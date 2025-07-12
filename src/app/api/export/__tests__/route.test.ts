// ============================================================================
// EXPORT API ROUTE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for export endpoint: POST /api/export
// Uses global mocks from jest.setup.js for consistent isolation

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

const mockReceipts = [
  {
    id: 'receipt-1',
    userId: 'test-user-id',
    merchant: 'Walmart',
    total: 25.99,
    category: 'Shopping',
    purchaseDate: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'receipt-2',
    userId: 'test-user-id',
    merchant: 'McDonald\'s',
    total: 12.50,
    category: 'Food & Dining',
    purchaseDate: new Date('2024-01-02'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('Export API Route', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Setup default successful responses using global mocks
    // These are already configured in jest.setup.js, but we can override for specific tests
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseServerClient } = require('@/lib/supabase')
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })
    
    // Setup Prisma mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue(mockUser)
    prisma.receipt.findMany.mockResolvedValue(mockReceipts)
    prisma.receipt.count.mockResolvedValue(2)
    
    // Setup service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { exportService } = require('@/lib/services/export')
    exportService.exportToCSV.mockResolvedValue('csv,data,here')
    exportService.exportToJSON.mockResolvedValue('{"data": "json"}')
    exportService.exportToPDF.mockResolvedValue(Buffer.from('pdf data'))
    
    // Setup notification service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { notificationService } = require('@/lib/services/notifications')
    notificationService.notifyExportCompleted.mockResolvedValue(undefined)
    notificationService.notifyExportError.mockResolvedValue(undefined)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // POST /api/export TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('POST /api/export', () => {
    it('should export receipts to CSV successfully', async () => {
      // Arrange
      const requestBody = {
        format: 'csv',
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          categories: ['Shopping', 'Food & Dining'],
        },
        includeAnalytics: true,
      }

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.downloadUrl).toBeDefined()
      expect(data.format).toBe('csv')
      
      // Verify export service was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exportService } = require('@/lib/services/export')
      expect(exportService.exportToCSV).toHaveBeenCalledWith(
        mockReceipts,
        expect.objectContaining({
          includeAnalytics: true,
          filters: requestBody.filters,
        })
      )
      
      // Verify notification was sent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyExportCompleted).toHaveBeenCalledWith(
        mockUser.id,
        'csv',
        2
      )
    })

    it('should export receipts to JSON successfully', async () => {
      // Arrange
      const requestBody = {
        format: 'json',
        filters: {},
        includeAnalytics: false,
      }

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.format).toBe('json')
      
      // Verify export service was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exportService } = require('@/lib/services/export')
      expect(exportService.exportToJSON).toHaveBeenCalledWith(
        mockReceipts,
        expect.objectContaining({
          includeAnalytics: false,
        })
      )
    })

    it('should export receipts to PDF successfully', async () => {
      // Arrange
      const requestBody = {
        format: 'pdf',
        filters: {
          minAmount: 10,
          maxAmount: 100,
        },
        includeAnalytics: true,
      }

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.format).toBe('pdf')
      
      // Verify export service was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exportService } = require('@/lib/services/export')
      expect(exportService.exportToPDF).toHaveBeenCalledWith(
        mockReceipts,
        expect.objectContaining({
          includeAnalytics: true,
          filters: requestBody.filters,
        })
      )
    })

    it('should handle unauthenticated requests', async () => {
      // Arrange
      // Override global mock to simulate unauthenticated user
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSupabaseServerClient } = require('@/lib/supabase')
      createSupabaseServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      })

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate required format parameter', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Export format is required')
    })

    it('should validate supported formats', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'unsupported' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Unsupported export format')
    })

    it('should handle database errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.receipt.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch receipts for export')
      
      // Verify error notification was sent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyExportError).toHaveBeenCalledWith(
        mockUser.id,
        'Database error'
      )
    })

    it('should handle export service errors', async () => {
      // Arrange
      // Override global mock to simulate export error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exportService } = require('@/lib/services/export')
      exportService.exportToCSV.mockRejectedValue(new Error('Export failed'))

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate export')
      
      // Verify error notification was sent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyExportError).toHaveBeenCalledWith(
        mockUser.id,
        'Export failed'
      )
    })

    it('should apply filters correctly', async () => {
      // Arrange
      const requestBody = {
        format: 'csv',
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          categories: ['Shopping'],
          minAmount: 20,
          maxAmount: 30,
          merchants: ['Walmart'],
        },
      }

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Verify Prisma was called with correct filters
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.receipt.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          purchaseDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
          category: { in: ['Shopping'] },
          total: {
            gte: 20,
            lte: 30,
          },
          merchant: { in: ['Walmart'] },
        },
        orderBy: { purchaseDate: 'desc' },
      })
    })

    it('should handle malformed JSON', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON')
    })

    it('should handle missing content type', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Content-Type must be application/json')
    })
  })
}) 