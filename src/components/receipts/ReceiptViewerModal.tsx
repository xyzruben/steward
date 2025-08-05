'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Receipt, Search, Filter, Download, X, Calendar, DollarSign, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  initialFilters?: {
    category?: string
    merchant?: string
    dateRange?: string
    minAmount?: number
    maxAmount?: number
  }
}

interface Receipt {
  id: string
  merchant: string
  total: number
  purchaseDate: string
  category: string
  imageUrl?: string
}

// ============================================================================
// RECEIPT VIEWER MODAL COMPONENT
// ============================================================================

export function ReceiptViewerModal({ 
  isOpen, 
  onClose, 
  initialFilters = {} 
}: ReceiptViewerModalProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch receipts with pagination
  const fetchReceipts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', pageNum.toString())
      params.append('limit', '20')
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }
      
      if (filters.category) {
        params.append('category', filters.category)
      }
      
      if (filters.merchant) {
        params.append('merchant', filters.merchant)
      }
      
      if (filters.minAmount !== undefined) {
        params.append('minAmount', filters.minAmount.toString())
      }
      
      if (filters.maxAmount !== undefined) {
        params.append('maxAmount', filters.maxAmount.toString())
      }

      const response = await fetch(`/api/receipts?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (append) {
          setReceipts(prev => [...prev, ...data])
        } else {
          setReceipts(data)
        }
        
        setHasMore(data.length === 20) // If we got less than 20, we've reached the end
      } else {
        throw new Error('Failed to fetch receipts')
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
      setError(error instanceof Error ? error.message : 'Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filters])

  // Load initial receipts when modal opens
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      setReceipts([])
      fetchReceipts(1, false)
    }
  }, [isOpen, fetchReceipts])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) {
        setPage(1)
        setReceipts([])
        fetchReceipts(1, false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filters, isOpen, fetchReceipts])

  // Load more receipts
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchReceipts(nextPage, true)
    }
  }

  // Export receipts
  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters, searchTerm })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipts-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>All Receipts</span>
              {filters.category && (
                <span className="text-sm text-gray-500">
                  - {filters.category}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={receipts.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Filter className="h-4 w-4 mr-1" />
              {viewMode === 'grid' ? 'List' : 'Grid'}
            </Button>
          </div>

          {/* Receipts Content */}
          <div className="flex-1 overflow-auto">
            {loading && receipts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => fetchReceipts(1, false)}>
                  Try Again
                </Button>
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No receipts found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload your first receipt to get started'}
                </p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-2'
              )}>
                {receipts.map((receipt) => (
                  <ReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    viewMode={viewMode}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && receipts.length > 0 && (
              <div className="text-center mt-6">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
                {hasMore && ' (scroll for more)'}
              </span>
              <span>
                {searchTerm && `Searching for "${searchTerm}"`}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// RECEIPT CARD COMPONENT
// ============================================================================

interface ReceiptCardProps {
  receipt: Receipt
  viewMode: 'grid' | 'list'
  formatDate: (date: string) => string
  formatAmount: (amount: number) => string
}

function ReceiptCard({ receipt, viewMode, formatDate, formatAmount }: ReceiptCardProps) {
  return (
    <Card className={cn(
      'hover:shadow-md transition-shadow cursor-pointer',
      viewMode === 'list' && 'flex items-center space-x-4'
    )}>
      <CardContent className={cn(
        'p-4',
        viewMode === 'list' && 'flex items-center space-x-4 flex-1'
      )}>
        {/* Receipt Image */}
        <div className={cn(
          viewMode === 'grid' ? 'mb-3' : 'flex-shrink-0'
        )}>
          {receipt.imageUrl ? (
            <img
              src={receipt.imageUrl}
              alt={`Receipt from ${receipt.merchant}`}
              className={cn(
                'rounded-lg border',
                viewMode === 'grid' 
                  ? 'w-full h-32 object-cover'
                  : 'w-16 h-16 object-cover'
              )}
            />
          ) : (
            <div className={cn(
              'bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border flex items-center justify-center',
              viewMode === 'grid' 
                ? 'w-full h-32'
                : 'w-16 h-16'
            )}>
              <Receipt className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Receipt Details */}
        <div className={cn(
          viewMode === 'list' && 'flex-1'
        )}>
          <div className={cn(
            viewMode === 'grid' ? 'space-y-2' : 'flex items-center justify-between'
          )}>
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {receipt.merchant}
              </h3>
              <p className="text-sm text-gray-600">
                {receipt.category || 'Uncategorized'}
              </p>
            </div>
            <div className={cn(
              'text-right',
              viewMode === 'list' && 'flex items-center space-x-4'
            )}>
              <p className="text-lg font-bold text-gray-900">
                {formatAmount(receipt.total)}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(receipt.purchaseDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 