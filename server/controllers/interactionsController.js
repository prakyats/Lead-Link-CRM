const prisma = require('../utils/prisma');

/**
 * Get interactions for a specific lead (with RBAC)
 * SALES: only if lead is assigned to them
 * MANAGER/ADMIN: all interactions for any lead in their org
 */
async function getInteractionsByLead(req, res) {
    try {
        const { leadId } = req.params;
        const { role, id: userId, organizationId } = req.user;
        const parsedLeadId = parseInt(leadId);

        // Verify lead exists and belongs to the user's org
        const lead = await prisma.lead.findFirst({
            where: { id: parsedLeadId, organizationId }
        });

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // SALES can only view interactions on their own leads
        if (role === 'SALES' && lead.assignedToId !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied: You can only view interactions for your own leads' });
        }

        const interactions = await prisma.interaction.findMany({
            where: { leadId: parsedLeadId, organizationId },
            include: {
                performedBy: { select: { id: true, name: true } }
            },
            orderBy: { date: 'desc' }
        });

        const mapped = interactions.map(i => ({
            ...i,
            type: i.type.toLowerCase(),
            performedBy: i.performedBy ? i.performedBy.name : 'Unknown'
        }));

        res.json({ success: true, data: mapped });
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch interactions' });
    }
}

/**
 * Create a new interaction (with RBAC)
 * SALES: only on their own leads
 * MANAGER: on any lead in their org
 * ADMIN: blocked (read-only)
 * performedById is always set to the authenticated user (server-side)
 */
async function createInteraction(req, res) {
    try {
        const { role, id: userId, organizationId } = req.user;

        if (role === 'ADMIN') {
            return res.status(403).json({ success: false, message: 'ADMIN is read-only' });
        }
        
        const { leadId, type, date, notes, summary, outcome, followUpDate } = req.body;

        const parsedLeadId = parseInt(leadId);
        const normalizedType = type.toUpperCase();

        // Verify lead exists in the same org
        const lead = await prisma.lead.findFirst({
            where: { id: parsedLeadId, organizationId }
        });

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // SALES can only add interactions to their own leads
        if (role === 'SALES' && lead.assignedToId !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied: You can only add interactions to your own leads' });
        }

        // Start transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create interaction
            const interaction = await tx.interaction.create({
                data: {
                    organizationId,
                    leadId: parsedLeadId,
                    performedById: userId,
                    type: normalizedType,
                    date: date ? new Date(date) : new Date(),
                    notes: notes || null,
                    summary: summary || null,
                    outcome: outcome || null,
                    followUpDate: followUpDate ? new Date(followUpDate) : null
                },
                include: {
                    performedBy: { select: { id: true, name: true } }
                }
            });

            // 2. Automate task creation if followUpDate is provided
            let autoTask = null;
            if (followUpDate) {
                autoTask = await tx.task.create({
                    data: {
                        organizationId,
                        leadId: parsedLeadId,
                        assignedToId: userId,
                        interactionId: interaction.id,
                        title: `Follow up with ${lead.contactName}`,
                        description: summary || notes || `Automated follow-up from ${normalizedType.toLowerCase()}`,
                        dueDate: new Date(followUpDate),
                        status: 'PENDING',
                        priority: 'HIGH'
                    }
                });
            }

            // 3. Update lead's lastInteraction
            await tx.lead.update({
                where: { id: parsedLeadId },
                data: { lastInteraction: new Date() }
            });

            return { interaction, autoTask };
        });

        res.status(201).json({
            success: true,
            data: {
                ...result.interaction,
                type: result.interaction.type.toLowerCase(),
                performedBy: result.interaction.performedBy ? result.interaction.performedBy.name : 'Unknown',
                autoTaskCreated: !!result.autoTask
            }
        });
    } catch (error) {
        console.error('Error creating interaction:', error);
        res.status(500).json({ success: false, message: 'Failed to create interaction' });
    }
}

module.exports = {
    getInteractionsByLead,
    createInteraction
};
