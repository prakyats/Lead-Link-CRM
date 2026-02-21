const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getAllTasks,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask
} = require('../controllers/tasksController');

// All task routes require authentication
router.use(authMiddleware);

// GET /api/tasks - Get all tasks
router.get('/', getAllTasks);

// POST /api/tasks - Create new task
router.post('/', createTask);

// PUT /api/tasks/:id - Update task
router.put('/:id', updateTask);

// PUT /api/tasks/:id/complete - Toggle completion
router.put('/:id/complete', toggleComplete);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', deleteTask);

module.exports = router;
