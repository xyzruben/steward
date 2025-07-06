// ============================================================================
// ANALYTICS MERCHANTS COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Displays top merchants table with sorting and pagination
// Follows master guide: Data Fetching Patterns, React State Patterns, Error Handling

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building, ChevronUp, ChevronDown, DollarSign, Receipt } from 'lucide-react'
import type { AnalyticsFilters, MerchantAnalysis } from '@/types/analytics'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsMerchantsProps {
  filters: AnalyticsFilters
}

interface MerchantsData {
  data: MerchantAnalysis[]
  metadata: {
    cached: boolean
    timestamp: string
  }
}

type SortField = 'merchant' | 'amount' | 'receiptCount'
type SortDirection = 'asc' | 'desc'

// ============================================================================
// ANALYTICS MERCHANTS COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Analytics merchants component displaying top merchants table
 * Features sorting, pagination, and detailed merchant analysis
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Data Fetching Patterns, Error Handling
 */
export function AnalyticsMerchants({ filters }: AnalyticsMerchantsProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const [data, setData] = useState<MerchantsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('amount')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // ============================================================================
  // DATA FETCHING (see master guide: Data Fetching Patterns)
  // ============================================================================

  const fetchMerchants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters from filters
      const params = new URLSearchParams()
      params.append('limit', '50') // Get more data for pagination
      
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

      const response = await fetch(`/api/analytics/merchants?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || 60} seconds.`)
        }
        throw new Error('Failed to fetch merchants data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Analytics merchants fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch data when filters change
  useEffect(() => {
    fetchMerchants()
    setCurrentPage(1) // Reset to first page when filters change
  }, [fetchMerchants])

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortedData = (): MerchantAnalysis[] => {
    if (!data?.data) return []
    
    return [...data.data].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number
      
      switch (sortField) {
        case 'merchant':
          aValue = a.merchant.toLowerCase()
          bValue = b.merchant.toLowerCase()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'receiptCount':
          aValue = a.receiptCount
          bValue = b.receiptCount
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const getPaginatedData = (): MerchantAnalysis[] => {
    const sortedData = getSortedData()
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }

  const getTotalPages = (): number => {
    if (!data?.data) return 0
    return Math.ceil(data.data.length / itemsPerPage)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-slate-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      : <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Top Merchants
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Top Merchants
        </h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchMerchants}
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
          Top Merchants
        </h2>
        <div className="text-center py-8">
          <Building className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            No merchant data available for the selected period
          </p>
        </div>
      </div>
    )
  }

  const paginatedData = getPaginatedData()
  const totalPages = getTotalPages()
  const totalSpent = data.data.reduce((sum, merchant) => sum + merchant.amount, 0)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Top Merchants
        </h2>
        <div className="flex items-center space-x-2">
          {data.metadata.cached && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Cached
            </span>
          )}
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {formatCurrency(totalSpent)} total
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('merchant')}
                  className="flex items-center space-x-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <Building className="h-4 w-4" />
                  <span>Merchant</span>
                  {getSortIcon('merchant')}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end space-x-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white ml-auto"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Amount</span>
                  {getSortIcon('amount')}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <button
                  onClick={() => handleSort('receiptCount')}
                  className="flex items-center justify-end space-x-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white ml-auto"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Receipts</span>
                  {getSortIcon('receiptCount')}
                </button>
              </th>
              <th className="text-right py-3 px-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  %
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((merchant, index) => (
              <tr
                key={merchant.merchant}
                className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {index + 1 + (currentPage - 1) * itemsPerPage}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {merchant.merchant}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {formatCurrency(merchant.amount / merchant.receiptCount)} avg
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(merchant.amount)}
                  </div>
                </td>
                <td className="text-right py-3 px-4">
                  <div className="text-slate-700 dark:text-slate-300">
                    {formatNumber(merchant.receiptCount)}
                  </div>
                </td>
                <td className="text-right py-3 px-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {totalSpent > 0 ? ((merchant.amount / totalSpent) * 100).toFixed(1) : '0'}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.data.length)} of {data.data.length} merchants
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 