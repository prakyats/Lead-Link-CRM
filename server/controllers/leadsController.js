const prisma = require('../utils/prisma');
const { addRiskToLead } = require('../utils/riskCalculator');
const { getAccessibleUserIds } = require('../utils/hierarchy');
const ExcelJS = require('exceljs');



/**
 * Helper to map Prisma Lead to Legacy Frontend Format
 */
function mapLeadToLegacy(lead) {
    if (!lead) return null;

    // Map Enums
    const mapEnum = (val) => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
    const stageMap = {
        'NEW': 'new',
        'CONTACTED': 'contacted',
        'INTERESTED': 'interested',
        'CONVERTED': 'converted',
        'LOST': 'lost'
    };

    const mapped = {
        ...lead,
        contact: lead.contactName, // legacy field name
        priority: lead.priority, // Return raw HIGH
        stage: lead.stage, // Return raw NEW
        assignedTo: lead.assignedTo ? lead.assignedTo.name : 'Unassigned',
        managerName: lead.assignedTo?.manager?.name || null
    };

    // Map Interactions if they exist
    if (lead.interactions) {
        mapped.interactions = lead.interactions.map(i => ({
            ...i,
            type: i.type.toLowerCase(),
            performedBy: i.performedBy ? i.performedBy.name : 'Unknown'
        }));
    }

    // Map Tasks if they exist
    if (lead.tasks) {
        mapped.tasks = lead.tasks.map(t => ({
            ...t,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assignedTo ? t.assignedTo.name : 'Unassigned'
        }));
    }

    return mapped;
}

/**
 * Get all leads with server-side RBAC
 */
async function getAllLeads(req, res) {
    try {
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);

        const leads = await prisma.lead.findMany({
            where: {
                organizationId,
                assignedToId: { in: accessibleIds }
            },

            include: {
                assignedTo: { 
                    select: { 
                        name: true,
                        manager: { select: { id: true, name: true } }
                    } 
                },
                interactions: {
                    include: { performedBy: { select: { name: true } } }
                }
            }
        });

        const legacyLeads = leads.map(lead => mapLeadToLegacy(addRiskToLead(lead)));
        res.json({ success: true, data: legacyLeads });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leads from database' });
    }
}

/**
 * Get single lead by ID with RBAC
 */
async function getLeadById(req, res) {
    try {
        const { id } = req.params;
        const { role, id: userId, organizationId } = req.user;

        const lead = await prisma.lead.findFirst({
            where: { id: parseInt(id), organizationId },
            include: {
                assignedTo: { select: { name: true, id: true } },
                tasks: {
                    include: { assignedTo: { select: { name: true } } }
                },
                interactions: {
                    include: { performedBy: { select: { name: true } } }
                }
            }
        });

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(lead.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }


        res.json({ success: true, data: mapLeadToLegacy(addRiskToLead(lead)) });
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lead' });
    }
}

/**
 * Create new lead
 */
async function createLead(req, res) {
    try {
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const { company, contact, email, phone, value, priority, stage, leadScore } = req.body;

        // Sanitize
        const sanitizedEmail = email ? email.trim().toLowerCase() : null;
        const sanitizedPhone = phone ? phone.replace(/\D/g, '') : null;
        const sanitizedCompany = company.trim();
        const sanitizedContact = contact ? contact.trim() : null;

        const newLead = await prisma.lead.create({
            data: {
                organizationId,
                company: sanitizedCompany,
                contactName: sanitizedContact,
                email: sanitizedEmail,
                phone: sanitizedPhone,
                value: parseFloat(value) || 0,
                priority: priority ? priority.toUpperCase() : 'MEDIUM',
                stage: stage ? stage.toUpperCase() : 'NEW',
                leadScore: parseInt(leadScore) || 50,
                assignedToId: userId,
                lastInteraction: new Date()
            },
            include: { assignedTo: { select: { name: true } } }
        });

        res.status(201).json({ success: true, data: mapLeadToLegacy(addRiskToLead(newLead)) });
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ success: false, message: 'Failed to create lead' });
    }
}

/**
 * Update lead
 */
async function updateLead(req, res) {
    try {
        const { id } = req.params;
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingLead = await prisma.lead.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingLead) return res.status(404).json({ success: false, message: 'Lead not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingLead.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Lead ownership is outside your team scope' });
        }

        const { company, contact, email, phone, value, priority, stage, leadScore } = req.body;
        
        if (Object.prototype.hasOwnProperty.call(req.body, 'stage') && role !== 'SALES') {
            return res.status(403).json({
                success: false,
                message: 'Only sales representatives can update lead stages'
            });
        }

        const data = {};

        if (company !== undefined) data.company = company;
        if (contact !== undefined) data.contactName = contact;
        if (email !== undefined) data.email = email;
        if (phone !== undefined) data.phone = phone;
        if (value !== undefined) data.value = parseFloat(value);
        if (leadScore !== undefined) data.leadScore = parseInt(leadScore);
        if (priority !== undefined) data.priority = priority.toUpperCase();
        if (stage !== undefined) {
            data.stage = stage.toUpperCase();
            if (data.stage === 'CONVERTED') {
                data.convertedAt = new Date();
            } else {
                data.convertedAt = null;
            }
        }
        data.lastInteraction = new Date();

        const updateRes = await prisma.lead.updateMany({
            where: { id: parseInt(id), organizationId },
            data
        });
        if (updateRes.count === 0) return res.status(404).json({ error: 'Lead not found' });

        const updatedLead = await prisma.lead.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({ success: true, data: mapLeadToLegacy(addRiskToLead(updatedLead)) });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ success: false, message: 'Failed to update lead' });
    }
}

/**
 * Update lead stage
 */
async function updateLeadStage(req, res) {
    try {
        const { id } = req.params;
        const { stage, notes, summary } = req.body;
        const { role, id: userId, organizationId } = req.user;
        if (role !== 'SALES') {
            return res.status(403).json({
                success: false,
                message: 'Only sales representatives can update lead stages'
            });
        }

        const existingLead = await prisma.lead.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingLead) return res.status(404).json({ success: false, message: 'Lead not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingLead.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Lead ownership is outside your team scope' });
        }

        const normalizedStage = stage.toUpperCase();
        const stageBefore = existingLead.stage;
        const stageAfter = normalizedStage;

        await prisma.$transaction(async (tx) => {
            await tx.lead.update({
                where: { id: parseInt(id) },
                data: {
                    stage: stageAfter,
                    lastInteraction: new Date(),
                    convertedAt: stageAfter === 'CONVERTED' ? new Date() : null
                }
            });

            await tx.interaction.create({
                data: {
                    organizationId,
                    leadId: parseInt(id),
                    performedById: userId,
                    type: 'OTHER',
                    date: new Date(),
                    summary: summary || `Pipeline stage updated: ${stageBefore} → ${stageAfter}`,
                    notes: notes || null
                }
            });
        });

        const updatedLead = await prisma.lead.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({ success: true, data: mapLeadToLegacy(addRiskToLead(updatedLead)) });
    } catch (error) {
        console.error('Error updating lead stage:', error);
        res.status(500).json({ success: false, message: 'Failed to update lead stage' });
    }
}

/**
 * Delete lead
 */
async function deleteLead(req, res) {
    try {
        const { id } = req.params;
        const { role, organizationId } = req.user;
        const existingLead = await prisma.lead.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingLead) return res.status(404).json({ success: false, message: 'Lead not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingLead.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Lead ownership is outside your team scope' });
        }

        await prisma.lead.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ success: false, message: 'Failed to delete lead' });
    }
}

/**
 * Assign lead to a user (MANAGER only)
 */
async function assignLead(req, res) {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;
        const { role, organizationId } = req.user;

        if (role !== 'MANAGER') {
            return res.status(403).json({ success: false, message: 'Only Managers can assign leads' });
        }

        if (!assignedToId) {
            return res.status(400).json({ success: false, message: 'assignedToId is required' });
        }

        const existingLead = await prisma.lead.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingLead) return res.status(404).json({ success: false, message: 'Lead not found' });

        // Verify target user exists in the same org
        const targetUser = await prisma.user.findFirst({
            where: { id: parseInt(assignedToId), organizationId }
        });
        if (!targetUser) return res.status(400).json({ success: false, message: 'Target user not found in this organization' });

        // Verify target user is within the manager's accessible team
        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(parseInt(assignedToId))) {
            return res.status(403).json({ success: false, message: 'Cannot assign lead outside your team' });
        }

        await prisma.lead.update({
            where: { id: parseInt(id) },
            data: { assignedToId: parseInt(assignedToId) }
        });

        const updatedLead = await prisma.lead.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({ success: true, data: mapLeadToLegacy(addRiskToLead(updatedLead)) });
    } catch (error) {
        console.error('Error assigning lead:', error);
        res.status(500).json({ success: false, message: 'Failed to assign lead' });
    }
}

/**
 * Export accessible leads as Excel (.xlsx)
 * Optional query: q (search by company/contact/email)
 */
async function exportLeads(req, res) {
    try {
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);
        const qRaw = (req.query.q || '').toString().trim();

        const searchFilter = qRaw
            ? {
                OR: [
                    { company: { contains: qRaw, mode: 'insensitive' } },
                    { contactName: { contains: qRaw, mode: 'insensitive' } },
                    { email: { contains: qRaw, mode: 'insensitive' } }
                ]
            }
            : {};

        const leads = await prisma.lead.findMany({
            where: {
                organizationId,
                assignedToId: { in: accessibleIds },
                ...searchFilter
            },
            include: { assignedTo: { select: { id: true, name: true, email: true } } },
            orderBy: [{ stage: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'LeadLinkCRM';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Leads');
        sheet.columns = [
            { header: 'Lead ID', key: 'id', width: 10 },
            { header: 'Company', key: 'company', width: 28 },
            { header: 'Contact', key: 'contactName', width: 20 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Phone', key: 'phone', width: 16 },
            { header: 'Value', key: 'value', width: 12 },
            { header: 'Priority', key: 'priority', width: 10 },
            { header: 'Stage', key: 'stage', width: 12 },
            { header: 'Lead Score', key: 'leadScore', width: 11 },
            { header: 'Risk', key: 'risk', width: 8 },
            { header: 'Assigned To', key: 'assignedTo', width: 18 },
            { header: 'Last Interaction', key: 'lastInteraction', width: 22 },
            { header: 'Created At', key: 'createdAt', width: 22 }
        ];

        // Header styling
        sheet.getRow(1).font = { bold: true };
        sheet.views = [{ state: 'frozen', ySplit: 1 }];

        for (const lead of leads) {
            const withRisk = addRiskToLead(lead);
            sheet.addRow({
                id: lead.id,
                company: lead.company,
                contactName: lead.contactName,
                email: lead.email,
                phone: lead.phone || '',
                value: lead.value,
                priority: lead.priority,
                stage: lead.stage,
                leadScore: lead.leadScore,
                risk: withRisk.risk,
                assignedTo: lead.assignedTo?.name || '',
                lastInteraction: lead.lastInteraction ? new Date(lead.lastInteraction) : '',
                createdAt: lead.createdAt ? new Date(lead.createdAt) : ''
            });
        }

        // Date formatting
        sheet.getColumn('lastInteraction').numFmt = 'yyyy-mm-dd hh:mm';
        sheet.getColumn('createdAt').numFmt = 'yyyy-mm-dd hh:mm';

        const safeQ = qRaw ? `_${qRaw.replace(/[^\w-]+/g, '_').slice(0, 32)}` : '';
        const filename = `leads_export${safeQ}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const buffer = await workbook.xlsx.writeBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('Error exporting leads:', error);
        res.status(500).json({ success: false, message: 'Failed to export leads' });
    }
}

module.exports = {
    getAllLeads,
    getLeadById,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    assignLead,
    exportLeads
};
