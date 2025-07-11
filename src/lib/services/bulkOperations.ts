// ============================================================================
// BULK OPERATIONS SERVICE
// ============================================================================
// Service for bulk receipt operations and advanced filtering
// See: Master System Guide - Backend/API Design, Database Schema Design

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BulkFilterSchema = z.object({
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).optional(),
  amountRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional(),
  categories: z.array(z.string()).optional(),
  merchants: z.array(z.string()).optional(),
  confidenceScore: z.object({
    min: z.number().min(0).max(1).optional(),
    max: z.number().min(0).max(1).optional()
  }).optional(),
  hasSummary: z.boolean().optional(),
  searchQuery: z.string().optional()
})

const BulkUpdateSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  merchant: z.string().optional(),
  summary: z.string().optional()
})

const BulkDeleteSchema = z.object({
  receiptIds: z.array(z.string().uuid()).min(1).max(1000)
})

const BulkExportSchema = z.object({
  receiptIds: z.array(z.string().uuid()).min(1).max(1000),
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
  includeAnalytics: z.boolean().default(false)
})

// ============================================================================
// TYPES
// ============================================================================

export type BulkFilter = z.infer<typeof BulkFilterSchema>
export type BulkUpdate = z.infer<typeof BulkUpdateSchema>
export type BulkDelete = z.infer<typeof BulkDeleteSchema>
export type BulkExport = z.infer<typeof BulkExportSchema>

export interface BulkOperationResult {
  success: boolean
  processedCount: number
  successCount: number
  errorCount: number
  errors: Array<{
    receiptId: string
    error: string
  }>
  operationId: string
  duration: number
}

export interface BulkFilterResult {
  receipts: Array<{
    id: string
    merchant: string
    total: number
    purchaseDate: Date
    category?: string
    subcategory?: string
    confidenceScore?: number
    summary?: string
    imageUrl: string
  }>
  totalCount: number
  filteredCount: number
  appliedFilters: BulkFilter
}

// ============================================================================
// BULK OPERATIONS SERVICE
// ============================================================================

export class BulkOperationsService {
  // ============================================================================
  // FILTERING OPERATIONS
  // ============================================================================

  /**
   * Apply advanced filters to receipts
   */
  static async filterReceipts(userId: string, filters: BulkFilter): Promise<BulkFilterResult> {
    const startTime = Date.now()
    
    try {
      // Validate filters
      const validatedFilters = BulkFilterSchema.parse(filters)
      
      // Build where clause
      const whereClause: any = {
        userId,
        ...this.buildWhereClause(validatedFilters)
      }

      // Get total count for comparison
      const totalCount = await prisma.receipt.count({ where: { userId } })
      
      // Get filtered receipts
      const receipts = await prisma.receipt.findMany({
        where: whereClause,
        select: {
          id: true,
          merchant: true,
          total: true,
          purchaseDate: true,
          category: true,
          subcategory: true,
          confidenceScore: true,
          summary: true,
          imageUrl: true
        },
        orderBy: { purchaseDate: 'desc' }
      })

      const filteredCount = receipts.length

      return {
        receipts: receipts.map(receipt => ({
          id: receipt.id,
          merchant: receipt.merchant,
          total: receipt.total.toNumber(),
          purchaseDate: receipt.purchaseDate,
          category: receipt.category || undefined,
          subcategory: receipt.subcategory || undefined,
          confidenceScore: receipt.confidenceScore?.toNumber(),
          summary: receipt.summary || undefined,
          imageUrl: receipt.imageUrl
        })),
        totalCount,
        filteredCount,
        appliedFilters: validatedFilters
      }

    } catch (error) {
      console.error('Error filtering receipts:', error)
      throw new Error('Failed to filter receipts')
    }
  }

  /**
   * Get receipt IDs that match filters (for bulk operations)
   */
  static async getFilteredReceiptIds(userId: string, filters: BulkFilter): Promise<string[]> {
    try {
      const validatedFilters = BulkFilterSchema.parse(filters)
      
      const whereClause: any = {
        userId,
        ...this.buildWhereClause(validatedFilters)
      }

      const receipts = await prisma.receipt.findMany({
        where: whereClause,
        select: { id: true }
      })

      return receipts.map(r => r.id)

    } catch (error) {
      console.error('Error getting filtered receipt IDs:', error)
      throw new Error('Failed to get filtered receipt IDs')
    }
  }

  // ============================================================================
  // BULK UPDATE OPERATIONS
  // ============================================================================

  /**
   * Bulk update receipts
   */
  static async bulkUpdate(
    userId: string, 
    receiptIds: string[], 
    updates: BulkUpdate
  ): Promise<BulkOperationResult> {
    const startTime = Date.now()
    const operationId = `bulk_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Validate inputs
      const validatedUpdates = BulkUpdateSchema.parse(updates)
      
      if (receiptIds.length === 0) {
        throw new Error('No receipt IDs provided')
      }

      if (receiptIds.length > 1000) {
        throw new Error('Cannot update more than 1000 receipts at once')
      }

      // Verify all receipts belong to user
      const userReceipts = await prisma.receipt.findMany({
        where: {
          id: { in: receiptIds },
          userId
        },
        select: { id: true }
      })

      const validReceiptIds = userReceipts.map(r => r.id)
      const invalidReceiptIds = receiptIds.filter(id => !validReceiptIds.includes(id))

      if (invalidReceiptIds.length > 0) {
        throw new Error(`Invalid receipt IDs: ${invalidReceiptIds.join(', ')}`)
      }

      // Perform bulk update
      const result = await prisma.receipt.updateMany({
        where: {
          id: { in: validReceiptIds },
          userId
        },
        data: {
          ...validatedUpdates,
          updatedAt: new Date()
        }
      })

      const duration = Date.now() - startTime

      return {
        success: true,
        processedCount: validReceiptIds.length,
        successCount: result.count,
        errorCount: 0,
        errors: [],
        operationId,
        duration
      }

    } catch (error) {
      console.error('Bulk update error:', error)
      const duration = Date.now() - startTime
      
      return {
        success: false,
        processedCount: receiptIds.length,
        successCount: 0,
        errorCount: receiptIds.length,
        errors: receiptIds.map(id => ({
          receiptId: id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        operationId,
        duration
      }
    }
  }

  // ============================================================================
  // BULK DELETE OPERATIONS
  // ============================================================================

  /**
   * Bulk delete receipts
   */
  static async bulkDelete(
    userId: string, 
    receiptIds: string[]
  ): Promise<BulkOperationResult> {
    const startTime = Date.now()
    const operationId = `bulk_delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Validate inputs
      const validatedDelete = BulkDeleteSchema.parse({ receiptIds })
      
      // Verify all receipts belong to user
      const userReceipts = await prisma.receipt.findMany({
        where: {
          id: { in: receiptIds },
          userId
        },
        select: { id: true, imageUrl: true }
      })

      const validReceiptIds = userReceipts.map(r => r.id)
      const invalidReceiptIds = receiptIds.filter(id => !validReceiptIds.includes(id))

      if (invalidReceiptIds.length > 0) {
        throw new Error(`Invalid receipt IDs: ${invalidReceiptIds.join(', ')}`)
      }

      // TODO: Delete associated files from storage
      // This would require Supabase Storage integration
      // For now, we'll just delete from database

      // Perform bulk delete
      const result = await prisma.receipt.deleteMany({
        where: {
          id: { in: validReceiptIds },
          userId
        }
      })

      const duration = Date.now() - startTime

      return {
        success: true,
        processedCount: validReceiptIds.length,
        successCount: result.count,
        errorCount: 0,
        errors: [],
        operationId,
        duration
      }

    } catch (error) {
      console.error('Bulk delete error:', error)
      const duration = Date.now() - startTime
      
      return {
        success: false,
        processedCount: receiptIds.length,
        successCount: 0,
        errorCount: receiptIds.length,
        errors: receiptIds.map(id => ({
          receiptId: id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })),
        operationId,
        duration
      }
    }
  }

  // ============================================================================
  // BULK EXPORT OPERATIONS
  // ============================================================================

  /**
   * Prepare receipts for bulk export
   */
  static async prepareBulkExport(
    userId: string, 
    receiptIds: string[]
  ): Promise<BulkFilterResult> {
    try {
      // Validate inputs
      const validatedExport = BulkExportSchema.parse({ 
        receiptIds, 
        format: 'csv', 
        includeAnalytics: false 
      })
      
      // Verify all receipts belong to user
      const userReceipts = await prisma.receipt.findMany({
        where: {
          id: { in: receiptIds },
          userId
        },
        select: {
          id: true,
          merchant: true,
          total: true,
          purchaseDate: true,
          category: true,
          subcategory: true,
          confidenceScore: true,
          summary: true,
          imageUrl: true
        },
        orderBy: { purchaseDate: 'desc' }
      })

      const validReceiptIds = userReceipts.map(r => r.id)
      const invalidReceiptIds = receiptIds.filter(id => !validReceiptIds.includes(id))

      if (invalidReceiptIds.length > 0) {
        throw new Error(`Invalid receipt IDs: ${invalidReceiptIds.join(', ')}`)
      }

      return {
        receipts: userReceipts.map(receipt => ({
          id: receipt.id,
          merchant: receipt.merchant,
          total: receipt.total.toNumber(),
          purchaseDate: receipt.purchaseDate,
          category: receipt.category || undefined,
          subcategory: receipt.subcategory || undefined,
          confidenceScore: receipt.confidenceScore?.toNumber(),
          summary: receipt.summary || undefined,
          imageUrl: receipt.imageUrl
        })),
        totalCount: userReceipts.length,
        filteredCount: userReceipts.length,
        appliedFilters: {}
      }

    } catch (error) {
      console.error('Bulk export preparation error:', error)
      throw new Error('Failed to prepare bulk export')
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Build Prisma where clause from filters
   */
  private static buildWhereClause(filters: BulkFilter): any {
    const whereClause: any = {}

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start || filters.dateRange.end) {
        whereClause.purchaseDate = {}
        if (filters.dateRange.start) {
          whereClause.purchaseDate.gte = filters.dateRange.start
        }
        if (filters.dateRange.end) {
          whereClause.purchaseDate.lte = filters.dateRange.end
        }
      }
    }

    // Amount range filter
    if (filters.amountRange) {
      if (filters.amountRange.min !== undefined || filters.amountRange.max !== undefined) {
        whereClause.total = {}
        if (filters.amountRange.min !== undefined) {
          whereClause.total.gte = filters.amountRange.min
        }
        if (filters.amountRange.max !== undefined) {
          whereClause.total.lte = filters.amountRange.max
        }
      }
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      whereClause.category = { in: filters.categories }
    }

    // Merchants filter
    if (filters.merchants && filters.merchants.length > 0) {
      whereClause.merchant = { in: filters.merchants }
    }

    // Confidence score filter
    if (filters.confidenceScore) {
      if (filters.confidenceScore.min !== undefined || filters.confidenceScore.max !== undefined) {
        whereClause.confidenceScore = {}
        if (filters.confidenceScore.min !== undefined) {
          whereClause.confidenceScore.gte = filters.confidenceScore.min
        }
        if (filters.confidenceScore.max !== undefined) {
          whereClause.confidenceScore.lte = filters.confidenceScore.max
        }
      }
    }

    // Has summary filter
    if (filters.hasSummary !== undefined) {
      if (filters.hasSummary) {
        whereClause.summary = { not: null }
      } else {
        whereClause.summary = null
      }
    }

    // Search query filter (text search)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const searchTerm = filters.searchQuery.trim()
      whereClause.OR = [
        { merchant: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { subcategory: { contains: searchTerm, mode: 'insensitive' } },
        { summary: { contains: searchTerm, mode: 'insensitive' } },
        { rawText: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    return whereClause
  }

  /**
   * Get available filter options for user
   */
  static async getFilterOptions(userId: string): Promise<{
    categories: string[]
    merchants: string[]
    dateRange: { min: Date; max: Date }
    amountRange: { min: number; max: number }
  }> {
    try {
      const [categories, merchants, dateRange, amountRange] = await Promise.all([
        // Get unique categories
        prisma.receipt.findMany({
          where: { userId, category: { not: null } },
          select: { category: true },
          distinct: ['category']
        }),
        
        // Get unique merchants
        prisma.receipt.findMany({
          where: { userId },
          select: { merchant: true },
          distinct: ['merchant']
        }),
        
        // Get date range
        prisma.receipt.aggregate({
          where: { userId },
          _min: { purchaseDate: true },
          _max: { purchaseDate: true }
        }),
        
        // Get amount range
        prisma.receipt.aggregate({
          where: { userId },
          _min: { total: true },
          _max: { total: true }
        })
      ])

      return {
        categories: categories.map(c => c.category!).filter(Boolean),
        merchants: merchants.map(m => m.merchant).filter(Boolean),
        dateRange: {
          min: dateRange._min.purchaseDate || new Date(),
          max: dateRange._max.purchaseDate || new Date()
        },
        amountRange: {
          min: Number(amountRange._min.total) || 0,
          max: Number(amountRange._max.total) || 0
        }
      }

    } catch (error) {
      console.error('Error getting filter options:', error)
      throw new Error('Failed to get filter options')
    }
  }

  /**
   * Get receipt statistics for bulk operations
   */
  static async getReceiptStats(userId: string, filters?: BulkFilter): Promise<{
    totalReceipts: number
    totalAmount: number
    averageAmount: number
    categoryBreakdown: Array<{ category: string; count: number; total: number }>
    monthlyBreakdown: Array<{ month: string; count: number; total: number }>
  }> {
    try {
      const whereClause: any = { userId }
      
      if (filters) {
        Object.assign(whereClause, this.buildWhereClause(filters))
      }

      const [totalStats, categoryStats, monthlyStats] = await Promise.all([
        // Total statistics
        prisma.receipt.aggregate({
          where: whereClause,
          _count: { id: true },
          _sum: { total: true },
          _avg: { total: true }
        }),
        
        // Category breakdown
        prisma.receipt.groupBy({
          by: ['category'],
          where: whereClause,
          _count: { id: true },
          _sum: { total: true }
        }),
        
        // Monthly breakdown
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "purchaseDate") as month,
            COUNT(*) as count,
            SUM(total) as total
          FROM receipts 
          WHERE "userId" = ${userId}
          GROUP BY DATE_TRUNC('month', "purchaseDate")
          ORDER BY month DESC
          LIMIT 12
        `
      ])

      return {
        totalReceipts: totalStats._count.id,
        totalAmount: Number(totalStats._sum.total) || 0,
        averageAmount: Number(totalStats._avg.total) || 0,
        categoryBreakdown: categoryStats.map(stat => ({
          category: stat.category || 'Uncategorized',
          count: stat._count.id,
          total: Number(stat._sum.total) || 0
        })),
        monthlyBreakdown: (monthlyStats as any[]).map(stat => ({
          month: stat.month,
          count: Number(stat.count),
          total: Number(stat.total)
        }))
      }

    } catch (error) {
      console.error('Error getting receipt stats:', error)
      throw new Error('Failed to get receipt statistics')
    }
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const bulkOperationsService = BulkOperationsService 