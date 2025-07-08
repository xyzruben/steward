'use client'

// ============================================================================
// EXPORT BUTTON COMPONENT
// ============================================================================
// Reusable export button with modal integration
// See: Master System Guide - Component Hierarchy, User Experience

import React, { useState } from 'react'
import { Download } from 'lucide-react'
import ExportModal from './ExportModal'
import { useExport } from '@/hooks/useExport'
import type { ExportOptions } from './ExportModal'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ExportButtonProps {
  availableCategories?: string[]
  availableMerchants?: string[]
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children?: React.ReactNode
}

// ============================================================================
// EXPORT BUTTON COMPONENT
// ============================================================================

export default function ExportButton({
  availableCategories = [],
  availableMerchants = [],
  className = '',
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ExportButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { exportData, isExporting, error } = useExport()

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleExport = async (options: ExportOptions) => {
    await exportData(options)
  }

  // ============================================================================
  // STYLE CLASSES
  // ============================================================================

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
      case 'outline':
        return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'md':
        return 'px-4 py-2 text-sm'
      case 'lg':
        return 'px-6 py-3 text-base'
      default:
        return 'px-4 py-2 text-sm'
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isExporting}
        className={`
          inline-flex items-center space-x-2 font-medium rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
        {...props}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>{children || 'Export'}</span>
          </>
        )}
      </button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableCategories={availableCategories}
        availableMerchants={availableMerchants}
        onExport={handleExport}
      />

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}
    </>
  )
} 