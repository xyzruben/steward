// ============================================================================
// MOBILE NAVIGATION COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Mobile-first navigation with smooth animations and touch interactions
// Follows master guide: Component Hierarchy, Performance, Accessibility

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Receipt, 
  BarChart3, 
  Settings, 
  Plus,
  Search,
  Bell
} from 'lucide-react'
import { AnimatedButton } from './AnimatedComponents'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

interface MobileNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  onUpload?: () => void
  onSearch?: () => void
  onNotifications?: () => void
  className?: string
}

// ============================================================================
// NAVIGATION DATA (see master guide: Component Hierarchy)
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/'
  },
  {
    id: 'receipts',
    label: 'Receipts',
    icon: Receipt,
    href: '/receipts',
    badge: 3
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/profile'
  }
]

// ============================================================================
// MOBILE NAVIGATION COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function MobileNavigation({
  activeTab,
  onTabChange,
  onUpload,
  onSearch,
  onNotifications,
  className = ''
}: MobileNavigationProps) {
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false)

  const handleTabPress = (tabId: string) => {
    onTabChange(tabId)
    // Add haptic feedback for mobile
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleUploadPress = () => {
    setIsUploadMenuOpen(!isUploadMenuOpen)
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(20)
    }
  }

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 z-50', className)}>
      {/* Top action bar */}
      <motion.div 
        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-2"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between">
          {/* Search button */}
          <motion.button
            className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            whileTap={{ scale: 0.95 }}
            onClick={onSearch}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </motion.button>

          {/* Upload button */}
          <div className="relative">
            <motion.button
              className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg"
              whileTap={{ scale: 0.9 }}
              onClick={handleUploadPress}
              aria-label="Upload receipt"
            >
              <Plus className="w-6 h-6" />
            </motion.button>

            {/* Upload menu */}
            <AnimatePresence>
              {isUploadMenuOpen && (
                <motion.div
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-2"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className="flex flex-col space-y-2">
                    <AnimatedButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onUpload?.()
                        setIsUploadMenuOpen(false)
                      }}
                      className="text-left"
                    >
                      📷 Camera
                    </AnimatedButton>
                    <AnimatedButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onUpload?.()
                        setIsUploadMenuOpen(false)
                      }}
                      className="text-left"
                    >
                      📁 Gallery
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications button */}
          <motion.button
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            whileTap={{ scale: 0.95 }}
            onClick={onNotifications}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 500 }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Bottom tab bar */}
      <motion.div 
        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-2 py-2"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <motion.button
                key={item.id}
                className="relative flex flex-col items-center justify-center flex-1 py-2 px-1"
                onClick={() => handleTabPress(item.id)}
                whileTap={{ scale: 0.95 }}
                aria-label={item.label}
                aria-pressed={isActive}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon 
                    className={cn(
                      'w-6 h-6 transition-colors',
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    )} 
                  />
                  
                  {/* Badge */}
                  {item.badge && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {item.badge}
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                <motion.span
                  className={cn(
                    'text-xs mt-1 transition-colors',
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400 font-medium' 
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                  animate={{ 
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white dark:bg-slate-900" />
    </div>
  )
}

// ============================================================================
// MOBILE HEADER COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface MobileHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  onMenu?: () => void
  className?: string
}

export function MobileHeader({
  title,
  subtitle,
  onBack,
  onMenu,
  className = ''
}: MobileHeaderProps) {
  return (
    <motion.header 
      className={cn(
        'bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3',
        className
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <motion.button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              aria-label="Go back"
            >
              ←
            </motion.button>
          )}
          
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {onMenu && (
          <motion.button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            whileTap={{ scale: 0.95 }}
            onClick={onMenu}
            aria-label="Menu"
          >
            ☰
          </motion.button>
        )}
      </div>
    </motion.header>
  )
} 