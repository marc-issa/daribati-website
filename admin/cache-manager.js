// Cache Manager for Admin Portal
// Reduces redundant API requests and improves performance

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = {
      stats: 30000,           // 30 seconds for stats
      users: 60000,           // 1 minute for user lists
      notifications: 15000,   // 15 seconds for notifications
      feedback: 30000,        // 30 seconds for feedback
      alerts: 10000,          // 10 seconds for alerts (more critical)
      sessions: 30000,        // 30 seconds for sessions
      adminUsers: 60000,      // 1 minute for admin users
      services: 300000,       // 5 minutes for services (rarely change)
      disclaimers: 300000,    // 5 minutes for disclaimers (rarely change)
    };
  }

  /**
   * Generate cache key from endpoint and params
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}${sortedParams ? '?' + sortedParams : ''}`;
  }

  /**
   * Get cached data if valid
   */
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache HIT] ${key}`);
    return cached.data;
  }

  /**
   * Set cache data with TTL
   */
  set(key, data, ttl = 30000) {
    console.log(`[Cache SET] ${key} (TTL: ${ttl}ms)`);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key) {
    console.log(`[Cache INVALIDATE] ${key}`);
    this.cache.delete(key);
  }

  /**
   * Invalidate by pattern (e.g., all user-related caches)
   */
  invalidatePattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`[Cache INVALIDATE] ${count} entries matching "${pattern}"`);
  }

  /**
   * Clear all cache
   */
  clearAll() {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`[Cache CLEAR] All ${count} entries cleared`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now <= value.expiresAt) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Auto-cleanup expired entries
   */
  startAutoCleanup(interval = 60000) {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, value] of this.cache.entries()) {
        if (now > value.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Cache CLEANUP] Removed ${cleaned} expired entries`);
      }
    }, interval);
  }
}

// Create global cache instance
const cache = new CacheManager();

// Start auto-cleanup every minute
cache.startAutoCleanup(60000);

// Helper function to make cached requests
async function makeCachedRequest(endpoint, options = {}, cacheTTL = null) {
  const params = options.params || {};
  const cacheKey = cache.generateKey(endpoint, params);

  // Only cache GET requests
  if (!options.method || options.method === 'GET') {
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // Make actual request
  const data = await makeRequest(endpoint, options);

  // Cache the response for GET requests
  if (!options.method || options.method === 'GET') {
    // Determine TTL based on endpoint
    let ttl = cacheTTL || 30000; // Default 30 seconds
    
    if (endpoint.includes('/stats')) {
      ttl = cache.defaultTTL.stats;
    } else if (endpoint.includes('/users')) {
      ttl = cache.defaultTTL.users;
    } else if (endpoint.includes('/notifications')) {
      ttl = cache.defaultTTL.notifications;
    } else if (endpoint.includes('/feedback')) {
      ttl = cache.defaultTTL.feedback;
    } else if (endpoint.includes('/alerts')) {
      ttl = cache.defaultTTL.alerts;
    } else if (endpoint.includes('/sessions')) {
      ttl = cache.defaultTTL.sessions;
    } else if (endpoint.includes('/services')) {
      ttl = cache.defaultTTL.services;
    } else if (endpoint.includes('/disclaimers')) {
      ttl = cache.defaultTTL.disclaimers;
    }

    cache.set(cacheKey, data, ttl);
  }

  return data;
}

// Invalidation helpers for common operations
function invalidateUserCaches() {
  cache.invalidatePattern('/users');
  cache.invalidatePattern('/stats');
}

function invalidateNotificationCaches() {
  cache.invalidatePattern('/notifications');
  cache.invalidatePattern('/stats');
}

function invalidateFeedbackCaches() {
  cache.invalidatePattern('/feedback');
  cache.invalidatePattern('/stats');
}

function invalidateAlertCaches() {
  cache.invalidatePattern('/alerts');
  cache.invalidatePattern('/stats');
}

function invalidateAdminCaches() {
  cache.invalidatePattern('/auth/users');
  cache.invalidatePattern('/auth/sessions');
  cache.invalidatePattern('/stats');
}

function invalidateServiceCaches() {
  cache.invalidatePattern('/services');
}

function invalidateDisclaimerCaches() {
  cache.invalidatePattern('/disclaimers');
}

