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
      // Prepare request body
      const requestBody: any = {
        format: options.format,
        includeAnalytics: options.includeAnalytics
      }

      // Add date range if specified
      if (options.dateRange?.start && options.dateRange?.end) {
        requestBody.dateRange = {
          start: options.dateRange.start,
          end: options.dateRange.end
        }
      }

      // Add filters if specified
      if (options.categories.length > 0) {
        requestBody.categories = options.categories
      }

      if (options.merchants.length > 0) {
        requestBody.merchants = options.merchants
      }

      if (options.minAmount) {
        requestBody.minAmount = parseFloat(options.minAmount)
      }

      if (options.maxAmount) {
        requestBody.maxAmount = parseFloat(options.maxAmount)
      }

      // Make API request
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Export failed: ${response.status}`)
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'export'
        : `steward-export.${options.format}`

      // Get file size
      const contentLength = response.headers.get('content-length')
      const size = contentLength ? parseInt(contentLength, 10) : 0

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Update state with success
      setState(prev => ({
        ...prev,
        isExporting: false,
        lastExport: {
          filename,
          size,
          timestamp: new Date()
        }
      }))

      // Show success notification (if notification system is available)
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification({
          type: 'success',
          title: 'Export Complete',
          message: `Successfully exported ${filename} (${formatFileSize(size)})`
        })
      }

    } catch (error) {
      console.error('Export error:', error)
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }))

      // Show error notification (if notification system is available)
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification({
          type: 'error',
          title: 'Export Failed',
          message: error instanceof Error ? error.message : 'Export failed'
        })
      }
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