// // =============================================================
// // routes/auth.js
// // =============================================================
// // Authentication routes: Register and Login.
// //
// // REST API DESIGN:
// //   POST /api/auth/register  → create a new account
// //   POST /api/auth/login     → get a JWT token
// //   GET  /api/auth/me        → get current user info (requires auth)
// //
// // WHAT HAPPENS ON REGISTER:
// //   1. Validate input (email format, password length)
// //   2. Check if email is already taken
// //   3. Hash the password with bcrypt
// //   4. Save user to database
// //   5. Create JWT token
// //   6. Return token + user (without password)
// //
// // WHAT HAPPENS ON LOGIN:
// //   1. Find user by email
// //   2. Compare password against stored hash using bcrypt.compare()
// //   3. If match: create JWT token and return it
// //   4. If no match: return generic error (don't say "wrong password"
// //      specifically — reveals whether email exists, a security leak)
// // =============================================================

// const express = require('express');
// const bcrypt  = require('bcryptjs'); // secure password hashing
// const jwt     = require('jsonwebtoken');


// // Express Router: a mini-app that handles a subset of routes
// // We mount this at /api/auth in server.js
// const router = express.Router();

// const DB = require('../config/database');
// const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
// const { authMiddleware } = require('../middleware/auth');
// const { authLimiter } = require('../middleware/rateLimiter');

// // Helper: generate a unique ID
// // In real MongoDB, _id is auto-generated. We simulate that here.
// function generateId() {
//   return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// }

// // =============================================================
// // POST /api/auth/register
// // Creates a new user account.
// // =============================================================
// router.post('/register', authLimiter, async (req, res) => {
//   // req.body contains the JSON data sent by the frontend
//   // e.g., { email: 'alice@example.com', password: 'secret', name: 'Alice' }
//   const { email, password, name } = req.body;

//   // --- INPUT VALIDATION ---
//   // Always validate on the backend even if frontend also validates.
//   // Someone could bypass the frontend and send raw HTTP requests.
//   if (!email || !password || !name) {
//     return res.status(400).json({ error: 'Email, password, and name are required.' });
//     // 400 = Bad Request (client sent incomplete data)
//   }

//   if (password.length < 6) {
//     return res.status(400).json({ error: 'Password must be at least 6 characters.' });
//   }

//   // Basic email format check using regex
//   // Regex (Regular Expression) is a pattern for matching strings
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return res.status(400).json({ error: 'Please enter a valid email address.' });
//   }

//   // --- CHECK IF EMAIL ALREADY EXISTS ---
//   const existingUser = DB.findOne('users', u => u.email === email.toLowerCase());
//   if (existingUser) {
//     return res.status(409).json({ error: 'An account with this email already exists.' });
//     // 409 = Conflict (resource already exists)
//   }

//   // --- HASH THE PASSWORD ---
//   // bcrypt.hash(password, saltRounds)
//   // saltRounds = 12: how many times to process the hash.
//   // Higher = more secure but slower. 12 is a good balance.
//   //
//   // WHY HASH PASSWORDS?
//   //   If your database is hacked, attackers shouldn't get plain passwords.
//   //   "password123" → "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LchE96lh"
//   //   The hash CANNOT be reversed — you can only check if a password matches.
//   const hashedPassword = await bcrypt.hash(password, 12);

//   // --- CREATE THE USER DOCUMENT ---
//   const user = DB.insertOne('users', {
//     id: generateId(),
//     email: email.toLowerCase(), // always store lowercase
//     password: hashedPassword,   // NEVER store plain text passwords
//     name: name.trim(),
//     createdAt: Date.now(),
//     plan: 'free'                // 'free' or 'pro'
//   });

//   // --- CREATE JWT TOKEN ---
//   // jwt.sign(payload, secret, options)
//   //   payload = data to encode (don't put sensitive info here!)
//   //   secret  = our secret key for signing
//   //   options = { expiresIn: '7d' } → token expires in 7 days
//   const token = jwt.sign(
//     { userId: user.id },   // payload: just the user ID
//     JWT_SECRET,
//     { expiresIn: JWT_EXPIRES_IN }
//   );

//   // Return token and user (but NOT the password)
//   const { password: _, ...userWithoutPassword } = user; // destructure to remove password

//   // 201 = Created (successfully created a new resource)
//   res.status(201).json({
//     message: 'Account created successfully!',
//     token,
//     user: userWithoutPassword
//   });
// });

// // =============================================================
// // POST /api/auth/login
// // Authenticates an existing user, returns JWT token.
// // =============================================================
// router.post('/login', authLimiter, async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required.' });
//   }

//   // --- FIND USER ---
//   const user = DB.findOne('users', u => u.email === email.toLowerCase());

//   // Security note: if user doesn't exist, we still run bcrypt.compare()
//   // to prevent "timing attacks" — where an attacker can tell if an email
//   // exists based on how fast the server responds.
//   if (!user) {
//     // Use a dummy hash to waste time (same as real bcrypt compare)
//     await bcrypt.compare(password, '$2b$12$invalidhashforsecuritypurposes');
//     return res.status(401).json({ error: 'Invalid email or password.' });
//   }

//   // --- COMPARE PASSWORD ---
//   // bcrypt.compare(plaintext, hash) returns true if they match
//   // It hashes the plaintext and compares to the stored hash
//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     return res.status(401).json({ error: 'Invalid email or password.' });
//     // 401 = Unauthorized
//   }

//   // --- ISSUE TOKEN ---
//   const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
//   const { password: _, ...userWithoutPassword } = user;

//   res.json({
//     message: 'Logged in successfully!',
//     token,
//     user: userWithoutPassword
//   });
// });

// // =============================================================
// // GET /api/auth/me
// // Returns the current logged-in user.
// // Protected by authMiddleware — requires a valid JWT.
// // =============================================================
// router.get('/me', authMiddleware, (req, res) => {
//   // req.user was set by authMiddleware after verifying the token
//   res.json({ user: req.user });
// });

// module.exports = router;



//---- new update----



const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

const { User } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in MongoDB
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan }
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      await bcrypt.compare(password, '$2b$12$invalidhashforsecurity');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      message: 'Logged in successfully!',
      token,
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan }
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;