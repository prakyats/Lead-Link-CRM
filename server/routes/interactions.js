const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getInteractionsByLead,
    createInteraction
} = require('../controllers/interactionsController');

const validate = require('../middleware/validate');
const { createInteractionSchema } = require('../validations/interaction.validation');

// All interaction routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/interactions/{leadId}:
 *   get:
 *     summary: Get interactions for a lead
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of interactions
 */
// GET /api/interactions/:leadId - Get interactions for a lead
router.get('/:leadId', getInteractionsByLead);

/**
 * @swagger
 * /api/interactions:
 *   post:
 *     summary: Create a new interaction
 *     tags: [Interactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, type, description]
 *             properties:
 *               leadId: { type: integer }
 *               type: { type: string, enum: [CALL, EMAIL, MEETING, WHATSAPP, OTHER] }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Interaction created
 */
// POST /api/interactions - Create new interaction
router.post('/', validate(createInteractionSchema), createInteraction);

module.exports = router;
