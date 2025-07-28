// ============================================================================
// ENHANCED CACHING SERVICE (see STEWARD_MASTER_SYSTEM_GUIDE.md - Scalability and Performance)
// ============================================================================
// Enterprise-grade caching with user isolation, cache warming, and intelligent invalidation
// Follows master guide: Scalability and Performance, Monitoring and Observability

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  userId?: string; // User-specific cache entries
  accessCount: number; // Track access frequency for LRU-like behavior
  lastAccessed: number; // Last access timestamp
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  keys: string[];
  hitRate: number;
  averageAccessCount: number;
  totalMemoryUsage: number;
  userSpecificEntries: number;
  expiredEntries: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableUserIsolation: boolean;
  enableCacheWarming: boolean;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    keys: [],
    hitRate: 0,
    averageAccessCount: 0,
    totalMemoryUsage: 0,
    userSpecificEntries: 0,
    expiredEntries: 0,
  };

  private config: CacheConfig = {
    maxSize: 1000, // Maximum cache entries
    defaultTtl: 5 * 60 * 1000, // 5 minutes default TTL
    cleanupInterval: 60 * 1000, // 1 minute cleanup interval
    enableUserIsolation: true,
    enableCacheWarming: true,
  };

  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupTimer();
  }

  // ============================================================================
  // CORE CACHING METHODS
  // ============================================================================

  /**
   * Get cached data with enhanced tracking
   */
  async get<T>(key: string, userId?: string): Promise<T | null> {
    const cacheKey = this.generateUserKey(key, userId);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.stats.expiredEntries++;
      this.updateStats();
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateStats();
    return entry.data as T;
  }

  /**
   * Set data in cache with enhanced features
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      userId?: string;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<void> {
    const { ttl = this.config.defaultTtl, userId, priority = 'normal' } = options;
    const cacheKey = this.generateUserKey(key, userId);

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize) {
      await this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      userId,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(cacheKey, entry);
    this.updateStats();
  }

  /**
   * Delete cache entry with user isolation
   */
  async delete(key: string, userId?: string): Promise<boolean> {
    const cacheKey = this.generateUserKey(key, userId);
    const deleted = this.cache.delete(cacheKey);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear all cache entries or user-specific entries
   */
  async clear(userId?: string): Promise<void> {
    if (userId) {
      // Clear only user-specific entries
      for (const [key, entry] of this.cache.entries()) {
        if (entry.userId === userId) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all entries
      this.cache.clear();
    }
    this.updateStats();
  }

  // ============================================================================
  // USER-SPECIFIC CACHING
  // ============================================================================

  /**
   * Generate user-specific cache key
   */
  private generateUserKey(key: string, userId?: string): string {
    if (userId && this.config.enableUserIsolation) {
      return `user:${userId}:${key}`;
    }
    return key;
  }

  /**
   * Invalidate all cache entries for a specific user
   */
  async invalidateUser(userId: string): Promise<number> {
    let deletedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    this.updateStats();
    return deletedCount;
  }

  /**
   * Get user-specific cache statistics
   */
  getUserStats(userId: string): Partial<CacheStats> {
    let userHits = 0;
    const userMisses = 0;
    let userEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        userEntries++;
        if (entry.accessCount > 0) {
          userHits += entry.accessCount;
        }
      }
    }

    return {
      size: userEntries,
      hits: userHits,
      hitRate: userHits > 0 ? userHits / (userHits + userMisses) : 0,
    };
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(userId: string, warmingData: Array<{ key: string; data: unknown; ttl?: number }>): Promise<void> {
    if (!this.config.enableCacheWarming) return;

    console.log(`🔥 Warming cache for user: ${userId} with ${warmingData.length} entries`);

    for (const { key, data, ttl } of warmingData) {
      await this.set(key, data, { userId, ttl, priority: 'high' });
    }
  }

  /**
   * Warm dashboard cache with common queries
   */
  async warmDashboardCache(userId: string): Promise<void> {
    const dashboardWarmingData = [
      { key: 'dashboard:overview', data: null, ttl: 2 * 60 * 1000 }, // 2 minutes
      { key: 'dashboard:recent-receipts', data: null, ttl: 1 * 60 * 1000 }, // 1 minute
      { key: 'dashboard:stats', data: null, ttl: 3 * 60 * 1000 }, // 3 minutes
    ];

    await this.warmCache(userId, dashboardWarmingData);
  }

  // ============================================================================
  // INTELLIGENT INVALIDATION
  // ============================================================================

  /**
   * Invalidate cache entries by pattern with user isolation
   */
  async invalidatePattern(pattern: string, userId?: string): Promise<number> {
    let deletedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      const shouldDelete = key.includes(pattern) && 
        (!userId || entry.userId === userId);
      
      if (shouldDelete) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    this.updateStats();
    return deletedCount;
  }

  /**
   * Invalidate cache entries by data type
   */
  async invalidateByType(dataType: string, userId?: string): Promise<number> {
    return this.invalidatePattern(`type:${dataType}`, userId);
  }

  /**
   * Invalidate cache entries by time range
   */
  async invalidateByTimeRange(startTime: number, endTime: number, userId?: string): Promise<number> {
    let deletedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      const shouldDelete = entry.timestamp >= startTime && 
        entry.timestamp <= endTime &&
        (!userId || entry.userId === userId);
      
      if (shouldDelete) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    this.updateStats();
    return deletedCount;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Evict least used cache entries
   */
  private async evictLeastUsed(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      // Sort by access count (ascending) then by last accessed (ascending)
      if (a[1].accessCount !== b[1].accessCount) {
        return a[1].accessCount - b[1].accessCount;
      }
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    // Remove 10% of least used entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`🗑️ Evicted ${toRemove} least used cache entries`);
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired cache entries`);
      this.stats.expiredEntries += expiredCount;
      this.updateStats();
    }
  }

  // ============================================================================
  // STATISTICS AND MONITORING
  // ============================================================================

  /**
   * Get enhanced cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.keys = Array.from(this.cache.keys());
    
    // Calculate hit rate
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    // Calculate average access count
    let totalAccessCount = 0;
    let userSpecificCount = 0;
    let totalMemoryUsage = 0;

    for (const entry of this.cache.values()) {
      totalAccessCount += entry.accessCount;
      if (entry.userId) userSpecificCount++;
      
      // Rough memory estimation (JSON.stringify size)
      try {
        totalMemoryUsage += JSON.stringify(entry.data).length;
      } catch {
        totalMemoryUsage += 100; // Fallback estimation
      }
    }

    this.stats.averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;
    this.stats.userSpecificEntries = userSpecificCount;
    this.stats.totalMemoryUsage = totalMemoryUsage;
  }

  /**
   * Generate cache key for analytics queries with enhanced features
   */
  generateKey(prefix: string, params: Record<string, unknown>, userId?: string): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    const baseKey = `${prefix}:${sortedParams}`;
    return this.generateUserKey(baseKey, userId);
  }

  /**
   * Get cache health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    hitRate: number;
    size: number;
    memoryUsage: number;
  } {
    const hitRate = this.stats.hitRate;
    const size = this.stats.size;
    const memoryUsage = this.stats.totalMemoryUsage;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (hitRate < 0.3 || size > this.config.maxSize * 0.9) {
      status = 'degraded';
    }
    
    if (hitRate < 0.1 || size >= this.config.maxSize) {
      status = 'unhealthy';
    }

    return {
      status,
      hitRate,
      size,
      memoryUsage,
    };
  }

  /**
   * Dispose of cache service
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// Global cache instance with enhanced configuration
export const analyticsCache = new CacheService({
  maxSize: 2000, // Increased for better performance
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 30 * 1000, // 30 seconds
  enableUserIsolation: true,
  enableCacheWarming: true,
}); 

/**
 * Cache for AI agent query results
 * Improves performance for repeated financial analysis queries
 */
const agentQueryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const agentCache = {
  /**
   * Get cached agent query result
   */
  get(key: string): any | null {
    const cached = agentQueryCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      agentQueryCache.delete(key);
      return null;
    }
    
    return cached.data;
  },

  /**
   * Set agent query result in cache
   */
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    agentQueryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },

  /**
   * Clear agent query cache
   */
  clear(): void {
    agentQueryCache.clear();
  },

  /**
   * Clear cache for specific user
   */
  clearUser(userId: string): void {
    for (const [key] of agentQueryCache) {
      if (key.includes(userId)) {
        agentQueryCache.delete(key);
      }
    }
  },

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: agentQueryCache.size,
      keys: Array.from(agentQueryCache.keys())
    };
  }
}; 