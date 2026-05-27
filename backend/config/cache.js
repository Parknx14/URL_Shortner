// =============================================================
// config/cache.js
// =============================================================
// Simulates Redis using a JavaScript Map (in-memory storage).
//
// WHAT IS REDIS?
//   Redis is a separate server program that stores data in RAM
//   (memory), not on disk. RAM is ~100x faster than disk reads.
//   It's used as a "cache" — a fast temporary storage layer.
//
// WHY CACHE URL LOOKUPS?
//   Every redirect (e.g., snap.lk/aB3 → original URL) hits the
//   database. If 10,000 people click the same link:
//     Without cache: 10,000 database reads → slow, expensive
//     With cache:    1 database read + 9,999 memory reads → fast!
//
// REAL REDIS USAGE IN NODE.JS:
//   const redis = require('redis')
//   const client = redis.createClient({ url: 'redis://localhost:6379' })
//   await client.set('url:aB3', JSON.stringify(urlDoc), { EX: 300 })
//   const cached = await client.get('url:aB3')
//
// HERE we use a JavaScript Map (built-in, no install needed).
// A Map is like an object but designed for key-value storage.
// =============================================================

// The cache store: Map<key, { value, expiresAt }>
// This lives in memory — cleared when server restarts
// (Redis persists to disk, so it survives restarts)
const store = new Map();

// Track statistics for the analytics dashboard
let hits = 0;    // How many times we found something in cache
let misses = 0;  // How many times we had to go to the database

const Cache = {

  /**
   * get(key)
   * Looks up a value in cache.
   * Returns null if not found or expired (cache "miss").
   *
   * @param {string} key - e.g., 'url:aB3x9K'
   */
  get(key) {
    const entry = store.get(key);

    // Key doesn't exist in cache
    if (!entry) {
      misses++;
      return null;
    }

    // Check if this entry has expired (TTL = Time To Live)
    if (Date.now() > entry.expiresAt) {
      store.delete(key); // Clean up expired entry
      misses++;
      return null;
    }

    // Cache HIT — return the stored value
    hits++;
    return entry.value;
  },

  /**
   * set(key, value, ttlSeconds)
   * Stores a value in cache with an expiration time.
   *
   * @param {string} key        - cache key, e.g., 'url:aB3x9K'
   * @param {*}      value      - anything: object, string, number
   * @param {number} ttlSeconds - how long to keep it (default: 5 minutes)
   *
   * Real Redis: SET key value EX 300
   */
  set(key, value, ttlSeconds = 300) {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000, // convert seconds → ms
      createdAt: Date.now()
    });
  },

  /**
   * del(key)
   * Removes an entry from cache.
   * Called when a URL is updated or deleted, so we don't serve
   * stale (outdated) data.
   */
  del(key) {
    store.delete(key);
  },

  /**
   * stats()
   * Returns cache performance metrics.
   * Used by the analytics dashboard.
   */
  stats() {
    const total = hits + misses;
    return {
      hits,
      misses,
      size: store.size,  // how many items currently cached
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0
    };
  },

  /**
   * flush()
   * Clears the entire cache.
   * Like: redis-cli FLUSHALL
   */
  flush() {
    store.clear();
    hits = 0;
    misses = 0;
  }
};

module.exports = Cache;
