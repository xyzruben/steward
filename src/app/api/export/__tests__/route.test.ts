// ============================================================================
// EXPORT API ROUTE TESTS
// ============================================================================
// Comprehensive tests for export API endpoints
// See: Master System Guide - Testing and Quality Assurance

import { POST, GET } from '../route'
import { createSupabaseServerClient } from '@/lib/supabase'
import { exportService } from '@/lib/services/export'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn()
}))

// Mock export service
jest.mock('@/lib/services/export', () => ({
  exportService: {
    exportData: jest.fn()
  }
}))

// Mock rate limiter
jest.mock('@/lib/rate-limiter', () => ({
  analyticsRateLimiter: {
    isAllowed: jest.fn()
  }
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({}))
}))

const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>
const mockExportService = exportService as jest.Mocked<typeof exportService>
const mockAnalyticsRateLimiter = analyticsRateLimiter as jest.Mocked<typeof analyticsRateLimiter>

// ============================================================================
// TEST HELPERS
// ============================================================================

// Helper function to create Request objects for testing
function createTestRequest(url: string, method: string, body?: any): Request {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  if (body) {
    requestInit.body = JSON.stringify(body)
  }
  
  return new Request(url, requestInit)
}

// ============================================================================
// TEST DATA
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
}

const mockExportResult = {
  data: Buffer.from('test data'),
  filename: 'steward_receipts_2024-01-15_10-00-00.csv',
  contentType: 'text/csv',
  size: 100,
  metadata: {
    recordCount: 2,
    dateRange: { start: new Date('2024-01-15'), end: new Date('2024-01-16') },
    totalAmount: 80.67,
    exportTime: new Date()
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Export API Routes', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      }
    }
    
    mockCreateSupabaseServerClient.mockReturnValue(mockSupabase)
  })

  // ============================================================================
  // POST ROUTE TESTS
  // ============================================================================

  describe('POST /api/export', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', { format: 'csv' })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 429 when rate limit exceeded', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', { format: 'csv' })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.retryAfter).toBeDefined()
    })

    it('should return 400 for invalid format', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', { format: 'invalid' })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid format. Must be csv, json, or pdf')
    })

    it('should return 400 for invalid start date', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        dateRange: { start: 'invalid-date' }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid start date')
    })

    it('should return 400 for invalid end date', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        dateRange: { end: 'invalid-date' }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid end date')
    })

    it('should return 400 when start date is after end date', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        dateRange: {
          start: '2024-01-16',
          end: '2024-01-15'
        }
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Start date cannot be after end date')
    })

    it('should return 400 for invalid minAmount', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        minAmount: -10
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid minAmount parameter')
    })

    it('should return 400 for invalid maxAmount', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        maxAmount: -10
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid maxAmount parameter')
    })

    it('should return 400 when minAmount is greater than maxAmount', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        minAmount: 100,
        maxAmount: 50
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('minAmount cannot be greater than maxAmount')
    })

    it('should successfully export CSV data', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      mockExportService.exportData.mockResolvedValue(mockExportResult)

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv',
        includeAnalytics: false
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('steward_receipts')
      expect(response.headers.get('Content-Length')).toBe('100')
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    })

    it('should successfully export JSON data', async () => {
      // Arrange
      const jsonResult = {
        ...mockExportResult,
        contentType: 'application/json',
        filename: 'steward_receipts_2024-01-15_10-00-00.json'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      mockExportService.exportData.mockResolvedValue(jsonResult)

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'json',
        includeAnalytics: true
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('steward_receipts')
      expect(response.headers.get('Content-Disposition')).toContain('.json')
    })

    it('should successfully export PDF data', async () => {
      // Arrange
      const pdfResult = {
        ...mockExportResult,
        contentType: 'application/pdf',
        filename: 'steward_receipts_2024-01-15_10-00-00.pdf'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      mockExportService.exportData.mockResolvedValue(pdfResult)

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'pdf',
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        minAmount: 10,
        maxAmount: 1000
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/pdf')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('steward_receipts')
      expect(response.headers.get('Content-Disposition')).toContain('.pdf')
    })

    it('should handle export service errors', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      mockExportService.exportData.mockRejectedValue(new Error('Export failed'))

      const request = createTestRequest('http://localhost:3000/api/export', 'POST', {
        format: 'csv'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to export data')
    })

    it('should handle missing request body', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = createTestRequest('http://localhost:3000/api/export', 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Request body is required')
    })

    it('should handle malformed JSON in request body', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockAnalyticsRateLimiter.isAllowed.mockReturnValue({
        allowed: true,
        remaining: 9,
        resetTime: Date.now() + 3600000
      })

      const request = new Request('http://localhost:3000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })
  })

  // ============================================================================
  // GET ROUTE TESTS
  // ============================================================================

  describe('GET /api/export', () => {
    it('should return 405 Method Not Allowed', async () => {
      // Arrange
      const request = createTestRequest('http://localhost:3000/api/export', 'GET')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(405)
      expect(data.error).toBe('Method not allowed')
    })
  })
}) 