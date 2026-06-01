// Enhanced Redis-like caching service with fallback to in-memory when Redis is unavailable
class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.enabled = true;
    this.cleanupInterval = null;

    // Default TTL: 5 minutes for products, 10 minutes for categories
    this.ttls = {
      product: 5 * 60 * 1000,
      category: 10 * 60 * 1000,
      cart: 15 * 60 * 1000,
      order: 30 * 60 * 1000,
      user: 20 * 60 * 1000,
      default: 10 * 60 * 1000
    };

    // Store reference to the interval for cleanup
    this._intervals = new Set();
  }

  _getKey(type, id) {
    return `ts:${type}:${id}`;
  }

  async get(type, id) {
    if (!this.enabled) return null;
    const key = this._getKey(type, id);
    const cached = this.memoryCache.get(key);

    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // Remove expired entry
    if (cached) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(type, id, data, customTTL) {
    if (!this.enabled) return;
    const ttl = customTTL || this.ttls[type] || this.ttls.default;
    const key = this._getKey(type, id);
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  async delete(type, id) {
    const key = this._getKey(type, id);
    this.memoryCache.delete(key);
  }

  async invalidate(type) {
    const prefix = `ts:${type}:`;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async invalidateProduct(id) {
    await this.delete('product', id);
  }

  async invalidateCategory(id) {
    await this.delete('category', id);
    // Also invalidate product list since it may reference categories
    await this.invalidate('product');
  }

  async invalidateCart(userId, deviceId) {
    if (userId) await this.delete('cart', userId);
    if (deviceId) await this.delete('cart', deviceId);
  }

  async invalidateOrder(id) {
    await this.delete('order', id);
  }

  // Get with fallback: tries cache first, then calls fetchFn if miss
  async getOrFetch(type, id, fetchFn, customTTL) {
    const cached = await this.get(type, id);
    if (cached) return cached;

    const data = await fetchFn();
    if (data) {
      await this.set(type, id, data, customTTL);
    }
    return data;
  }

  // Health check
  async isReady() {
    return this.enabled;
  }

  // Stats
  getStats() {
    return {
      enabled: this.enabled,
      entries: this.memoryCache.size,
      types: Array.from(this.memoryCache.keys()).reduce((acc, key) => {
        const type = key.split(':')[1];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Clean up expired entries periodically
  startCleanup(intervalMs = 60 * 1000) {
    const intervalId = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.memoryCache) {
        if (value.expiry < now) {
          this.memoryCache.delete(key);
        }
      }
    }, intervalMs);
    
    this._intervals.add(intervalId);
    return intervalId;
  }

  // Stop all cleanup intervals (useful for testing)
  stopCleanup() {
    for (const intervalId of this._intervals) {
      clearInterval(intervalId);
    }
    this._intervals.clear();
  }
}

// Singleton instance
const cacheService = new CacheService();

// Only start cleanup if not in test environment
if (process.env.NODE_ENV !== 'test') {
  cacheService.startCleanup();
}

module.exports = cacheService;
