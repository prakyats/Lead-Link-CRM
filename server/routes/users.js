const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getAllUsers, createUser, getSalesUsers } = require('../controllers/usersController');

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users - Get all users (Admin only)
router.get('/', getAllUsers);

// GET /api/users/sales - Get sales/manager users for assignment (Manager/Admin)
router.get('/sales', getSalesUsers);

// POST /api/users - Create new user (Admin only)
router.post('/', createUser);

module.exports = router;
