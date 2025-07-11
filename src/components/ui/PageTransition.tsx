// ============================================================================
// PAGE TRANSITION COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Client-side wrapper for AnimatePresence to handle route transitions
// Follows master guide: Component Hierarchy, Performance, Accessibility

'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { getPageTransition } from '@/lib/animations'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface PageTransitionProps {
  children: React.ReactNode
  transitionType?: 'fade' | 'slide-up' | 'slide-right' | 'scale'
  className?: string
}

// ============================================================================
// PAGE TRANSITION COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function PageTransition({ 
  children, 
  transitionType = 'fade',
  className = ''
}: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={getPageTransition(transitionType)}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{ minHeight: '100vh' }}
        // Accessibility: Announce route changes to screen readers
        aria-live="polite"
        aria-label={`Navigated to ${pathname}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
} 