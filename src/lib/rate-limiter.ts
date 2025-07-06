// Rate limiter for analytics API endpoints
// See: Master System Guide - Security Requirements, Rate Limiting and Validation

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
    this.config = config;
  }

  /**
   * Check if request is allowed for the given key
   */
  isAllowed(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats(): { totalKeys: number; config: RateLimitConfig } {
    return {
      totalKeys: this.limits.size,
      config: this.config,
    };
  }
}

// Global rate limiter instances
export const analyticsRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 50, // 50 requests per minute
});

// Clean up expired entries every 5 minutes
setInterval(() => {
  analyticsRateLimiter.cleanup();
}, 5 * 60 * 1000); 