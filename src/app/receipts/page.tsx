'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { ReceiptFilters, ReceiptFilters as ReceiptFiltersType } from '@/components/receipts/ReceiptFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SharedNavigation } from '@/components/ui/SharedNavigation'
import { Button } from '@/components/ui/button'

export default function ReceiptsPage() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ReceiptFiltersType>({})
  const [showFilters, setShowFilters] = useState(false)
  const [reCategorizing, setReCategorizing] = useState(false)
  const [categorizationStats, setCategorizationStats] = useState<any>(null)

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

  if (loading) {
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
            <button 
              onClick={fetchReceipts}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
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

        <ReceiptList />
      </div>
    </div>
  )
} 