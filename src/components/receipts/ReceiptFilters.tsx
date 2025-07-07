'use client'

import React, { useState } from 'react'
import { Filter, X, Calendar, DollarSign, Tag, Target } from 'lucide-react'

interface ReceiptFiltersProps {
  onFiltersChange: (filters: ReceiptFilters) => void
  className?: string
}

export interface ReceiptFilters {
  category?: string
  subcategory?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
  minConfidence?: number
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Travel',
  'Education',
  'Other'
]

const CONFIDENCE_OPTIONS = [
  { value: 0.5, label: '50% or higher' },
  { value: 0.7, label: '70% or higher' },
  { value: 0.8, label: '80% or higher' },
  { value: 0.9, label: '90% or higher' }
]

export function ReceiptFilters({ onFiltersChange, className = "" }: ReceiptFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<ReceiptFilters>({})

  const handleFilterChange = (key: keyof ReceiptFilters, value: any) => {
    const newFilters = { ...filters }
    
    if (value === '' || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className={`${className}`}>
      {/* Filter toggle button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {Object.keys(filters).length}
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter controls */}
      {isExpanded && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          {/* Category and Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subcategory
              </label>
              <input
                type="text"
                value={filters.subcategory || ''}
                onChange={(e) => handleFilterChange('subcategory', e.target.value || undefined)}
                placeholder="e.g., Restaurants, Gas Stations"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Min amount"
                min="0"
                step="0.01"
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Max amount"
                min="0"
                step="0.01"
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Confidence Score */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Minimum Confidence Score
            </label>
            <select
              value={filters.minConfidence || ''}
              onChange={(e) => handleFilterChange('minConfidence', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any confidence</option>
              {CONFIDENCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key as keyof ReceiptFilters, undefined)}
                      className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 