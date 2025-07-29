// ============================================================================
// EXPORT HOOK
// ============================================================================
// Custom hook for managing data export functionality
// See: Master System Guide - State Management, Error Handling

import { useState } from 'react'
import type { ExportOptions } from '@/components/export/ExportModal'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ExportState {
  isExporting: boolean
  error: string | null
  lastExport: {
    filename: string
    size: number
    timestamp: Date
  } | null
}

export interface UseExportReturn extends ExportState {
  exportData: (options: ExportOptions) => Promise<void>
  clearError: () => void
  resetState: () => void
}

// ============================================================================
// EXPORT HOOK
// ============================================================================

export function useExport(): UseExportReturn {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    error: null,
    lastExport: null
  })

  // ============================================================================
  // EXPORT FUNCTION
  // ============================================================================

  const exportData = async (options: ExportOptions): Promise<void> => {
    setState(prev => ({
      ...prev,
      isExporting: true,
      error: null
    }))

    try {
      // Prepare request body - always include all fields for type safety (see Master System Guide)
      const requestBody: any = {
        format: options.format,

        dateRange: options.dateRange ?? null,
        categories: options.categories ?? [],
        merchants: options.merchants ?? [],
        minAmount: options.minAmount ?? '',
        maxAmount: options.maxAmount ?? ''
      }

      // Make API request
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      // If the response is JSON, treat as error (even if status is 200)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Export failed: ${response.status}`)
      }

      // PATCH: If content-type is missing but response.ok, treat as file download (for test env)
      if (!contentType && response.ok) {
        // Proceed as file download
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Export failed: ${response.status}`)
      }

      // Handle file download
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'exported_file'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/)
        if (match) filename = match[1]
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Set lastExport and clear error state (see Master System Guide - error handling)
      setState(prev => ({
        ...prev,
        isExporting: false,
        lastExport: {
          filename,
          size: blob.size,
          timestamp: new Date()
        },
        error: null
      }))
    } catch (error) {
      console.error('Export error:', error)
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }))
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  const resetState = () => {
    setState({
      isExporting: false,
      error: null,
      lastExport: null
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    ...state,
    exportData,
    clearError,
    resetState
  }
}

// ============================================================================
// GLOBAL NOTIFICATION INTERFACE
// ============================================================================

declare global {
  interface Window {
    showNotification?: (notification: {
      type: 'success' | 'error' | 'info' | 'warning'
      title: string
      message: string
    }) => void
  }
} 