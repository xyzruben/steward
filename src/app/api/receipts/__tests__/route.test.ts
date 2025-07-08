import { NextRequest } from 'next/server'
import { GET } from '../route'
import { getReceiptsByUserId } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

const mockGetReceiptsByUserId = getReceiptsByUserId as jest.MockedFunction<typeof getReceiptsByUserId>

describe('GET /api/receipts', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User'
  }

  const mockReceipts = [
    {
      id: 'receipt-1',
      userId: 'user-123',
      imageUrl: 'https://example.com/receipt1.jpg',
      rawText: 'Sample receipt text',
      merchant: 'Test Store',
      total: 25.50,
      purchaseDate: '2024-01-15T00:00:00.000Z',
      summary: 'Test purchase',
      category: 'Food & Dining',
      subcategory: 'Restaurants',
      confidenceScore: 0.95,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful authentication
    const { createSupabaseServerClient } = require('@/lib/supabase')
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    })
  })

  it('should return receipts for authenticated user', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts as any)

    const request = new NextRequest('http://localhost:3000/api/receipts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockReceipts as any)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc'
    })
  })

  it('should return 401 for unauthenticated user', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase')
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null
        })
      }
    })

    const request = new NextRequest('http://localhost:3000/api/receipts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should handle search parameter', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?search=test')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      search: 'test'
    })
  })

  it('should handle category filter', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?category=Food%20%26%20Dining')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      category: 'Food & Dining'
    })
  })

  it('should handle subcategory filter', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?subcategory=Restaurants')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      subcategory: 'Restaurants'
    })
  })

  it('should handle amount range filters', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?minAmount=10&maxAmount=100')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      minAmount: 10,
      maxAmount: 100
    })
  })

  it('should handle date range filters', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?startDate=2024-01-01&endDate=2024-12-31')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    })
  })

  it('should handle confidence score filter', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?minConfidence=0.8')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      minConfidence: 0.8
    })
  })

  it('should handle pagination parameters', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?skip=20&limit=10')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 20,
      take: 10,
      orderBy: 'createdAt',
      order: 'desc'
    })
  })

  it('should handle sorting parameters', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest('http://localhost:3000/api/receipts?orderBy=merchant&order=asc')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'merchant',
      order: 'asc'
    })
  })

  it('should return 400 for invalid minAmount', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?minAmount=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid minAmount parameter')
  })

  it('should return 400 for invalid maxAmount', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?maxAmount=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid maxAmount parameter')
  })

  it('should return 400 for invalid minConfidence', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?minConfidence=2.0')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid minConfidence parameter (must be between 0 and 1)')
  })

  it('should return 400 for invalid startDate', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?startDate=invalid-date')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid startDate parameter')
  })

  it('should return 400 for invalid endDate', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?endDate=invalid-date')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid endDate parameter')
  })

  it('should return 400 when minAmount is greater than maxAmount', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?minAmount=100&maxAmount=50')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('minAmount cannot be greater than maxAmount')
  })

  it('should return 400 when startDate is after endDate', async () => {
    const request = new NextRequest('http://localhost:3000/api/receipts?startDate=2024-12-31&endDate=2024-01-01')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('startDate cannot be after endDate')
  })

  it('should handle multiple filters simultaneously', async () => {
    mockGetReceiptsByUserId.mockResolvedValue(mockReceipts)

    const request = new NextRequest(
      'http://localhost:3000/api/receipts?search=test&category=Food%20%26%20Dining&minAmount=10&maxAmount=100&startDate=2024-01-01&endDate=2024-12-31&minConfidence=0.8'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetReceiptsByUserId).toHaveBeenCalledWith('user-123', {
      skip: 0,
      take: 20,
      orderBy: 'createdAt',
      order: 'desc',
      search: 'test',
      category: 'Food & Dining',
      minAmount: 10,
      maxAmount: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      minConfidence: 0.8
    })
  })

  it('should handle database errors gracefully', async () => {
    mockGetReceiptsByUserId.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/receipts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle authentication errors gracefully', async () => {
    const { createSupabaseServerClient } = require('@/lib/supabase')
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Auth error')
        })
      }
    })

    const request = new NextRequest('http://localhost:3000/api/receipts')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
}) 