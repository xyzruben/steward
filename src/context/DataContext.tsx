// ============================================================================
// DATA CONTEXT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Centralized data management for dashboard with smart caching
// Follows master guide: Component Hierarchy, React State Patterns, Performance

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface DashboardData {
  stats: {
    totalSpent: number
    totalReceipts: number
    averagePerReceipt: number
    monthlyGrowth: number
  }
  recentReceipts: Array<{
    id: string
    merchant: string
    amount: number
    date: string
    category: string
    imageUrl?: string
  }>
  analytics: {
    totalSpent: number
    totalReceipts: number
    averagePerReceipt: number
    monthlyGrowth: number
    topCategory: string
    topMerchant: string
  }
}

interface DataContextType {
  // Data
  dashboardData: DashboardData | null
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshData: () => Promise<void>
  refreshStats: () => Promise<void>
  refreshReceipts: () => Promise<void>
  refreshAnalytics: () => Promise<void>
  
  // Cache management
  clearCache: () => void
  isStale: boolean
}

// ============================================================================
// DATA CONTEXT
// ============================================================================

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [isStale, setIsStale] = useState(false)

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000

  // ============================================================================
  // DATA FETCHING FUNCTIONS (see master guide: React State Patterns)
  // ============================================================================

  const fetchDashboardData = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      })

      // Make direct API call instead of using DashboardDataService
      const dataPromise = fetch('/api/dashboard/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(25000) // 25 second timeout
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`)
        }
        return response.json()
      })

      const data = await Promise.race([dataPromise, timeoutPromise]) as any
      
      setDashboardData(data)
      setLastFetch(Date.now())
      setIsStale(false)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id]) // Only depend on user.id, not the entire user object

  const refreshData = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  const refreshStats = useCallback(async () => {
    if (!user) return

    try {
      // Refresh by fetching full dashboard data
      await fetchDashboardData()
    } catch (err) {
      console.error('Error refreshing stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh stats')
    }
  }, [user?.id, fetchDashboardData])

  const refreshReceipts = useCallback(async () => {
    if (!user) return

    try {
      // Refresh by fetching full dashboard data
      await fetchDashboardData()
    } catch (err) {
      console.error('Error refreshing receipts:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh receipts')
    }
  }, [user?.id, fetchDashboardData])

  const refreshAnalytics = useCallback(async () => {
    if (!user) return

    try {
      // Refresh by fetching full dashboard data
      await fetchDashboardData()
    } catch (err) {
      console.error('Error refreshing analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh analytics')
    }
  }, [user?.id, fetchDashboardData])

  const clearCache = useCallback(() => {
    setDashboardData(null)
    setLastFetch(0)
    setIsStale(true)
  }, [])

  // ============================================================================
  // CACHE MANAGEMENT (see master guide: Performance)
  // ============================================================================

  // Check if data is stale (with memoization to prevent excessive updates)
  useEffect(() => {
    if (lastFetch > 0) {
      const timeSinceLastFetch = Date.now() - lastFetch
      const newIsStale = timeSinceLastFetch > CACHE_DURATION
      
      // Only update if the stale state actually changed
      if (newIsStale !== isStale) {
        setIsStale(newIsStale)
      }
    }
  }, [lastFetch, isStale, CACHE_DURATION])

  // Auto-refresh stale data (with better guards)
  useEffect(() => {
    if (isStale && user?.id && !isLoading) {
      const timer = setTimeout(() => {
        fetchDashboardData()
      }, 1000) // Small delay to prevent rapid refreshes

      return () => clearTimeout(timer)
    }
  }, [isStale, user?.id, isLoading, fetchDashboardData])

  // ============================================================================
  // INITIAL DATA LOADING (see master guide: React State Patterns)
  // ============================================================================

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    } else if (!user) {
      // Clear data when user logs out
      setDashboardData(null)
      setIsLoading(false)
      setError(null)
      setLastFetch(0)
      setIsStale(false)
    }
  }, [user?.id, fetchDashboardData])

  // ============================================================================
  // CONTEXT VALUE (Memoized for performance)
  // ============================================================================

  const value: DataContextType = useMemo(() => ({
    dashboardData,
    isLoading,
    error,
    refreshData,
    refreshStats,
    refreshReceipts,
    refreshAnalytics,
    clearCache,
    isStale
  }), [
    dashboardData,
    isLoading,
    error,
    refreshData,
    refreshStats,
    refreshReceipts,
    refreshAnalytics,
    clearCache,
    isStale
  ])

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

// ============================================================================
// DATA HOOK
// ============================================================================

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
} 