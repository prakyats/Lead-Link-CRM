const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getAllLeads,
    getLeadById,
    createLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    assignLead
} = require('../controllers/leadsController');

const validate = require('../middleware/validate');
const { createLeadSchema, updateLeadSchema } = require('../validations/lead.validation');

// All leads routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Get all leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leads
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [company, contact, email]
 *             properties:
 *               company: { type: string }
 *               contact: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               value: { type: number }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *     responses:
 *       201:
 *         description: Lead created
 */
// GET /api/leads - Get all leads
router.get('/', getAllLeads);

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lead details
 *   put:
 *     summary: Update a lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lead updated
 *   delete:
 *     summary: Delete a lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lead deleted
 */
// GET /api/leads/:id - Get single lead
router.get('/:id', getLeadById);

// POST /api/leads - Create new lead
router.post('/', validate(createLeadSchema), createLead);

// PUT /api/leads/:id - Update lead
router.put('/:id', validate(updateLeadSchema), updateLead);

/**
 * @swagger
 * /api/leads/{id}/stage:
 *   put:
 *     summary: Update lead pipeline stage
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Stage updated
 */
// PUT /api/leads/:id/stage - Update lead stage
router.put('/:id/stage', updateLeadStage);

/**
 * @swagger
 * /api/leads/{id}/assign:
 *   put:
 *     summary: Assign lead to user (Manager only)
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lead assigned
 */
// PUT /api/leads/:id/assign - Assign lead to user (MANAGER only)
router.put('/:id/assign', assignLead);

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', deleteLead);

module.exports = router;
