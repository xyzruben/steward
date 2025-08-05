'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Receipt } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function SharedNavigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
  }

  // Don't show navigation on the home page (dashboard)
  if (pathname === '/') {
    return null
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              {/* Circular Logo */}
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white dark:bg-slate-700 shadow-sm border-2 border-slate-200 dark:border-slate-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors duration-200">
                <Image
                  src="/steward_logo.png"
                  alt="Steward Logo"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              
              {/* Brand Text */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  Steward
                </h1>
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                  AI-powered receipt tracking
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors duration-200"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
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