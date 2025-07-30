// ============================================================================
// ENHANCED RECENT RECEIPTS COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium recent receipts display with skeleton loading states and smooth transitions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'
import { ReceiptsEmptyState } from '@/components/ui/EmptyState'
import { Receipt, Calendar, DollarSign, Tag, Eye, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface RecentReceiptsProps {
  className?: string
  receipts?: Array<{
    id: string
    merchant: string
    amount: number
    date: string
    category: string
    imageUrl?: string
  }>
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
              ${(amount || 0).toFixed(2)}
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
// MAIN RECENT RECEIPTS COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function RecentReceipts({ className = '', receipts: propReceipts }: RecentReceiptsProps) {
  const [isLoading, setIsLoading] = useState(!propReceipts)
  const [receipts, setReceipts] = useState<ReceiptItemProps[]>([])

  // Use props data if available, otherwise use local state
  useEffect(() => {
    if (propReceipts) {
      setReceipts(propReceipts)
      setIsLoading(false)
    } else {
      // Fallback to local data if no props provided
      setReceipts([
        {
          id: '1',
          merchant: 'Starbucks Coffee',
          amount: 12.45,
          date: '2024-01-15',
          category: 'Food & Dining',
          imageUrl: undefined
        },
        {
          id: '2',
          merchant: 'Amazon.com',
          amount: 89.99,
          date: '2024-01-14',
          category: 'Shopping',
          imageUrl: undefined
        },
        {
          id: '3',
          merchant: 'Shell Gas Station',
          amount: 45.67,
          date: '2024-01-13',
          category: 'Transportation',
          imageUrl: undefined
        },
        {
          id: '4',
          merchant: 'Walmart',
          amount: 156.78,
          date: '2024-01-12',
          category: 'Shopping',
          imageUrl: undefined
        },
        {
          id: '5',
          merchant: 'Netflix',
          amount: 15.99,
          date: '2024-01-11',
          category: 'Entertainment',
          imageUrl: undefined
        }
      ])
      setIsLoading(false)
    }
  }, [propReceipts])

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Recent Receipts
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {isLoading ? 'Loading your recent transactions...' : 'Your latest expense entries'}
            </p>
          </div>
          {!isLoading && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Live updates
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <SkeletonList count={5} variant="receipt" />
        ) : (
          <>
            {receipts.map((receipt) => (
              <ReceiptItem
                key={receipt.id}
                {...receipt}
                loading={false}
              />
            ))}
            
            {receipts.length === 0 && (
              <ReceiptsEmptyState 
                showTips={false}
                className="py-4"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 