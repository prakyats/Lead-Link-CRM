const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getAllTasks,
    createTask,
    updateTask,
    toggleComplete,
    markTaskComplete,
    getTaskSummary,
    deleteTask
} = require('../controllers/tasksController');

const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validations/task.validation');

// All task routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of tasks
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, dueDate, leadId]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               dueDate: { type: string, format: date-time }
 *               leadId: { type: integer }
 *               type: { type: string, enum: [FOLLOW_UP, DOCUMENTATION, MEETING, OTHER] }
 *     responses:
 *       201:
 *         description: Task created
 */
// GET /api/tasks - Get all tasks
router.get('/', getAllTasks);

/**
 * @swagger
 * /api/tasks/summary:
 *   get:
 *     summary: Get task summary for dashboard
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task count summary
 */
// GET /api/tasks/summary - Get task counts/list for dashboard
router.get('/summary', getTaskSummary);

// POST /api/tasks - Create new task
router.post('/', validate(createTaskSchema), createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Task updated
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Task deleted
 */
// PUT /api/tasks/:id - Update task
router.put('/:id', validate(updateTaskSchema), updateTask);

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   patch:
 *     summary: Mark task as completed
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Task completed
 */
// PATCH /api/tasks/:id/complete - Mark specifically as COMPLETED
router.patch('/:id/complete', markTaskComplete);

// PUT /api/tasks/:id/complete - Toggle completion (Legacy support)
router.put('/:id/complete', toggleComplete);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', deleteTask);

module.exports = router;
