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
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SALES can only view interactions on their own leads
        if (role === 'SALES' && lead.assignedToId !== userId) {
            return res.status(403).json({ error: 'Access denied: You can only view interactions for your own leads' });
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

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
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
            return res.status(403).json({ error: 'ADMIN is read-only' });
        }

        const { leadId, type, date, notes } = req.body;
        const parsedLeadId = parseInt(leadId);

        if (!parsedLeadId || !type) {
            return res.status(400).json({ error: 'leadId and type are required' });
        }

        // Validate type
        const validTypes = ['EMAIL', 'CALL', 'MEETING'];
        const normalizedType = type.toUpperCase();
        if (!validTypes.includes(normalizedType)) {
            return res.status(400).json({ error: 'Invalid type. Must be EMAIL, CALL, or MEETING' });
        }

        // Verify lead exists in the same org
        const lead = await prisma.lead.findFirst({
            where: { id: parsedLeadId, organizationId }
        });

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // SALES can only add interactions to their own leads
        if (role === 'SALES' && lead.assignedToId !== userId) {
            return res.status(403).json({ error: 'Access denied: You can only add interactions to your own leads' });
        }

        const interaction = await prisma.interaction.create({
            data: {
                organizationId,
                leadId: parsedLeadId,
                performedById: userId, // Always the authenticated user
                type: normalizedType,
                date: date ? new Date(date) : new Date(),
                notes: notes || null
            },
            include: {
                performedBy: { select: { id: true, name: true } }
            }
        });

        // Update lead's lastInteraction timestamp
        await prisma.lead.update({
            where: { id: parsedLeadId },
            data: { lastInteraction: new Date() }
        });

        res.status(201).json({
            ...interaction,
            type: interaction.type.toLowerCase(),
            performedBy: interaction.performedBy ? interaction.performedBy.name : 'Unknown'
        });
    } catch (error) {
        console.error('Error creating interaction:', error);
        res.status(500).json({ error: 'Failed to create interaction' });
    }
}

module.exports = {
    getInteractionsByLead,
    createInteraction
};
