
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,

  
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: '7d',

  BASE_URL: process.env.BASE_URL || 'https://url-shortner-8e04.onrender.com/',

  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },

  URL_CODE_LENGTH: 6,
};