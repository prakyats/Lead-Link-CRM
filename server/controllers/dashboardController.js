const prisma = require('../utils/prisma');
const { calculateRisk } = require('../utils/riskCalculator');
const { getAccessibleUserIds } = require('../utils/hierarchy');


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
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);
        let where = { 
            organizationId,
            assignedToId: { in: accessibleIds }
        };


        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const atRiskThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalLeads, activeCustomers, pendingFollowUps, atRiskCustomers] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({
                where: { ...where, stage: 'CONVERTED' }
            }),
            prisma.task.count({
                where: { 
                    ...where, 
                    status: 'PENDING',
                    dueDate: { gte: now, lte: sevenDaysFromNow }
                }
            }),
            prisma.lead.count({
                where: {
                    ...where,
                    lastInteraction: { lt: atRiskThreshold },
                    stage: { notIn: ['CONVERTED', 'LOST'] }
                }
            })
        ]);

        // Mock trends (as in original)
        const generateTrend = () => parseFloat((Math.random() * 20 - 5).toFixed(1));

        res.json({
            success: true,
            data: {
                totalLeads: { value: totalLeads, trend: generateTrend() },
                activeCustomers: { value: activeCustomers, trend: generateTrend() },
                pendingFollowUps: { value: pendingFollowUps, trend: generateTrend() },
                atRiskCustomers: { value: atRiskCustomers, trend: generateTrend() }
            }
        });
    } catch (error) {
        console.error('Error calculating KPIs:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate KPIs' });
    }
}

/**
 * Get recent leads (last 5) with RBAC
 */
async function getRecentLeads(req, res) {
    try {
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);

        const leads = await prisma.lead.findMany({
            where: {
                organizationId,
                assignedToId: { in: accessibleIds }
            },

            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({ success: true, data: leads.map(mapLeadToLegacy) });
    } catch (error) {
        console.error('Error fetching recent leads:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent leads' });
    }
}

/**
 * Get upcoming tasks (next 5 pending) with RBAC
 */
async function getUpcomingTasks(req, res) {
    try {
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);
        let where = { 
            status: 'PENDING', 
            organizationId,
            assignedToId: { in: accessibleIds }
        };


        const tasks = await prisma.task.findMany({
            where,
            orderBy: { dueDate: 'asc' },
            take: 5,
            include: {
                lead: true,
                assignedTo: { select: { name: true } }
            }
        });

        res.json({ success: true, data: tasks.map(mapTaskToLegacy) });
    } catch (error) {
        console.error('Error fetching upcoming tasks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming tasks' });
    }
}

/**
 * GET Dashboard Summary (Manager snapshot)
 * Sections: Task Health, Team Performance, Key Metrics, Alerts
 */
async function getDashboardSummary(req, res) {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { organizationId } = req.user;

        const accessibleIds = await getAccessibleUserIds(req.user);

        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const idleThreshold = new Date(new Date().setDate(new Date().getDate() - 7));

        const [
            users,
            taskTotalToday,
            taskCompletedToday,
            taskPending,
            taskOverdue,
            interestedLeads,
            convertedLeads,
            activeLeads,
            totalTasks,
            idleLeadsCount,
            taskStatusGroups,
            taskOverdueGroups,
            interactionTodayGroups,
            interactionWeekGroups
        ] = await Promise.all([
            prisma.user.findMany({
                where: { organizationId, id: { in: accessibleIds } },
                select: { id: true, name: true }
            }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: todayStart } } }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds }, status: 'COMPLETED', completedAt: { gte: todayStart } } }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds }, status: 'PENDING' } }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds }, status: 'PENDING', dueDate: { lt: new Date() } } }),
            prisma.lead.count({ where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'INTERESTED' } }),
            prisma.lead.count({ where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'CONVERTED' } }),
            prisma.lead.count({ where: { organizationId, assignedToId: { in: accessibleIds }, stage: { notIn: ['CONVERTED', 'LOST'] } } }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds } } }),
            prisma.lead.count({ 
                where: { 
                    organizationId, 
                    assignedToId: { in: accessibleIds }, 
                    stage: { notIn: ['CONVERTED', 'LOST'] },
                    lastInteraction: { lt: idleThreshold }
                } 
            }),
            prisma.task.groupBy({
                by: ['assignedToId', 'status'],
                where: { organizationId, assignedToId: { in: accessibleIds } },
                _count: true
            }),
            prisma.task.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, status: 'PENDING', dueDate: { lt: new Date() } },
                _count: true
            }),
            prisma.interaction.groupBy({
                by: ['performedById'],
                where: { organizationId, performedById: { in: accessibleIds }, createdAt: { gte: todayStart } },
                _count: true
            }),
            prisma.interaction.groupBy({
                by: ['performedById'],
                where: { organizationId, performedById: { in: accessibleIds }, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
                _count: true
            })
        ]);

        // Helper to find count from groupBy results
        const getCount = (groups, userId, key, matchKey, matchVal) => {
            const group = groups.find(g => g[key] === userId && (matchKey ? g[matchKey] === matchVal : true));
            return group ? group._count : 0;
        };

        // 1. Task Health
        const taskHealth = {
            total: taskTotalToday,
            completed: taskCompletedToday,
            pending: taskPending,
            overdue: taskOverdue
        };

        // 2. Team Performance
        const teamPerformance = users.map(u => ({
            id: u.id,
            name: u.name,
            pending: getCount(taskStatusGroups, u.id, 'assignedToId', 'status', 'PENDING'),
            completed: getCount(taskStatusGroups, u.id, 'assignedToId', 'status', 'COMPLETED'),
            overdue: getCount(taskOverdueGroups, u.id, 'assignedToId'),
            interactionsToday: getCount(interactionTodayGroups, u.id, 'performedById'),
            interactionsWeek: getCount(interactionWeekGroups, u.id, 'performedById')
        })).sort((a, b) => b.overdue - a.overdue);

        // 3. Key Metrics
        const keyMetrics = {
            taskCompletionRate: totalTasks > 0 ? (taskCompletedToday / totalTasks) * 100 : 0, // Simplified approximation
            activeLeads,
            conversionRate: interestedLeads > 0 ? (convertedLeads / interestedLeads) * 100 : 0
        };

        // 4. Alerts
        const alerts = [];
        teamPerformance.filter(u => u.overdue > 0).forEach(u => {
            alerts.push({ type: 'OVERDUE', message: `${u.name} has ${u.overdue} overdue follow-ups`, priority: 'HIGH' });
        });

        if (idleLeadsCount > 0) {
            alerts.push({ type: 'IDLE', message: `${idleLeadsCount} leads have no interaction in 7+ days`, priority: 'MEDIUM' });
        }

        res.json({ success: true, data: { taskHealth, teamPerformance, keyMetrics, alerts } });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
    }
}

/**
 * GET Reports Data
 * Supports filtering: Today, Week, Month
 */
async function getReportsData(req, res) {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);

        const { filter } = req.query; // today, week, month

        let startDate = new Date();
        if (filter === 'today') startDate.setHours(0, 0, 0, 0);
        else if (filter === 'week') startDate.setDate(startDate.getDate() - 7);
        else startDate.setDate(startDate.getDate() - 30); // Default month

        const [
            users,
            taskTotal,
            taskCompleted,
            leadFlowGroups,
            revenueData,
            pipelineData,
            userTaskCompletedGroups,
            userTaskOverdueGroups,
            userInteractionGroups,
            userLeadConvertedGroups,
            userLeadInterestedGroups
        ] = await Promise.all([
            prisma.user.findMany({
                where: { organizationId, id: { in: accessibleIds } },
                select: { id: true, name: true }
            }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: startDate } } }),
            prisma.task.count({ where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: startDate }, status: 'COMPLETED' } }),
            prisma.lead.groupBy({
                by: ['stage'],
                where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: startDate } },
                _count: true
            }),
            prisma.lead.aggregate({
                _sum: { value: true },
                where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'CONVERTED', createdAt: { gte: startDate } }
            }),
            prisma.lead.aggregate({
                _sum: { value: true },
                where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'INTERESTED', createdAt: { gte: startDate } }
            }),
            prisma.task.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: startDate }, status: 'COMPLETED' },
                _count: true
            }),
            prisma.task.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, status: 'PENDING', dueDate: { lt: new Date() } },
                _count: true
            }),
            prisma.interaction.groupBy({
                by: ['performedById'],
                where: { organizationId, performedById: { in: accessibleIds }, createdAt: { gte: startDate } },
                _count: true
            }),
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'CONVERTED', createdAt: { gte: startDate } },
                _count: true
            }),
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'INTERESTED', createdAt: { gte: startDate } },
                _count: true
            })
        ]);

        const getCount = (groups, userId, key) => {
            const group = groups.find(g => g[key] === userId);
            return group ? group._count : 0;
        };

        const funnelCount = (stage) => {
            const group = leadFlowGroups.find(g => g.stage === stage);
            return group ? group._count : 0;
        };

        // 1. Task Trends
        const taskTrends = {
            created: taskTotal,
            completed: taskCompleted
        };

        // 2. Sales Performance Comparison
        const salesComparison = users.map(u => {
            const converted = getCount(userLeadConvertedGroups, u.id, 'assignedToId');
            const interested = getCount(userLeadInterestedGroups, u.id, 'assignedToId');

            return {
                id: u.id,
                name: u.name,
                tasksCompleted: getCount(userTaskCompletedGroups, u.id, 'assignedToId'),
                overdue: getCount(userTaskOverdueGroups, u.id, 'assignedToId'),
                interactions: getCount(userInteractionGroups, u.id, 'performedById'),
                conversionRate: interested > 0 ? (converted / interested) * 100 : 0
            };
        });

        // 3. Revenue Insights
        const actualRevenue = revenueData._sum.value || 0;
        const pipelineValue = pipelineData._sum.value || 0;

        // 4. Lead Flow (Funnel)
        const leadFlow = {
            new: funnelCount('NEW'),
            contacted: funnelCount('CONTACTED'),
            interested: funnelCount('INTERESTED'),
            converted: funnelCount('CONVERTED'),
            lost: funnelCount('LOST')
        };

        res.json({ success: true, data: { taskTrends, salesComparison, revenue: { actualRevenue, pipelineValue }, leadFlow } });
    } catch (error) {
        console.error('Error fetching reports data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reports data' });
    }
}

module.exports = {
    getKPIs,
    getRecentLeads,
    getUpcomingTasks,
    getDashboardSummary,
    getReportsData
};
