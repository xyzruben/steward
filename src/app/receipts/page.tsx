'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { ReceiptFilters, ReceiptFilters as ReceiptFiltersType } from '@/components/receipts/ReceiptFilters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SharedNavigation } from '@/components/ui/SharedNavigation'

export default function ReceiptsPage() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ReceiptFiltersType>({})
  const [showFilters, setShowFilters] = useState(false)

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Receipts</h1>
          <p className="text-gray-600">Manage and view your receipt history</p>
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