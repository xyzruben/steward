'use client'

import { useAuth } from '@/context/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { DashboardHeader } from './DashboardHeader'
import { ReceiptStats } from './ReceiptStats'
import ReceiptUpload from './ReceiptUpload'
import { RecentReceipts } from './RecentReceipts'


export function DashboardContent() {
  const { user, loading } = useAuth()

  const handleUploadSuccess = () => {
    // Refresh the page to show new data
    window.location.reload()
  }

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading Steward...</p>
        </div>
      </div>
    )
  }

  // Show login form if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Steward
            </h1>
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
  return (
    <div className="min-h-screen">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-8">
            <ReceiptStats />
            <RecentReceipts />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            <ReceiptUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      </main>
    </div>
  )
} 