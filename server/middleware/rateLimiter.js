const rateLimit = require('express-rate-limit');

/**
 * Custom handler for rate limit exceed event
 */
const limitReachedHandler = (req, res, next, options) => {
  console.warn(`⚠️ Rate limit exceeded: ${req.ip} tried to access ${req.originalUrl}`);
  res.status(options.statusCode || 429).json({
    message: "Too many requests. Please try again later."
  });
};

/**
 * General API Limiter
 * Applied to all /api routes
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: limitReachedHandler
});

/**
 * Auth Limiter (Strict)
 * Applied to login route
 * 5 FAILED requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 7, // Limit each IP to 7 requests per windowMs
  skipSuccessfulRequests: true, // Only failed attempts count towards the limit
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitReachedHandler
});

module.exports = {
  apiLimiter,
  authLimiter
};
