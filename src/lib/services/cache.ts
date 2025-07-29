// ============================================================================
// ENHANCED CACHING SERVICE - AI-First Architecture Optimized
// ============================================================================
// Optimized caching with user isolation, intelligent cleanup, and performance monitoring
// Focuses on AI agent performance with minimal overhead

interface CacheEntry<T> {
  value: T;
  expiry: number;
  userId?: string;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  keys: string[];
  hitRate: number;
  averageAccessCount: number;
  totalMemoryUsage: number;
  userSpecificEntries: number;
  expiredEntries: number;
}

export class Cache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private maxSize = 1000;
  private cleanupInterval: NodeJS.Timeout;
  private stats = {
    hits: 0,
    misses: 0,
    totalMemoryUsage: 0,
    expiredEntries: 0
  };

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get<T>(key: string, userId?: string): Promise<T | null> {
    const cacheKey = this.generateUserKey(key, userId);
    const entry = this.memoryCache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(cacheKey);
      this.stats.misses++;
      this.stats.expiredEntries = (this.stats.expiredEntries || 0) + 1;
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options: { ttl?: number; userId?: string } = {}): Promise<void> {
    const ttl = options.ttl || 3600; // Default 1 hour
    const expiry = Date.now() + (ttl * 1000);
    const cacheKey = this.generateUserKey(key, options.userId);

    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.memoryCache.set(cacheKey, {
      value,
      expiry,
      userId: options.userId,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  // Synchronous version for compatibility
  setSync(key: string, value: any, ttl: number = 3600): void {
    const expiry = Date.now() + (ttl * 1000);
    
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.memoryCache.set(key, {
      value,
      expiry,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  async delete(key: string, userId?: string): Promise<boolean> {
    const cacheKey = this.generateUserKey(key, userId);
    return this.memoryCache.delete(cacheKey);
  }

  async clear(userId?: string): Promise<void> {
    if (userId) {
      // Clear user-specific entries
      for (const [key, entry] of this.memoryCache) {
        if (entry.userId === userId) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      // Clear all entries
      this.memoryCache.clear();
    }
  }

  clearUserSync(userId: string): void {
    // Clear user-specific entries
    for (const [key, entry] of this.memoryCache) {
      if (entry.userId === userId) {
        this.memoryCache.delete(key);
      }
    }
  }

  async invalidateUser(userId: string): Promise<number> {
    let deletedCount = 0;
    for (const [key, entry] of this.memoryCache) {
      if (entry.userId === userId) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async invalidatePattern(pattern: string, userId?: string): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const [key, entry] of this.memoryCache) {
      if (regex.test(key) && (!userId || entry.userId === userId)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  getStats(): CacheStats {
    const keys = Array.from(this.memoryCache.keys());
    const totalAccessCount = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    const userSpecificEntries = Array.from(this.memoryCache.values())
      .filter(entry => entry.userId).length;

    return {
      size: this.memoryCache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0,
      averageAccessCount: this.memoryCache.size > 0 
        ? totalAccessCount / this.memoryCache.size 
        : 0,
      totalMemoryUsage: this.stats.totalMemoryUsage,
      userSpecificEntries,
      expiredEntries: this.stats.expiredEntries || 0
    };
  }

  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    hitRate: number;
    size: number;
    memoryUsage: number;
  } {
    const stats = this.getStats();
    const hitRate = stats.hitRate;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (hitRate < 0.5) {
      status = 'degraded';
    }
    if (hitRate < 0.2 || stats.size > this.maxSize * 0.9) {
      status = 'unhealthy';
    }
    
    return {
      status,
      hitRate,
      size: stats.size,
      memoryUsage: stats.totalMemoryUsage
    };
  }

  private generateUserKey(key: string, userId?: string): string {
    return userId ? `${userId}:${key}` : key;
  }

  private evictLeastUsed(): void {
    // Find the least recently used entry
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.memoryCache) {
      if (now > entry.expiry) {
        this.memoryCache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cache cleanup: removed ${expiredCount} expired entries`);
    }
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.memoryCache.clear();
  }
}

// ============================================================================
// CACHE INSTANCES
// ============================================================================

// Agent cache for AI responses
export const agentCache = new Cache();

 