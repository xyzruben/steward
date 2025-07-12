// ============================================================================
// ADVANCED ANALYTICS API ROUTE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for advanced analytics API endpoint: GET /api/analytics/advanced
// Uses global mocks from jest.setup.js for consistent isolation

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

const mockAnalytics = {
  totalSpending: 1250.75,
  averageTransaction: 62.54,
  topCategories: [
    { category: 'Food & Dining', total: 450.25, count: 8 },
    { category: 'Shopping', total: 325.50, count: 5 },
    { category: 'Transportation', total: 175.00, count: 3 },
  ],
  spendingTrends: [
    { month: '2024-01', total: 450.25 },
    { month: '2024-02', total: 325.50 },
    { month: '2024-03', total: 475.00 },
  ],
  merchantInsights: [
    { merchant: 'Walmart', total: 125.75, frequency: 3 },
    { merchant: 'McDonald\'s', total: 85.50, frequency: 4 },
    { merchant: 'Target', total: 95.25, frequency: 2 },
  ],
}

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('Advanced Analytics API Route', () => {
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
    prisma.receipt.aggregate.mockResolvedValue({
      _sum: { total: mockAnalytics.totalSpending },
      _count: { id: 20 },
      _avg: { total: mockAnalytics.averageTransaction },
    })
    prisma.receipt.groupBy.mockResolvedValue(mockAnalytics.topCategories)
    
    // Setup service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { analyticsService } = require('@/lib/services/analytics')
    analyticsService.getAdvancedAnalytics.mockResolvedValue(mockAnalytics)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // GET /api/analytics/advanced TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('GET /api/analytics/advanced', () => {
    it('should return advanced analytics for authenticated user', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analytics.totalSpending).toBe(1250.75)
      expect(data.analytics.averageTransaction).toBe(62.54)
      expect(data.analytics.topCategories).toHaveLength(3)
      
      // Verify analytics service was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsService } = require('@/lib/services/analytics')
      expect(analyticsService.getAdvancedAnalytics).toHaveBeenCalledWith('test-user-id', {})
    })

    it('should handle date range parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?startDate=2024-01-01&endDate=2024-12-31')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Verify analytics service was called with date range
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsService } = require('@/lib/services/analytics')
      expect(analyticsService.getAdvancedAnalytics).toHaveBeenCalledWith('test-user-id', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      })
    })

    it('should handle category filter parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?categories=Food%20%26%20Dining,Shopping')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Verify analytics service was called with category filter
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsService } = require('@/lib/services/analytics')
      expect(analyticsService.getAdvancedAnalytics).toHaveBeenCalledWith('test-user-id', {
        categories: ['Food & Dining', 'Shopping'],
      })
    })

    it('should handle amount range parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?minAmount=10&maxAmount=100')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Verify analytics service was called with amount range
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsService } = require('@/lib/services/analytics')
      expect(analyticsService.getAdvancedAnalytics).toHaveBeenCalledWith('test-user-id', {
        minAmount: 10,
        maxAmount: 100,
      })
    })

    it('should handle multiple filter parameters', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/advanced?startDate=2024-01-01&endDate=2024-12-31&categories=Food%20%26%20Dining&minAmount=10&maxAmount=100'
      )

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Verify analytics service was called with all filters
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsService } = require('@/lib/services/analytics')
      expect(analyticsService.getAdvancedAnalytics).toHaveBeenCalledWith('test-user-id', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        categories: ['Food & Dining'],
        minAmount: 10,
        maxAmount: 100,
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

      const request = new NextRequest('http://localhost:3000/api/analytics/advanced')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate date parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?startDate=invalid-date')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid startDate parameter')
    })

    it('should validate amount parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?minAmount=invalid')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid minAmount parameter')
    })

    it('should validate amount range logic', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?minAmount=100&maxAmount=50')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('minAmount cannot be greater than maxAmount')
    })

    it('should handle analytics service errors', async () => {
      // Arrange
      // Override global mock to simulate analytics service error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { analyticsService } = require('@/lib/services/analytics')
      analyticsService.getAdvancedAnalytics.mockRejectedValue(new Error('Analytics service error'))

      const request = new NextRequest('http://localhost:3000/api/analytics/advanced')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch analytics')
    })

    it('should handle database errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.receipt.aggregate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/analytics/advanced')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch analytics')
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle malformed query parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?invalid=param')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle empty query parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced?categories=')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle missing query parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/analytics/advanced')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
}) 