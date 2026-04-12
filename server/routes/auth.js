const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema } = require('../validations/auth.validation');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to LeadLinkCRM
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
// GET /api/auth/me — verify token & return authenticated user info
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = router;
