const prisma = require('../utils/prisma');
const { addRiskToLead } = require('../utils/riskCalculator');
const { validateLeadBody, normalizeEmail, normalizePhone, sanitizeString } = require('../utils/validation');

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
        const { role, id: userId, organizationId } = req.user;
        let where = { organizationId };

        if (role === 'SALES') {
            where.assignedToId = userId;
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: { select: { name: true } },
                interactions: {
                    include: { performedBy: { select: { name: true } } }
                }
            }
        });

        const legacyLeads = leads.map(lead => mapLeadToLegacy(addRiskToLead(lead)));
        res.json(legacyLeads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads from database' });
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
                assignedTo: { select: { name: true } },
                tasks: {
                    include: { assignedTo: { select: { name: true } } }
                },
                interactions: {
                    include: { performedBy: { select: { name: true } } }
                }
            }
        });

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (role === 'SALES' && lead.assignedToId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(mapLeadToLegacy(addRiskToLead(lead)));
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({ error: 'Failed to fetch lead' });
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

        // Validate
        const { errors, isValid } = validateLeadBody({ company, contact, email, phone, value });
        if (!isValid) {
            const firstError = Object.values(errors)[0];
            return res.status(400).json({ error: firstError, errors });
        }

        // Sanitize
        const sanitizedEmail = normalizeEmail(email);
        const sanitizedPhone = phone ? normalizePhone(phone) : null;
        const sanitizedCompany = sanitizeString(company);
        const sanitizedContact = sanitizeString(contact);

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

        res.status(201).json(mapLeadToLegacy(addRiskToLead(newLead)));
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Failed to create lead' });
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
        if (!existingLead) return res.status(404).json({ error: 'Lead not found' });
        if (role === 'SALES' && existingLead.assignedToId !== userId) return res.status(403).json({ error: 'Access denied' });

        const data = { ...req.body };
        if (data.contact) data.contactName = data.contact;
        delete data.contact;
        delete data.id;
        if (data.value) data.value = parseFloat(data.value);
        if (data.leadScore) data.leadScore = parseInt(data.leadScore);
        if (data.priority) data.priority = data.priority.toUpperCase();
        if (data.stage) data.stage = data.stage.toUpperCase();
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

        res.json(mapLeadToLegacy(addRiskToLead(updatedLead)));
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
}

/**
 * Update lead stage
 */
async function updateLeadStage(req, res) {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingLead = await prisma.lead.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingLead) return res.status(404).json({ error: 'Lead not found' });
        if (role === 'SALES' && existingLead.assignedToId !== userId) return res.status(403).json({ error: 'Access denied' });

        await prisma.lead.updateMany({
            where: { id: parseInt(id), organizationId },
            data: {
                stage: stage.toUpperCase(),
                lastInteraction: new Date()
            }
        });

        const updatedLead = await prisma.lead.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json(mapLeadToLegacy(addRiskToLead(updatedLead)));
    } catch (error) {
        console.error('Error updating lead stage:', error);
        res.status(500).json({ error: 'Failed to update lead stage' });
    }
}

/**
 * Delete lead
 */
async function deleteLead(req, res) {
    try {
        const { id } = req.params;
        const { role, organizationId } = req.user;
        if (role !== 'MANAGER') return res.status(403).json({ error: 'Only Managers can delete' });

        const delRes = await prisma.lead.deleteMany({ where: { id: parseInt(id), organizationId } });
        if (delRes.count === 0) return res.status(404).json({ error: 'Lead not found' });
        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
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
            return res.status(403).json({ error: 'Only Managers can assign leads' });
        }

        if (!assignedToId) {
            return res.status(400).json({ error: 'assignedToId is required' });
        }

        const existingLead = await prisma.lead.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingLead) return res.status(404).json({ error: 'Lead not found' });

        // Verify target user exists in the same org
        const targetUser = await prisma.user.findFirst({
            where: { id: parseInt(assignedToId), organizationId }
        });
        if (!targetUser) return res.status(400).json({ error: 'Target user not found in this organization' });

        await prisma.lead.update({
            where: { id: parseInt(id) },
            data: { assignedToId: parseInt(assignedToId) }
        });

        const updatedLead = await prisma.lead.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json(mapLeadToLegacy(addRiskToLead(updatedLead)));
    } catch (error) {
        console.error('Error assigning lead:', error);
        res.status(500).json({ error: 'Failed to assign lead' });
    }
}

module.exports = {
    getAllLeads,
    getLeadById,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    assignLead
};
