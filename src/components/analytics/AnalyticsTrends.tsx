// ============================================================================
// ANALYTICS TRENDS COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Displays spending trends over time with interactive charts
// Follows master guide: Data Fetching Patterns, React State Patterns, Error Handling

'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3 } from 'lucide-react'
import type { AnalyticsFilters, SpendingTrend } from '@/types/analytics'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsTrendsProps {
  filters: AnalyticsFilters
}

interface TrendsData {
  data: SpendingTrend[]
  metadata: {
    cached: boolean
    timestamp: string
  }
}

// ============================================================================
// ANALYTICS TRENDS COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Analytics trends component displaying spending patterns over time
 * Features monthly/yearly views with interactive chart visualization
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Data Fetching Patterns, Error Handling
 */
export function AnalyticsTrends({ filters }: AnalyticsTrendsProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly')

  // ============================================================================
  // DATA FETCHING (see master guide: Data Fetching Patterns)
  // ============================================================================

  const fetchTrends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters from filters
      const params = new URLSearchParams()
      params.append('timeframe', timeframe)
      
      if (filters.dateRange?.start) {
        params.append('startDate', filters.dateRange.start.toISOString())
      }
      if (filters.dateRange?.end) {
        params.append('endDate', filters.dateRange.end.toISOString())
      }
      if (filters.categories?.length) {
        params.append('category', filters.categories[0])
      }
      if (filters.merchants?.length) {
        params.append('merchant', filters.merchants[0])
      }
      if (filters.amountRange?.min !== undefined) {
        params.append('minAmount', filters.amountRange.min.toString())
      }
      if (filters.amountRange?.max !== undefined) {
        params.append('maxAmount', filters.amountRange.max.toString())
      }

      const response = await fetch(`/api/analytics/trends?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`)
        }
        throw new Error('Failed to fetch trends data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Analytics trends fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, timeframe])

  // Fetch data when filters or timeframe change
  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

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

  const getMaxAmount = (): number => {
    if (!data?.data.length) return 0
    return Math.max(...data.data.map(item => item.amount))
  }

  const getBarHeight = (amount: number): string => {
    const maxAmount = getMaxAmount()
    if (maxAmount === 0) return '0%'
    return `${(amount / maxAmount) * 100}%`
  }

  const formatPeriod = (period: string): string => {
    if (timeframe === 'monthly') {
      const [year, month] = period.split('-')
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    }
    return period
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Spending Trends
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Spending Trends
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchTrends}
            className="mt-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Spending Trends
        </h2>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            No spending data available for the selected period
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Spending Trends
        </h2>
        <div className="flex items-center space-x-2">
          {data.metadata.cached && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Cached
            </span>
          )}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'monthly' | 'yearly')}
            className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {/* Chart Bars */}
        <div className="flex items-end justify-between space-x-2 h-48">
          {data.data.map((trend) => (
            <div key={trend.period} className="flex-1 flex flex-col items-center">
              {/* Bar */}
              <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t relative group">
                <div
                  className="bg-blue-600 dark:bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-700 dark:hover:bg-blue-300"
                  style={{ height: getBarHeight(trend.amount) }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <div className="font-medium">{formatCurrency(trend.amount)}</div>
                    <div>{formatNumber(trend.receiptCount)} receipts</div>
                  </div>
                </div>
              </div>
              
              {/* Period Label */}
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 text-center">
                {formatPeriod(trend.period)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(data.data.reduce((sum, trend) => sum + trend.amount, 0))}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total Spent
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(data.data.reduce((sum, trend) => sum + trend.receiptCount, 0))}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total Receipts
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}