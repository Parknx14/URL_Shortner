// // =============================================================
// // config/index.js
// // =============================================================
// // This file holds all configuration constants for the backend.
// //
// // In a real production app, sensitive values like JWT_SECRET
// // would come from environment variables (.env file), NOT be
// // hardcoded here. We use dotenv package for that:
// //   require('dotenv').config()
// //   const secret = process.env.JWT_SECRET
// //
// // But for learning, we hardcode them here so it just works.
// // =============================================================

// module.exports = {

//   // PORT: which "door" on your computer the server listens on.
//   // Think of ports like apartment numbers — 5000 is our apartment.
//   PORT: 5000,

//   // JWT_SECRET: a secret password used to sign JWT tokens.
//   // If someone gets this, they can forge tokens — keep it secret!
//   // In production: a long random string like a UUID or 256-bit key
//   JWT_SECRET: 'snaplink_super_secret_key_change_in_production_12345',

//   // JWT_EXPIRES_IN: how long a token is valid before the user
//   // must log in again. '7d' means 7 days.
//   JWT_EXPIRES_IN: '7d',

//   // BASE_URL: the domain that short URLs will use.
//   // In production this would be your actual domain e.g. 'https://snp.lk'
//   BASE_URL: 'http://localhost:5000',

//   // RATE_LIMIT: controls how many requests a user can make
//   // within a time window to prevent abuse.
//   RATE_LIMIT: {
//     windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
//     max: 100                   // max 100 requests per 15 minutes
//   },

//   // URL_CODE_LENGTH: how many characters the short code will be
//   // e.g., 6 → "aB3x9K"
//   URL_CODE_LENGTH: 6,

//   // DATA_DIR: where we store our JSON "database" files.
//   // In production, this would be a real MongoDB connection string.
//   DATA_DIR: './data'
// };
/// ----- new update to the app----

// Load .env file variables into process.env
// This must be at the top before anything else
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,

  // Now comes from .env file, not hardcoded
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: '7d',

  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',

  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },

  URL_CODE_LENGTH: 6,
};