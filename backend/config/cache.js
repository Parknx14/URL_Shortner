
const store = new Map();

let hits = 0;    
let misses = 0;  
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

   
    if (Date.now() > entry.expiresAt) {
      store.delete(key); 
      misses++;
      return null;
    }

  
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

  del(key) {
    store.delete(key);
  },

 
  stats() {
    const total = hits + misses;
    return {
      hits,
      misses,
      size: store.size,  // how many items currently cached
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0
    };
  },


  flush() {
    store.clear();
    hits = 0;
    misses = 0;
  }
};

module.exports = Cache;
