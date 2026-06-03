

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