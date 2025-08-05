'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { ReceiptFilters, ReceiptFilters as ReceiptFiltersType } from '@/components/receipts/ReceiptFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SharedNavigation } from '@/components/ui/SharedNavigation'
import { Button } from '@/components/ui/button'

export default function ReceiptsPage() {
  const { user, loading: authLoading } = useAuth()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ReceiptFiltersType>({})
  const [showFilters, setShowFilters] = useState(false)
  const [reCategorizing, setReCategorizing] = useState(false)
  const [categorizationStats, setCategorizationStats] = useState<any>(null)

  const fetchReceipts = useCallback(async () => {
    if (!user) {
      console.warn('🔍 Receipts: No user found, skipping fetch')
      return
    }

    console.log('🔍 Receipts: Starting fetch for user:', user.id)

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
      
      const url = `/api/receipts?${params.toString()}`
      console.log('🔍 Receipts: Fetching from URL:', url)
      
      const response = await fetch(url)
      
      console.log('🔍 Receipts: Response status:', response.status)
      console.log('🔍 Receipts: Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Receipts: Received data:', {
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          sample: Array.isArray(data) ? data.slice(0, 2) : data
        })
        setReceipts(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('🔍 Receipts: API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('🔍 Receipts: Fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to load receipts: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [user, searchQuery, filters])

  useEffect(() => {
    if (!authLoading) {
      fetchReceipts()
    }
  }, [fetchReceipts, authLoading])

  const handleFiltersChange = (newFilters: ReceiptFiltersType) => {
    setFilters(newFilters)
  }

  const handleShowFilters = () => {
    setShowFilters(!showFilters)
  }

  const fetchCategorizationStats = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/receipts/re-categorize')
      if (response.ok) {
        const data = await response.json()
        setCategorizationStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch categorization stats:', error)
    }
  }, [user])

  const handleReCategorize = async () => {
    if (!user) return

    try {
      setReCategorizing(true)
      
      const response = await fetch('/api/receipts/re-categorize', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Re-categorization result:', result)
        
        // Refresh receipts and stats
        await fetchReceipts()
        await fetchCategorizationStats()
        
        // Show success message
        alert(`Successfully processed ${result.processed} receipts!\n${result.categorized} were re-categorized.`)
      } else {
        throw new Error('Failed to re-categorize receipts')
      }
    } catch (error) {
      console.error('Failed to re-categorize receipts:', error)
      alert('Failed to re-categorize receipts. Please try again.')
    } finally {
      setReCategorizing(false)
    }
  }

  useEffect(() => {
    fetchCategorizationStats()
  }, [fetchCategorizationStats])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Receipts</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2 mb-6">
              <button 
                onClick={fetchReceipts}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.open('/api/debug/receipts', '_blank')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Debug Info
              </button>
            </div>
            {!user && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  You may need to <a href="/login" className="text-blue-600 hover:underline">sign in</a> to view your receipts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Receipts</h1>
              <p className="text-gray-600">Manage and view your receipt history</p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  Debug: User {user?.id || 'not authenticated'} | {receipts.length} receipts loaded
                  <button 
                    onClick={() => window.open('/api/debug/receipts', '_blank')}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    [Debug Info]
                  </button>
                </div>
              )}
            </div>
            
            {/* Re-categorization Button */}
            {categorizationStats && categorizationStats.uncategorizedCount > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2">
                  {categorizationStats.uncategorizedCount} uncategorized receipts
                </div>
                <Button
                  onClick={handleReCategorize}
                  disabled={reCategorizing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {reCategorizing ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Re-categorizing...
                    </>
                  ) : (
                    '🏷️ Re-categorize All'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <ReceiptFilters
            onFiltersChange={handleFiltersChange}
          />
        </div>

        <ReceiptList 
          receipts={receipts.map(receipt => ({
            id: receipt.id,
            merchant: receipt.merchant,
            amount: Number(receipt.total),
            date: receipt.purchaseDate.split('T')[0],
            category: receipt.category || 'Uncategorized',
            imageUrl: receipt.imageUrl
          }))}
          loading={loading}
          error={error}
          onRefresh={fetchReceipts}
        />
      </div>
    </div>
  )
} 