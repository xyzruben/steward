// ============================================================================
// INTELLIGENT RECEIPT CACHING SYSTEM
// ============================================================================
// High-performance caching for receipt data with smart invalidation
// Optimized for CPU performance and memory efficiency

import { Receipt } from '@prisma/client'

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  // Cache TTL (Time To Live)
  TTL: 5 * 60 * 1000, // 5 minutes
  
  // Maximum cache size (number of entries)
  MAX_ENTRIES: 1000,
  
  // Memory threshold for cache cleanup (50MB)
  MEMORY_THRESHOLD: 50 * 1024 * 1024,
  
  // Prefetch threshold
  PREFETCH_THRESHOLD: 10
}

// ============================================================================
// CACHE ENTRY INTERFACE
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
  size: number // Estimated memory size in bytes
  accessCount: number
  lastAccessed: number
}

interface PaginationCacheEntry {
  receipts: Receipt[]
  hasMore: boolean
  nextCursor: string | null
  totalCount?: number
}

// ============================================================================
// SMART CACHE MANAGER
// ============================================================================

class ReceiptCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private memoryUsage = 0
  private hitCount = 0
  private missCount = 0

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  set<T>(key: string, data: T, customTTL?: number): void {
    try {
      // Estimate memory size
      const size = this.estimateSize(data)
      
      // Check memory threshold
      if (this.memoryUsage + size > CACHE_CONFIG.MEMORY_THRESHOLD) {
        this.cleanup()
      }

      // Remove existing entry if present
      if (this.cache.has(key)) {
        const existing = this.cache.get(key)!
        this.memoryUsage -= existing.size
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        key,
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      }

      this.cache.set(key, entry)
      this.memoryUsage += size

      console.log(`🔍 Cache: Set ${key} (${this.formatBytes(size)})`)
    } catch (error) {
      console.error('🔍 Cache: Set error:', error)
    }
  }

  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined
      
      if (!entry) {
        this.missCount++
        console.log(`🔍 Cache: Miss ${key}`)
        return null
      }

      // Check if expired
      const age = Date.now() - entry.timestamp
      if (age > CACHE_CONFIG.TTL) {
        this.delete(key)
        this.missCount++
        console.log(`🔍 Cache: Expired ${key}`)
        return null
      }

      // Update access statistics
      entry.accessCount++
      entry.lastAccessed = Date.now()
      this.hitCount++

      console.log(`🔍 Cache: Hit ${key} (age: ${Math.round(age / 1000)}s)`)
      return entry.data
    } catch (error) {
      console.error('🔍 Cache: Get error:', error)
      return null
    }
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.memoryUsage -= entry.size
      this.cache.delete(key)
      console.log(`🔍 Cache: Deleted ${key}`)
      return true
    }
    return false
  }

  // ============================================================================
  // SPECIALIZED RECEIPT METHODS
  // ============================================================================

  // Cache receipts with pagination info
  setReceiptsPage(
    userId: string,
    filters: Record<string, any>,
    page: number,
    data: PaginationCacheEntry
  ): void {
    const key = this.generateReceiptsKey(userId, filters, page)
    this.set(key, data)
  }

  getReceiptsPage(
    userId: string,
    filters: Record<string, any>,
    page: number
  ): PaginationCacheEntry | null {
    const key = this.generateReceiptsKey(userId, filters, page)
    return this.get<PaginationCacheEntry>(key)
  }

  // Cache individual receipt
  setReceipt(receipt: Receipt): void {
    const key = `receipt:${receipt.id}`
    this.set(key, receipt)
  }

  getReceipt(receiptId: string): Receipt | null {
    const key = `receipt:${receiptId}`
    return this.get<Receipt>(key)
  }

  // Invalidate all receipts for a user
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = []
    
    for (const [key] of this.cache) {
      if (key.startsWith(`receipts:${userId}:`) || key.includes(userId)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
    console.log(`🔍 Cache: Invalidated ${keysToDelete.length} entries for user ${userId}`)
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateReceiptsKey(
    userId: string,
    filters: Record<string, any>,
    page: number
  ): string {
    // Create a stable key from filters
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|')
    
    return `receipts:${userId}:${page}:${this.hashString(filterStr)}`
  }

  private hashString(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // Rough estimate: 2 bytes per character
    } catch {
      return 1024 // Default 1KB if serialization fails
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // ============================================================================
  // CACHE MAINTENANCE
  // ============================================================================

  private cleanup(): void {
    console.log('🔍 Cache: Starting cleanup...')
    
    const entries = Array.from(this.cache.entries())
    const now = Date.now()

    // Remove expired entries
    let expiredCount = 0
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > CACHE_CONFIG.TTL) {
        this.delete(key)
        expiredCount++
      }
    })

    // If still over threshold, remove least recently used entries
    if (this.cache.size > CACHE_CONFIG.MAX_ENTRIES) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)
      
      const toRemove = this.cache.size - CACHE_CONFIG.MAX_ENTRIES
      for (let i = 0; i < toRemove; i++) {
        this.delete(sortedEntries[i][0])
      }
    }

    console.log(`🔍 Cache: Cleanup complete. Removed ${expiredCount} expired entries. Memory: ${this.formatBytes(this.memoryUsage)}`)
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.hitCount + this.missCount > 0 
      ? Math.round((this.hitCount / (this.hitCount + this.missCount)) * 100)
      : 0

    return {
      size: this.cache.size,
      memoryUsage: this.formatBytes(this.memoryUsage),
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate}%`
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.memoryUsage = 0
    this.hitCount = 0
    this.missCount = 0
    console.log('🔍 Cache: Cleared all entries')
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const receiptCache = new ReceiptCacheManager()

// ============================================================================
// CACHE HOOKS FOR REACT COMPONENTS
// ============================================================================

import { useEffect, useCallback } from 'react'

export function useCacheWarmup(userId: string, initialData?: Receipt[]) {
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // Cache initial receipts
      initialData.forEach(receipt => {
        receiptCache.setReceipt(receipt)
      })

      // Cache as first page
      receiptCache.setReceiptsPage(userId, {}, 1, {
        receipts: initialData,
        hasMore: initialData.length >= 25,
        nextCursor: initialData[initialData.length - 1]?.id || null
      })

      console.log(`🔍 Cache: Warmed up with ${initialData.length} receipts`)
    }
  }, [userId, initialData])
}

export function useCacheInvalidation(userId: string) {
  return useCallback(() => {
    receiptCache.invalidateUser(userId)
  }, [userId])
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (process.env.NODE_ENV === 'development') {
  // Expose cache to window for debugging
  ;(globalThis as any).receiptCache = receiptCache
  
  // Log cache stats periodically
  setInterval(() => {
    const stats = receiptCache.getStats()
    if (stats.hitCount > 0 || stats.missCount > 0) {
      console.log('🔍 Cache Stats:', stats)
    }
  }, 30000) // Every 30 seconds
}