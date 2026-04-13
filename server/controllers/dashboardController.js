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
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));
        let where = {
            organizationId: parseInt(organizationId),
            assignedToId: { in: accessibleIds }
        };


        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const atRiskThreshold = sevenDaysAgo;

        const [
            totalLeads,
            activeCustomers,
            pendingFollowUps,
            atRiskCustomers,
            totalLeadsPrev,
            totalLeadsThis,
            activeCustomersPrev,
            activeCustomersThis,
            tasksCompletedPrev,
            tasksCompletedThis,
            atRiskPrev
        ] = await Promise.all([
            // 1. totalLeads Value
            prisma.lead.count({ where }),

            // 2. activeCustomers Value
            prisma.lead.count({
                where: { ...where, stage: 'CONVERTED' }
            }),

            // 3. pendingFollowUps Value
            prisma.task.count({
                where: {
                    ...where,
                    status: 'PENDING',
                    dueDate: { gte: now, lte: sevenDaysFromNow }
                }
            }),

            // 4. atRiskCustomers Value (also serves as atRiskThis)
            prisma.lead.count({
                where: {
                    ...where,
                    lastInteraction: { lt: atRiskThreshold },
                    stage: { notIn: ['CONVERTED', 'LOST'] }
                }
            }),

            // 5. totalLeadsPrev (Trend)
            prisma.lead.count({
                where: {
                    ...where,
                    createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
                }
            }),

            // 6. totalLeadsThis (Trend)
            prisma.lead.count({
                where: {
                    ...where,
                    createdAt: { gte: sevenDaysAgo }
                }
            }),

            // 7. activeCustomersPrev (Trend)
            prisma.lead.count({
                where: {
                    ...where,
                    stage: 'CONVERTED',
                    convertedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
                }
            }),

            // 8. activeCustomersThis (Trend)
            prisma.lead.count({
                where: {
                    ...where,
                    stage: 'CONVERTED',
                    convertedAt: { gte: sevenDaysAgo }
                }
            }),

            // 9. tasksCompletedPrev (Trend)
            prisma.task.count({
                where: {
                    ...where,
                    status: 'COMPLETED',
                    completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
                }
            }),

            // 10. tasksCompletedThis (Trend)
            prisma.task.count({
                where: {
                    ...where,
                    status: 'COMPLETED',
                    completedAt: { gte: sevenDaysAgo }
                }
            }),

            // 11. atRiskPrev (Trend)
            prisma.lead.count({
                where: {
                    ...where,
                    lastInteraction: { lt: fourteenDaysAgo },
                    stage: { notIn: ['CONVERTED', 'LOST'] }
                }
            })
        ]);

        const calcTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return parseFloat(((current - previous) / previous * 100).toFixed(1));
        };

        res.json({
            success: true,
            data: {
                totalLeads: { value: totalLeads, trend: calcTrend(totalLeadsThis, totalLeadsPrev) },
                activeCustomers: { value: activeCustomers, trend: calcTrend(activeCustomersThis, activeCustomersPrev) },
                taskCompletion: { value: pendingFollowUps, trend: calcTrend(tasksCompletedThis, tasksCompletedPrev) },
                atRiskCustomers: { value: atRiskCustomers, trend: calcTrend(atRiskCustomers, atRiskPrev) }
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
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        const leads = await prisma.lead.findMany({
            where: {
                organizationId: parseInt(organizationId),
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
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));
        let where = {
            status: 'PENDING',
            organizationId: parseInt(organizationId),
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
        const organizationId = parseInt(req.user.organizationId);
        const userId = parseInt(req.user.id);

        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const idleThreshold = new Date(new Date().setDate(new Date().getDate() - 7));

        const [
            users,
            teamCount,
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
            prisma.user.count({ where: { organizationId, managerId: req.user.id } }),
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

        res.json({ success: true, data: { taskHealth, teamPerformance, keyMetrics, alerts, hasTeam: teamCount > 0 } });
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
        const organizationId = parseInt(req.user.organizationId);
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

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
            userTotalLeadsGroups
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
                where: { organizationId, assignedToId: { in: accessibleIds }, convertedAt: { gte: startDate } },
                _count: true
            }),
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: startDate } },
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
            const totalInPeriod = getCount(userTotalLeadsGroups, u.id, 'assignedToId');

            return {
                id: u.id,
                name: u.name,
                tasksCompleted: getCount(userTaskCompletedGroups, u.id, 'assignedToId'),
                overdue: getCount(userTaskOverdueGroups, u.id, 'assignedToId'),
                interactions: getCount(userInteractionGroups, u.id, 'performedById'),
                conversionRate: totalInPeriod > 0 ? (converted / totalInPeriod) * 100 : (converted > 0 ? 100 : 0)
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

/**
 * GET Team Performance
 */
async function getTeamPerformance(req, res) {
    try {
        const organizationId = parseInt(req.user.organizationId);
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const users = await prisma.user.findMany({
            where: { 
                organizationId, 
                id: { in: accessibleIds },
                role: 'SALES'
            },
            select: { id: true, name: true, role: true }
        });

        const [
            taskStatusGroups, 
            taskOverdueGroups, 
            interactionGroups, 
            currentConvertedGroups, 
            currentTotalGroups,
            baselineConvertedGroups,
            baselineTotalGroups,
            lastActivityGroups,
            lastTaskCompletionGroups,
            userStageGroups
        ] = await Promise.all([
            prisma.task.groupBy({
                by: ['assignedToId', 'status'],
                where: { organizationId, assignedToId: { in: accessibleIds } },
                _count: true
            }),
            prisma.task.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, status: 'PENDING', dueDate: { lt: now } },
                _count: true
            }),
            prisma.interaction.groupBy({
                by: ['performedById'],
                where: { organizationId, performedById: { in: accessibleIds } },
                _count: true
            }),
            // Current 30 days
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'CONVERTED', convertedAt: { gte: thirtyDaysAgo } },
                _count: true
            }),
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: thirtyDaysAgo } },
                _count: true
            }),
            // Baseline (30-60 days ago)
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, stage: 'CONVERTED', convertedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
                _count: true
            }),
            prisma.lead.groupBy({
                by: ['assignedToId'],
                where: { organizationId, assignedToId: { in: accessibleIds }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
                _count: true
            }),
            // Last Activity
            prisma.interaction.groupBy({
                by: ['performedById'],
                where: { organizationId, performedById: { in: accessibleIds } },
                _max: { createdAt: true }
            }),
            // Last Task Completion Recency (New Metric Source)
            prisma.task.groupBy({
                by: ['assignedToId'],
                where: { 
                    organizationId, 
                    assignedToId: { in: accessibleIds },
                    status: 'COMPLETED' 
                },
                _max: { completedAt: true }
            }),
            // Stage Distribution for Stuck Logic
            prisma.lead.groupBy({
                by: ['assignedToId', 'stage'],
                where: { organizationId, assignedToId: { in: accessibleIds } },
                _count: true
            })
        ]);

        const getCount = (groups, userId, key, matchKey, matchVal) => {
            const group = groups.find(g => g[key] === userId && (matchKey ? g[matchKey] === matchVal : true));
            return group ? group._count : 0;
        };

        const getMaxDate = (groups, userId, key, field = 'createdAt') => {
            const group = groups.find(g => g[key] === userId);
            return group ? group._max[field] : null;
        };

        // Team Benchmark Calculation
        const totalTeamConverted = currentConvertedGroups.reduce((acc, g) => acc + g._count, 0);
        const totalTeamLeads = currentTotalGroups.reduce((acc, g) => acc + g._count, 0);
        const teamAvgConversion = totalTeamLeads > 0 ? (totalTeamConverted / totalTeamLeads) * 100 : 0;

        const performanceData = users.map(u => {
            // Current Rate
            const curConverted = getCount(currentConvertedGroups, u.id, 'assignedToId');
            const curTotal = getCount(currentTotalGroups, u.id, 'assignedToId');
            const curRate = curTotal > 0 ? (curConverted / curTotal) * 100 : (curConverted > 0 ? 100 : 0);

            // Baseline Rate
            const baseConverted = getCount(baselineConvertedGroups, u.id, 'assignedToId');
            const baseTotal = getCount(baselineTotalGroups, u.id, 'assignedToId');
            const baseRate = baseTotal > 0 ? (baseConverted / baseTotal) * 100 : (baseConverted > 0 ? 100 : 0);

            const lastInteraction = getMaxDate(lastActivityGroups, u.id, 'performedById');
            const lastCompletedAt = getMaxDate(lastTaskCompletionGroups, u.id, 'assignedToId', 'completedAt');
            const overdueTasks = getCount(taskOverdueGroups, u.id, 'assignedToId');
            
            // This metric reflects task completion activity, not interaction logging.
            const userTaskStats = taskStatusGroups.filter(g => g.assignedToId === u.id);
            const totalTasksCount = userTaskStats.reduce((acc, g) => acc + g._count, 0);
            const completedTasksCount = userTaskStats.find(g => g.status === 'COMPLETED')?._count || 0;
            
            // 1. Root Cause Insights
            const insights = [];
            if (curTotal === 0) {
                insights.push("No leads assigned in period");
            } else {
                // Activity Check (Legacy insight for manager awareness)
                if (!lastInteraction) {
                    insights.push("Never Active");
                } else {
                    const daysSince = (now - new Date(lastInteraction)) / (1000 * 60 * 60 * 24);
                    if (daysSince > 7) insights.push("No interactions in 7+ days");
                }

                // Stuck Stage Detection
                if (curTotal >= 5) {
                    const stages = userStageGroups.filter(g => g.assignedToId === u.id);
                    const activeStages = stages.filter(s => !['CONVERTED', 'LOST'].includes(s.stage));
                    for (const s of activeStages) {
                        const stagePercent = (s._count / curTotal) * 100;
                        if (stagePercent > 50) {
                            insights.push(`Stuck at ${s.stage} (${s._count} leads)`);
                        }
                    }
                }

                if (overdueTasks > 0) {
                    insights.push(`${overdueTasks} overdue tasks`);
                }
            }

            // 2. Priority Scoring & Reasons Engine
            let score = 0;
            const reasons = [];

            if (curTotal === 0 && totalTasksCount === 0) {
                reasons.push("No workload assigned");
            } else {
                if (curTotal === 0) {
                    score += 50;
                    reasons.push("No leads assigned");
                }
                
                // Activity Check
                const inactivityDays = lastInteraction ? (now - new Date(lastInteraction)) / (1000 * 60 * 60 * 24) : 999;
                if (inactivityDays > 7) {
                    score += 30;
                    reasons.push("No recent task activity (7+ days)");
                }

                if (curRate === 0 && curTotal > 0) {
                    score += 20;
                    reasons.push("No conversions from active leads");
                }

                if (overdueTasks > 0) {
                    score += 20;
                    reasons.push("Overdue tasks pending");
                }
            }

            // Activity Status Formatting (Final Refinement Mapping)
            let activityStatus = "Active";
            if (totalTasksCount === 0) {
                activityStatus = "No tasks assigned";
            } else if (completedTasksCount === 0) {
                activityStatus = "No tasks completed yet";
            } else {
                const days = (now - new Date(lastCompletedAt)) / (1000 * 60 * 60 * 24);
                if (days > 7) activityStatus = "No task completed (7+ days)";
                else if (days > 3) activityStatus = "No task completed (3+ days)";
            }

            return {
                id: u.id,
                name: u.name,
                role: u.role,
                totalLeads: curTotal,
                convertedLeads: curConverted,
                conversionRate: parseFloat(curRate.toFixed(1)),
                conversionDelta: curTotal >= 5 ? parseFloat((curRate - baseRate).toFixed(1)) : null,
                deltaFromTeam: parseFloat((curRate - teamAvgConversion).toFixed(1)),
                lastActivity: lastCompletedAt,
                activityStatus,
                tasksCompleted: getCount(taskStatusGroups, u.id, 'assignedToId', 'status', 'COMPLETED'),
                overdueTasks,
                interactions: getCount(interactionGroups, u.id, 'performedById'),
                insights: insights.slice(0, 2),
                priorityScore: score,
                priorityReasons: reasons.slice(0, 2)
            };
        });

        // 3. Attention Priority Ranking (Stable Sort)
        performanceData.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.conversionRate - b.conversionRate; // Lower conversion = higher priority
        });

        // Add Rank
        const rankedData = performanceData.map((d, i) => ({
            ...d,
            priorityRank: i + 1
        }));

        // Calculate Aggregate Metrics for Team Header
        const totalLeads = rankedData.reduce((acc, r) => acc + r.totalLeads, 0);
        const totalInactive = rankedData.filter(r => r.activityStatus.includes('inactive') || r.activityStatus.includes('7+ days')).length;
        const totalNoLeads = rankedData.filter(r => r.totalLeads === 0).length;
        const leadsPerRep = rankedData.length > 0 ? (totalLeads / rankedData.length).toFixed(1) : 0;

        // Stage Distribution for redundant chart access
        const distribution = {
            NEW: getCount(userStageGroups, null, 'assignedToId', 'stage', 'NEW'),
            CONTACTED: getCount(userStageGroups, null, 'assignedToId', 'stage', 'CONTACTED'),
            INTERESTED: getCount(userStageGroups, null, 'assignedToId', 'stage', 'INTERESTED'),
            CONVERTED: getCount(userStageGroups, null, 'assignedToId', 'stage', 'CONVERTED'),
            LOST: getCount(userStageGroups, null, 'assignedToId', 'stage', 'LOST')
        };

        res.json({ 
            success: true, 
            data: { 
                performance: rankedData,
                metrics: {
                    totalLeads,
                    totalReps: rankedData.length,
                    totalInactive,
                    totalNoLeads,
                    leadsPerRep,
                    teamAvgConversion: parseFloat(teamAvgConversion.toFixed(1))
                },
                distribution,
                insights: [
                    totalInactive > 0 ? `${totalInactive} reps require reactivation — Review inactivity alerts` : "Team activity is stable",
                    totalNoLeads > 0 ? `${totalNoLeads} reps need lead assignment — Critical for volume` : "Workload is balanced"
                ]
            } 
        });
    } catch (error) {
        console.error('Error fetching team performance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch team performance' });
    }
}

/**
 * GET Team Activity (Latest 5 Interactions)
 */
async function getTeamActivity(req, res) {
    try {
        const organizationId = parseInt(req.user.organizationId);
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        const activities = await prisma.interaction.findMany({
            where: {
                organizationId,
                performedById: { in: accessibleIds }
            },
            include: {
                performedBy: { select: { id: true, name: true } },
                lead: { select: { id: true, company: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error fetching team activity:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch team activity' });
    }
}

/**
 * GET Pipeline Distribution
 */
async function getPipelineDistribution(req, res) {
    try {
        const organizationId = parseInt(req.user.organizationId);
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        const statusCounts = await prisma.lead.groupBy({
            by: ['stage'],
            where: {
                organizationId,
                assignedToId: { in: accessibleIds }
            },
            _count: { _all: true }
        });

        const distribution = {
            NEW: 0,
            CONTACTED: 0,
            INTERESTED: 0,
            CONVERTED: 0,
            LOST: 0
        };

        statusCounts.forEach(item => {
            const stage = item.stage.toUpperCase();
            if (distribution.hasOwnProperty(stage)) {
                distribution[stage] = item._count._all;
            }
        });

        // Drop-off Analysis
        const transitions = [
            { from: 'NEW', to: 'CONTACTED' },
            { from: 'CONTACTED', to: 'INTERESTED' },
            { from: 'INTERESTED', to: 'CONVERTED' }
        ];

        let biggestDropOff = null;

        transitions.forEach(t => {
            const base = distribution[t.from];
            const next = distribution[t.to];
            if (base >= 5) {
                const dropOff = ((base - next) / base) * 100;
                if (!biggestDropOff || dropOff > biggestDropOff.percentage) {
                    biggestDropOff = {
                        stage: `${t.from} → ${t.to}`,
                        percentage: parseFloat(dropOff.toFixed(1))
                    };
                }
            }
        });

        res.json({ 
            success: true, 
            data: { 
                distribution, 
                biggestDropOff: biggestDropOff || { stage: "Insufficient data", percentage: 0 } 
            } 
        });
    } catch (error) {
        console.error('Error fetching pipeline distribution:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pipeline distribution' });
    }
}

/**
 * GET Risk Summary
 */
async function getRiskSummary(req, res) {
    try {
        const organizationId = parseInt(req.user.organizationId);
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        const now = new Date();
        const inactiveThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const formatCount = (count, word) => {
            return count === 1 ? `1 ${word}` : `${count} ${word}s`;
        };

        const [inactiveLeads, overdueTasks, usersWithNoLeads, usersWithNoActivity, pipelineStats] = await Promise.all([
            prisma.lead.count({
                where: {
                    organizationId,
                    assignedToId: { in: accessibleIds },
                    assignedTo: { role: 'SALES' },
                    stage: { notIn: ['CONVERTED', 'LOST'] },
                    lastInteraction: { lt: inactiveThreshold }
                }
            }),
            prisma.task.count({
                where: {
                    organizationId,
                    assignedToId: { in: accessibleIds },
                    assignedTo: { role: 'SALES' },
                    status: 'PENDING',
                    dueDate: { lt: now }
                }
            }),
            prisma.user.findMany({
                where: {
                    organizationId,
                    id: { in: accessibleIds },
                    role: 'SALES',
                    leads: { none: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } }
                },
                select: { id: true }
            }),
            prisma.user.findMany({
                where: {
                    organizationId,
                    id: { in: accessibleIds },
                    role: 'SALES',
                    AND: [
                        { interactions: { none: { createdAt: { gte: inactiveThreshold } } } },
                        { tasks: { none: { status: 'COMPLETED', completedAt: { gte: inactiveThreshold } } } }
                    ]
                },
                select: { id: true }
            }),
            prisma.lead.groupBy({
                by: ['stage'],
                where: { 
                    organizationId, 
                    assignedToId: { in: accessibleIds },
                    assignedTo: { role: 'SALES' }
                },
                _count: true
            })
        ]);

        // Pipeline Drop-off Analysis (Internal)
        const counts = pipelineStats.reduce((acc, curr) => ({ ...acc, [curr.stage]: curr._count }), {});
        const stages = ['NEW', 'CONTACTED', 'INTERESTED', 'QUOTED', 'NEGOTIATION', 'CONVERTED'];
        let biggestDropOff = null;

        for (let i = 0; i < stages.length - 1; i++) {
            const current = counts[stages[i]] || 0;
            const next = counts[stages[i + 1]] || 0;
            
            if (current >= 5) {
                const dropOff = ((current - next) / current) * 100;
                if (dropOff > 40 && (!biggestDropOff || dropOff > biggestDropOff.percentage)) {
                    biggestDropOff = { 
                        stage: `${stages[i]} → ${stages[i + 1]}`, 
                        percentage: Math.round(dropOff) 
                    };
                }
            }
        }

        // Suggestions Engine (Prioritized)
        const suggestions = [];

        // 1. No Leads (ℹ)
        if (usersWithNoLeads.length > 0) {
            suggestions.push(`ℹ ${formatCount(usersWithNoLeads.length, 'rep')} have no leads — consider assigning new leads`);
        }

        // 2. No Activity (⚠)
        if (usersWithNoActivity.length > 0) {
            suggestions.push(`⚠ ${formatCount(usersWithNoActivity.length, 'rep')} inactive for 7+ days — needs attention`);
        }

        // 3. Drop-off (⚠)
        if (biggestDropOff) {
            suggestions.push(`⚠ High drop-off at ${biggestDropOff.stage} (${biggestDropOff.percentage}%)`);
        }

        // 4. Overdue Tasks (⚠)
        if (overdueTasks > 0) {
            suggestions.push(`⚠ ${formatCount(overdueTasks, 'overdue task')} need attention`);
        }

        // 5. Inactive Leads (ℹ)
        // Signal De-duplication: Only show if NO activity alert is present
        if (inactiveLeads > 0 && usersWithNoActivity.length === 0) {
            suggestions.push(`ℹ ${formatCount(inactiveLeads, 'lead')} inactive for 7+ days`);
        }

        res.json({
            success: true,
            data: {
                inactiveLeadsCount: inactiveLeads,
                overdueTasksCount: overdueTasks,
                thresholdDays: 7,
                suggestions: [...new Set(suggestions)].filter(Boolean).slice(0, 3)
            }
        });
    } catch (error) {
        console.error('Error fetching risk summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch risk summary' });
    }
}

module.exports = {
    getKPIs,
    getRecentLeads,
    getUpcomingTasks,
    getDashboardSummary,
    getReportsData,
    getTeamPerformance,
    getTeamActivity,
    getPipelineDistribution,
    getRiskSummary
};
