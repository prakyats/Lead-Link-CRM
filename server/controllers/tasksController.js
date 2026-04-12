const prisma = require('../utils/prisma');
const { getAccessibleUserIds } = require('../utils/hierarchy');



/**
 * Helper to map Prisma Task to Legacy Frontend Format
 */
function mapTaskToLegacy(task) {
    if (!task) return null;

    const mapEnum = (val) => val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;

    return {
        ...task,
        status: task.status, // Return raw COMPLETED
        priority: task.priority, // Return raw HIGH
        assignedTo: task.assignedTo ? task.assignedTo.name : 'Unassigned',
    };
}

/**
 * Get all tasks with server-side RBAC
 */
async function getAllTasks(req, res) {
    try {
        const { organizationId } = req.user;
        const accessibleIds = await getAccessibleUserIds(req.user);

        const tasks = await prisma.task.findMany({
            where: {
                organizationId,
                assignedToId: { in: accessibleIds }
            },

            include: {
                lead: true,
                assignedTo: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const legacyTasks = tasks.map(mapTaskToLegacy);
        res.json({ success: true, data: legacyTasks });
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
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ success: false, message: 'ADMIN is read-only' });

        const { title, description, dueDate, priority, leadId, assignedToId } = req.body;

        const parsedLeadId = leadId ? parseInt(leadId) : null;
        const parsedAssignedToId = parseInt(assignedToId) || userId;

        // Only validate lead if one is specified
        if (parsedLeadId) {
            const lead = await prisma.lead.findFirst({
                where: { id: parsedLeadId, organizationId }
            });
            if (!lead) return res.status(400).json({ success: false, message: 'Invalid lead for this organization' });
        }

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(parsedAssignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: You cannot assign tasks to users outside your team' });
        }


        const newTask = await prisma.task.create({
            data: {
                organizationId,
                title: title.trim(),
                description: description ? description.trim() : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority ? priority.toUpperCase() : 'MEDIUM',
                status: 'PENDING',
                leadId: parsedLeadId,
                assignedToId: parsedAssignedToId
            },
            include: { assignedTo: { select: { name: true } } }
        });

        res.status(201).json({ success: true, data: mapTaskToLegacy(newTask) });
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
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingTask.assignedToId)) {
            return res.status(403).json({ success: false, message: 'Access denied: Task ownership is outside your team scope' });
        }

        const updateData = { ...req.body };
        delete updateData.id;
        if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
        if (updateData.leadId) updateData.leadId = parseInt(updateData.leadId);
        if (updateData.assignedToId) updateData.assignedToId = parseInt(updateData.assignedToId);
        if (updateData.status) updateData.status = updateData.status.toUpperCase();
        if (updateData.priority) updateData.priority = updateData.priority.toUpperCase();

        const updateRes = await prisma.task.updateMany({
            where: { id: parseInt(id), organizationId },
            data: updateData
        });
        if (updateRes.count === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        const updatedTask = await prisma.task.findFirst({
            where: { id: parseInt(id), organizationId },
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
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId } });
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
            where: { id: parseInt(id), organizationId },
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
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId } });
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
        const { id: userId, organizationId } = req.user;
        
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const baseWhere = {
            organizationId,
            assignedToId: userId,
            status: 'PENDING'
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
        const { role, organizationId } = req.user;
        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingTask) return res.status(404).json({ success: false, message: 'Task not found' });

        const accessibleIds = await getAccessibleUserIds(req.user);
        if (!accessibleIds.includes(existingTask.assignedToId)) {
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
