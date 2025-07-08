// ============================================================================
// BULK OPERATIONS SERVICE TESTS
// ============================================================================
// Comprehensive tests for bulk operations service
// See: Master System Guide - Testing and Quality Assurance

import { BulkOperationsService, bulkOperationsService } from '../bulkOperations'
import { prisma } from '@/lib/prisma'

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/lib/prisma', () => ({
  prisma: {
    receipt: {
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    $queryRaw: jest.fn()
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ============================================================================
// TEST DATA
// ============================================================================

const mockReceipts = [
  {
    id: 'receipt-1',
    merchant: 'Walmart',
    total: 45.67,
    purchaseDate: new Date('2024-01-15'),
    category: 'Groceries',
    subcategory: 'Food',
    confidenceScore: 0.95,
    summary: 'Grocery shopping at Walmart',
    imageUrl: 'https://example.com/receipt1.jpg'
  },
  {
    id: 'receipt-2',
    merchant: 'Shell',
    total: 35.00,
    purchaseDate: new Date('2024-01-16'),
    category: 'Transportation',
    subcategory: 'Gas',
    confidenceScore: 0.88,
    summary: 'Gas purchase at Shell',
    imageUrl: 'https://example.com/receipt2.jpg'
  },
  {
    id: 'receipt-3',
    merchant: 'Starbucks',
    total: 12.50,
    purchaseDate: new Date('2024-01-17'),
    category: 'Food & Dining',
    subcategory: 'Coffee',
    confidenceScore: 0.92,
    summary: 'Coffee at Starbucks',
    imageUrl: 'https://example.com/receipt3.jpg'
  }
]

// ============================================================================
// TEST SUITE
// ============================================================================

describe('BulkOperationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // FILTERING OPERATIONS TESTS
  // ============================================================================

  describe('filterReceipts', () => {
    it('should filter receipts by date range', async () => {
      // Arrange
      const filters = {
        dateRange: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-16')
        }
      }
      
      mockPrisma.receipt.count.mockResolvedValue(3)
      mockPrisma.receipt.findMany.mockResolvedValue(mockReceipts.slice(0, 2))

      // Act
      const result = await BulkOperationsService.filterReceipts('user-123', filters)

      // Assert
      expect(result.receipts).toHaveLength(2)
      expect(result.totalCount).toBe(3)
      expect(result.filteredCount).toBe(2)
      expect(result.appliedFilters).toEqual(filters)
      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          purchaseDate: {
            gte: new Date('2024-01-15'),
            lte: new Date('2024-01-16')
          }
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
    })

    it('should filter receipts by amount range', async () => {
      // Arrange
      const filters = {
        amountRange: {
          min: 30,
          max: 50
        }
      }
      
      mockPrisma.receipt.count.mockResolvedValue(3)
      mockPrisma.receipt.findMany.mockResolvedValue([mockReceipts[0], mockReceipts[1]])

      // Act
      const result = await BulkOperationsService.filterReceipts('user-123', filters)

      // Assert
      expect(result.receipts).toHaveLength(2)
      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          total: {
            gte: 30,
            lte: 50
          }
        },
        select: expect.any(Object),
        orderBy: { purchaseDate: 'desc' }
      })
    })

    it('should filter receipts by categories', async () => {
      // Arrange
      const filters = {
        categories: ['Groceries', 'Transportation']
      }
      
      mockPrisma.receipt.count.mockResolvedValue(3)
      mockPrisma.receipt.findMany.mockResolvedValue([mockReceipts[0], mockReceipts[1]])

      // Act
      const result = await BulkOperationsService.filterReceipts('user-123', filters)

      // Assert
      expect(result.receipts).toHaveLength(2)
      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          category: {
            in: ['Groceries', 'Transportation']
          }
        },
        select: expect.any(Object),
        orderBy: { purchaseDate: 'desc' }
      })
    })

    it('should filter receipts by search query', async () => {
      // Arrange
      const filters = {
        searchQuery: 'Walmart'
      }
      
      mockPrisma.receipt.count.mockResolvedValue(3)
      mockPrisma.receipt.findMany.mockResolvedValue([mockReceipts[0]])

      // Act
      const result = await BulkOperationsService.filterReceipts('user-123', filters)

      // Assert
      expect(result.receipts).toHaveLength(1)
      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          OR: [
            { merchant: { contains: 'Walmart', mode: 'insensitive' } },
            { category: { contains: 'Walmart', mode: 'insensitive' } },
            { subcategory: { contains: 'Walmart', mode: 'insensitive' } },
            { summary: { contains: 'Walmart', mode: 'insensitive' } },
            { rawText: { contains: 'Walmart', mode: 'insensitive' } }
          ]
        },
        select: expect.any(Object),
        orderBy: { purchaseDate: 'desc' }
      })
    })

    it('should handle empty filters', async () => {
      // Arrange
      const filters = {}
      
      mockPrisma.receipt.count.mockResolvedValue(3)
      mockPrisma.receipt.findMany.mockResolvedValue(mockReceipts)

      // Act
      const result = await BulkOperationsService.filterReceipts('user-123', filters)

      // Assert
      expect(result.receipts).toHaveLength(3)
      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: expect.any(Object),
        orderBy: { purchaseDate: 'desc' }
      })
    })

    it('should throw error on database error', async () => {
      // Arrange
      mockPrisma.receipt.count.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(BulkOperationsService.filterReceipts('user-123', {})).rejects.toThrow('Failed to filter receipts')
    })
  })

  describe('getFilteredReceiptIds', () => {
    it('should return receipt IDs that match filters', async () => {
      // Arrange
      const filters = { categories: ['Groceries'] }
      mockPrisma.receipt.findMany.mockResolvedValue([
        { id: 'receipt-1' },
        { id: 'receipt-2' }
      ])

      // Act
      const result = await BulkOperationsService.getFilteredReceiptIds('user-123', filters)

      // Assert
      expect(result).toEqual(['receipt-1', 'receipt-2'])
      expect(mockPrisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          category: { in: ['Groceries'] }
        },
        select: { id: true }
      })
    })
  })

  // ============================================================================
  // BULK UPDATE OPERATIONS TESTS
  // ============================================================================

  describe('bulkUpdate', () => {
    it('should update multiple receipts successfully', async () => {
      // Arrange
      const receiptIds = ['receipt-1', 'receipt-2']
      const updates = {
        category: 'Updated Category',
        subcategory: 'Updated Subcategory'
      }
      
      mockPrisma.receipt.findMany.mockResolvedValue([
        { id: 'receipt-1' },
        { id: 'receipt-2' }
      ])
      mockPrisma.receipt.updateMany.mockResolvedValue({ count: 2 })

      // Act
      const result = await BulkOperationsService.bulkUpdate('user-123', receiptIds, updates)

      // Assert
      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(mockPrisma.receipt.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: receiptIds },
          userId: 'user-123'
        },
        data: {
          ...updates,
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should handle invalid receipt IDs', async () => {
      // Arrange
      const receiptIds = ['receipt-1', 'invalid-id']
      const updates = { category: 'Updated' }
      
      mockPrisma.receipt.findMany.mockResolvedValue([
        { id: 'receipt-1' }
      ])

      // Act & Assert
      await expect(BulkOperationsService.bulkUpdate('user-123', receiptIds, updates)).rejects.toThrow('Invalid receipt IDs')
    })

    it('should handle empty receipt IDs array', async () => {
      // Arrange
      const receiptIds: string[] = []
      const updates = { category: 'Updated' }

      // Act & Assert
      await expect(BulkOperationsService.bulkUpdate('user-123', receiptIds, updates)).rejects.toThrow('No receipt IDs provided')
    })

    it('should handle too many receipt IDs', async () => {
      // Arrange
      const receiptIds = Array.from({ length: 1001 }, (_, i) => `receipt-${i}`)
      const updates = { category: 'Updated' }

      // Act & Assert
      await expect(BulkOperationsService.bulkUpdate('user-123', receiptIds, updates)).rejects.toThrow('Cannot update more than 1000 receipts at once')
    })
  })

  // ============================================================================
  // BULK DELETE OPERATIONS TESTS
  // ============================================================================

  describe('bulkDelete', () => {
    it('should delete multiple receipts successfully', async () => {
      // Arrange
      const receiptIds = ['receipt-1', 'receipt-2']
      
      mockPrisma.receipt.findMany.mockResolvedValue([
        { id: 'receipt-1', imageUrl: 'url1' },
        { id: 'receipt-2', imageUrl: 'url2' }
      ])
      mockPrisma.receipt.deleteMany.mockResolvedValue({ count: 2 })

      // Act
      const result = await BulkOperationsService.bulkDelete('user-123', receiptIds)

      // Assert
      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(2)
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(0)
      expect(mockPrisma.receipt.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: receiptIds },
          userId: 'user-123'
        }
      })
    })

    it('should handle invalid receipt IDs', async () => {
      // Arrange
      const receiptIds = ['receipt-1', 'invalid-id']
      
      mockPrisma.receipt.findMany.mockResolvedValue([
        { id: 'receipt-1', imageUrl: 'url1' }
      ])

      // Act & Assert
      await expect(BulkOperationsService.bulkDelete('user-123', receiptIds)).rejects.toThrow('Invalid receipt IDs')
    })
  })

  // ============================================================================
  // BULK EXPORT OPERATIONS TESTS
  // ============================================================================

  describe('prepareBulkExport', () => {
    it('should prepare receipts for export', async () => {
      // Arrange
      const receiptIds = ['receipt-1', 'receipt-2']
      
      mockPrisma.receipt.findMany.mockResolvedValue([
        mockReceipts[0],
        mockReceipts[1]
      ])

      // Act
      const result = await BulkOperationsService.prepareBulkExport('user-123', receiptIds)

      // Assert
      expect(result.receipts).toHaveLength(2)
      expect(result.totalCount).toBe(2)
      expect(result.filteredCount).toBe(2)
      expect(result.appliedFilters).toEqual({ receiptIds })
    })

    it('should handle invalid receipt IDs', async () => {
      // Arrange
      const receiptIds = ['receipt-1', 'invalid-id']
      
      mockPrisma.receipt.findMany.mockResolvedValue([
        mockReceipts[0]
      ])

      // Act & Assert
      await expect(BulkOperationsService.prepareBulkExport('user-123', receiptIds)).rejects.toThrow('Invalid receipt IDs')
    })
  })

  // ============================================================================
  // UTILITY METHODS TESTS
  // ============================================================================

  describe('getFilterOptions', () => {
    it('should return filter options for user', async () => {
      // Arrange
      mockPrisma.receipt.findMany
        .mockResolvedValueOnce([
          { category: 'Groceries' },
          { category: 'Transportation' }
        ])
        .mockResolvedValueOnce([
          { merchant: 'Walmart' },
          { merchant: 'Shell' }
        ])
      
      mockPrisma.receipt.aggregate
        .mockResolvedValueOnce({
          _min: { purchaseDate: new Date('2024-01-01') },
          _max: { purchaseDate: new Date('2024-12-31') }
        })
        .mockResolvedValueOnce({
          _min: { total: 10.00 },
          _max: { total: 100.00 }
        })

      // Act
      const result = await BulkOperationsService.getFilterOptions('user-123')

      // Assert
      expect(result.categories).toEqual(['Groceries', 'Transportation'])
      expect(result.merchants).toEqual(['Walmart', 'Shell'])
      expect(result.dateRange.min).toEqual(new Date('2024-01-01'))
      expect(result.dateRange.max).toEqual(new Date('2024-12-31'))
      expect(result.amountRange.min).toBe(10)
      expect(result.amountRange.max).toBe(100)
    })
  })

  describe('getReceiptStats', () => {
    it('should return receipt statistics', async () => {
      // Arrange
      mockPrisma.receipt.aggregate
        .mockResolvedValueOnce({
          _count: { id: 3 },
          _sum: { total: 93.17 },
          _avg: { total: 31.06 }
        })
      
      mockPrisma.receipt.groupBy.mockResolvedValue([
        {
          category: 'Groceries',
          _count: { id: 1 },
          _sum: { total: 45.67 }
        },
        {
          category: 'Transportation',
          _count: { id: 1 },
          _sum: { total: 35.00 }
        }
      ])

      mockPrisma.$queryRaw.mockResolvedValue([
        {
          month: new Date('2024-01-01'),
          count: 3,
          total: 93.17
        }
      ])

      // Act
      const result = await BulkOperationsService.getReceiptStats('user-123')

      // Assert
      expect(result.totalReceipts).toBe(3)
      expect(result.totalAmount).toBe(93.17)
      expect(result.averageAmount).toBe(31.06)
      expect(result.categoryBreakdown).toHaveLength(2)
      expect(result.monthlyBreakdown).toHaveLength(1)
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('validation', () => {
    it('should validate valid filter data', async () => {
      // Arrange
      const validFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        amountRange: {
          min: 10,
          max: 100
        },
        categories: ['Groceries'],
        merchants: ['Walmart'],
        confidenceScore: {
          min: 0.5,
          max: 1.0
        },
        hasSummary: true,
        searchQuery: 'test'
      }
      
      mockPrisma.receipt.count.mockResolvedValue(0)
      mockPrisma.receipt.findMany.mockResolvedValue([])

      // Act
      const result = await BulkOperationsService.filterReceipts('user-123', validFilters)

      // Assert
      expect(result).toBeDefined()
    })

    it('should reject invalid confidence score', async () => {
      // Arrange
      const invalidFilters = {
        confidenceScore: {
          min: 1.5, // Invalid: > 1.0
          max: 2.0
        }
      }

      // Act & Assert
      await expect(BulkOperationsService.filterReceipts('user-123', invalidFilters)).rejects.toThrow()
    })
  })

  // ============================================================================
  // EXPORT TESTS
  // ============================================================================

  describe('default export', () => {
    it('should export default instance', () => {
      // Assert
      expect(bulkOperationsService).toBe(BulkOperationsService)
    })
  })
}) 