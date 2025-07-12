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
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
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
        userId: 'test-user-id',
        format: 'csv',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31'),
        },
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toContain('Walmart')
      expect(result.data).toContain('McDonald\'s')
      expect(result.filename).toMatch(/steward_receipts_.*\.csv/)
      expect(result.contentType).toBe('text/csv')
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          purchaseDate: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-01-31'),
          },
        },
        orderBy: { purchaseDate: 'desc' },
      })
    })

    it('should handle empty results', async () => {
      // Arrange
      // Override global mock to simulate no receipts
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.receipt.findMany.mockResolvedValue([])

      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'csv',
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toContain('No receipts found')
    })

    it('should apply category filters', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'csv',
        categories: ['Food & Dining'],
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toContain('McDonald\'s')
      expect(result.data).not.toContain('Walmart')
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          category: { in: ['Food & Dining'] },
        },
        orderBy: { purchaseDate: 'desc' },
      })
    })

    it('should apply amount filters', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'csv',
        minAmount: 20,
        maxAmount: 30,
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toContain('Walmart')
      expect(result.data).not.toContain('McDonald\'s')
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          total: {
            gte: 20,
            lte: 30,
          },
        },
        orderBy: { purchaseDate: 'desc' },
      })
    })
  })

  // ============================================================================
  // PDF EXPORT TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('PDF Export', () => {
    it('should export receipts to PDF format', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'pdf',
        includeAnalytics: true,
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/steward_receipts_.*\.pdf/)
      expect(result.contentType).toBe('application/pdf')
    })

    it('should include analytics in PDF when requested', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'pdf',
        includeAnalytics: true,
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.aggregate).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        _sum: { total: true },
        _count: true,
      })
    })
  })

  // ============================================================================
  // JSON EXPORT TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('JSON Export', () => {
    it('should export receipts to JSON format', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'json',
        includeMetadata: true,
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/steward_receipts_.*\.json/)
      expect(result.contentType).toBe('application/json')
      
      const jsonData = JSON.parse(result.data)
      expect(jsonData.receipts).toHaveLength(2)
      expect(jsonData.metadata).toBeDefined()
    })

    it('should include metadata when requested', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'json',
        includeMetadata: true,
      }

      // Act
      const result = await ExportService.exportData(options)

      // Assert
      const jsonData = JSON.parse(result.data)
      expect(jsonData.metadata).toEqual({
        recordCount: 2,
        totalAmount: 38.49,
        exportTime: expect.any(String),
        dateRange: expect.any(Object),
      })
    })
  })

  // ============================================================================
  // VALIDATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Input Validation', () => {
    it('should validate required userId', async () => {
      // Arrange
      const options = {
        format: 'csv',
      } as ExportOptions

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('User ID is required')
    })

    it('should validate required format', async () => {
      // Arrange
      const options = {
        userId: 'test-user-id',
      } as ExportOptions

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Export format is required')
    })

    it('should validate supported formats', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'unsupported' as any,
      }

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Unsupported export format')
    })

    it('should validate date range', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'csv',
        dateRange: {
          start: new Date('2025-01-31'),
          end: new Date('2025-01-01'),
        },
      }

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Start date cannot be after end date')
    })

    it('should validate amount range', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'csv',
        minAmount: 100,
        maxAmount: 50,
      }

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Minimum amount cannot be greater than maximum amount')
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
        userId: 'test-user-id',
        format: 'csv',
      }

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Failed to fetch receipts')
    })

    it('should handle user not found', async () => {
      // Arrange
      // Override global mock to simulate user not found
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique.mockResolvedValue(null)

      const options: ExportOptions = {
        userId: 'non-existent-user',
        format: 'csv',
      }

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('User not found')
    })

    it('should handle CSV generation errors', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'csv',
      }

      // Mock CSV generation to throw error
      const originalGenerateCsv = ExportService.generateCsv
      ExportService.generateCsv = jest.fn().mockImplementation(() => {
        throw new Error('CSV generation failed')
      })

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Failed to generate CSV')

      // Restore original method
      ExportService.generateCsv = originalGenerateCsv
    })

    it('should handle PDF generation errors', async () => {
      // Arrange
      const options: ExportOptions = {
        userId: 'test-user-id',
        format: 'pdf',
      }

      // Mock PDF generation to throw error
      const originalGeneratePdf = ExportService.generatePdf
      ExportService.generatePdf = jest.fn().mockImplementation(() => {
        throw new Error('PDF generation failed')
      })

      // Act & Assert
      await expect(ExportService.exportData(options)).rejects.toThrow('Failed to generate PDF')

      // Restore original method
      ExportService.generatePdf = originalGeneratePdf
    })
  })

  // ============================================================================
  // UTILITY METHOD TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Utility Methods', () => {
    it('should generate filename with timestamp', () => {
      // Act
      const filename = ExportService.generateFilename('csv')

      // Assert
      expect(filename).toMatch(/steward_receipts_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/)
    })

    it('should calculate total amount correctly', () => {
      // Arrange
      const receipts = [
        { total: 10.50 },
        { total: 25.75 },
        { total: 5.25 },
      ]

      // Act
      const total = ExportService.calculateTotal(receipts)

      // Assert
      expect(total).toBe(41.50)
    })

    it('should format currency correctly', () => {
      // Act
      const formatted = ExportService.formatCurrency(1234.56)

      // Assert
      expect(formatted).toBe('$1,234.56')
    })

    it('should validate date range correctly', () => {
      // Valid range
      expect(ExportService.validateDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )).toBe(true)

      // Invalid range
      expect(ExportService.validateDateRange(
        new Date('2025-01-31'),
        new Date('2025-01-01')
      )).toBe(false)
    })
  })
}) 