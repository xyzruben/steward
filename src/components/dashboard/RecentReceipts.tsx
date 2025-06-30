'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Receipt {
  id: string
  merchant: string
  total: number
  purchaseDate: string
  imageUrl: string
  summary?: string
}

export function RecentReceipts() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReceipts = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/receipts?limit=5')
      if (response.ok) {
        const data = await response.json()
        setReceipts(data)
      }
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [user])

  // Listen for custom events when receipts are uploaded
  useEffect(() => {
    const handleReceiptUploaded = () => {
      fetchReceipts()
    }

    window.addEventListener('receipt-uploaded', handleReceiptUploaded)
    return () => {
      window.removeEventListener('receipt-uploaded', handleReceiptUploaded)
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Receipts
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Recent Receipts
      </h2>
      
      {receipts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            No receipts yet. Upload your first receipt to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {receipt.merchant}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(receipt.purchaseDate).toLocaleDateString()}
                </p>
                {receipt.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {receipt.summary}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  ${receipt.total.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {receipts.length > 0 && (
        <div className="mt-6 text-center">
          <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            View All Receipts
          </button>
        </div>
      )}
    </div>
  )
} 