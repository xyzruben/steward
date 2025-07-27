// ============================================================================
// ENHANCED RECEIPT LIST COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium receipt list with skeleton loading states and smooth transitions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton, SkeletonList, SkeletonTable, SkeletonGrid } from '@/components/ui/Skeleton'
import { Receipt, Calendar, DollarSign, Tag, Eye, Download, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface ReceiptListProps {
  className?: string
}

interface ReceiptItemProps {
  id: string
  merchant: string
  amount: number
  date: string
  category: string
  imageUrl?: string
  loading?: boolean
}

// ============================================================================
// RECEIPT ITEM COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function ReceiptItem({ 
  id, 
  merchant, 
  amount, 
  date, 
  category, 
  imageUrl,
  loading = false 
}: ReceiptItemProps) {
  if (loading) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all duration-300">
        <Skeleton variant="rectangular" width={60} height={60} className="rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
          <div className="flex items-center space-x-4">
            <Skeleton width={80} height={20} />
            <Skeleton width={60} height={20} />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" size="sm" width={32} height={32} />
          <Skeleton variant="circular" size="sm" width={32} height={32} />
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center space-x-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300">
      {/* Receipt Image */}
      <div className="relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`Receipt from ${merchant}`}
            className="w-15 h-15 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
          />
        ) : (
          <div className="w-15 h-15 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
        )}
      </div>

      {/* Receipt Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {merchant}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {category}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              ${amount.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
            <Tag className="w-3 h-3" />
            <span>{category}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN RECEIPT LIST COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function ReceiptList({ className = '' }: ReceiptListProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [receipts, setReceipts] = useState<ReceiptItemProps[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')

  // Fetch real receipt data
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/receipts?limit=50')
        if (response.ok) {
          const data = await response.json()
          const formattedReceipts = data.map((receipt: any) => ({
            id: receipt.id,
            merchant: receipt.merchant,
            amount: Number(receipt.total),
            date: receipt.purchaseDate.split('T')[0],
            category: receipt.category || 'Uncategorized',
            imageUrl: receipt.imageUrl
          }))
          setReceipts(formattedReceipts)
        } else {
          console.error('Failed to fetch receipts:', response.statusText)
          setReceipts([])
        }
      } catch (error) {
        console.error('Error fetching receipts:', error)
        setReceipts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReceipts()
  }, [])

  const renderContent = () => {
    if (isLoading) {
      switch (viewMode) {
        case 'table':
          return <SkeletonTable rows={8} columns={4} />
        case 'list':
          return <SkeletonList count={8} variant="receipt" />
        default:
          return <SkeletonGrid count={8} columns={3} variant="card" />
      }
    }

    if (receipts.length === 0) {
      return (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No receipts found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Upload your first receipt to get started
          </p>
        </div>
      )
    }

    switch (viewMode) {
      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-white">Receipt</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-white">Merchant</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-white">Category</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-white">Date</th>
                  <th className="text-right p-4 font-medium text-slate-900 dark:text-white">Amount</th>
                  <th className="text-center p-4 font-medium text-slate-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{receipt.merchant}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{receipt.category}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{receipt.date}</td>
                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">${receipt.amount.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'list':
        return (
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <ReceiptItem
                key={receipt.id}
                {...receipt}
                loading={false}
              />
            ))}
          </div>
        )

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receipts.map((receipt) => (
              <ReceiptItem
                key={receipt.id}
                {...receipt}
                loading={false}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            All Receipts
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {isLoading ? 'Loading your receipts...' : `${receipts.length} receipts found`}
          </p>
        </div>

        {!isLoading && (
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {(['grid', 'list', 'table'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Search and Filter */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
} 