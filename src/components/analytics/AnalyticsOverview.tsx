// ============================================================================
// ANALYTICS OVERVIEW COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Displays key spending metrics with real-time data and caching
// Follows master guide: Data Fetching Patterns, React State Patterns, Error Handling

'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Receipt, Calendar, Target } from 'lucide-react'
import type { AnalyticsFilters, AnalyticsOverview as OverviewType } from '@/types/analytics'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsOverviewProps {
  filters: AnalyticsFilters
}

interface OverviewData {
  data: OverviewType
  metadata: {
    cached: boolean
    timestamp: string
  }
}

// ============================================================================
// ANALYTICS OVERVIEW COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Analytics overview component displaying key spending metrics
 * Features caching, filtering, and real-time data updates
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Data Fetching Patterns, Error Handling
 */
export function AnalyticsOverview({ filters }: AnalyticsOverviewProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // DATA FETCHING (see master guide: Data Fetching Patterns)
  // ============================================================================

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters from filters
      const params = new URLSearchParams()
      if (filters.dateRange?.start) {
        params.append('startDate', filters.dateRange.start.toISOString())
      }
      if (filters.dateRange?.end) {
        params.append('endDate', filters.dateRange.end.toISOString())
      }
      if (filters.categories?.length) {
        params.append('category', filters.categories[0]) // API supports single category
      }
      if (filters.merchants?.length) {
        params.append('merchant', filters.merchants[0]) // API supports single merchant
      }
      if (filters.amountRange?.min !== undefined) {
        params.append('minAmount', filters.amountRange.min.toString())
      }
      if (filters.amountRange?.max !== undefined) {
        params.append('maxAmount', filters.amountRange.max.toString())
      }

      const response = await fetch(`/api/analytics/overview?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`)
        }
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Analytics overview fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch data when filters change
  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  // ============================================================================
  // UTILITY FUNCTIONS (see master guide: Code Quality and Conventions)
  // ============================================================================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getDateRangeText = (): string => {
    if (!data?.data.dateRange.start || !data?.data.dateRange.end) {
      return 'All time'
    }
    
    const start = new Date(data.data.dateRange.start)
    const end = new Date(data.data.dateRange.end)
    
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    
    return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Spending Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Spending Overview
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchOverview}
            className="mt-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Spending Overview
        </h2>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{getDateRangeText()}</span>
          {data.metadata.cached && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Cached
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Spent */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Spent
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(data.data.totalSpent)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Receipt Count */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Receipts
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatNumber(data.data.receiptCount)}
              </p>
            </div>
            <Receipt className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Average Receipt */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Average
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(data.data.averageReceipt)}
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Period
              </p>
              <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {getDateRangeText()}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>
    </div>
  )
} 