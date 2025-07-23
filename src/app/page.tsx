// ============================================================================
// ENHANCED MAIN PAGE COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium main page with skeleton loading states and smooth transitions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { RealtimeNotifications } from '@/components/ui/RealtimeNotifications'
import { FullScreenLoading } from '@/components/ui/LoadingSpinner'
import { MobileNavigation, MobileHeader } from '@/components/ui/MobileNavigation'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { cn } from '@/lib/utils'
import { isMobileDevice } from '@/lib/utils'
import { usePerformance } from '@/hooks/usePerformance'

// ============================================================================
// MAIN PAGE COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export default function HomePage() {
  const { user, loading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Track initial page load
  const { start, end } = usePerformance({ label: 'Initial Page Load', auto: false })

  useEffect(() => {
    start()
    setIsInitialized(true)
    // End timer when dashboard is shown
    if (user && !loading) {
      end()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  // Show full screen loading for initial app load
  if (!isInitialized) {
    return (
      <FullScreenLoading 
        variant="stepper"
        text="Initializing Steward..."
        showLogo={true}
      />
    )
  }

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <FullScreenLoading 
        variant="dots"
        text="Loading your account..."
        showLogo={true}
      />
    )
  }

  // Show login form if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-slate-700 shadow-lg border-2 border-slate-200 dark:border-slate-600">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Steward
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              AI-powered receipt and expense tracking
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  // Show authenticated dashboard
  const isMobile = isMobileDevice()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Immediate refresh for better performance
    setIsRefreshing(false)
  }

  const handleUpload = () => {
    // Handle upload action
    console.log('Upload triggered')
  }

  const handleSearch = () => {
    // Handle search action
    console.log('Search triggered')
  }

  const handleNotifications = () => {
    // Handle notifications action
    console.log('Notifications triggered')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title="Steward"
          subtitle="Your financial companion"
          onMenu={() => console.log('Menu pressed')}
        />
      )}

      {/* Desktop Header */}
      {!isMobile && <DashboardHeader />}
      
      <main className={cn(
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
        isMobile && 'pb-32' // Space for mobile navigation
      )}>
        <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
          <DashboardContent />
        </PullToRefresh>
      </main>
      
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUpload={handleUpload}
          onSearch={handleSearch}
          onNotifications={handleNotifications}
        />
      )}
      
      {/* Real-time notifications - positioned in top-right to avoid conflicts */}
      <RealtimeNotifications position="top-right" />
    </div>
  )
}
