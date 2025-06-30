'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface ReceiptStats {
  totalReceipts: number
  totalSpent: number
  averageSpent: number
}

export function ReceiptStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReceiptStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/receipts/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch receipt stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Receipt Statistics
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Receipt Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats?.totalReceipts || 0}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total Receipts
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${stats?.totalSpent.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total Spent
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            ${stats?.averageSpent.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Average per Receipt
          </div>
        </div>
      </div>
    </div>
  )
} 