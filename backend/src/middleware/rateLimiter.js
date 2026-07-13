// src/middleware/rateLimiter.js
// Express-rate-limit configurations for different route sensitivities.
// loginLimiter: 5 attempts per 15 minutes per IP (per document spec).
// apiLimiter: general-purpose limiter for all API routes.

const rateLimit = require('express-rate-limit');

// Strict limiter for authentication endpoints (login/register)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// General API rate limiter (applied to all /api/* routes)
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// High-ceiling limiter for scan status polling (GET /api/code-scan/:id)
// A 2-second poll interval for a 3-minute scan = ~90 requests — well within 500/15min
const scanPollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET', // only throttle GETs
  message: {
    success: false,
    message: 'Too many status checks. Please slow down your polling.',
  },
});

// Moderate limiter for scan creation (prevent scan flooding)
const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: 'Too many scan requests. Please wait a moment before starting a new scan.',
  },
});

module.exports = { loginLimiter, apiLimiter, scanLimiter, scanPollLimiter };
