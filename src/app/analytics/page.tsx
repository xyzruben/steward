// ============================================================================
// ANALYTICS PAGE (see STEWARD_MASTER_SYSTEM_GUIDE.md - App Router Structure)
// ============================================================================
// Analytics dashboard page with comprehensive spending analysis
// Follows master guide: Frontend Architecture, Component Hierarchy

import { Suspense } from 'react'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// ============================================================================
// ANALYTICS PAGE COMPONENT (see master guide: App Router Structure)
// ============================================================================

/**
 * Analytics page providing comprehensive spending analysis
 * Features overview, trends, categories, and merchant breakdown
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Frontend Architecture, Component Hierarchy
 */
export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Suspense fallback={<LoadingSpinner />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
} 