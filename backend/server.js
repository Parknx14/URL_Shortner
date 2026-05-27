// // =============================================================
// // server.js
// // =============================================================
// // This is the ENTRY POINT of the backend.
// // When you run "node server.js", this file runs first.
// //
// // WHAT THIS FILE DOES:
// //   1. Creates an Express application
// //   2. Registers middleware (cors, json parsing, rate limiting)
// //   3. Mounts route files at URL paths
// //   4. Handles the redirect endpoint (/:shortCode)
// //   5. Starts listening on a port
// //
// // EXPRESS.JS:
// //   Express is a minimal web framework for Node.js.
// //   It makes it easy to:
// //     - Listen for HTTP requests (GET, POST, PUT, DELETE)
// //     - Parse request bodies (JSON, form data)
// //     - Send responses (JSON, HTML, redirects)
// //     - Chain middleware functions
// // =============================================================

// const express = require('express');
// const cors    = require('cors');    // Cross-Origin Resource Sharing
// const path    = require('path');

// const { PORT, BASE_URL } = require('./config');
// const DB    = require('./config/database');
// const Cache = require('./config/cache');
// const { generalLimiter } = require('./middleware/rateLimiter');

// // Import route files
// const authRoutes = require('./routes/auth');
// const urlRoutes  = require('./routes/urls');

// // =============================================================
// // CREATE THE EXPRESS APP
// // app is the core object — everything attaches to it
// // =============================================================
// const app = express();

// // =============================================================
// // MIDDLEWARE STACK
// // These run on EVERY request before reaching route handlers.
// // Order matters — they execute top to bottom.
// // =============================================================

// // CORS: allows the frontend (localhost:5173) to call this backend
// // Without this, browsers block cross-origin requests for security.
// // In production: replace with your actual frontend domain.
// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));

// // express.json(): parses incoming request bodies as JSON
// // Without this, req.body would be undefined
// // When frontend sends: fetch('/api/...', { body: JSON.stringify({...}) })
// // This middleware parses it so req.body = { ... }
// app.use(express.json());

// // Apply general rate limiter to all /api routes
// app.use('/api', generalLimiter);

// // =============================================================
// // ROUTE MOUNTING
// // We "mount" each router at a specific path prefix.
// // All routes in auth.js are prefixed with /api/auth
// // All routes in urls.js are prefixed with /api/urls
// // =============================================================
// app.use('/api/auth', authRoutes);
// app.use('/api/urls', urlRoutes);

// // =============================================================
// // REDIRECT ENDPOINT
// // GET /:shortCode — the core feature of a URL shortener!
// //
// // When someone visits http://localhost:5000/aB3x9K:
// //   1. Extract shortCode from URL ("aB3x9K")
// //   2. Check Redis cache first
// //   3. If not cached: look up in database
// //   4. If found: 301 redirect to the original URL
// //   5. Record the click for analytics
// // =============================================================
// app.get('/:shortCode', (req, res) => {
//   const { shortCode } = req.params;

//   // Skip if this looks like an API or static file request
//   if (shortCode.startsWith('api') || shortCode.includes('.')) {
//     return res.status(404).json({ error: 'Not found' });
//   }

//   // STEP 1: Check Redis cache (fast path — ~1ms)
//   const cached = Cache.get(`url:${shortCode}`);
//   if (cached) {
//     // Check expiry even on cached data
//     if (cached.expiresAt && cached.expiresAt < Date.now()) {
//       Cache.del(`url:${shortCode}`);
//       return res.status(410).json({ error: 'This short URL has expired.' });
//       // 410 = Gone (resource existed but no longer does)
//     }
//     if (!cached.isActive) {
//       return res.status(404).json({ error: 'This short URL is disabled.' });
//     }
//     // Record click asynchronously (don't slow down the redirect)
//     recordClick(cached.id, shortCode);
//     // 301 = Moved Permanently (browser caches this redirect)
//     // 302 = Found (temporary redirect — use this for trackable links)
//     return res.redirect(302, cached.longUrl);
//   }

//   // STEP 2: Cache miss — query database (slow path — ~10ms)
//   const url = DB.findOne('urls', u => u.shortCode === shortCode);

//   if (!url) {
//     return res.status(404).json({ error: 'Short URL not found.' });
//   }

//   // Check expiration (MongoDB TTL index would handle this automatically)
//   if (url.expiresAt && url.expiresAt < Date.now()) {
//     return res.status(410).json({ error: 'This short URL has expired.' });
//   }

//   if (!url.isActive) {
//     return res.status(404).json({ error: 'This short URL is disabled.' });
//   }

//   // STEP 3: Store in cache for next time
//   Cache.set(`url:${shortCode}`, url);

//   // STEP 4: Record click (async — fire and forget)
//   recordClick(url.id, shortCode);

//   // STEP 5: Redirect!
//   res.redirect(302, url.longUrl);
// });

// // =============================================================
// // CLICK RECORDER
// // Records analytics data when a URL is clicked.
// // In production: this would publish to a message queue (Kafka/RabbitMQ)
// // and be processed by a separate analytics microservice.
// // =============================================================
// const COUNTRIES = ['India','USA','UK','Germany','Canada','France','Brazil','Australia'];
// const DEVICES   = ['Desktop','Mobile','Tablet'];
// const REFERRERS = ['Direct','Twitter','Google','WhatsApp','Instagram','LinkedIn','Email'];
// function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
// function generateId()    { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

// function recordClick(urlId, shortCode) {
//   // setImmediate() runs this AFTER the response is sent
//   // So the redirect happens immediately, analytics recorded after
//   setImmediate(() => {
//     try {
//       DB.insertOne('clicks', {
//         id: generateId(),
//         urlId,
//         shortCode,
//         timestamp: Date.now(),
//         country:  randomFrom(COUNTRIES),
//         device:   randomFrom(DEVICES),
//         referrer: randomFrom(REFERRERS),
//       });
//       // Increment click count on the URL document
//       const url = DB.findOne('urls', u => u.id === urlId);
//       if (url) DB.updateOne('urls', urlId, { clicks: (url.clicks || 0) + 1 });
//     } catch (e) {
//       console.error('Click recording failed:', e.message);
//     }
//   });
// }

// // =============================================================
// // HEALTH CHECK ENDPOINT
// // Used to verify the server is running.
// // Monitoring tools (like UptimeRobot) ping this every minute.
// // =============================================================
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'ok',
//     uptime: process.uptime(),           // seconds since server started
//     memory: process.memoryUsage().heapUsed, // bytes of RAM used
//     cache: Cache.stats(),
//   });
// });

// // =============================================================
// // GLOBAL ERROR HANDLER
// // If any route throws an unhandled error, this catches it.
// // Without this, unhandled errors crash the server!
// //
// // Express recognizes error handlers by their 4 parameters: (err, req, res, next)
// // =============================================================
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err.message);
//   res.status(500).json({
//     error: 'Internal server error. Please try again.',
//     // In development: include err.message
//     // In production: NEVER expose internal errors to clients
//   });
// });

// // =============================================================
// // START THE SERVER
// // app.listen(port, callback) starts accepting connections.
// // =============================================================
// app.listen(PORT, () => {
//   console.log(`
//   ⚡ SnapLink Backend running!
//   ───────────────────────────
//   API Server  : http://localhost:${PORT}
//   Health Check: http://localhost:${PORT}/health
//   Redirect    : http://localhost:${PORT}/:shortCode
//   ───────────────────────────
//   `);
// });

// module.exports = app;




// --- new update---



require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { PORT, BASE_URL } = require('./config');
const { connectDB, Url } = require('./config/database');
const Cache  = require('./config/cache');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const urlRoutes  = require('./routes/urls');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://url-shortner-j3iivye9d-parknx14.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/api', generalLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Redirect endpoint
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  if (shortCode.startsWith('api') || shortCode.includes('.')) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const cached = Cache.get(`url:${shortCode}`);
    if (cached) {
      return res.redirect(302, cached.longUrl);
    }

    const url = await Url.findOne({ shortCode });
    if (!url) return res.status(404).json({ error: 'Short URL not found.' });
    if (url.expiresAt && url.expiresAt < Date.now()) {
      return res.status(410).json({ error: 'This short URL has expired.' });
    }
    if (!url.isActive) {
      return res.status(404).json({ error: 'This short URL is disabled.' });
    }

    Cache.set(`url:${shortCode}`, url);
    res.redirect(302, url.longUrl);
  } catch (error) {
    res.status(500).json({ error: 'Redirect failed.' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cache: Cache.stats() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// Connect to MongoDB first, THEN start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
  ⚡ SnapLink Backend running!
  ───────────────────────────
  API Server  : http://localhost:${PORT}
  MongoDB     : Connected ✅
  ───────────────────────────
    `);
  });
});