// ============================================================================
// SIMPLIFIED DATA EXPORT SERVICE - AI-First Architecture
// ============================================================================
// Basic CSV export only - optimized for performance
// Removed: PDF, JSON export options, complex metadata, progress tracking

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type ExportFormat = 'csv'

export interface ExportOptions {
  format: ExportFormat
  dateRange?: {
    start: Date
    end: Date
  }
  categories?: string[]
  merchants?: string[]
}

export interface ExportResult {
  data: string
  filename: string
  contentType: string
  size: number
}

export interface ReceiptExportData {
  id: string
  merchant: string
  total: number
  purchaseDate: string
  category: string | null
  createdAt: string
}

// ============================================================================
// SIMPLIFIED EXPORT SERVICE CLASS
// ============================================================================

export class ExportService {
  // ============================================================================
  // MAIN EXPORT METHOD - CSV ONLY
  // ============================================================================

  async exportData(userId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      // Build query filters
      const whereClause = this.buildWhereClause(userId, options)

      // Fetch receipts data
      const receipts = await this.fetchReceipts(whereClause)

      // Generate CSV export
      const csvData = this.generateCSV(receipts)
      const filename = `receipts_${new Date().toISOString().split('T')[0]}.csv`

      return {
        data: csvData,
        filename,
        contentType: 'text/csv',
        size: Buffer.byteLength(csvData, 'utf8')
      }
    } catch (error) {
      console.error('Export service error:', error)
      throw new Error('Export failed')
    }
  }

  // ============================================================================
  // CSV GENERATION - SIMPLIFIED
  // ============================================================================

  private generateCSV(receipts: ReceiptExportData[]): string {
    const headers = ['ID', 'Merchant', 'Total', 'Purchase Date', 'Category', 'Created At']
    const rows = receipts.map(receipt => [
      receipt.id,
      receipt.merchant,
      receipt.total,
      receipt.purchaseDate,
      receipt.category || '',
      receipt.createdAt
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // ============================================================================
  // DATA FETCHING - SIMPLIFIED
  // ============================================================================

  private async fetchReceipts(whereClause: any): Promise<ReceiptExportData[]> {
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      select: {
        id: true,
        merchant: true,
        total: true,
        purchaseDate: true,
        category: true,
        createdAt: true
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    })

    return receipts.map(receipt => ({
      id: receipt.id,
      merchant: receipt.merchant,
      total: Number(receipt.total),
      purchaseDate: receipt.purchaseDate.toISOString().split('T')[0],
      category: receipt.category,
      createdAt: receipt.createdAt.toISOString().split('T')[0]
    }))
  }

  // ============================================================================
  // QUERY BUILDING - SIMPLIFIED
  // ============================================================================

  private buildWhereClause(userId: string, options: ExportOptions) {
    const where: any = {
      userId
    }

    if (options.dateRange) {
      where.purchaseDate = {
        gte: options.dateRange.start,
        lte: options.dateRange.end
      }
    }

    if (options.categories && options.categories.length > 0) {
      where.category = {
        in: options.categories
      }
    }

    if (options.merchants && options.merchants.length > 0) {
      where.merchant = {
        in: options.merchants
      }
    }

    return where
  }
} 