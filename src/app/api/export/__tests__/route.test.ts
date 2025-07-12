// ============================================================================
// EXPORT API ROUTE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for export API endpoints
// Uses global mocks from jest.setup.js for consistent isolation

import { POST, GET } from '../route'
import { NextRequest } from 'next/server'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

const mockExportResult = {
  data: 'test-csv-data',
  filename: 'test-export.csv',
  contentType: 'text/csv',
}

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('Export API Routes', () => {
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
    
    // Setup export service mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { exportService } = require('@/lib/services/export')
    exportService.exportData.mockResolvedValue(mockExportResult)
    
    // Setup rate limiter mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { analyticsRateLimiter } = require('@/lib/rate-limiter')
    analyticsRateLimiter.isAllowed.mockReturnValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 3600000
    })
    
    // Setup Prisma mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue({ id: 'test-user-id' })
    prisma.receipt.findMany.mockResolvedValue([])
    prisma.receipt.aggregate.mockResolvedValue({ _sum: { total: 0 }, _count: 0 })
    prisma.receipt.groupBy.mockResolvedValue([])
    prisma.userProfile.findUnique.mockResolvedValue(null)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // POST /api/export TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('POST /api/export', () => {
    it('should export data successfully', async () => {
      // Arrange
      const requestBody = {
        format: 'csv',
        dateRange: {
          start: '2025-01-01',
          end: '2025-12-31'
        },
        categories: ['Food & Dining'],
        includeMetadata: true
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
      expect(data.data).toBe('test-csv-data')
      expect(data.filename).toBe('test-export.csv')
      expect(data.contentType).toBe('text/csv')
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exportService } = require('@/lib/services/export')
      expect(exportService.exportData).toHaveBeenCalledWith({
        userId: 'test-user-id',
        format: 'csv',
        dateRange: {
          start: '2025-01-01',
          end: '2025-12-31'
        },
        categories: ['Food & Dining'],
        includeMetadata: true
      })
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

    it('should validate required fields', async () => {
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
      expect(data.error).toBe('Format is required')
    })

    it('should handle rate limiting', async () => {
      // Arrange
      // Override global mock to simulate rate limit exceeded
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsRateLimiter } = require('@/lib/rate-limiter')
      analyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000
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
      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
    })

    it('should handle export service errors', async () => {
      // Arrange
      // Override global mock to simulate export error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { exportService } = require('@/lib/services/export')
      exportService.exportData.mockRejectedValue(new Error('Export failed'))

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
      expect(data.error).toBe('Failed to export data')
    })

    it('should support different export formats', async () => {
      // Arrange
      const formats = ['csv', 'pdf', 'json']
      
      for (const format of formats) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { exportService } = require('@/lib/services/export')
        exportService.exportData.mockResolvedValue({
          data: `test-${format}-data`,
          filename: `test-export.${format}`,
          contentType: format === 'csv' ? 'text/csv' : format === 'pdf' ? 'application/pdf' : 'application/json',
        })

        const request = new NextRequest('http://localhost:3000/api/export', {
          method: 'POST',
          body: JSON.stringify({ format }),
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
        expect(data.filename).toBe(`test-export.${format}`)
      }
    })
  })

  // ============================================================================
  // GET /api/export TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('GET /api/export', () => {
    it('should return export history', async () => {
      // Arrange
      const mockExports = [
        {
          id: 'export-1',
          userId: 'test-user-id',
          format: 'csv',
          filename: 'export-1.csv',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'export-2',
          userId: 'test-user-id',
          format: 'pdf',
          filename: 'export-2.pdf',
          createdAt: new Date('2025-01-02'),
        },
      ]

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.export.findMany.mockResolvedValue(mockExports)

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'GET',
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.exports).toHaveLength(2)
      expect(data.exports[0].format).toBe('csv')
      expect(data.exports[1].format).toBe('pdf')
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
        method: 'GET',
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.export.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'GET',
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch export history')
    })

    it('should support pagination', async () => {
      // Arrange
      const mockExports = [
        {
          id: 'export-1',
          userId: 'test-user-id',
          format: 'csv',
          filename: 'export-1.csv',
          createdAt: new Date('2025-01-01'),
        },
      ]

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.export.findMany.mockResolvedValue(mockExports)

      const request = new NextRequest('http://localhost:3000/api/export?page=1&limit=10', {
        method: 'GET',
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.export.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      })
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Error Handling', () => {
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

    it('should handle unsupported export formats', async () => {
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
  })
}) 