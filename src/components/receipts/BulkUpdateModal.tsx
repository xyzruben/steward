// ============================================================================
// BULK UPDATE MODAL
// ============================================================================
// Modal for bulk updating receipt fields
// See: Master System Guide - Frontend Architecture, UI Components

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Loader2 } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface BulkUpdateData {
  category?: string
  subcategory?: string
  tags?: string[]
  notes?: string
}

export interface BulkUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: BulkUpdateData) => Promise<void>
  selectedCount: number
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkUpdateModal({
  isOpen,
  onClose,
  onUpdate,
  selectedCount,
  isLoading = false
}: BulkUpdateModalProps) {
  const [formData, setFormData] = useState<BulkUpdateData>({
    category: '',
    subcategory: '',
    tags: [],
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty values
    const updates = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0
        return value !== '' && value !== undefined
      })
    )

    if (Object.keys(updates).length === 0) {
      alert('Please fill in at least one field to update.')
      return
    }

    setIsSubmitting(true)
    try {
      await onUpdate(updates)
      handleClose()
    } catch (error) {
      console.error('Bulk update failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      category: '',
      subcategory: '',
      tags: [],
      notes: ''
    })
    setIsSubmitting(false)
    onClose()
  }

  const handleInputChange = (field: keyof BulkUpdateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Bulk Update Receipts
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selection info */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Updating {selectedCount} receipt{selectedCount !== 1 ? 's' : ''}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              type="text"
              placeholder="Enter subcategory (optional)"
              value={formData.subcategory}
              onChange={(e) => handleInputChange('subcategory', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              type="text"
              placeholder="Enter tags separated by commas (optional)"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Example: work, reimbursable, tax-deductible
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Enter notes (optional)"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md 
                       bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                       placeholder-slate-500 dark:placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Receipts</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 