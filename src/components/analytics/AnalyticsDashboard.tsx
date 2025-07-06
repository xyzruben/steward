// ============================================================================
// ANALYTICS DASHBOARD COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Frontend Architecture)
// ============================================================================
// Main analytics dashboard with overview, trends, categories, and merchants
// Follows master guide: Component Hierarchy, React State Patterns, Data Fetching Patterns

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AnalyticsOverview } from './AnalyticsOverview'
import { AnalyticsTrends } from './AnalyticsTrends'
import { AnalyticsCategories } from './AnalyticsCategories'
import { AnalyticsMerchants } from './AnalyticsMerchants'
import { AnalyticsFilters } from './AnalyticsFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { AnalyticsFilters as FiltersType } from '@/types/analytics'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsDashboardProps {
  className?: string
}

// ============================================================================
// ANALYTICS DASHBOARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Main analytics dashboard component
 * Provides comprehensive spending analysis with filtering and caching
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Frontend Architecture, Component Hierarchy
 */
export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FiltersType>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ============================================================================
  // EFFECTS AND DATA FETCHING (see master guide: Data Fetching Patterns)
  // ============================================================================

  // Update timestamp when filters change
  useEffect(() => {
    setLastUpdated(new Date())
  }, [filters])

  // ============================================================================
  // EVENT HANDLERS (see master guide: React State Patterns)
  // ============================================================================

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
    setLoading(true) // Show loading state during filter changes
    // Brief delay to show loading state for better UX
    setTimeout(() => setLoading(false), 300)
  }

  const handleRefresh = () => {
    setLastUpdated(new Date())
  }

  // ============================================================================
  // RENDER LOGIC (see master guide: Component Hierarchy)
  // ============================================================================

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Please log in to view analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Analytics Dashboard
              </h1>
              {lastUpdated && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <AnalyticsFilters 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Analytics Grid */}
        {!loading && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <AnalyticsOverview filters={filters} />

            {/* Charts and Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnalyticsTrends filters={filters} />
              <AnalyticsCategories filters={filters} />
            </div>

            {/* Merchants Table */}
            <AnalyticsMerchants filters={filters} />
          </div>
        )}
      </main>
    </div>
  )
} 