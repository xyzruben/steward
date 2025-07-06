// ============================================================================
// ANALYTICS CATEGORIES COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Displays spending breakdown by category with interactive pie chart
// Follows master guide: Data Fetching Patterns, React State Patterns, Error Handling

'use client'

import { useState, useEffect, useCallback } from 'react'
import { PieChart } from 'lucide-react'
import type { AnalyticsFilters, CategoryBreakdown } from '@/types/analytics'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsCategoriesProps {
  filters: AnalyticsFilters
}

interface CategoriesData {
  data: CategoryBreakdown[]
  metadata: {
    cached: boolean
    timestamp: string
  }
}

// ============================================================================
// ANALYTICS CATEGORIES COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Analytics categories component displaying spending breakdown by category
 * Features pie chart visualization and percentage calculations
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Data Fetching Patterns, Error Handling
 */
export function AnalyticsCategories({ filters }: AnalyticsCategoriesProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const [data, setData] = useState<CategoriesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // ============================================================================
  // DATA FETCHING (see master guide: Data Fetching Patterns)
  // ============================================================================

  const fetchCategories = useCallback(async () => {
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

      const response = await fetch(`/api/analytics/categories?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`)
        }
        throw new Error('Failed to fetch categories data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Analytics categories fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch data when filters change
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

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

  const getTotalSpent = (): number => {
    if (!data?.data.length) return 0
    return data.data.reduce((sum, category) => sum + category.amount, 0)
  }

  const getCategoryColors = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-cyan-500'
    ]
    return colors[index % colors.length]
  }

  const getCategoryBorderColors = (index: number): string => {
    const colors = [
      'border-blue-500',
      'border-green-500',
      'border-purple-500',
      'border-orange-500',
      'border-red-500',
      'border-indigo-500',
      'border-pink-500',
      'border-yellow-500',
      'border-teal-500',
      'border-cyan-500'
    ]
    return colors[index % colors.length]
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Category Breakdown
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
          Category Breakdown
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchCategories}
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
          Category Breakdown
        </h2>
        <div className="text-center py-8">
          <PieChart className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            No category data available for the selected period
          </p>
        </div>
      </div>
    )
  }

  const totalSpent = getTotalSpent()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Category Breakdown
        </h2>
        {data.metadata.cached && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
            Cached
          </span>
        )}
      </div>

      {/* Pie Chart Visualization */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          {/* Simple pie chart using CSS */}
          <div className="w-full h-full rounded-full border-8 border-slate-200 dark:border-slate-700 relative overflow-hidden">
            {data.data.map((category, index) => {
              const percentage = totalSpent > 0 ? (category.amount / totalSpent) * 100 : 0
              const rotation = data.data
                .slice(0, index)
                .reduce((sum, cat) => sum + (cat.amount / totalSpent) * 360, 0)
              
              return (
                <div
                  key={category.category}
                  className={`absolute inset-0 ${getCategoryColors(index)}`}
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rotation * Math.PI) / 180)}% ${50 + 50 * Math.sin((rotation * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((rotation + percentage * 3.6) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((rotation + percentage * 3.6) * Math.PI) / 180)}%)`
                  }}
                />
              )
            })}
          </div>
          
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {data.data.map((category, index) => (
          <div
            key={category.category}
            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
              selectedCategory === category.category
                ? `${getCategoryBorderColors(index)} bg-slate-50 dark:bg-slate-700`
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={() => setSelectedCategory(
              selectedCategory === category.category ? null : category.category
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${getCategoryColors(index)}`} />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {category.category}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {formatNumber(category.receiptCount)} receipts
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(category.amount)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {totalSpent > 0 ? ((category.amount / totalSpent) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {data.data.length} categories
          </span>
          <span className="text-slate-900 dark:text-white font-medium">
            {formatCurrency(totalSpent)} total
          </span>
        </div>
      </div>
    </div>
  )
} 