// // =============================================================
// // routes/urls.js
// // =============================================================
// // URL management routes. All protected by JWT auth.
// //
// // REST API:
// //   GET    /api/urls          → list all URLs for logged-in user
// //   POST   /api/urls          → create a new short URL
// //   PUT    /api/urls/:id      → update a URL (title, active status)
// //   DELETE /api/urls/:id      → delete a URL
// //   GET    /api/urls/:id/stats → get click analytics for one URL
// //
// // ROUTE PARAMETERS:
// //   :id in the path is a "URL parameter" — a variable part of the URL.
// //   GET /api/urls/abc123 → req.params.id === 'abc123'
// // =============================================================

// const express = require('express');
// const router  = express.Router();

// const DB    = require('../config/database');
// const Cache = require('../config/cache');
// const { generateCode } = require('../utils/base62');
// const { authMiddleware } = require('../middleware/auth');
// const { createUrlLimiter } = require('../middleware/rateLimiter');
// const { BASE_URL } = require('../config');

// // Helper: generate unique document ID
// function generateId() {
//   return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// }

// // Helper: get or create the auto-increment counter
// // This simulates MongoDB's auto-incrementing _id for Base62 encoding
// function getNextCounter() {
//   let counter = DB.findOne('counters', c => c.id === 'url_counter');
//   if (!counter) {
//     counter = DB.insertOne('counters', { id: 'url_counter', value: 100000 });
//   }
//   const next = counter.value + 1;
//   DB.updateOne('counters', 'url_counter', { value: next });
//   return next;
// }

// // Helper: simulate geographic + device data for analytics
// // In a real app: use geoip-lite package and user-agent parser
// const COUNTRIES  = ['India', 'USA', 'UK', 'Germany', 'Canada', 'France', 'Brazil', 'Australia'];
// const DEVICES    = ['Desktop', 'Mobile', 'Tablet'];
// const REFERRERS  = ['Direct', 'Twitter', 'Google', 'WhatsApp', 'Instagram', 'LinkedIn', 'Email'];
// function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// // =============================================================
// // GET /api/urls
// // Returns all URLs created by the logged-in user.
// // Sorted newest first.
// // =============================================================
// router.get('/', authMiddleware, (req, res) => {
//   const urls = DB.find('urls', u => u.userId === req.user.id)
//     .sort((a, b) => b.createdAt - a.createdAt); // sort descending by date

//   res.json({ urls });
// });

// // =============================================================
// // POST /api/urls
// // Creates a new shortened URL.
// //
// // Request body: {
// //   longUrl: 'https://...',
// //   customAlias: 'my-alias',  // optional
// //   expiresIn: '7d',          // optional: '1h', '24h', '7d', '30d'
// //   title: 'My Link'          // optional
// // }
// // =============================================================
// router.post('/', authMiddleware, createUrlLimiter, (req, res) => {
//   const { longUrl, customAlias, expiresIn, title } = req.body;

//   // --- VALIDATE URL ---
//   if (!longUrl) {
//     return res.status(400).json({ error: 'longUrl is required.' });
//   }

//   // Try to parse the URL — invalid URLs will throw an error
//   try {
//     new URL(longUrl); // built-in URL constructor validates format
//   } catch (_) {
//     return res.status(400).json({ error: 'Invalid URL. Please include http:// or https://' });
//   }

//   // --- DETERMINE SHORT CODE ---
//   let shortCode;

//   if (customAlias) {
//     // Validate custom alias: only letters, numbers, hyphens, 3-30 chars
//     if (!/^[a-zA-Z0-9-]{3,30}$/.test(customAlias)) {
//       return res.status(400).json({
//         error: 'Custom alias must be 3-30 characters (letters, numbers, hyphens only).'
//       });
//     }
//     // Check if alias is already taken
//     const existing = DB.findOne('urls', u => u.shortCode === customAlias);
//     if (existing) {
//       return res.status(409).json({ error: 'This custom alias is already taken.' });
//     }
//     shortCode = customAlias;

//   } else {
//     // AUTO-GENERATE using Base62 encoding of our counter
//     // Counter ensures uniqueness (collision handling built-in)
//     const counter = getNextCounter();
//     shortCode = generateCode(counter);

//     // Extra collision check (extremely unlikely but defensive programming)
//     // Defensive programming = handle edge cases even when unlikely
//     let attempts = 0;
//     while (DB.findOne('urls', u => u.shortCode === shortCode) && attempts < 5) {
//       shortCode = generateCode(getNextCounter());
//       attempts++;
//     }
//   }

//   // --- CALCULATE EXPIRY ---
//   // MongoDB TTL Index in real life:
//   //   db.urls.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
//   //   MongoDB will auto-delete documents when expiresAt < current time
//   let expiresAt = null;
//   if (expiresIn) {
//     const durations = {
//       '1h':  1  * 60 * 60 * 1000,
//       '24h': 24 * 60 * 60 * 1000,
//       '7d':  7  * 24 * 60 * 60 * 1000,
//       '30d': 30 * 24 * 60 * 60 * 1000,
//     };
//     if (!durations[expiresIn]) {
//       return res.status(400).json({ error: 'Invalid expiresIn. Use: 1h, 24h, 7d, 30d' });
//     }
//     expiresAt = Date.now() + durations[expiresIn];
//   }

//   // --- DETERMINE TITLE ---
//   // If no title given, extract domain from URL as default
//   // new URL('https://github.com/foo').hostname → 'github.com'
//   const urlTitle = title?.trim() || new URL(longUrl).hostname;

//   // --- SAVE TO DATABASE ---
//   const urlDoc = DB.insertOne('urls', {
//     id: generateId(),
//     userId: req.user.id,
//     longUrl,
//     shortCode,
//     title: urlTitle,
//     clicks: 0,
//     isActive: true,
//     expiresAt,
//     createdAt: Date.now(),
//   });

//   // --- CACHE THE NEW URL (for fast redirects) ---
//   Cache.set(`url:${shortCode}`, urlDoc);

//   // 201 = Created
//   res.status(201).json({
//     message: 'Short URL created!',
//     url: urlDoc,
//     shortUrl: `${BASE_URL}/${shortCode}`
//   });
// });

// // =============================================================
// // PUT /api/urls/:id
// // Updates a URL's title or active status.
// // Users can only update their own URLs.
// // =============================================================
// router.put('/:id', authMiddleware, (req, res) => {
//   const { id } = req.params; // Extract :id from the URL path
//   const { title, isActive } = req.body;

//   // Find the URL and verify ownership
//   const url = DB.findOne('urls', u => u.id === id && u.userId === req.user.id);
//   if (!url) {
//     return res.status(404).json({ error: 'URL not found.' });
//     // 404 = Not Found
//   }

//   // Build the update object (only include fields that were provided)
//   const updates = {};
//   if (title !== undefined) updates.title = title.trim();
//   if (isActive !== undefined) updates.isActive = Boolean(isActive);

//   const updated = DB.updateOne('urls', id, updates);

//   // Invalidate cache — the cached data is now stale (outdated)
//   Cache.del(`url:${url.shortCode}`);

//   res.json({ url: updated });
// });

// // =============================================================
// // DELETE /api/urls/:id
// // Deletes a URL. Users can only delete their own URLs.
// // =============================================================
// router.delete('/:id', authMiddleware, (req, res) => {
//   const { id } = req.params;

//   const url = DB.findOne('urls', u => u.id === id && u.userId === req.user.id);
//   if (!url) {
//     return res.status(404).json({ error: 'URL not found.' });
//   }

//   DB.deleteOne('urls', id);
//   Cache.del(`url:${url.shortCode}`); // Remove from cache

//   // 200 with success message (some APIs return 204 No Content)
//   res.json({ message: 'URL deleted successfully.' });
// });

// // =============================================================
// // GET /api/urls/:id/stats
// // Returns click analytics for one specific URL.
// // =============================================================
// router.get('/:id/stats', authMiddleware, (req, res) => {
//   const { id } = req.params;

//   // Verify the URL belongs to this user
//   const url = DB.findOne('urls', u => u.id === id && u.userId === req.user.id);
//   if (!url) {
//     return res.status(404).json({ error: 'URL not found.' });
//   }

//   // Get all clicks for this URL
//   const clicks = DB.find('clicks', c => c.urlId === id);

//   // --- AGGREGATE DATA (like MongoDB's aggregation pipeline) ---

//   // COUNT BY COUNTRY: { India: 45, USA: 30, ... }
//   // reduce() is a powerful array method that builds a single result
//   // from iterating over all items.
//   const byCountry = clicks.reduce((acc, click) => {
//     acc[click.country] = (acc[click.country] || 0) + 1;
//     return acc;
//   }, {});

//   // COUNT BY DEVICE
//   const byDevice = clicks.reduce((acc, click) => {
//     acc[click.device] = (acc[click.device] || 0) + 1;
//     return acc;
//   }, {});

//   // COUNT BY REFERRER
//   const byReferrer = clicks.reduce((acc, click) => {
//     acc[click.referrer] = (acc[click.referrer] || 0) + 1;
//     return acc;
//   }, {});

//   // CLICKS PER DAY — last 7 days
//   const last7Days = [];
//   for (let i = 6; i >= 0; i--) {
//     const d = new Date();
//     d.setDate(d.getDate() - i); // go back i days
//     const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
//     const dayEnd   = dayStart + 86400000; // 24 hours in ms
//     const count    = clicks.filter(c => c.timestamp >= dayStart && c.timestamp < dayEnd).length;
//     last7Days.push({
//       label: d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
//       count
//     });
//   }

//   res.json({
//     url,
//     stats: {
//       total: clicks.length,
//       byCountry,
//       byDevice,
//       byReferrer,
//       last7Days
//     }
//   });
// });

// // =============================================================
// // POST /api/urls/:id/click (internal — simulates a click)
// // In production: clicking snap.lk/aB3 → redirect endpoint
// // records the click asynchronously, then redirects
// // =============================================================
// router.post('/:id/click', authMiddleware, (req, res) => {
//   const { id } = req.params;

//   const url = DB.findOne('urls', u => u.id === id && u.userId === req.user.id);
//   if (!url) return res.status(404).json({ error: 'URL not found.' });

//   // Record click with simulated analytics data
//   const click = DB.insertOne('clicks', {
//     id: generateId(),
//     urlId: id,
//     shortCode: url.shortCode,
//     timestamp: Date.now(),
//     country: randomFrom(COUNTRIES),
//     device: randomFrom(DEVICES),
//     referrer: randomFrom(REFERRERS),
//   });

//   // Increment click counter on the URL document
//   DB.updateOne('urls', id, { clicks: (url.clicks || 0) + 1 });

//   // Invalidate the cache entry (click count changed)
//   Cache.del(`url:${url.shortCode}`);

//   res.json({ click, message: 'Click recorded.' });
// });

// // =============================================================
// // GET /api/urls/stats/global
// // Overall stats across all of the user's URLs.
// // =============================================================
// router.get('/stats/global', authMiddleware, (req, res) => {
//   const urls = DB.find('urls', u => u.userId === req.user.id);
//   const urlIds = new Set(urls.map(u => u.id));
//   const allClicks = DB.find('clicks', c => urlIds.has(c.urlId));

//   const todayStart = new Date().setHours(0, 0, 0, 0);

//   res.json({
//     totalUrls: urls.length,
//     activeUrls: urls.filter(u => u.isActive && (!u.expiresAt || u.expiresAt > Date.now())).length,
//     totalClicks: allClicks.length,
//     clicksToday: allClicks.filter(c => c.timestamp >= todayStart).length,
//     cache: Cache.stats(),
//   });
// });

// module.exports = router;


//--new update--

const express = require('express');
const router  = express.Router();

const { Url, Click, Counter } = require('../config/database');
const Cache = require('../config/cache');
const { generateCode } = require('../utils/base62');
const { authMiddleware } = require('../middleware/auth');
const { createUrlLimiter } = require('../middleware/rateLimiter');
const { BASE_URL } = require('../config');

const COUNTRIES = ['India','USA','UK','Germany','Canada','France','Brazil','Australia'];
const DEVICES   = ['Desktop','Mobile','Tablet'];
const REFERRERS = ['Direct','Twitter','Google','WhatsApp','Instagram','LinkedIn','Email'];
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Get next counter value for Base62
async function getNextCounter() {
  const counter = await Counter.findOneAndUpdate(
    { id: 'url_counter' },
    { $inc: { value: 1 } },   // $inc increments the value by 1
    { upsert: true, new: true } // upsert = create if doesn't exist
  );
  return counter.value;
}

// GET /api/urls
router.get('/', authMiddleware, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch URLs.' });
  }
});

// POST /api/urls
router.post('/', authMiddleware, createUrlLimiter, async (req, res) => {
  const { longUrl, customAlias, expiresIn, title } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: 'longUrl is required.' });
  }

  try {
    new URL(longUrl);
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL. Please include http:// or https://' });
  }

  try {
    let shortCode;

    if (customAlias) {
      if (!/^[a-zA-Z0-9-]{3,30}$/.test(customAlias)) {
        return res.status(400).json({ error: 'Custom alias must be 3-30 characters.' });
      }
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(409).json({ error: 'This custom alias is already taken.' });
      }
      shortCode = customAlias;
    } else {
      const counter = await getNextCounter();
      shortCode = generateCode(counter);
    }

    let expiresAt = null;
    if (expiresIn) {
      const durations = {
        '1h':  1  * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d':  7  * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      expiresAt = Date.now() + (durations[expiresIn] || 0);
    }

    const urlDoc = await Url.create({
      userId:    req.user.id,
      longUrl,
      shortCode,
      title:     title?.trim() || new URL(longUrl).hostname,
      expiresAt,
    });

    Cache.set(`url:${shortCode}`, urlDoc);

    res.status(201).json({
      message: 'Short URL created!',
      url: urlDoc,
      shortUrl: `${BASE_URL}/${shortCode}`
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to create URL.' });
  }
});

// PUT /api/urls/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, isActive } = req.body;
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user.id });
    if (!url) return res.status(404).json({ error: 'URL not found.' });

    if (title !== undefined)    url.title    = title.trim();
    if (isActive !== undefined) url.isActive = Boolean(isActive);
    await url.save();

    Cache.del(`url:${url.shortCode}`);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update URL.' });
  }
});

// DELETE /api/urls/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user.id });
    if (!url) return res.status(404).json({ error: 'URL not found.' });

    await url.deleteOne();
    Cache.del(`url:${url.shortCode}`);
    res.json({ message: 'URL deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete URL.' });
  }
});

// GET /api/urls/stats/global
router.get('/stats/global', authMiddleware, async (req, res) => {
  try {
    const urls        = await Url.find({ userId: req.user.id });
    const urlIds      = urls.map(u => u._id.toString());
    const totalClicks = urls.reduce((sum, u) => sum + u.clicks, 0);
    const todayStart  = new Date().setHours(0, 0, 0, 0);
    const clicksToday = await Click.countDocuments({ urlId: { $in: urlIds }, timestamp: { $gte: todayStart } });
    const activeUrls  = urls.filter(u => u.isActive && (!u.expiresAt || u.expiresAt > Date.now())).length;

    res.json({
      totalUrls: urls.length,
      activeUrls,
      totalClicks,
      clicksToday,
      cache: Cache.stats(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// GET /api/urls/:id/stats
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user.id });
    if (!url) return res.status(404).json({ error: 'URL not found.' });

    const clicks = await Click.find({ urlId: req.params.id });

    const byCountry  = clicks.reduce((acc, c) => { acc[c.country]  = (acc[c.country]  || 0) + 1; return acc; }, {});
    const byDevice   = clicks.reduce((acc, c) => { acc[c.device]   = (acc[c.device]   || 0) + 1; return acc; }, {});
    const byReferrer = clicks.reduce((acc, c) => { acc[c.referrer] = (acc[c.referrer] || 0) + 1; return acc; }, {});

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d        = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd   = dayStart + 86400000;
      const count    = clicks.filter(c => c.timestamp >= dayStart && c.timestamp < dayEnd).length;
      last7Days.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), count });
    }

    res.json({ url, stats: { total: clicks.length, byCountry, byDevice, byReferrer, last7Days } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// POST /api/urls/:id/click
router.post('/:id/click', authMiddleware, async (req, res) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user.id });
    if (!url) return res.status(404).json({ error: 'URL not found.' });

    const click = await Click.create({
      urlId:     url._id.toString(),
      shortCode: url.shortCode,
      country:   randomFrom(COUNTRIES),
      device:    randomFrom(DEVICES),
      referrer:  randomFrom(REFERRERS),
    });

    url.clicks += 1;
    await url.save();
    Cache.del(`url:${url.shortCode}`);

    res.json({ click, message: 'Click recorded.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record click.' });
  }
});

module.exports = router;