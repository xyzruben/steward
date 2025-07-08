'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BulkOperationsToolbar } from '@/components/receipts/BulkOperationsToolbar'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { EnhancedSearch } from '@/components/search/EnhancedSearch'
import { SearchResults } from '@/components/search/SearchResults'
import { ReceiptFilters, ReceiptFilters as ReceiptFiltersType } from '@/components/receipts/ReceiptFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SharedNavigation } from '@/components/ui/SharedNavigation'
import ExportButton from '@/components/export/ExportButton'
import { useBulkOperations } from '@/hooks/useBulkOperations'
import type { SearchFilters, SearchOptions } from '@/lib/services/search'

export default function ReceiptsPage() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<any[]>([])
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ReceiptFiltersType>({})
  const [searchAnalytics, setSearchAnalytics] = useState<any>(null)
  const [searchMetadata, setSearchMetadata] = useState<any>(null)
  const [currentSearchFilters, setCurrentSearchFilters] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Initialize bulk operations hook
  const {
    bulkUpdate,
    bulkDelete,
    bulkExport,
    isProcessing,
    error: bulkError
  } = useBulkOperations()

  const fetchReceipts = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('limit', '1000') // Get all receipts for search/filter
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      
      if (filters.category) {
        params.append('category', filters.category)
      }
      
      if (filters.subcategory) {
        params.append('subcategory', filters.subcategory)
      }
      
      if (filters.minAmount !== undefined) {
        params.append('minAmount', filters.minAmount.toString())
      }
      
      if (filters.maxAmount !== undefined) {
        params.append('maxAmount', filters.maxAmount.toString())
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }
      
      if (filters.minConfidence !== undefined) {
        params.append('minConfidence', filters.minConfidence.toString())
      }
      
      const response = await fetch(`/api/receipts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReceipts(data)
        
        // Clear search analytics when using regular fetch
        setSearchAnalytics(null)
        setSearchMetadata(null)
        setCurrentSearchFilters(null)
      } else {
        throw new Error('Failed to fetch receipts')
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
      setError('Failed to load receipts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user, searchQuery, filters])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  // Listen for custom events when receipts are uploaded
  useEffect(() => {
    const handleReceiptUploaded = () => {
      fetchReceipts()
    }

    window.addEventListener('receipt-uploaded', handleReceiptUploaded)
    return () => {
      window.removeEventListener('receipt-uploaded', handleReceiptUploaded)
    }
  }, [fetchReceipts])

  // Handle bulk operations
  const handleBulkUpdate = async (receiptIds: string[], updates: any) => {
    try {
      await bulkUpdate(receiptIds, updates)
      await fetchReceipts() // Refresh the list
      setSelectedReceipts([]) // Clear selection
    } catch (error) {
      console.error('Bulk update failed:', error)
      throw error
    }
  }

  const handleBulkDelete = async (receiptIds: string[]) => {
    try {
      await bulkDelete(receiptIds)
      await fetchReceipts() // Refresh the list
      setSelectedReceipts([]) // Clear selection
    } catch (error) {
      console.error('Bulk delete failed:', error)
      throw error
    }
  }

  const handleBulkExport = async (receiptIds: string[], format: string) => {
    try {
      await bulkExport(receiptIds, format)
    } catch (error) {
      console.error('Bulk export failed:', error)
      throw error
    }
  }

  const handleSearch = async (query: string, filters?: SearchFilters, options?: SearchOptions) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      setSearchQuery(query)
      
      // Build enhanced search parameters
      const params = new URLSearchParams()
      params.append('query', query)
      
      if (filters) {
        if (filters.category) params.append('category', filters.category)
        if (filters.subcategory) params.append('subcategory', filters.subcategory)
        if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString())
        if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString())
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
        if (filters.minConfidence !== undefined) params.append('minConfidence', filters.minConfidence.toString())
        if (filters.merchant) params.append('merchant', filters.merchant)
        if (filters.tags) params.append('tags', filters.tags.join(','))
      }
      
      if (options) {
        if (options.limit) params.append('limit', options.limit.toString())
        if (options.offset) params.append('offset', options.offset.toString())
        if (options.sortBy) params.append('sortBy', options.sortBy)
        if (options.sortOrder) params.append('sortOrder', options.sortOrder)
        if (options.includeSuggestions) params.append('includeSuggestions', 'true')
        if (options.fuzzyMatch) params.append('fuzzyMatch', 'true')
      }
      
      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setReceipts(data.receipts || [])
        
        // Store search analytics and metadata for display
        setSearchAnalytics(data.searchAnalytics || null)
        setSearchMetadata(data.metadata || null)
        setCurrentSearchFilters(filters || null)
      } else {
        throw new Error('Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSearch = async (name: string, query: string, filters: SearchFilters) => {
    if (!user) return

    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          query,
          filters
        })
      })

      if (response.ok) {
        console.log('Search saved successfully')
        // You could show a toast notification here
      } else {
        throw new Error('Failed to save search')
      }
    } catch (error) {
      console.error('Failed to save search:', error)
      // You could show an error toast here
    }
  }

  const handleFiltersChange = (newFilters: ReceiptFiltersType) => {
    setFilters(newFilters)
  }

  const handleShowFilters = () => {
    setShowFilters(!showFilters)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Please log in to view your receipts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SharedNavigation />
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EnhancedSearch 
                onSearch={handleSearch}
                onSaveSearch={handleSaveSearch}
                placeholder="Search receipts by merchant, category, or description..."
                showAdvancedFilters={true}
                showSuggestions={true}
                showSavedSearches={true}
              />
            </div>
            <div className="space-y-4">
              <ReceiptFilters onFiltersChange={handleFiltersChange} />
              <div className="flex justify-end">
                <ExportButton
                  variant="outline"
                  size="md"
                  className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Export All
                </ExportButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {(searchAnalytics || searchMetadata) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchResults
            totalResults={receipts.length}
            searchAnalytics={searchAnalytics}
            metadata={searchMetadata}
            query={searchQuery}
            filters={currentSearchFilters}
          />
        </div>
      )}

      {/* Bulk operations toolbar */}
      <BulkOperationsToolbar
        receipts={receipts}
        selectedReceipts={selectedReceipts}
        onSelectionChange={setSelectedReceipts}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        onShowFilters={handleShowFilters}
        isLoading={loading || isProcessing}
      />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchReceipts}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <ReceiptList
            receipts={receipts}
            selectedReceipts={selectedReceipts}
            onSelectionChange={setSelectedReceipts}
          />
        )}
      </div>
    </div>
  )
} 