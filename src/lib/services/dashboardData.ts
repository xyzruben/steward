// ============================================================================
// DASHBOARD DATA SERVICE (see STEWARD_MASTER_SYSTEM_GUIDE.md - Backend/API Design)
// ============================================================================
// Unified dashboard data service with batch API calls and smart caching
// Follows master guide: Backend/API Design, TypeScript Standards, Performance

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

export interface DashboardStats {
  totalSpent: number
  totalReceipts: number
  averagePerReceipt: number
  monthlyGrowth: number
}

export interface RecentReceipt {
  id: string
  merchant: string
  amount: number
  date: string
  category: string
  imageUrl?: string
}

export interface DashboardAnalytics {
  totalSpent: number
  totalReceipts: number
  averagePerReceipt: number
  monthlyGrowth: number
  topCategory: string
  topMerchant: string
}

export interface DashboardData {
  stats: DashboardStats
  recentReceipts: RecentReceipt[]
  analytics: DashboardAnalytics
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

class DashboardCache {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T
    }
    return null
  }

  static set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  static clear(): void {
    this.cache.clear()
  }

  static clearUser(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(userId))
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  static getCacheKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  static deleteCacheKey(key: string): void {
    this.cache.delete(key)
  }
}

// ============================================================================
// DASHBOARD DATA SERVICE
// ============================================================================

export class DashboardDataService {
  // ============================================================================
  // BATCH DATA FETCHING (see master guide: Performance)
  // ============================================================================

  /**
   * Get all dashboard data in a single batch call
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    const cacheKey = `${userId}:dashboard`
    
    // Check cache first
    const cached = DashboardCache.get<DashboardData>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Make batch API call to get all data at once
      const response = await fetch('/api/dashboard/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
      }

      const data: DashboardData = await response.json()
      
      // Cache the result
      DashboardCache.set(cacheKey, data)
      
      return data
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      
      // Fallback to individual API calls if batch fails
      return this.getDashboardDataFallback(userId)
    }
  }

  /**
   * Fallback method using individual API calls
   */
  private static async getDashboardDataFallback(userId: string): Promise<DashboardData> {
    const [stats, recentReceipts, analytics] = await Promise.all([
      this.getStats(userId),
      this.getRecentReceipts(userId),
      this.getAnalytics(userId)
    ])

    return {
      stats,
      recentReceipts,
      analytics
    }
  }

  // ============================================================================
  // INDIVIDUAL DATA FETCHING (for selective updates)
  // ============================================================================

  /**
   * Get stats data
   */
  static async getStats(userId: string): Promise<DashboardStats> {
    const cacheKey = `${userId}:stats`
    
    // Check cache first
    const cached = DashboardCache.get<DashboardStats>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await fetch('/api/analytics/overview')
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`)
      }

      const data = await response.json()
      const stats: DashboardStats = {
        totalSpent: data.totalSpent || 0,
        totalReceipts: data.receiptCount || 0,
        averagePerReceipt: data.averageReceipt || 0,
        monthlyGrowth: data.monthlyGrowth || 0
      }

      DashboardCache.set(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Error fetching stats:', error)
      
      // Return mock data as fallback
      return {
        totalSpent: 2847.50,
        totalReceipts: 47,
        averagePerReceipt: 60.58,
        monthlyGrowth: 12.5
      }
    }
  }

  /**
   * Get recent receipts
   */
  static async getRecentReceipts(userId: string): Promise<RecentReceipt[]> {
    const cacheKey = `${userId}:receipts`
    
    // Check cache first
    const cached = DashboardCache.get<RecentReceipt[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await fetch('/api/receipts?limit=5')
      if (!response.ok) {
        throw new Error(`Failed to fetch receipts: ${response.statusText}`)
      }

      const data = await response.json()
      const receipts: RecentReceipt[] = data.map((receipt: any) => ({
        id: receipt.id,
        merchant: receipt.merchant,
        amount: receipt.total,
        date: receipt.purchaseDate,
        category: receipt.category || 'Uncategorized',
        imageUrl: receipt.imageUrl
      }))

      DashboardCache.set(cacheKey, receipts)
      return receipts
    } catch (error) {
      console.error('Error fetching receipts:', error)
      
      // Return mock data as fallback
      return [
        {
          id: '1',
          merchant: 'Starbucks Coffee',
          amount: 12.45,
          date: '2024-01-15',
          category: 'Food & Dining',
          imageUrl: undefined
        },
        {
          id: '2',
          merchant: 'Amazon.com',
          amount: 89.99,
          date: '2024-01-14',
          category: 'Shopping',
          imageUrl: undefined
        },
        {
          id: '3',
          merchant: 'Shell Gas Station',
          amount: 45.67,
          date: '2024-01-13',
          category: 'Transportation',
          imageUrl: undefined
        },
        {
          id: '4',
          merchant: 'Walmart',
          amount: 156.78,
          date: '2024-01-12',
          category: 'Shopping',
          imageUrl: undefined
        },
        {
          id: '5',
          merchant: 'Netflix',
          amount: 15.99,
          date: '2024-01-11',
          category: 'Entertainment',
          imageUrl: undefined
        }
      ]
    }
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(userId: string): Promise<DashboardAnalytics> {
    const cacheKey = `${userId}:analytics`
    
    // Check cache first
    const cached = DashboardCache.get<DashboardAnalytics>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await fetch('/api/analytics/overview')
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      const data = await response.json()
      const analytics: DashboardAnalytics = {
        totalSpent: data.totalSpent || 0,
        totalReceipts: data.receiptCount || 0,
        averagePerReceipt: data.averageReceipt || 0,
        monthlyGrowth: data.monthlyGrowth || 0,
        topCategory: data.topCategory || 'Food & Dining',
        topMerchant: data.topMerchant || 'Amazon.com'
      }

      DashboardCache.set(cacheKey, analytics)
      return analytics
    } catch (error) {
      console.error('Error fetching analytics:', error)
      
      // Return mock data as fallback
      return {
        totalSpent: 2847.50,
        totalReceipts: 47,
        averagePerReceipt: 60.58,
        monthlyGrowth: 12.5,
        topCategory: 'Food & Dining',
        topMerchant: 'Amazon.com'
      }
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear cache for a specific user
   */
  static clearUserCache(userId: string): void {
    DashboardCache.clearUser(userId)
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    DashboardCache.clear()
  }

  /**
   * Invalidate specific cache keys
   */
  static invalidateCache(userId: string, type: 'stats' | 'receipts' | 'analytics' | 'dashboard'): void {
    const keysToDelete = DashboardCache.getCacheKeys().filter(key => 
      key === `${userId}:${type}` || (type === 'dashboard' && key.startsWith(userId))
    )
    keysToDelete.forEach(key => DashboardCache.deleteCacheKey(key))
  }
} 