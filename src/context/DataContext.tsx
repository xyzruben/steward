// ============================================================================
// DATA CONTEXT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Centralized data management for dashboard with smart caching
// Follows master guide: Component Hierarchy, React State Patterns, Performance

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { DashboardDataService } from '@/lib/services/dashboardData'

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

      // Use the dashboard data service for batch fetching
      const data = await DashboardDataService.getDashboardData(user.id)
      
      setDashboardData(data)
      setLastFetch(Date.now())
      setIsStale(false)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const refreshData = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  const refreshStats = useCallback(async () => {
    if (!user) return

    try {
      const stats = await DashboardDataService.getStats(user.id)
      setDashboardData(prev => prev ? { ...prev, stats } : null)
      setLastFetch(Date.now())
      setIsStale(false)
    } catch (err) {
      console.error('Error refreshing stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh stats')
    }
  }, [user])

  const refreshReceipts = useCallback(async () => {
    if (!user) return

    try {
      const recentReceipts = await DashboardDataService.getRecentReceipts(user.id)
      setDashboardData(prev => prev ? { ...prev, recentReceipts } : null)
      setLastFetch(Date.now())
      setIsStale(false)
    } catch (err) {
      console.error('Error refreshing receipts:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh receipts')
    }
  }, [user])

  const refreshAnalytics = useCallback(async () => {
    if (!user) return

    try {
      const analytics = await DashboardDataService.getAnalytics(user.id)
      setDashboardData(prev => prev ? { ...prev, analytics } : null)
      setLastFetch(Date.now())
      setIsStale(false)
    } catch (err) {
      console.error('Error refreshing analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh analytics')
    }
  }, [user])

  const clearCache = useCallback(() => {
    setDashboardData(null)
    setLastFetch(0)
    setIsStale(true)
  }, [])

  // ============================================================================
  // CACHE MANAGEMENT (see master guide: Performance)
  // ============================================================================

  // Check if data is stale
  useEffect(() => {
    if (lastFetch > 0) {
      const timeSinceLastFetch = Date.now() - lastFetch
      setIsStale(timeSinceLastFetch > CACHE_DURATION)
    }
  }, [lastFetch])

  // Auto-refresh stale data
  useEffect(() => {
    if (isStale && user && !isLoading) {
      const timer = setTimeout(() => {
        fetchDashboardData()
      }, 1000) // Small delay to prevent rapid refreshes

      return () => clearTimeout(timer)
    }
  }, [isStale, user, isLoading, fetchDashboardData])

  // ============================================================================
  // INITIAL DATA LOADING (see master guide: React State Patterns)
  // ============================================================================

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    } else {
      // Clear data when user logs out
      setDashboardData(null)
      setIsLoading(false)
      setError(null)
      setLastFetch(0)
      setIsStale(false)
    }
  }, [user, fetchDashboardData])

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