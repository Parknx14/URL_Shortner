// =============================================================
// middleware/rateLimiter.js
// =============================================================
// Rate limiting prevents API abuse by capping how many requests
// a client can make in a given time window.
//
// WHY RATE LIMIT?
//   Without it, someone could write a script:
//     for (let i = 0; i < 1000000; i++) {
//       fetch('/api/urls', { method: 'POST', body: ... })
//     }
//   This would:
//     - Flood our database with garbage data
//     - Crash our server (too many requests)
//     - Cost us money (cloud bills scale with usage)
//
// HTTP STATUS 429: "Too Many Requests"
//   When rate limit is hit, we return 429 with a Retry-After header
//   telling the client when they can try again.
//
// REAL-WORLD RATE LIMITING:
//   In production, you'd use Redis to store request counts so
//   limits work across multiple server instances (horizontal scaling).
//   Package: express-rate-limit with redis store.
// =============================================================

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config');

/**
 * generalLimiter
 * Applied to all API routes.
 * 100 requests per 15 minutes per IP address.
 *
 * rateLimit() is a function from the 'express-rate-limit' package.
 * It returns middleware that tracks request counts per IP.
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs, // 15 minutes
  max: RATE_LIMIT.max,           // 100 requests max

  // What to send back when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000 / 60), // in minutes
    });
  },

  // standardHeaders: true → adds RateLimit-* headers to responses
  // These tell the client how many requests they have left:
  //   RateLimit-Limit: 100
  //   RateLimit-Remaining: 47
  //   RateLimit-Reset: 1699000000
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * createUrlLimiter
 * Stricter limit specifically for URL creation.
 * 20 requests per 15 minutes (URL creation is expensive).
 */
const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // only 20 URL creations per window
  handler: (req, res) => {
    res.status(429).json({
      error: 'URL creation limit reached. Try again in 15 minutes.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * authLimiter
 * Very strict limit for login/register to prevent brute force attacks.
 * A brute force attack = trying thousands of passwords automatically.
 * 10 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts. Please wait 15 minutes.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, createUrlLimiter, authLimiter };
