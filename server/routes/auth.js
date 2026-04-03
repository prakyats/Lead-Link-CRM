const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me — verify token & return authenticated user info
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
