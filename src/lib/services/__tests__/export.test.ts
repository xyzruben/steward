// ============================================================================
// EXPORT SERVICE TESTS
// ============================================================================
// Comprehensive unit tests for export functionality
// See: Master System Guide - Testing and Quality Assurance

import { ExportService, type ExportOptions, type ExportResult } from '../export'
import { prisma } from '@/lib/prisma'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    receipt: {
      findMany: jest.fn(),
      count: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Type the mock methods properly for TypeScript
const mockUserFindUnique = mockPrisma.user.findUnique as jest.MockedFunction<typeof mockPrisma.user.findUnique>
const mockReceiptFindMany = mockPrisma.receipt.findMany as jest.MockedFunction<typeof mockPrisma.receipt.findMany>

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
}

const mockReceipts = [
  {
    id: 'receipt-1',
    merchant: 'Walmart',
    total: 45.67,
    purchaseDate: new Date('2024-01-15'),
    category: 'Groceries',
    subcategory: 'Food',
    confidence: 0.95,
    summary: 'Grocery shopping',
    tags: ['food', 'essentials'],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 'receipt-2',
    merchant: 'Gas Station',
    total: 35.00,
    purchaseDate: new Date('2024-01-16'),
    category: 'Transportation',
    subcategory: 'Fuel',
    confidence: 0.88,
    summary: 'Gas fill up',
    tags: ['fuel', 'transport'],
    createdAt: new Date('2024-01-16T14:30:00Z'),
    updatedAt: new Date('2024-01-16T14:30:00Z')
  }
]

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ExportService', () => {
  let exportService: ExportService

  beforeEach(() => {
    exportService = new ExportService()
    jest.clearAllMocks()
  })

  // ============================================================================
  // MAIN EXPORT METHOD TESTS
  // ============================================================================

  describe('exportData', () => {
    it('should export data successfully with CSV format', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result).toBeDefined()
      expect(result.filename).toContain('receipts')
      expect(result.filename).toContain('.csv')
      expect(result.contentType).toBe('text/csv')
      expect(result.size).toBeGreaterThan(0)
      expect(result.metadata.recordCount).toBe(2)
    })

    it('should export data successfully with JSON format', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'json',
        includeAnalytics: true
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result).toBeDefined()
      expect(result.filename).toContain('receipts')
      expect(result.filename).toContain('.json')
      expect(result.contentType).toBe('application/json')
      expect(result.size).toBeGreaterThan(0)
      expect(result.metadata.recordCount).toBe(2)
    })

    it('should export data successfully with PDF format', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'pdf',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result).toBeDefined()
      expect(result.filename).toContain('receipts')
      expect(result.filename).toContain('.pdf')
      expect(result.contentType).toBe('application/pdf')
      expect(result.size).toBeGreaterThan(0)
      expect(result.metadata.recordCount).toBe(2)
    })

    it('should throw error for unsupported format', async () => {
      // Arrange
      const options = {
        format: 'invalid' as any,
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)

      // Act & Assert
      await expect(exportService.exportData(mockUser.id, options))
        .rejects.toThrow('Export failed')
    })

    it('should throw error when user not found', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(exportService.exportData('invalid-user-id', options))
        .rejects.toThrow('Export failed')
    })

    it('should apply date range filters correctly', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-16')
        }
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      await exportService.exportData(mockUser.id, options)

      // Assert
      expect(mockReceiptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUser.id,
            purchaseDate: {
              gte: new Date('2024-01-15'),
              lte: new Date('2024-01-16')
            }
          })
        })
      )
    })

    it('should apply category filters correctly', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        categories: ['Groceries']
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      await exportService.exportData(mockUser.id, options)

      // Assert
      expect(mockReceiptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUser.id,
            category: { in: ['Groceries'] }
          })
        })
      )
    })

    it('should apply amount range filters correctly', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        minAmount: 30,
        maxAmount: 50
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      await exportService.exportData(mockUser.id, options)

      // Assert
      expect(mockReceiptFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUser.id,
            total: {
              gte: expect.any(Object), // Decimal
              lte: expect.any(Object)  // Decimal
            }
          })
        })
      )
    })
  })

  // ============================================================================
  // CSV GENERATION TESTS
  // ============================================================================

  describe('CSV Generation', () => {
    it('should generate valid CSV content', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      const csvContent = result.data.toString()
      expect(csvContent).toContain('"ID","Merchant","Total","Purchase Date","Category","Subcategory","Confidence","Summary","Tags","Created At","Updated At"')
      expect(csvContent).toContain('"receipt-1","Walmart","45.67"')
      expect(csvContent).toContain('"receipt-2","Gas Station","35.00"')
    })

    it('should handle empty receipts array', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue([])

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      const csvContent = result.data.toString()
      expect(csvContent).toContain('"ID","Merchant","Total","Purchase Date","Category","Subcategory","Confidence","Summary","Tags","Created At","Updated At"')
      expect(result.metadata.recordCount).toBe(0)
    })
  })

  // ============================================================================
  // JSON GENERATION TESTS
  // ============================================================================

  describe('JSON Generation', () => {
    it('should generate valid JSON content', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'json',
        includeAnalytics: true
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      const jsonContent = JSON.parse(result.data.toString())
      expect(jsonContent).toHaveProperty('receipts')
      expect(jsonContent).toHaveProperty('analytics')
      expect(jsonContent).toHaveProperty('metadata')
      expect(jsonContent.receipts).toHaveLength(2)
      expect(jsonContent.metadata.format).toBe('json')
      expect(jsonContent.metadata.version).toBe('1.0')
    })

    it('should include analytics when requested', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'json',
        includeAnalytics: true
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      const jsonContent = JSON.parse(result.data.toString())
      expect(jsonContent.analytics).toBeDefined()
      expect(jsonContent.analytics.overview).toBeDefined()
      expect(jsonContent.analytics.categories).toBeDefined()
      expect(jsonContent.analytics.merchants).toBeDefined()
      expect(jsonContent.analytics.trends).toBeDefined()
    })

    it('should not include analytics when not requested', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'json',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      const jsonContent = JSON.parse(result.data.toString())
      expect(jsonContent.analytics).toBeUndefined()
    })
  })

  // ============================================================================
  // PDF GENERATION TESTS
  // ============================================================================

  describe('PDF Generation', () => {
    it('should generate PDF content', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'pdf',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      const pdfContent = result.data.toString()
      expect(pdfContent).toContain('STEWARD RECEIPT EXPORT')
      expect(pdfContent).toContain('Walmart - $45.67')
      expect(pdfContent).toContain('Gas Station - $35.00')
      expect(pdfContent).toContain('Total Records: 2')
    })
  })

  // ============================================================================
  // FILENAME GENERATION TESTS
  // ============================================================================

  describe('Filename Generation', () => {
    it('should generate filename with timestamp', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result.filename).toMatch(/^steward_receipts_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/)
    })

    it('should include date range in filename when specified', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-16')
        }
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result.filename).toContain('2024-01-15_to_2024-01-16')
    })
  })

  // ============================================================================
  // METADATA GENERATION TESTS
  // ============================================================================

  describe('Metadata Generation', () => {
    it('should generate correct metadata', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue(mockReceipts as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result.metadata.recordCount).toBe(2)
      expect(result.metadata.totalAmount).toBe(80.67)
      expect(result.metadata.dateRange.start).toEqual(new Date('2024-01-15'))
      expect(result.metadata.dateRange.end).toEqual(new Date('2024-01-16'))
      expect(result.metadata.exportTime).toBeInstanceOf(Date)
    })

    it('should handle empty dataset metadata', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockResolvedValue([])

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert
      expect(result.metadata.recordCount).toBe(0)
      expect(result.metadata.totalAmount).toBe(0)
      expect(result.metadata.dateRange.start).toBeNull()
      expect(result.metadata.dateRange.end).toBeNull()
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        includeAnalytics: false
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)
      mockReceiptFindMany.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(exportService.exportData(mockUser.id, options))
        .rejects.toThrow('Export failed')
    })

    it('should handle invalid date ranges', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-16'),
          end: new Date('2024-01-15') // Invalid: end before start
        }
      }

      mockUserFindUnique.mockResolvedValue(mockUser as any)

      // Act
      const result = await exportService.exportData(mockUser.id, options)

      // Assert - Should still work but return empty results
      expect(result.metadata.recordCount).toBe(0)
    })
  })
}) 