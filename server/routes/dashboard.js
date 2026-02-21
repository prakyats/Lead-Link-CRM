const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getKPIs,
    getRecentLeads,
    getUpcomingTasks
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/kpis - Get KPI metrics
router.get('/kpis', getKPIs);

// GET /api/dashboard/recent-leads - Get recent leads
router.get('/recent-leads', getRecentLeads);

// GET /api/dashboard/upcoming-tasks - Get upcoming tasks
router.get('/upcoming-tasks', getUpcomingTasks);

module.exports = router;
