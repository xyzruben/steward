'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { BulkOperationsToolbar } from '@/components/receipts/BulkOperationsToolbar'
import { ReceiptList } from '@/components/receipts/ReceiptList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Receipt } from '@/types/database'

export default function ReceiptsPage() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReceipts = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/receipts?limit=1000') // Get all receipts for bulk operations
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
  }, [user])

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

  const handleBulkDelete = async (receiptIds: string[]) => {
    try {
      const response = await fetch('/api/receipts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          receiptIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete receipts')
      }

      const result = await response.json()
      
      if (result.summary.failed > 0) {
        alert(`Successfully deleted ${result.summary.successful} receipts. ${result.summary.failed} receipts could not be deleted.`)
      } else {
        alert(`Successfully deleted ${result.summary.successful} receipts.`)
      }

      // Refresh the receipts list
      await fetchReceipts()
    } catch (error) {
      console.error('Failed to delete receipts:', error)
      alert('Failed to delete receipts. Please try again.')
      throw error
    }
  }

  const handleBulkCategorize = async (receiptIds: string[], category: string, subcategory?: string) => {
    try {
      const response = await fetch('/api/receipts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'categorize',
          receiptIds,
          category,
          subcategory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to categorize receipts')
      }

      const result = await response.json()
      
      if (result.summary.failed > 0) {
        alert(`Successfully categorized ${result.summary.successful} receipts. ${result.summary.failed} receipts could not be categorized.`)
      } else {
        alert(`Successfully categorized ${result.summary.successful} receipts.`)
      }

      // Refresh the receipts list
      await fetchReceipts()
    } catch (error) {
      console.error('Failed to categorize receipts:', error)
      alert('Failed to categorize receipts. Please try again.')
      throw error
    }
  }

  const handleBulkExport = async (receiptIds: string[]) => {
    try {
      const response = await fetch('/api/receipts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          receiptIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export receipts')
      }

      const result = await response.json()
      
      // Create CSV content
      const csvContent = [
        ['ID', 'Merchant', 'Total', 'Purchase Date', 'Category', 'Subcategory', 'Summary', 'Created At'],
        ...result.results.map((r: any) => [
          r.data.id,
          r.data.merchant,
          r.data.total,
          r.data.purchaseDate,
          r.data.category || '',
          r.data.subcategory || '',
          r.data.summary || '',
          r.data.createdAt
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipts-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert(`Successfully exported ${result.summary.successful} receipts.`)
    } catch (error) {
      console.error('Failed to export receipts:', error)
      alert('Failed to export receipts. Please try again.')
      throw error
    }
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
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Receipts
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage and organize your receipts
              </p>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk operations toolbar */}
      <BulkOperationsToolbar
        receipts={receipts}
        selectedReceipts={selectedReceipts}
        onSelectionChange={setSelectedReceipts}
        onBulkDelete={handleBulkDelete}
        onBulkCategorize={handleBulkCategorize}
        onBulkExport={handleBulkExport}
        onRefresh={fetchReceipts}
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