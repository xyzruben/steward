// ============================================================================
// AUTH PAGE - Redirects to main page for authentication
// ============================================================================
// Simple redirect page since main page handles auth
// DEPLOYMENT TRIGGER: Force Vercel to pick up auth page changes

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AuthPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main page which handles authentication
    router.replace('/')
  }, [router])

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
          text="Redirecting to login..."
          className="mb-4"
        />
        
        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span>AI-powered receipt tracking</span>
        </div>
      </div>
    </div>
  )
} 