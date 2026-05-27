// // =============================================================
// // middleware/auth.js
// // =============================================================
// // This is Express MIDDLEWARE for JWT authentication.
// //
// // WHAT IS MIDDLEWARE?
// //   In Express, middleware is a function that runs BETWEEN
// //   receiving a request and sending a response.
// //
// //   Request → [middleware 1] → [middleware 2] → Route Handler → Response
// //
// //   Think of it like security checkpoints at an airport:
// //   Before you get on the plane (route handler), you go through
// //   passport control (auth middleware), security scan (rate limit), etc.
// //
// // HOW JWT AUTH MIDDLEWARE WORKS:
// //   1. Client sends request with token in the Authorization header:
// //      Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQi...
// //   2. This middleware extracts and verifies the token
// //   3. If valid: attaches user to req.user and calls next()
// //   4. If invalid: returns 401 Unauthorized (stops the request)
// //
// // USAGE IN ROUTES:
// //   router.get('/urls', authMiddleware, (req, res) => {
// //     // req.user is available here because middleware verified it
// //     const urls = DB.find('urls', u => u.userId === req.user.id)
// //   })
// // =============================================================

// const jwt = require('jsonwebtoken'); // npm package for JWT operations
// const { JWT_SECRET } = require('../config');
// const DB = require('../config/database');

// /**
//  * authMiddleware
//  * Express middleware function.
//  *
//  * Every middleware has THREE parameters:
//  * @param {object} req  - the incoming request (has .headers, .body, .params)
//  * @param {object} res  - the outgoing response (use to send data back)
//  * @param {Function} next - call this to pass control to next middleware/handler
//  */
// function authMiddleware(req, res, next) {

//   // STEP 1: Extract the token from the Authorization header
//   // Header format: "Bearer <token>"
//   // req.headers.authorization might be: "Bearer eyJhbGci..."
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     // No token provided — reject the request
//     return res.status(401).json({
//       error: 'Access denied. No token provided.',
//       // 401 = Unauthorized (not logged in)
//     });
//   }

//   // Split "Bearer eyJhbGci..." → ["Bearer", "eyJhbGci..."]
//   // [1] gets the second part (the actual token)
//   const token = authHeader.split(' ')[1];

//   // STEP 2: Verify the token using our secret key
//   // jwt.verify() checks:
//   //   a) Was this token signed with JWT_SECRET? (not tampered with)
//   //   b) Has it expired?
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     // decoded = { userId: 'abc123', iat: 1234567890, exp: 1234567890 }

//     // STEP 3: Look up the actual user from the database
//     const user = DB.findOne('users', u => u.id === decoded.userId);
//     if (!user) {
//       return res.status(401).json({ error: 'User not found' });
//     }

//     // STEP 4: Attach user to request object (without password!)
//     // Now any route handler after this middleware can use req.user
//     const { password, ...userWithoutPassword } = user;
//     req.user = userWithoutPassword;

//     // STEP 5: Call next() to continue to the route handler
//     next();

//   } catch (error) {
//     // Token is invalid or expired
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ error: 'Token expired. Please log in again.' });
//     }
//     return res.status(401).json({ error: 'Invalid token.' });
//   }
// }

// /**
//  * optionalAuth
//  * Like authMiddleware but doesn't block if no token.
//  * Used for routes that work for both logged-in and anonymous users.
//  */
// function optionalAuth(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     req.user = null; // No user — that's okay
//     return next();
//   }
//   // If token exists, verify it
//   authMiddleware(req, res, next);
// }

// module.exports = { authMiddleware, optionalAuth };



//---new update---



const jwt  = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { User } = require('../config/database');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user from MongoDB using _id
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = { id: user._id, email: user.email, name: user.name, plan: user.plan };
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = { authMiddleware };