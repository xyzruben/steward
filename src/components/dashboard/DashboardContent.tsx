// ============================================================================
// ENHANCED DASHBOARD CONTENT COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium dashboard with skeleton loading states and smooth transitions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ReceiptStats } from './ReceiptStats'
import { RecentReceipts } from './RecentReceipts'
import { ReceiptUpload } from './ReceiptUpload'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface DashboardContentProps {
  className?: string
}

// ============================================================================
// MAIN DASHBOARD CONTENT COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function DashboardContent({ className = '' }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setIsInitialized(true)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  // Show full screen loading for initial load
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-slate-700 shadow-lg border-2 border-slate-200 dark:border-slate-600">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Steward
            </h1>
          </div>
          
          <LoadingSpinner 
            variant="stepper" 
            size="lg" 
            text="Loading your financial dashboard..."
            className="mb-4"
          />
          
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span>AI-powered receipt tracking</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Stats Section */}
      <ReceiptStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <RecentReceipts />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ReceiptUpload />
        </div>
      </div>
    </div>
  )
} 