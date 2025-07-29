'use client'

import React from 'react'
import { Clock, BarChart3, TrendingUp, Filter, Sparkles } from 'lucide-react'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================



interface SearchMetadata {
  queryTime: number
  cached: boolean
  timestamp: string
}

interface SearchResultsProps {
  totalResults: number
  metadata?: SearchMetadata
  query?: string
  filters?: any
  className?: string
}

// ============================================================================
// SEARCH RESULTS COMPONENT
// ============================================================================

export function SearchResults({
  totalResults,
  metadata,
  query,
  filters,
  className = ""
}: SearchResultsProps) {
  if (totalResults === 0 && !query) {
    return null
  }

  const hasFilters = filters && Object.keys(filters).length > 0

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Search Results
          </h3>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
          {metadata && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{metadata.queryTime}ms</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <BarChart3 className="h-4 w-4" />
            <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Query and Filters Display */}
      {(query || hasFilters) && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Search
            </span>
          </div>
          
          {query && (
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span className="font-medium">Query:</span> "{query}"
            </div>
          )}
          
          {hasFilters && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">Filters:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Metadata Footer */}
      {metadata && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
              <span>Query time: {metadata.queryTime}ms</span>
              {metadata.cached && (
                <span className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Cached</span>
                </span>
              )}
            </div>
            <span>
              {new Date(metadata.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 