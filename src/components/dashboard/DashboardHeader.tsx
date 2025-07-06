'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { BarChart3, Home, Receipt } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function DashboardHeader() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Steward
            </h1>
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
              AI-powered receipt tracking
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors duration-200"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/receipts"
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors duration-200"
            >
              <Receipt className="h-4 w-4" />
              <span>Receipts</span>
            </Link>
            <Link
              href="/analytics"
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </nav>

          {/* User menu and theme toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Welcome, {user?.email}
            </div>
            <button
              onClick={handleSignOut}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
} 