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
        const { role, id: userId, organizationId } = req.user;
        let where = { organizationId };

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
        const { role, id: userId, organizationId } = req.user;
        let where = { organizationId };

        if (role === 'SALES') {
            where.assignedToId = userId;
        }

        const leads = await prisma.lead.findMany({
            where,
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
        const { role, id: userId, organizationId } = req.user;
        let where = { status: 'PENDING', organizationId };

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
        const { role, id: userId, organizationId } = req.user;

        // Scoping logic: filter by userId if role is SALES
        const baseWhere = { organizationId };
        const salesWhere = role === 'SALES' ? { assignedToId: userId } : {};
        const interactionWhere = role === 'SALES' ? { performedById: userId } : {};
        const teamWhere = role === 'SALES' ? { id: userId } : { role: 'SALES' };

        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const idleThreshold = new Date();
        idleThreshold.setDate(now.getDate() - 7);

        const [tasks, leads, interactions, users] = await Promise.all([
            prisma.task.findMany({ where: { ...baseWhere, ...salesWhere } }),
            prisma.lead.findMany({ where: { ...baseWhere, ...salesWhere } }),
            prisma.interaction.findMany({ 
                where: { 
                    ...baseWhere,
                    ...interactionWhere,
                    createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } 
                } 
            }),
            prisma.user.findMany({ 
                where: { ...baseWhere, ...teamWhere },
                select: { id: true, name: true }
            })
        ]);

        // 1. Task Health
        const taskHealth = {
            total: tasks.filter(t => t.createdAt >= todayStart).length, // Tasks created today
            completed: tasks.filter(t => t.status === 'COMPLETED' && t.completedAt >= todayStart).length,
            pending: tasks.filter(t => t.status === 'PENDING').length,
            overdue: tasks.filter(t => t.status === 'PENDING' && t.dueDate && new Date(t.dueDate) < new Date()).length
        };

        // 2. Team Performance
        const teamPerformance = users.map(u => {
            const userTasks = tasks.filter(t => t.assignedToId === u.id);
            const userInteractions = interactions.filter(i => i.performedById === u.id);
            return {
                id: u.id,
                name: u.name,
                pending: userTasks.filter(t => t.status === 'PENDING').length,
                completed: userTasks.filter(t => t.status === 'COMPLETED').length,
                overdue: userTasks.filter(t => t.status === 'PENDING' && t.dueDate && new Date(t.dueDate) < new Date()).length,
                interactionsToday: userInteractions.filter(i => i.createdAt >= todayStart).length,
                interactionsWeek: userInteractions.length
            };
        }).sort((a, b) => b.overdue - a.overdue);

        // 3. Key Metrics
        const interestedLeads = leads.filter(l => l.stage === 'INTERESTED').length;
        const convertedLeads = leads.filter(l => l.stage === 'CONVERTED').length;
        const activeLeads = leads.filter(l => l.stage !== 'CONVERTED' && l.stage !== 'LOST').length;
        
        const keyMetrics = {
            taskCompletionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100 : 0,
            activeLeads,
            conversionRate: interestedLeads > 0 ? (convertedLeads / interestedLeads) * 100 : 0
        };

        // 4. Alerts
        const alerts = [];
        teamPerformance.filter(u => u.overdue > 0).forEach(u => {
            alerts.push({ type: 'OVERDUE', message: `${u.name} has ${u.overdue} overdue follow-ups`, priority: 'HIGH' });
        });

        const idleLeads = leads.filter(l => {
            if (l.stage === 'CONVERTED' || l.stage === 'LOST') return false;
            return !l.lastInteraction || new Date(l.lastInteraction) < idleThreshold;
        });
        
        if (idleLeads.length > 0) {
            alerts.push({ type: 'IDLE', message: `${idleLeads.length} leads have no interaction in 7+ days`, priority: 'MEDIUM' });
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
        const { role, id: userId, organizationId } = req.user;

        // Scoping logic: filter by userId if role is SALES
        const baseWhere = { organizationId };
        const salesWhere = role === 'SALES' ? { assignedToId: userId } : {};
        const interactionWhere = role === 'SALES' ? { performedById: userId } : {};
        const teamWhere = role === 'SALES' ? { id: userId } : { role: 'SALES' };

        const { filter } = req.query; // today, week, month

        let startDate = new Date();
        if (filter === 'today') startDate.setHours(0, 0, 0, 0);
        else if (filter === 'week') startDate.setDate(startDate.getDate() - 7);
        else startDate.setDate(startDate.getDate() - 30); // Default month

        const [leads, tasks, interactions, users] = await Promise.all([
            prisma.lead.findMany({ where: { ...baseWhere, ...salesWhere, createdAt: { gte: startDate } } }),
            prisma.task.findMany({ where: { ...baseWhere, ...salesWhere, createdAt: { gte: startDate } } }),
            prisma.interaction.findMany({ where: { ...baseWhere, ...interactionWhere, createdAt: { gte: startDate } } }),
            prisma.user.findMany({ where: { ...baseWhere, ...teamWhere }, select: { id: true, name: true } })
        ]);

        // 1. Task Trends (Created vs Completed)
        // Simplified: Total counts for the period
        const taskTrends = {
            created: tasks.length,
            completed: tasks.filter(t => t.status === 'COMPLETED').length
        };

        // 2. Sales Performance Comparison
        const salesComparison = users.map(u => {
            const userLeads = leads.filter(l => l.assignedToId === u.id);
            const userConverted = userLeads.filter(l => l.stage === 'CONVERTED').length;
            const userInterested = userLeads.filter(l => l.stage === 'INTERESTED').length;

            return {
                id: u.id,
                name: u.name,
                tasksCompleted: tasks.filter(t => t.assignedToId === u.id && t.status === 'COMPLETED').length,
                overdue: tasks.filter(t => t.assignedToId === u.id && t.status === 'PENDING' && t.dueDate && new Date(t.dueDate) < new Date()).length,
                interactions: interactions.filter(i => i.performedById === u.id).length,
                conversionRate: userInterested > 0 ? (userConverted / userInterested) * 100 : 0
            };
        });

        // 3. Revenue Insights
        const actualRevenue = leads
            .filter(l => l.stage === 'CONVERTED')
            .reduce((sum, l) => sum + (l.value || 0), 0);
        
        const pipelineValue = leads
            .filter(l => l.stage === 'INTERESTED')
            .reduce((sum, l) => sum + (l.value || 0), 0);

        // 4. Lead Flow (Funnel)
        const leadFlow = {
            new: leads.filter(l => l.stage === 'NEW').length,
            contacted: leads.filter(l => l.stage === 'CONTACTED').length,
            interested: leads.filter(l => l.stage === 'INTERESTED').length,
            converted: leads.filter(l => l.stage === 'CONVERTED').length,
            lost: leads.filter(l => l.stage === 'LOST').length
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
