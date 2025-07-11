// ============================================================================
// DATA EXPORT SERVICE
// ============================================================================
// Comprehensive export capabilities for Steward receipt tracking
// See: Master System Guide - Security Requirements, Data Privacy Compliance

import { prisma } from '@/lib/prisma'
import { Decimal } from '../../generated/prisma/runtime/library'
import { format } from 'date-fns'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type ExportFormat = 'csv' | 'json' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  includeAnalytics?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  categories?: string[]
  merchants?: string[]
  minAmount?: number
  maxAmount?: number
  includeMetadata?: boolean
}

export interface ExportResult {
  data: string | Buffer
  filename: string
  contentType: string
  size: number
  metadata: {
    recordCount: number
    dateRange: { start: Date | null; end: Date | null }
    totalAmount: number
    exportTime: Date
  }
}

export interface ReceiptExportData {
  id: string
  merchant: string
  total: number
  purchaseDate: string
  category: string | null
  subcategory: string | null
  confidenceScore: number | null
  summary: string | null
  createdAt: string
  updatedAt: string
}

export interface AnalyticsExportData {
  overview: {
    totalSpent: number
    receiptCount: number
    averageReceipt: number
    dateRange: { start: string; end: string }
  }
  categories: Array<{
    category: string
    count: number
    total: number
    percentage: number
  }>
  merchants: Array<{
    merchant: string
    count: number
    total: number
    percentage: number
  }>
  trends: Array<{
    period: string
    total: number
    count: number
    average: number
  }>
}

// ============================================================================
// EXPORT SERVICE CLASS
// ============================================================================

export class ExportService {
  // ============================================================================
  // MAIN EXPORT METHOD
  // ============================================================================

  async exportData(userId: string, options: ExportOptions): Promise<ExportResult> {
    try {
      // Validate user permissions (see master guide: Authentication and Authorization)
      await this.validateUserAccess(userId)

      // Build query filters
      const whereClause = this.buildWhereClause(userId, options)

      // Fetch receipts data
      const receipts = await this.fetchReceipts(whereClause, options)

      // Generate export based on format
      let exportResult: ExportResult
      
      switch (options.format) {
        case 'csv':
          exportResult = await this.generateCSV(receipts, options)
          break
        case 'json':
          exportResult = await this.generateJSON(receipts, options)
          break
        case 'pdf':
          exportResult = await this.generatePDF(receipts, options)
          break
        default:
          throw new Error('Unsupported export format')
      }

      // Log export activity for audit trail
      await this.logExport(userId, options, exportResult.metadata)

      return exportResult
    } catch (error) {
      console.error('Export service error:', error)
      throw new Error('Export failed')
    }
  }

  // ============================================================================
  // EXPORT FORMAT GENERATORS
  // ============================================================================

  private async generateCSV(receipts: ReceiptExportData[], options: ExportOptions): Promise<ExportResult> {
    const headers = [
      'ID',
      'Merchant',
      'Total',
      'Purchase Date',
      'Category',
      'Subcategory',
      'Confidence Score',
      'Summary',
      'Created At',
      'Updated At'
    ]

    const rows = receipts.map(receipt => [
      receipt.id,
      receipt.merchant,
      receipt.total.toFixed(2),
      receipt.purchaseDate,
      receipt.category || '',
      receipt.subcategory || '',
      receipt.confidenceScore?.toFixed(2) || '',
      receipt.summary || '',
      receipt.createdAt,
      receipt.updatedAt
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const filename = this.generateFilename('receipts', 'csv', options)
    const data = Buffer.from(csvContent, 'utf-8')

    return {
      data,
      filename,
      contentType: 'text/csv',
      size: data.length,
      metadata: await this.generateMetadata(receipts)
    }
  }

  private async generateJSON(receipts: ReceiptExportData[], options: ExportOptions): Promise<ExportResult> {
    const exportData: {
      receipts: ReceiptExportData[]
      analytics?: AnalyticsExportData
      metadata: {
        exportDate: string
        recordCount: number
        format: string
        version: string
      }
    } = {
      receipts,
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: receipts.length,
        format: 'json',
        version: '1.0'
      }
    }

    // Include analytics if requested
    if (options.includeAnalytics) {
      exportData.analytics = await this.generateAnalyticsData(receipts)
    }

    const jsonContent = JSON.stringify(exportData, null, 2)
    const filename = this.generateFilename('receipts', 'json', options)
    const data = Buffer.from(jsonContent, 'utf-8')

    return {
      data,
      filename,
      contentType: 'application/json',
      size: data.length,
      metadata: await this.generateMetadata(receipts)
    }
  }

  private async generatePDF(receipts: ReceiptExportData[], options: ExportOptions): Promise<ExportResult> {
    // For now, return a simple text-based PDF
    // TODO: Implement proper PDF generation with formatting
    const pdfContent = this.generatePDFContent(receipts, options)
    const filename = this.generateFilename('receipts', 'pdf', options)
    const data = Buffer.from(pdfContent, 'utf-8')

    return {
      data,
      filename,
      contentType: 'application/pdf',
      size: data.length,
      metadata: await this.generateMetadata(receipts)
    }
  }

  // ============================================================================
  // DATA FETCHING AND PROCESSING
  // ============================================================================

  private async fetchReceipts(whereClause: any, options: ExportOptions): Promise<ReceiptExportData[]> {
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      orderBy: { purchaseDate: 'desc' },
      select: {
        id: true,
        merchant: true,
        total: true,
        purchaseDate: true,
        category: true,
        subcategory: true,
        confidenceScore: true,
        summary: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return receipts.map(receipt => ({
      ...receipt,
      total: Number(receipt.total),
      confidenceScore: receipt.confidenceScore ? Number(receipt.confidenceScore) : null,
      purchaseDate: format(receipt.purchaseDate, 'yyyy-MM-dd'),
      createdAt: format(receipt.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      updatedAt: format(receipt.updatedAt, 'yyyy-MM-dd HH:mm:ss')
    }))
  }

  private async generateAnalyticsData(receipts: ReceiptExportData[]): Promise<AnalyticsExportData> {
    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total, 0)
    const receiptCount = receipts.length
    const averageReceipt = receiptCount > 0 ? totalSpent / receiptCount : 0

    // Group by category
    const categoryMap = new Map<string, { count: number; total: number }>()
    receipts.forEach(receipt => {
      const category = receipt.category || 'Uncategorized'
      const existing = categoryMap.get(category) || { count: 0, total: 0 }
      categoryMap.set(category, {
        count: existing.count + 1,
        total: existing.total + receipt.total
      })
    })

    const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0
    })).sort((a, b) => b.total - a.total)

    // Group by merchant
    const merchantMap = new Map<string, { count: number; total: number }>()
    receipts.forEach(receipt => {
      const existing = merchantMap.get(receipt.merchant) || { count: 0, total: 0 }
      merchantMap.set(receipt.merchant, {
        count: existing.count + 1,
        total: existing.total + receipt.total
      })
    })

    const merchants = Array.from(merchantMap.entries()).map(([merchant, data]) => ({
      merchant,
      count: data.count,
      total: data.total,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0
    })).sort((a, b) => b.total - a.total)

    // Generate trends (monthly)
    const trends = this.generateTrends(receipts)

    return {
      overview: {
        totalSpent,
        receiptCount,
        averageReceipt,
        dateRange: {
          start: receipts.length > 0 ? receipts[receipts.length - 1].purchaseDate : '',
          end: receipts.length > 0 ? receipts[0].purchaseDate : ''
        }
      },
      categories,
      merchants,
      trends
    }
  }

  private generateTrends(receipts: ReceiptExportData[]): AnalyticsExportData['trends'] {
    const monthlyMap = new Map<string, { total: number; count: number }>()
    
    receipts.forEach(receipt => {
      const month = receipt.purchaseDate.substring(0, 7) // YYYY-MM
      const existing = monthlyMap.get(month) || { total: 0, count: 0 }
      monthlyMap.set(month, {
        total: existing.total + receipt.total,
        count: existing.count + 1
      })
    })

    return Array.from(monthlyMap.entries()).map(([period, data]) => ({
      period,
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0
    })).sort((a, b) => a.period.localeCompare(b.period))
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private buildWhereClause(userId: string, options: ExportOptions) {
    const whereClause: any = { userId }

    if (options.dateRange) {
      whereClause.purchaseDate = {
        gte: options.dateRange.start,
        lte: options.dateRange.end
      }
    }

    if (options.categories && options.categories.length > 0) {
      whereClause.category = { in: options.categories }
    }

    if (options.merchants && options.merchants.length > 0) {
      whereClause.merchant = { in: options.merchants }
    }

    if (options.minAmount !== undefined || options.maxAmount !== undefined) {
      whereClause.total = {}
      if (options.minAmount !== undefined) {
        whereClause.total.gte = new Decimal(options.minAmount)
      }
      if (options.maxAmount !== undefined) {
        whereClause.total.lte = new Decimal(options.maxAmount)
      }
    }

    return whereClause
  }

  private generateFilename(baseName: string, extension: string, options: ExportOptions): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const filters = []
    
    if (options.dateRange) {
      filters.push(`${format(options.dateRange.start, 'yyyy-MM-dd')}_to_${format(options.dateRange.end, 'yyyy-MM-dd')}`)
    }
    
    const filterSuffix = filters.length > 0 ? `_${filters.join('_')}` : ''
    return `steward_${baseName}_${timestamp}${filterSuffix}.${extension}`
  }

  private async generateMetadata(receipts: ReceiptExportData[]) {
    const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.total, 0)
    const dateRange = receipts.length > 0 ? {
      start: new Date(receipts[receipts.length - 1].purchaseDate),
      end: new Date(receipts[0].purchaseDate)
    } : { start: null, end: null }

    return {
      recordCount: receipts.length,
      dateRange,
      totalAmount,
      exportTime: new Date()
    }
  }

  private generatePDFContent(receipts: ReceiptExportData[], options: ExportOptions): string {
    // Simple text-based PDF content
    // TODO: Implement proper PDF formatting
    let content = 'STEWARD RECEIPT EXPORT\n'
    content += '======================\n\n'
    content += `Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`
    content += `Total Records: ${receipts.length}\n\n`

    receipts.forEach((receipt, index) => {
      content += `${index + 1}. ${receipt.merchant} - $${receipt.total.toFixed(2)}\n`
      content += `   Date: ${receipt.purchaseDate} | Category: ${receipt.category}\n`
      if (receipt.summary) {
        content += `   Summary: ${receipt.summary}\n`
      }
      content += '\n'
    })

    return content
  }

  private async validateUserAccess(userId: string): Promise<void> {
    // Verify user exists and has access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      throw new Error('User not found')
    }
  }

  private async logExport(userId: string, options: ExportOptions, metadata: any): Promise<void> {
    // Log export activity for audit trail
    console.log(`Export logged: User ${userId} exported ${metadata.recordCount} records in ${options.format} format`)
    // TODO: Implement proper audit logging to database
  }
}

// ============================================================================
// GLOBAL SERVICE INSTANCE
// ============================================================================

export const exportService = new ExportService() 