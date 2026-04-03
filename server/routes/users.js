const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getAllUsers, createUser } = require('../controllers/usersController');

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users - Get all users (Admin only)
router.get('/', getAllUsers);

// POST /api/users - Create new user (Admin only)
router.post('/', createUser);

module.exports = router;
