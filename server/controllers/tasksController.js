const prisma = require('../utils/prisma');

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
        const { role, id: userId, organizationId } = req.user;
        let where = { organizationId };

        if (role === 'SALES') {
            where.assignedToId = userId;
        }

        const tasks = await prisma.task.findMany({
            where,
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
        res.json(legacyTasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
}

/**
 * Create new task
 */
async function createTask(req, res) {
    try {
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const { title, description, dueDate, priority, leadId, assignedToId } = req.body;
        const parsedLeadId = parseInt(leadId);
        const parsedAssignedToId = parseInt(assignedToId) || userId;

        const lead = await prisma.lead.findFirst({
            where: { id: parsedLeadId, organizationId }
        });
        if (!lead) return res.status(400).json({ error: 'Invalid lead for this organization' });

        const assignee = await prisma.user.findFirst({
            where: { id: parsedAssignedToId, organizationId }
        });
        if (!assignee) return res.status(400).json({ error: 'Invalid assignee for this organization' });

        const newTask = await prisma.task.create({
            data: {
                organizationId,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority ? priority.toUpperCase() : 'MEDIUM',
                status: 'PENDING',
                leadId: parsedLeadId,
                assignedToId: parsedAssignedToId
            },
            include: { assignedTo: { select: { name: true } } }
        });

        res.status(201).json(mapTaskToLegacy(newTask));
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
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
        if (!existingTask) return res.status(404).json({ error: 'Task not found' });
        if (role === 'SALES' && existingTask.assignedToId !== userId) return res.status(403).json({ error: 'Access denied' });

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
        if (updateRes.count === 0) return res.status(404).json({ error: 'Task not found' });

        const updatedTask = await prisma.task.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json(mapTaskToLegacy(updatedTask));
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
}

/**
 * Toggle task completion
 */
async function toggleComplete(req, res) {
    try {
        const { id } = req.params;
        const { role, id: userId, organizationId } = req.user;
        if (role === 'ADMIN') return res.status(403).json({ error: 'ADMIN is read-only' });

        const existingTask = await prisma.task.findFirst({ where: { id: parseInt(id), organizationId } });
        if (!existingTask) return res.status(404).json({ error: 'Task not found' });
        if (role === 'SALES' && existingTask.assignedToId !== userId) return res.status(403).json({ error: 'Access denied' });

        const newStatus = existingTask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        await prisma.task.updateMany({
            where: { id: parseInt(id), organizationId },
            data: {
                status: newStatus,
                completedAt: newStatus === 'COMPLETED' ? new Date() : null
            }
        });

        const updatedTask = await prisma.task.findFirst({
            where: { id: parseInt(id), organizationId },
            include: { assignedTo: { select: { name: true } } }
        });

        res.json(mapTaskToLegacy(updatedTask));
    } catch (error) {
        console.error('Error toggling task:', error);
        res.status(500).json({ error: 'Failed to toggle task' });
    }
}

/**
 * Delete task
 */
async function deleteTask(req, res) {
    try {
        const { id } = req.params;
        const { role, organizationId } = req.user;
        if (role !== 'MANAGER') return res.status(403).json({ error: 'Only Managers can delete' });

        const delRes = await prisma.task.deleteMany({ where: { id: parseInt(id), organizationId } });
        if (delRes.count === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
}

module.exports = {
    getAllTasks,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask
};
