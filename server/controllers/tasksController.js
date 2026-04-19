const prisma = require('../utils/prisma');
const { getAccessibleUserIds } = require('../utils/hierarchy');
const { validateUserContext, validateId } = require('../utils/validation');

/**
 * LOCKED STATUS DEFINITIONS (Shared Logic)
 */
function computeTaskState(task) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const isCompleted = task.status === 'COMPLETED';
    const isPending = !isCompleted;
    const isOverdue = 
        task.dueDate && 
        new Date(task.dueDate) < startOfToday && 
        !isCompleted;

    return { isCompleted, isPending, isOverdue };
}

/**
 * Helper to map Prisma Task to Legacy Frontend Format
 */
function mapTaskToLegacy(task) {
    if (!task) return null;

    const mapEnum = (val) => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;
    const taskType = task.createdById === task.assignedToId ? 'SELF' : 'DELEGATED';

    return {
        ...task,
        status: task.status, // Return raw COMPLETED
        priority: task.priority, // Return raw HIGH
        assignedTo: task.assignedTo ? task.assignedTo.name : 'Unassigned',
        createdBy: task.createdBy ? task.createdBy.name : 'Unknown System',
        taskType
    };
}

/**
 * Helper: Compute task category for urgency sorting
 */
function getTaskCategory(dueDate, startOfToday, endOfToday) {
    if (!dueDate) return 3; // No date = Bottom
    const d = new Date(dueDate);
    if (d < startOfToday) return 0; // Overdue
    if (d <= endOfToday) return 1;  // Today
    return 2;                       // Upcoming
}

/**
 * Helper: Apply urgency-based sort to a task array (mutates in place)
 */
function sortTasksByUrgency(tasks, startOfToday, endOfToday) {
    tasks.sort((a, b) => {
        const catA = getTaskCategory(a.dueDate, startOfToday, endOfToday);
        const catB = getTaskCategory(b.dueDate, startOfToday, endOfToday);
        if (catA !== catB) return catA - catB;
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    return tasks;
}

/**
 * Get all tasks with role-awareness
 */
async function getAllTasks(req, res) {
    try {
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        const { role } = req.user;
        const accessibleIds = (await getAccessibleUserIds(req.user)).map(id => parseInt(id));

        // UTILITY: Compute counts from a list of tasks using consistent logic
        const computeCounts = (tasks) => {
            return tasks.reduce((acc, t) => {
                const { isPending, isOverdue, isCompleted } = computeTaskState(t);
                return {
                    totalTasks: acc.totalTasks + 1,
                    pendingCount: acc.pendingCount + (isPending ? 1 : 0),
                    overdueCount: acc.overdueCount + (isOverdue ? 1 : 0),
                    completedCount: acc.completedCount + (isCompleted ? 1 : 0)
                };
            }, { totalTasks: 0, pendingCount: 0, overdueCount: 0, completedCount: 0 });
        };

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        // ── ADMIN: Full task registry (same shape as SALES) for the Tasks UI ──
        if (role === 'ADMIN') {
            const tasks = await prisma.task.findMany({
                where: {
                    organizationId: orgId,
                    assignedToId: { in: accessibleIds }
                },
                include: {
                    lead: true,
                    assignedTo: { select: { name: true } },
                    createdBy: { select: { name: true } }
                }
            });

            const legacyTasks = sortTasksByUrgency(tasks.map(mapTaskToLegacy), startOfToday, endOfToday);
            return res.json({ success: true, role: 'ADMIN', data: { role, payload: { tasks: legacyTasks } } });
        }

        // ── MANAGER: Rep-grouped tasks with full task objects ────────────────
        if (role === 'MANAGER') {
            const reps = await prisma.user.findMany({
                where: { organizationId: orgId, managerId: userId },
                select: { id: true, name: true }
            });

            const result = await Promise.all(reps.map(async (rep) => {
                const repTasks = await prisma.task.findMany({
                    where: {
                        organizationId: orgId,
                        assignedToId: rep.id
                    },
                    include: {
                        lead: true,
                        assignedTo: { select: { name: true } },
                        createdBy: { select: { name: true } }
                    }
                });

                const legacyRepTasks = sortTasksByUrgency(repTasks.map(mapTaskToLegacy), startOfToday, endOfToday);

                return {
                    repId: rep.id,
                    repName: rep.name,
                    ...computeCounts(legacyRepTasks),
                    tasks: legacyRepTasks
                };
            }));

            return res.json({ success: true, role: 'MANAGER', data: { role, payload: result } });
        }

        // ── SALES (+ fallback): Flat urgency-sorted task list ────────────────
        const tasks = await prisma.task.findMany({
            where: {
                organizationId: orgId,
                OR: [
                    { assignedToId: userId },
                    { createdById: userId }
                ]
            },
            include: {
                lead: true,
                assignedTo: { select: { name: true } },
                createdBy: { select: { name: true } }
            }
        });

        const legacyTasks = sortTasksByUrgency(tasks.map(mapTaskToLegacy), startOfToday, endOfToday);
        res.json({ success: true, role: 'SALES', data: { role, payload: { tasks: legacyTasks } } });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
}

/**
 * Create new task
 */
async function createTask(req, res) {
    try {
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        const { role } = req.user;

        const { 
            title, 
            description, 
            dueDate, 
            priority, 
            leadId, 
            assignedToId,
            assignmentType = 'USER'
        } = req.body;

        const parsedLeadId = leadId ? parseInt(leadId) : null;
        
        if (parsedLeadId) {
            const lead = await prisma.lead.findFirst({
                where: { id: parsedLeadId, organizationId: orgId }
            });
            if (!lead) return res.status(400).json({ success: false, message: 'Invalid lead for this organization' });
        }

        let targetUserIds = [];

        const accessibleIds = await getAccessibleUserIds(req.user);

        if (assignmentType === 'TEAM') {
            if (role === 'SALES') {
                return res.status(403).json({ success: false, message: 'Sales representatives cannot perform team assignments.' });
            }
            
            const salesReps = await prisma.user.findMany({
                where: {
                    organizationId: orgId,
                    id: { in: accessibleIds },
                    role: 'SALES'
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true }
            });

            if (salesReps.length === 0) {
                return res.status(400).json({ success: false, message: 'No sales representatives available for team assignment.' });
            }
            targetUserIds = salesReps.map(r => r.id);
        } else {
            const parsedAssignedToId = parseInt(assignedToId) || userId;
            
            if (!accessibleIds.includes(parsedAssignedToId)) {
                return res.status(403).json({ success: false, message: 'Unauthorized assignment: Target user is outside your authorized hierarchy.' });
            }

            if (role === 'SALES' && parsedAssignedToId !== userId) {
                return res.status(403).json({ success: false, message: 'Sales representatives can only assign tasks to themselves.' });
            }
            targetUserIds = [parsedAssignedToId];
        }

        const normalizedTitle = title.trim().toLowerCase();
        const startOfDay = new Date(new Date(dueDate).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(dueDate).setHours(23, 59, 59, 999));

        let createdCount = 0;
        let skippedCount = 0;
        let lastCreatedTask = null;

        for (const targetId of targetUserIds) {
            const existingTask = await prisma.task.findFirst({
                where: {
                    organizationId: orgId,
                    assignedToId: targetId,
                    status: { not: 'COMPLETED' },
                    title: { equals: normalizedTitle, mode: 'insensitive' },
                    dueDate: { gte: startOfDay, lte: endOfDay }
                }
            });

            if (existingTask) {
                skippedCount++;
                continue;
            }

            const newTask = await prisma.task.create({
                data: {
                    organizationId: orgId,
                    title: title.trim(),
                    description: description ? description.trim() : null,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    priority: priority ? priority.toUpperCase() : 'MEDIUM',
                    status: 'PENDING',
                    leadId: parsedLeadId,
                    assignedToId: targetId,
                    createdById: userId
                },
                include: { 
                    assignedTo: { select: { name: true } },
                    createdBy: { select: { name: true } }
                }
            });
            lastCreatedTask = newTask;
            createdCount++;
        }

        if (createdCount === 0 && targetUserIds.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: targetUserIds.length === 1 
                    ? `Duplicate task already exists for this assignee on ${new Date(dueDate).toLocaleDateString()}`
                    : `All ${targetUserIds.length} team assignments skipped (duplicates existing).`
            });
        }

        const message = assignmentType === 'TEAM' 
            ? `Assigned to ${createdCount} reps (${skippedCount} skipped)`
            : 'Task created successfully';

        res.status(201).json({ 
            success: true, 
            message,
            createdCount,
            skippedCount,
            data: lastCreatedTask ? mapTaskToLegacy(lastCreatedTask) : null
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, message: 'Failed to create task' });
    }
}

/**
 * Update task
 */
async function updateTask(req, res) {
    try {
        const { id } = req.params;
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        const { role } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId: orgId } });
        if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingTask.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Task ownership is outside your team scope' });
        }

        const { title, description, dueDate, priority, leadId, assignedToId, status } = req.body;
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (priority !== undefined) updateData.priority = priority.toUpperCase();
        if (leadId !== undefined) updateData.leadId = parseInt(leadId);
        if (assignedToId !== undefined) updateData.assignedToId = parseInt(assignedToId);
        if (status !== undefined) updateData.status = status.toUpperCase();

        const updateRes = await prisma.task.updateMany({
            where: { id: parseInt(id), organizationId: orgId },
            data: updateData
        });
        if (updateRes.count === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        const updatedTask = await prisma.task.findFirst({
            where: { id: parseInt(id), organizationId: orgId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({ success: true, data: mapTaskToLegacy(updatedTask) });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, message: 'Failed to update task' });
    }
}

async function toggleComplete(req, res) {
    try {
        const { id } = req.params;
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        const { role } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId: orgId } });
        if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingTask.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Task ownership is outside your team scope' });
        }

        const newStatus = existingTask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await prisma.task.update({
            where: { id: parseInt(id) },
            data: {
                status: newStatus,
                completedAt: newStatus === 'COMPLETED' ? new Date() : null
            }
        });

        const updatedTask = await prisma.task.findFirst({
            where: { id: parseInt(id), organizationId: orgId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json({ success: true, data: mapTaskToLegacy(updatedTask) });
    } catch (error) {
        console.error('Error toggling task:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle task' });
    }
}

/**
 * Mark task as complete (specifically status = COMPLETED)
 */
async function markTaskComplete(req, res) {
    try {
        const { id } = req.params;
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        const { role } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId: orgId } });
        if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingTask.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Task ownership is outside your team scope' });
        }

        await prisma.task.update({
            where: { id: parseInt(id) },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });

        res.json({ success: true, message: 'Task marked as completed' });
    } catch (error) {
        console.error('Error completing task:', error);
        res.status(500).json({ success: false, message: 'Failed to complete task' });
    }
}

/**
 * Get task summary for dashboard (Today, Overdue, Upcoming)
 * Uses timezone-safe startOfDay/endOfDay logic
 */
async function getTaskSummary(req, res) {
    try {
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const baseWhere = {
            organizationId: orgId,
            assignedToId: userId,
            status: { not: 'COMPLETED' }
        };

        const [today, overdue, upcoming] = await Promise.all([
            prisma.task.findMany({
                where: {
                    ...baseWhere,
                    dueDate: {
                        gte: startOfToday,
                        lte: endOfToday
                    }
                },
                include: { lead: { select: { company: true, contactName: true } } }
            }),
            prisma.task.findMany({
                where: {
                    ...baseWhere,
                    dueDate: {
                        lt: startOfToday
                    }
                },
                include: { lead: { select: { company: true, contactName: true } } }
            }),
            prisma.task.findMany({
                where: {
                    ...baseWhere,
                    dueDate: {
                        gt: endOfToday
                    }
                },
                include: { lead: { select: { company: true, contactName: true } } }
            })
        ]);

        res.json({
            success: true,
            data: {
                today: today.map(t => ({ ...t, leadName: t.lead?.company || t.lead?.contactName })),
                overdue: overdue.map(t => ({ ...t, leadName: t.lead?.company || t.lead?.contactName })),
                upcoming: upcoming.map(t => ({ ...t, leadName: t.lead?.company || t.lead?.contactName }))
            }
        });
    } catch (error) {
        console.error('Error fetching task summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch task summary' });
    }
}

/**
 * Delete task
 */
async function deleteTask(req, res) {
    try {
        const { id } = req.params;
        const { orgId, userId, isValid } = validateUserContext(req.user);
        if (!isValid) return res.status(412).json({ success: false, message: 'Invalid session context' });
        
        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId: orgId } });
        if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(parseInt(existingTask.assignedToId))) {
            return res.status(403).json({ success: false, message: 'Access denied: Task ownership is outside your team scope' });
        }

        await prisma.task.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Failed to delete task' });
    }
}

module.exports = {
    getAllTasks,
    createTask,
    updateTask,
    toggleComplete,
    markTaskComplete,
    getTaskSummary,
    deleteTask
};
