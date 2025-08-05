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
import { FullScreenLoading } from '@/components/ui/LoadingSpinner'
import { MobileNavigation, MobileHeader } from '@/components/ui/MobileNavigation'
import { PullToRefresh } from '@/components/ui/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isMobileDevice } from '@/lib/utils'
import { Zap } from 'lucide-react'
import AgentChat from '@/components/agent/AgentChat';
import { WelcomeScreen } from '@/components/ui/WelcomeScreen';
import { OnboardingTour, useOnboardingTour } from '@/components/ui/OnboardingTour';
import { HelpSystem, HelpTrigger } from '@/components/ui/HelpSystem';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ReceiptViewerModal } from '@/components/receipts/ReceiptViewerModal';

// ============================================================================
// MAIN PAGE COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export default function HomePage() {
  const { user, loading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated' | 'error'>('checking')
  const [showReceiptViewer, setShowReceiptViewer] = useState(false)
  const [receiptViewerFilters, setReceiptViewerFilters] = useState({})
  
  // Memoize expensive computations to prevent re-renders
  const isMobile = React.useMemo(() => isMobileDevice(), [])
  
  // Onboarding tour
  const { isTourVisible, hasCompletedTour, startTour, completeTour, skipTour } = useOnboardingTour()

  // Track initial page load
  const startTimer = () => console.log('Page load started');
  const endTimer = (success: boolean) => console.log(`Page load ${success ? 'completed' : 'failed'}`);

  // Check authentication status with server
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user) {
        setAuthStatus('unauthenticated')
        return
      }

      try {
        const response = await fetch('/api/auth/test')
        const data = await response.json()
        
        if (data.authenticated) {
          setAuthStatus('authenticated')
        } else {
          console.warn('🔍 Frontend shows user logged in but server disagrees:', data.error)
          setAuthStatus('unauthenticated')
        }
      } catch (error) {
        console.error('🔍 Auth status check failed:', error)
        setAuthStatus('error')
      }
    }

    if (user && !loading) {
      checkAuthStatus()
    }
  }, [user, loading])

  useEffect(() => {
    startTimer()
    setIsInitialized(true)
    // End timer when dashboard is shown
    if (user?.id && !loading) {
      endTimer(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading])

  // Ensure page scrolls to top when navigating back to home
  useEffect(() => {
    if (user && !loading) {
      window.scrollTo(0, 0);
    }
  }, [user, loading]);

  // Handle opening receipt viewer with filters
  const handleViewReceipts = (filters = {}) => {
    setReceiptViewerFilters(filters)
    setShowReceiptViewer(true)
  }

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

  // Show welcome screen for new users or login form
  if (!user) {
    if (showWelcome) {
      return (
        <WelcomeScreen
          onGetStarted={() => setShowWelcome(false)}
          onTakeTour={() => {
            setShowWelcome(false);
            startTour();
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mt-20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome to Steward
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Your AI-powered financial companion
              </p>
            </div>
            
            <LoginForm />
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowWelcome(true)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Learn more about Steward
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication warning if there's a mismatch
  if (user && authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                Authentication Session Expired
              </h2>
              <p className="text-yellow-700 mb-4">
                It looks like your login session has expired. Please sign in again to continue using Steward.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Refresh & Sign In
                </button>
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
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
        <ErrorBoundary>
          {/* AI Agent - Primary Feature (Tier 4: AI-native, see Master System Guide & TIER4_UPGRADE_PLAN.md) */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border border-blue-200 dark:border-blue-800 mb-4">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  AI Financial Assistant
                </span>
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Ask me anything about your finances
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Get instant insights about your spending patterns, find specific transactions, or analyze your financial trends with natural language queries.
              </p>
            </div>
            <AgentChat onViewReceipts={handleViewReceipts} />
          </div>

          {/* Dashboard Content - Secondary */}
          <PullToRefresh onRefresh={handleRefresh} disabled={isRefreshing}>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Your Financial Overview
                </h3>
                <Button
                  variant="outline"
                  onClick={() => handleViewReceipts()}
                  className="flex items-center space-x-2"
                >
                  <span>View All Receipts</span>
                </Button>
              </div>
              <DashboardContent />
            </div>
          </PullToRefresh>
        </ErrorBoundary>
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
      
      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        isOpen={showReceiptViewer}
        onClose={() => setShowReceiptViewer(false)}
        initialFilters={receiptViewerFilters}
      />
      
      {/* Help and Tour Components */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col space-y-2">
        {!hasCompletedTour && (
          <Button
            onClick={startTour}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700"
          >
            Take Tour
          </Button>
        )}
        <HelpTrigger onOpen={() => setShowHelp(true)} />
      </div>
      
      {/* Onboarding Tour */}
      <OnboardingTour
        isVisible={isTourVisible}
        onComplete={completeTour}
        onSkip={skipTour}
      />
      
      {/* Help System */}
      <HelpSystem
        isVisible={showHelp}
        onClose={() => setShowHelp(false)}
      />
      
      {/* Real-time notifications - positioned in top-right to avoid conflicts */}
              {/* RealtimeNotifications removed for performance optimization */}
    </div>
  )
}
