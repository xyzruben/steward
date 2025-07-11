// ============================================================================
// BULK OPERATIONS TOOLBAR
// ============================================================================
// Toolbar for bulk receipt operations
// See: Master System Guide - Frontend Architecture, UI Components

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit, 
  Download, 
  Filter,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { SimpleToast } from '@/components/ui/SimpleToast'
import { BulkUpdateModal } from './BulkUpdateModal'

// ============================================================================
// TYPES
// ============================================================================

export interface Receipt {
  id: string
  merchant: string
  total: number
  purchaseDate: Date
  category?: string
  subcategory?: string
  confidenceScore?: number
  summary?: string
  imageUrl: string
}

export interface BulkOperationsToolbarProps {
  receipts: Receipt[]
  selectedReceipts: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkUpdate: (updates: any) => Promise<void>
  onBulkDelete: () => Promise<void>
  onBulkExport: (format: string) => Promise<void>
  onShowFilters: () => void
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkOperationsToolbar({
  receipts,
  selectedReceipts,
  onSelectionChange,
  onBulkUpdate,
  onBulkDelete,
  onBulkExport,
  onShowFilters,
  isLoading = false
}: BulkOperationsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // ============================================================================
  // SELECTION HANDLERS
  // ============================================================================

  const handleSelectAll = useCallback(() => {
    const allIds = receipts.map(receipt => receipt.id)
    onSelectionChange(allIds)
  }, [receipts, onSelectionChange])

  const handleSelectNone = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  const handleSelectReceipt = useCallback((receiptId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedReceipts, receiptId])
    } else {
      onSelectionChange(selectedReceipts.filter(id => id !== receiptId))
    }
  }, [selectedReceipts, onSelectionChange])

  const isAllSelected = receipts.length > 0 && selectedReceipts.length === receipts.length
  const isPartiallySelected = selectedReceipts.length > 0 && selectedReceipts.length < receipts.length

  // ============================================================================
  // BULK ACTION HANDLERS
  // ============================================================================

  const handleBulkUpdate = useCallback(async (updates: any) => {
    if (selectedReceipts.length === 0) return

    setIsProcessing(true)
    try {
      await onBulkUpdate(updates)
      setNotification({ type: 'success', message: `Updated ${selectedReceipts.length} receipts` })
      onSelectionChange([]) // Clear selection after successful update
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update receipts' })
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [selectedReceipts, onBulkUpdate, onSelectionChange])

  const handleBulkDelete = useCallback(async () => {
    if (selectedReceipts.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedReceipts.length} receipt(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsProcessing(true)
    try {
      await onBulkDelete()
      setNotification({ type: 'success', message: `Deleted ${selectedReceipts.length} receipts` })
      onSelectionChange([]) // Clear selection after successful delete
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete receipts' })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedReceipts, onBulkDelete, onSelectionChange])

  const handleBulkExport = useCallback(async () => {
    if (selectedReceipts.length === 0) return

    setIsProcessing(true)
    try {
      await onBulkExport('csv')
      setNotification({ type: 'success', message: `Exported ${selectedReceipts.length} receipts` })
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to export receipts' })
    } finally {
      setIsProcessing(false)
    }
  }, [selectedReceipts, onBulkExport])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (receipts.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Selection controls */}
          <div className="flex items-center space-x-4">
            {/* Select all/none */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={isAllSelected ? handleSelectNone : handleSelectAll}
                disabled={isLoading || isProcessing}
                className="flex items-center space-x-2"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : isPartiallySelected ? (
                  <div className="h-4 w-4 border-2 border-slate-400 rounded" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </span>
              </Button>
            </div>

            {/* Selection count */}
            {selectedReceipts.length > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>{selectedReceipts.length} selected</span>
              </Badge>
            )}

            {/* Clear selection */}
            {selectedReceipts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectNone}
                disabled={isLoading || isProcessing}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
                <span className="text-sm">Clear</span>
              </Button>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Filters button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShowFilters}
              disabled={isLoading || isProcessing}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>

            {/* Bulk actions - only show when items are selected */}
            {selectedReceipts.length > 0 && (
              <>
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

                {/* Update button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateModal(true)}
                  disabled={isLoading || isProcessing}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Update</span>
                </Button>

                {/* Export button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={isLoading || isProcessing}
                  className="flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Export</span>
                </Button>

                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isLoading || isProcessing}
                  className="flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing bulk operation...</span>
          </div>
        )}

        {/* Warning for large selections */}
        {selectedReceipts.length > 100 && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Large selection detected. This operation may take longer than usual.</span>
          </div>
        )}
      </div>

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleBulkUpdate}
        selectedCount={selectedReceipts.length}
        isLoading={isLoading || isProcessing}
      />

      {/* Simple Toast Notification */}
      {notification && (
        <SimpleToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  )
} 