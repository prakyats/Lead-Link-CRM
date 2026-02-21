const prisma = require('../utils/prisma');
const { calculateRisk } = require('../utils/riskCalculator');

/**
 * Mapping Helpers
 */
function mapLeadToLegacy(lead) {
    if (!lead) return null;
    const mapEnum = (val) => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
    return {
        ...lead,
        contact: lead.contactName,
        priority: mapEnum(lead.priority),
        stage: lead.stage.toLowerCase(),
        assignedTo: lead.assignedTo ? lead.assignedTo.name : 'Unassigned',
    };
}

function mapTaskToLegacy(task) {
    if (!task) return null;
    const mapEnum = (val) => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
    return {
        ...task,
        status: task.status.toLowerCase(),
        priority: mapEnum(task.priority),
        assignedTo: task.assignedTo ? task.assignedTo.name : 'Unassigned',
    };
}

/**
 * Get Dashboard KPIs with role-awareness
 */
async function getKPIs(req, res) {
    try {
        const { role, id: userId } = req.user;
        let where = {};

        // RBAC: SALES count only their own data
        if (role === 'SALES') {
            where.assignedToId = userId;
        }

        const [totalLeads, activeCustomers, tasks, leads] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({
                where: {
                    ...where,
                    stage: 'CONVERTED'
                }
            }),
            prisma.task.findMany({
                where: {
                    ...where,
                    status: 'PENDING'
                }
            }),
            prisma.lead.findMany({
                where,
                select: { lastInteraction: true }
            })
        ]);

        // Pending follow-ups (tasks due within next 7 days)
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const pendingFollowUps = tasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            return dueDate >= now && dueDate <= sevenDaysFromNow;
        }).length;

        // At-risk customers (no interaction in 7+ days)
        const atRiskCustomers = leads.filter(l => {
            const risk = calculateRisk(l.lastInteraction);
            return risk === 'high';
        }).length;

        // Mock trends (as in original)
        const generateTrend = () => parseFloat((Math.random() * 20 - 5).toFixed(1));

        res.json({
            totalLeads: { value: totalLeads, trend: generateTrend() },
            activeCustomers: { value: activeCustomers, trend: generateTrend() },
            pendingFollowUps: { value: pendingFollowUps, trend: generateTrend() },
            atRiskCustomers: { value: atRiskCustomers, trend: generateTrend() }
        });
    } catch (error) {
        console.error('Error calculating KPIs:', error);
        res.status(500).json({ error: 'Failed to calculate KPIs' });
    }
}

/**
 * Get recent leads (last 5) with RBAC
 */
async function getRecentLeads(req, res) {
    try {
        const { role, id: userId } = req.user;
        let where = {};

        if (role === 'SALES') {
            where.assignedToId = userId;
        }

        const leads = await prisma.lead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { assignedTo: { select: { name: true } } }
        });

        res.json(leads.map(mapLeadToLegacy));
    } catch (error) {
        console.error('Error fetching recent leads:', error);
        res.status(500).json({ error: 'Failed to fetch recent leads' });
    }
}

/**
 * Get upcoming tasks (next 5 pending) with RBAC
 */
async function getUpcomingTasks(req, res) {
    try {
        const { role, id: userId } = req.user;
        let where = { status: 'PENDING' };

        if (role === 'SALES') {
            where.assignedToId = userId;
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { dueDate: 'asc' },
            take: 5,
            include: {
                lead: true,
                assignedTo: { select: { name: true } }
            }
        });

        res.json(tasks.map(mapTaskToLegacy));
    } catch (error) {
        console.error('Error fetching upcoming tasks:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
    }
}

module.exports = {
    getKPIs,
    getRecentLeads,
    getUpcomingTasks
};
