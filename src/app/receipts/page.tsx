'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BulkOperationsToolbar } from '@/components/receipts/BulkOperationsToolbar'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { SemanticSearch } from '@/components/search/SemanticSearch'
import { SearchResults } from '@/components/search/SearchResults'
import { ReceiptFilters, ReceiptFilters as ReceiptFiltersType } from '@/components/receipts/ReceiptFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SharedNavigation } from '@/components/ui/SharedNavigation'
import ExportButton from '@/components/export/ExportButton'
import { useBulkOperations } from '@/hooks/useBulkOperations'

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

  const handleReceiptUploaded = () => {
    // Refresh receipts after upload
    fetchReceipts()
  }

  const handleBulkUpdate = async (updates: any) => {
    try {
      await bulkUpdate(updates)
      setSelectedReceipts([])
      fetchReceipts() // Refresh the list
    } catch (error) {
      console.error('Bulk update failed:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkDelete()
      setSelectedReceipts([])
      fetchReceipts() // Refresh the list
    } catch (error) {
      console.error('Bulk delete failed:', error)
    }
  }

  const handleBulkExport = async (format: string) => {
    try {
      await bulkExport(format)
    } catch (error) {
      console.error('Bulk export failed:', error)
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
      
      {/* AI-Powered Search */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <SemanticSearch 
              onResults={(results) => {
                // Convert semantic search results to receipt format for display
                const convertedReceipts = results.map(result => ({
                  id: result.receiptId,
                  merchant: result.metadata.merchant,
                  total: result.metadata.amount,
                  purchaseDate: result.metadata.date,
                  category: result.metadata.category,
                  subcategory: result.metadata.subcategory,
                  summary: result.metadata.summary,
                  similarity: result.similarity
                }))
                setReceipts(convertedReceipts)
                setSearchQuery(`AI Search: ${results.length} results`)
              }}
              onInsights={(insights) => {
                // Handle insights display
                console.log('Spending insights:', insights)
              }}
              placeholder="Ask about your spending in natural language..."
              showSuggestions={true}
            />
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
      {selectedReceipts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
                <button
                  onClick={handleShowFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {showFilters ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showFilters && (
                <ReceiptFilters onFiltersChange={handleFiltersChange} />
              )}
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <ExportButton
                  variant="outline"
                  size="md"
                  className="w-full text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Export All
                </ExportButton>
              </div>
            </div>
          </div>

          {/* Receipts List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            ) : (
              <ReceiptList />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 