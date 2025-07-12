// ============================================================================
// EXPORT SERVICE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive unit tests for export functionality
// Uses global mocks from jest.setup.js for consistent isolation

import { ExportService, type ExportOptions, type ExportResult } from '../export'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockReceipts = [
  {
    id: 'receipt-1',
    userId: 'test-user-id',
    merchant: 'Walmart',
    total: 25.99,
    purchaseDate: new Date('2025-01-01'),
    category: 'Shopping',
    tags: ['groceries'],
    summary: 'Grocery shopping at Walmart',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'receipt-2',
    userId: 'test-user-id',
    merchant: 'McDonald\'s',
    total: 12.50,
    purchaseDate: new Date('2025-01-02'),
    category: 'Food & Dining',
    tags: ['fast food'],
    summary: 'Lunch at McDonald\'s',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
]

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('ExportService', () => {
  let exportService: ExportService

  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Create service instance
    exportService = new ExportService()
    
    // Setup default successful responses using global mocks
    // These are already configured in jest.setup.js, but we can override for specific tests
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue(mockUser)
    prisma.receipt.findMany.mockResolvedValue(mockReceipts)
    prisma.receipt.aggregate.mockResolvedValue({
      _sum: { total: 38.49 },
      _count: 2,
    })
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // CSV EXPORT TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('CSV Export', () => {
    it('should export receipts to CSV format', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31'),
        },
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      expect(result.filename).toMatch(/receipts.*\.csv/)
      expect(result.contentType).toBe('text/csv')
      expect(result.data).toBeInstanceOf(Buffer)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalled()
    })

    it('should handle empty results', async () => {
      // Arrange
      // Override global mock to simulate no receipts
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.receipt.findMany.mockResolvedValue([])

      const options: ExportOptions = {
        format: 'csv',
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      expect(result.metadata.recordCount).toBe(0)
    })

    it('should apply category filters', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        categories: ['Food & Dining'],
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { in: ['Food & Dining'] },
          }),
        })
      )
    })

    it('should apply amount filters', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        minAmount: 20,
        maxAmount: 30,
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            total: {
              gte: 20,
              lte: 30,
            },
          }),
        })
      )
    })
  })

  // ============================================================================
  // PDF EXPORT TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('PDF Export', () => {
    it('should export receipts to PDF format', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'pdf',
        includeAnalytics: true,
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      expect(result.filename).toMatch(/receipts.*\.pdf/)
      expect(result.contentType).toBe('application/pdf')
    })

    it('should include analytics in PDF when requested', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'pdf',
        includeAnalytics: true,
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.aggregate).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // JSON EXPORT TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('JSON Export', () => {
    it('should export receipts to JSON format', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'json',
        includeMetadata: true,
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      expect(result).toBeDefined()
      expect(result.filename).toMatch(/receipts.*\.json/)
      expect(result.contentType).toBe('application/json')
      
      const jsonData = JSON.parse(result.data.toString())
      expect(jsonData.receipts).toBeDefined()
      expect(jsonData.metadata).toBeDefined()
    })

    it('should include metadata when requested', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'json',
        includeMetadata: true,
      }

      // Act
      const result = await exportService.exportData('test-user-id', options)

      // Assert
      const jsonData = JSON.parse(result.data.toString())
      expect(jsonData.metadata).toEqual({
        exportDate: expect.any(String),
        recordCount: 2,
        format: 'json',
        version: '1.0',
      })
    })
  })

  // ============================================================================
  // VALIDATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Input Validation', () => {
    it('should validate required format', async () => {
      // Arrange
      const options = {
        // Missing format
      } as ExportOptions

      // Act & Assert
      await expect(exportService.exportData('test-user-id', options)).rejects.toThrow()
    })

    it('should validate supported formats', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'unsupported' as any,
      }

      // Act & Assert
      await expect(exportService.exportData('test-user-id', options)).rejects.toThrow('Unsupported export format')
    })

    it('should validate date range', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        dateRange: {
          start: new Date('2025-01-31'),
          end: new Date('2025-01-01'),
        },
      }

      // Act & Assert
      await expect(exportService.exportData('test-user-id', options)).rejects.toThrow()
    })

    it('should validate amount range', async () => {
      // Arrange
      const options: ExportOptions = {
        format: 'csv',
        minAmount: 100,
        maxAmount: 50,
      }

      // Act & Assert
      await expect(exportService.exportData('test-user-id', options)).rejects.toThrow()
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.receipt.findMany.mockRejectedValue(new Error('Database connection failed'))

      const options: ExportOptions = {
        format: 'csv',
      }

      // Act & Assert
      await expect(exportService.exportData('test-user-id', options)).rejects.toThrow('Export failed')
    })

    it('should handle user not found', async () => {
      // Arrange
      // Override global mock to simulate user not found
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)

      const options: ExportOptions = {
        format: 'csv',
      }

      // Act & Assert
      await expect(exportService.exportData('non-existent-user', options)).rejects.toThrow()
    })
  })
}) 