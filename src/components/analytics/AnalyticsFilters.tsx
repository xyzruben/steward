// ============================================================================
// ANALYTICS FILTERS COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Input Validation)
// ============================================================================
// Advanced filtering interface for analytics data
// Follows master guide: Input Validation, React State Patterns, Accessibility

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, X, DollarSign, Building, Tag } from 'lucide-react'
import type { AnalyticsFilters } from '@/types/analytics'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
  loading?: boolean
}

// ============================================================================
// ANALYTICS FILTERS COMPONENT (see master guide: Input Validation)
// ============================================================================

/**
 * Analytics filters component for advanced data filtering
 * Supports date ranges, categories, merchants, and amount ranges
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Input Validation, Accessibility
 */
export function AnalyticsFilters({ filters, onFiltersChange, loading = false }: AnalyticsFiltersProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(filters)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableMerchants, setAvailableMerchants] = useState<string[]>([])

  // ============================================================================
  // EFFECTS (see master guide: React State Patterns)
  // ============================================================================

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Load available filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Load categories
        const categoriesResponse = await fetch('/api/analytics/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setAvailableCategories(categoriesData.data.map((cat: { category: string }) => cat.category))
        }

        // Load merchants
        const merchantsResponse = await fetch('/api/analytics/merchants')
        if (merchantsResponse.ok) {
          const merchantsData = await merchantsResponse.json()
          setAvailableMerchants(merchantsData.data.map((merchant: { merchant: string }) => merchant.merchant))
        }
      } catch (error) {
        console.error('Failed to load filter options:', error)
      }
    }

    loadFilterOptions()
  }, [])

  // ============================================================================
  // EVENT HANDLERS (see master guide: React State Patterns)
  // ============================================================================

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newFilters = { ...localFilters }
    if (!newFilters.dateRange) {
      newFilters.dateRange = { start: new Date(), end: new Date() }
    }
    
    if (value) {
      newFilters.dateRange[field] = new Date(value)
    } else {
      delete newFilters.dateRange[field]
      if (!newFilters.dateRange.start && !newFilters.dateRange.end) {
        delete newFilters.dateRange
      }
    }
    
    setLocalFilters(newFilters)
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newFilters = { ...localFilters }
    if (!newFilters.categories) {
      newFilters.categories = []
    }
    
    if (checked) {
      newFilters.categories.push(category)
    } else {
      newFilters.categories = newFilters.categories.filter(c => c !== category)
    }
    
    if (newFilters.categories.length === 0) {
      delete newFilters.categories
    }
    
    setLocalFilters(newFilters)
  }

  const handleMerchantChange = (merchant: string, checked: boolean) => {
    const newFilters = { ...localFilters }
    if (!newFilters.merchants) {
      newFilters.merchants = []
    }
    
    if (checked) {
      newFilters.merchants.push(merchant)
    } else {
      newFilters.merchants = newFilters.merchants.filter(m => m !== merchant)
    }
    
    if (newFilters.merchants.length === 0) {
      delete newFilters.merchants
    }
    
    setLocalFilters(newFilters)
  }

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const newFilters = { ...localFilters }
    if (!newFilters.amountRange) {
      newFilters.amountRange = { min: 0, max: 0 }
    }
    
    const numValue = value ? parseFloat(value) : undefined
    if (numValue !== undefined && !isNaN(numValue)) {
      newFilters.amountRange[field] = numValue
    } else {
      delete newFilters.amountRange[field]
      if (!newFilters.amountRange.min && !newFilters.amountRange.max) {
        delete newFilters.amountRange
      }
    }
    
    setLocalFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: AnalyticsFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = (): boolean => {
    return !!(
      localFilters.dateRange?.start ||
      localFilters.dateRange?.end ||
      localFilters.categories?.length ||
      localFilters.merchants?.length ||
      localFilters.amountRange?.min ||
      localFilters.amountRange?.max
    )
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Filters
            </h3>
            {hasActiveFilters() && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                Active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Date Range */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          {availableCategories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Categories
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localFilters.categories?.includes(category) || false}
                      onChange={(e) => handleCategoryChange(category, e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Merchants */}
          {availableMerchants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Merchants
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableMerchants.slice(0, 12).map((merchant) => (
                  <label key={merchant} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localFilters.merchants?.includes(merchant) || false}
                      onChange={(e) => handleMerchantChange(merchant, e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {merchant}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Amount Range */}
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Amount Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Minimum Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={localFilters.amountRange?.min || ''}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Maximum Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000.00"
                  value={localFilters.amountRange?.max || ''}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleClearFilters}
              disabled={!hasActiveFilters() || loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
              <span>Clear All</span>
            </button>
            
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 