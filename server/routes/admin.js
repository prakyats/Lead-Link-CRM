const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { runOnce } = require('../jobs/criticalLeadFollowUpCron');

router.use(authMiddleware);

/**
 * POST /api/admin/critical-leads/run-now
 * Admin-only. Runs the critical-lead follow-up email job once, immediately.
 * Returns the number of leads matched and emails sent, so you can verify the
 * pipeline end-to-end without waiting for the daily cron.
 *
 * Requires SMTP_HOST/PORT/USER/PASS to be configured in server/.env.
 * (ENABLE_CRITICAL_LEAD_EMAILS is only consulted by the scheduler, not here —
 * this endpoint lets you smoke-test the job even when the cron is off.)
 */
router.post('/critical-leads/run-now', async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }

        const missing = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']
            .filter((k) => !process.env[k]);

        if (missing.length) {
            return res.status(400).json({
                success: false,
                message: `SMTP not configured. Missing env vars: ${missing.join(', ')}`,
            });
        }

        const result = await runOnce();
        return res.json({
            success: true,
            message: 'Critical-lead email job executed',
            data: result,
        });
    } catch (err) {
        console.error('run-critical-leads-now failed:', err);
        return res.status(500).json({
            success: false,
            message: err?.message || 'Job failed',
        });
    }
});

module.exports = router;
