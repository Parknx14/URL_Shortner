

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config');

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

  
  standardHeaders: true,
  legacyHeaders: false,
});


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
