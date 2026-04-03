const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getInteractionsByLead,
    createInteraction
} = require('../controllers/interactionsController');

// All interaction routes require authentication
router.use(authMiddleware);

// GET /api/interactions/:leadId - Get interactions for a lead
router.get('/:leadId', getInteractionsByLead);

// POST /api/interactions - Create new interaction
router.post('/', createInteraction);

module.exports = router;
