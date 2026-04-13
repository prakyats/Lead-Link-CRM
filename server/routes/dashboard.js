const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    getKPIs,
    getRecentLeads,
    getUpcomingTasks,
    getDashboardSummary,
    getReportsData,
    getTeamPerformance,
    getTeamActivity,
    getPipelineDistribution,
    getRiskSummary
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/dashboard/kpis:
 *   get:
 *     summary: Get dashboard KPI metrics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard KPIs
 */
// GET /api/dashboard/kpis - Get KPI metrics
router.get('/kpis', getKPIs);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get manager dashboard summary
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
// GET /api/dashboard/summary - Dashboard Summary (Manager snapshot)
router.get('/summary', getDashboardSummary);

/**
 * @swagger
 * /api/dashboard/reports:
 *   get:
 *     summary: Get analytics reports data
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Analytical report metrics
 */
// GET /api/dashboard/reports - Reports Data
router.get('/reports', getReportsData);

/**
 * @swagger
 * /api/dashboard/recent-leads:
 *   get:
 *     summary: Get recent leads for dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: List of recent leads
 */
// GET /api/dashboard/recent-leads - Get recent leads
router.get('/recent-leads', getRecentLeads);

/**
 * @swagger
 * /api/dashboard/upcoming-tasks:
 *   get:
 *     summary: Get upcoming tasks for dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: List of upcoming tasks
 */
// GET /api/dashboard/upcoming-tasks - Get upcoming tasks
router.get('/upcoming-tasks', getUpcomingTasks);

// GET /api/dashboard/team-performance - Get team performance statistics
router.get('/team-performance', getTeamPerformance);

// GET /api/dashboard/team-activity - Get latest team activity feed
router.get('/team-activity', getTeamActivity);

// GET /api/dashboard/team-pipeline - Get team pipeline distribution
router.get('/team-pipeline', getPipelineDistribution);

// GET /api/dashboard/team-risk - Get team risk and alert summary
router.get('/team-risk', getRiskSummary);

module.exports = router;
