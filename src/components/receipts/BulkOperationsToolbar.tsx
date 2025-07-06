'use client'

import React, { useState } from 'react'
import { Trash2, Tag, Download, X, Check } from 'lucide-react'

interface Receipt {
  id: string
  merchant: string
  total: number
  purchaseDate: string
  category?: string
}

interface BulkOperationsToolbarProps {
  receipts: Receipt[]
  selectedReceipts: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkDelete: (receiptIds: string[]) => Promise<void>
  onBulkCategorize: (receiptIds: string[], category: string, subcategory?: string) => Promise<void>
  onBulkExport: (receiptIds: string[]) => Promise<void>
  onRefresh: () => void
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Travel',
  'Education',
  'Other'
]

export function BulkOperationsToolbar({
  receipts,
  selectedReceipts,
  onSelectionChange,
  onBulkDelete,
  onBulkCategorize,
  onBulkExport,
  onRefresh
}: BulkOperationsToolbarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')

  const allSelected = selectedReceipts.length === receipts.length && receipts.length > 0
  const someSelected = selectedReceipts.length > 0 && !allSelected

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(receipts.map(receipt => receipt.id))
    }
  }

  const handleSelectReceipt = (receiptId: string) => {
    if (selectedReceipts.includes(receiptId)) {
      onSelectionChange(selectedReceipts.filter(id => id !== receiptId))
    } else {
      onSelectionChange([...selectedReceipts, receiptId])
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedReceipts.length} receipt(s)? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      await onBulkDelete(selectedReceipts)
      onSelectionChange([])
      onRefresh()
    } catch (error) {
      console.error('Failed to delete receipts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkCategorize = async () => {
    if (!selectedCategory) {
      window.alert('Please select a category')
      return
    }

    setIsLoading(true)
    try {
      await onBulkCategorize(selectedReceipts, selectedCategory, selectedSubcategory)
      setShowCategoryModal(false)
      setSelectedCategory('')
      setSelectedSubcategory('')
      onSelectionChange([])
      onRefresh()
    } catch (error) {
      console.error('Failed to categorize receipts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkExport = async () => {
    setIsLoading(true)
    try {
      await onBulkExport(selectedReceipts)
      onSelectionChange([])
    } catch (error) {
      console.error('Failed to export receipts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (receipts.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
      {/* Selection controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected
              }}
              onChange={handleSelectAll}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </label>
          
          {selectedReceipts.length > 0 && (
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {selectedReceipts.length} receipt(s) selected
            </span>
          )}
        </div>

        {selectedReceipts.length > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Bulk action buttons */}
      {selectedReceipts.length > 0 && (
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBulkDelete}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete ({selectedReceipts.length})</span>
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Tag className="h-4 w-4" />
            <span>Categorize ({selectedReceipts.length})</span>
          </button>

          <button
            onClick={handleBulkExport}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export ({selectedReceipts.length})</span>
          </button>
        </div>
      )}

      {/* Category selection modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Categorize Receipts
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subcategory (optional)
                </label>
                <input
                  type="text"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  placeholder="e.g., Restaurants, Gas Stations"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCategorize}
                  disabled={!selectedCategory || isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                >
                  <Check className="h-4 w-4" />
                  <span>Categorize</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 