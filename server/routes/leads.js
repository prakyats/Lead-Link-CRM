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

// All leads routes require authentication
router.use(authMiddleware);

// GET /api/leads - Get all leads
router.get('/', getAllLeads);

// GET /api/leads/:id - Get single lead
router.get('/:id', getLeadById);

// POST /api/leads - Create new lead
router.post('/', createLead);

// PUT /api/leads/:id - Update lead
router.put('/:id', updateLead);

// PUT /api/leads/:id/stage - Update lead stage
router.put('/:id/stage', updateLeadStage);

// PUT /api/leads/:id/assign - Assign lead to user (MANAGER only)
router.put('/:id/assign', assignLead);

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', deleteLead);

module.exports = router;
