// ============================================================================
// BULK OPERATIONS HOOK
// ============================================================================
// React hook for managing bulk receipt operations
// See: Master System Guide - State Management, Frontend Architecture

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { 
  BulkFilter, 
  BulkUpdate, 
  BulkFilterResult, 
  BulkOperationResult
} from '@/lib/services/bulkOperations'

// Define FilterOptions type inline since it's not exported from the service
type FilterOptions = {
  categories: string[]
  merchants: string[]
  dateRange: { min: Date; max: Date }
  amountRange: { min: number; max: number }
}

// ============================================================================
// TYPES
// ============================================================================

export interface UseBulkOperationsReturn {
  // State
  receipts: BulkFilterResult['receipts']
  selectedReceipts: string[]
  appliedFilters: BulkFilter
  filterOptions: FilterOptions | null
  isLoading: boolean
  isProcessing: boolean
  error: string | null
  
  // Filter actions
  applyFilters: (filters: BulkFilter) => Promise<void>
  clearFilters: () => Promise<void>
  getFilterOptions: () => Promise<void>
  
  // Selection actions
  selectReceipt: (receiptId: string, selected: boolean) => void
  selectAll: () => void
  selectNone: () => void
  selectFiltered: () => void
  
  // Bulk actions
  bulkUpdate: (updates: BulkUpdate) => Promise<BulkOperationResult>
  bulkDelete: () => Promise<BulkOperationResult>
  bulkExport: (format: string) => Promise<BulkOperationResult>
  
  // Utility
  getSelectedReceipts: () => BulkFilterResult['receipts']
  getSelectionStats: () => {
    count: number
    totalAmount: number
    averageAmount: number
    categories: string[]
    merchants: string[]
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const filterCache = new Map<string, { data: BulkFilterResult; timestamp: number }>()
const optionsCache = new Map<string, { data: FilterOptions; timestamp: number }>()

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

function getCachedFilter(cacheKey: string): BulkFilterResult | null {
  const cached = filterCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedFilter(cacheKey: string, data: BulkFilterResult): void {
  filterCache.set(cacheKey, { data, timestamp: Date.now() })
}

function getCachedOptions(userId: string): FilterOptions | null {
  const cached = optionsCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedOptions(userId: string, data: FilterOptions): void {
  optionsCache.set(userId, { data, timestamp: Date.now() })
}

function clearCache(userId: string): void {
  // Clear all cache entries for this user
  for (const [key] of filterCache) {
    if (key.startsWith(userId)) {
      filterCache.delete(key)
    }
  }
  optionsCache.delete(userId)
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchFilteredReceipts(filters: BulkFilter): Promise<BulkFilterResult> {
  const params = new URLSearchParams()
  
  // Add filter parameters
  if (filters.dateRange?.start) {
    params.append('startDate', filters.dateRange.start.toISOString())
  }
  if (filters.dateRange?.end) {
    params.append('endDate', filters.dateRange.end.toISOString())
  }
  if (filters.amountRange?.min !== undefined) {
    params.append('minAmount', filters.amountRange.min.toString())
  }
  if (filters.amountRange?.max !== undefined) {
    params.append('maxAmount', filters.amountRange.max.toString())
  }
  if (filters.categories && filters.categories.length > 0) {
    params.append('categories', filters.categories.join(','))
  }
  if (filters.merchants && filters.merchants.length > 0) {
    params.append('merchants', filters.merchants.join(','))
  }
  if (filters.confidenceScore?.min !== undefined) {
    params.append('minConfidence', filters.confidenceScore.min.toString())
  }
  if (filters.confidenceScore?.max !== undefined) {
    params.append('maxConfidence', filters.confidenceScore.max.toString())
  }
  if (filters.hasSummary !== undefined) {
    params.append('hasSummary', filters.hasSummary.toString())
  }
  if (filters.searchQuery) {
    params.append('searchQuery', filters.searchQuery)
  }

  const response = await fetch(`/api/receipts/bulk?action=filter&${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch filtered receipts: ${response.statusText}`)
  }
  return response.json()
}

async function fetchFilterOptions(): Promise<FilterOptions> {
  const response = await fetch('/api/receipts/bulk?action=options')
  if (!response.ok) {
    throw new Error(`Failed to fetch filter options: ${response.statusText}`)
  }
  return response.json()
}

async function performBulkUpdate(receiptIds: string[], updates: BulkUpdate): Promise<BulkOperationResult> {
  const response = await fetch('/api/receipts/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update',
      receiptIds,
      updates
    })
  })
  if (!response.ok) {
    throw new Error(`Failed to perform bulk update: ${response.statusText}`)
  }
  return response.json()
}

async function performBulkDelete(receiptIds: string[]): Promise<BulkOperationResult> {
  const response = await fetch('/api/receipts/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete',
      receiptIds
    })
  })
  if (!response.ok) {
    throw new Error(`Failed to perform bulk delete: ${response.statusText}`)
  }
  return response.json()
}

async function performBulkExport(receiptIds: string[], format: string): Promise<BulkOperationResult> {
  const response = await fetch('/api/receipts/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'export',
      receiptIds,
      format
    })
  })
  if (!response.ok) {
    throw new Error(`Failed to perform bulk export: ${response.statusText}`)
  }
  return response.json()
}

// ============================================================================
// BULK OPERATIONS HOOK
// ============================================================================

export function useBulkOperations(userId?: string): UseBulkOperationsReturn {
  const [receipts, setReceipts] = useState<BulkFilterResult['receipts']>([])
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<BulkFilter>({})
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // FILTER OPERATIONS
  // ============================================================================

  const applyFilters = useCallback(async (filters: BulkFilter) => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      // Create cache key
      const cacheKey = `${userId}_${JSON.stringify(filters)}`
      const cachedResult = getCachedFilter(cacheKey)

      if (cachedResult) {
        setReceipts(cachedResult.receipts)
        setAppliedFilters(filters)
        return
      }

      const result = await fetchFilteredReceipts(filters)
      
      setCachedFilter(cacheKey, result)
      setReceipts(result.receipts)
      setAppliedFilters(filters)
      setSelectedReceipts([]) // Clear selection when filters change

    } catch (err) {
      console.error('Error applying filters:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply filters')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const clearFilters = useCallback(async () => {
    await applyFilters({})
  }, [applyFilters])

  const getFilterOptions = useCallback(async () => {
    if (!userId) return

    try {
      setError(null)

      const cachedOptions = getCachedOptions(userId)
      if (cachedOptions) {
        setFilterOptions(cachedOptions)
        return
      }

      const options = await fetchFilterOptions()
      setCachedOptions(userId, options)
      setFilterOptions(options)

    } catch (err) {
      console.error('Error fetching filter options:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch filter options')
    }
  }, [userId])

  // ============================================================================
  // SELECTION OPERATIONS
  // ============================================================================

  const selectReceipt = useCallback((receiptId: string, selected: boolean) => {
    setSelectedReceipts(prev => {
      if (selected) {
        return prev.includes(receiptId) ? prev : [...prev, receiptId]
      } else {
        return prev.filter(id => id !== receiptId)
      }
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedReceipts(receipts.map(receipt => receipt.id))
  }, [receipts])

  const selectNone = useCallback(() => {
    setSelectedReceipts([])
  }, [])

  const selectFiltered = useCallback(() => {
    // Select all currently filtered receipts
    setSelectedReceipts(receipts.map(receipt => receipt.id))
  }, [receipts])

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const bulkUpdate = useCallback(async (updates: BulkUpdate): Promise<BulkOperationResult> => {
    if (!userId || selectedReceipts.length === 0) {
      throw new Error('No receipts selected for update')
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await performBulkUpdate(selectedReceipts, updates)
      
      if (result.success) {
        // Refresh the current filter to show updated data
        await applyFilters(appliedFilters)
        setSelectedReceipts([]) // Clear selection after successful update
      }

      return result

    } catch (err) {
      console.error('Bulk update error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk update'
      setError(errorMessage)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [userId, selectedReceipts, appliedFilters, applyFilters])

  const bulkDelete = useCallback(async (): Promise<BulkOperationResult> => {
    if (!userId || selectedReceipts.length === 0) {
      throw new Error('No receipts selected for deletion')
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await performBulkDelete(selectedReceipts)
      
      if (result.success) {
        // Refresh the current filter to show updated data
        await applyFilters(appliedFilters)
        setSelectedReceipts([]) // Clear selection after successful delete
      }

      return result

    } catch (err) {
      console.error('Bulk delete error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk delete'
      setError(errorMessage)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [userId, selectedReceipts, appliedFilters, applyFilters])

  const bulkExport = useCallback(async (format: string): Promise<BulkOperationResult> => {
    if (!userId || selectedReceipts.length === 0) {
      throw new Error('No receipts selected for export')
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await performBulkExport(selectedReceipts, format)
      return result

    } catch (err) {
      console.error('Bulk export error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk export'
      setError(errorMessage)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [userId, selectedReceipts])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getSelectedReceipts = useCallback(() => {
    return receipts.filter(receipt => selectedReceipts.includes(receipt.id))
  }, [receipts, selectedReceipts])

  const getSelectionStats = useCallback(() => {
    const selectedReceiptsData = getSelectedReceipts()
    
    const totalAmount = selectedReceiptsData.reduce((sum, receipt) => sum + receipt.total, 0)
    const averageAmount = selectedReceiptsData.length > 0 ? totalAmount / selectedReceiptsData.length : 0
    
    const categories = [...new Set(selectedReceiptsData.map(r => r.category).filter(Boolean))] as string[]
    const merchants = [...new Set(selectedReceiptsData.map(r => r.merchant).filter(Boolean))] as string[]

    return {
      count: selectedReceiptsData.length,
      totalAmount,
      averageAmount,
      categories,
      merchants
    }
  }, [getSelectedReceipts])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (userId) {
      getFilterOptions()
    }
  }, [userId, getFilterOptions])

  useEffect(() => {
    if (userId) {
      // Apply default filters on mount
      applyFilters({})
    }
  }, [userId, applyFilters])

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return useMemo(() => ({
    receipts,
    selectedReceipts,
    appliedFilters,
    filterOptions,
    isLoading,
    isProcessing,
    error,
    applyFilters,
    clearFilters,
    getFilterOptions,
    selectReceipt,
    selectAll,
    selectNone,
    selectFiltered,
    bulkUpdate,
    bulkDelete,
    bulkExport,
    getSelectedReceipts,
    getSelectionStats
  }), [
    receipts,
    selectedReceipts,
    appliedFilters,
    filterOptions,
    isLoading,
    isProcessing,
    error,
    applyFilters,
    clearFilters,
    getFilterOptions,
    selectReceipt,
    selectAll,
    selectNone,
    selectFiltered,
    bulkUpdate,
    bulkDelete,
    bulkExport,
    getSelectedReceipts,
    getSelectionStats
  ])
} 