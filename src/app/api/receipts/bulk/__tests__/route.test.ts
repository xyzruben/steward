import { NextRequest } from 'next/server'
import { POST } from '../route'
import { createSupabaseServerClient } from '@/lib/supabase'
import { deleteReceipt, updateReceipt, getReceiptsByUserId } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/db')
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({})
}))

const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>
const mockDeleteReceipt = deleteReceipt as jest.MockedFunction<typeof deleteReceipt>
const mockUpdateReceipt = updateReceipt as jest.MockedFunction<typeof updateReceipt>
const mockGetReceiptsByUserId = getReceiptsByUserId as jest.MockedFunction<typeof getReceiptsByUserId>

describe('/api/receipts/bulk', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/receipts/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
  }

  describe('POST', () => {
    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized')
      })

      const request = createRequest({
        action: 'delete',
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for missing action', async () => {
      const request = createRequest({
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('action and receiptIds array required')
    })

    it('should return 400 for missing receiptIds', async () => {
      const request = createRequest({
        action: 'delete'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('action and receiptIds array required')
    })

    it('should return 400 for invalid action', async () => {
      const request = createRequest({
        action: 'invalid',
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid action')
    })

    it('should return 400 for categorize action without category', async () => {
      const request = createRequest({
        action: 'categorize',
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Category is required')
    })

    it('should return 400 for too many receipts', async () => {
      const request = createRequest({
        action: 'delete',
        receiptIds: Array.from({ length: 101 }, (_, i) => `receipt-${i}`)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cannot process more than 100 receipts')
    })

    describe('delete action', () => {
      it('should successfully delete receipts', async () => {
        const mockDeletedReceipt = {
          id: 'receipt-1',
          merchant: 'Test Store',
          total: 10.99
        }

        mockDeleteReceipt.mockResolvedValue(mockDeletedReceipt as any)

        const request = createRequest({
          action: 'delete',
          receiptIds: ['receipt-1', 'receipt-2']
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.action).toBe('delete')
        expect(data.summary.total).toBe(2)
        expect(data.summary.successful).toBe(2)
        expect(data.summary.failed).toBe(0)
        expect(data.results).toHaveLength(2)
        expect(mockDeleteReceipt).toHaveBeenCalledTimes(2)
      })

      it('should handle partial failures', async () => {
        mockDeleteReceipt
          .mockResolvedValueOnce({ id: 'receipt-1' } as any)
          .mockRejectedValueOnce(new Error('Database error'))

        const request = createRequest({
          action: 'delete',
          receiptIds: ['receipt-1', 'receipt-2']
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.summary.successful).toBe(1)
        expect(data.summary.failed).toBe(1)
        expect(data.errors).toHaveLength(1)
      })
    })

    describe('categorize action', () => {
      it('should successfully categorize receipts', async () => {
        const mockUpdatedReceipt = {
          id: 'receipt-1',
          merchant: 'Test Store',
          category: 'Food & Dining',
          subcategory: 'Restaurants'
        }

        mockUpdateReceipt.mockResolvedValue(mockUpdatedReceipt as any)

        const request = createRequest({
          action: 'categorize',
          receiptIds: ['receipt-1'],
          category: 'Food & Dining',
          subcategory: 'Restaurants'
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.action).toBe('categorize')
        expect(mockUpdateReceipt).toHaveBeenCalledWith('receipt-1', {
          category: 'Food & Dining',
          subcategory: 'Restaurants'
        })
      })
    })

    describe('export action', () => {
      it('should successfully export receipts', async () => {
        const mockReceipts = [
          {
            id: 'receipt-1',
            merchant: 'Test Store',
            total: 10.99,
            purchaseDate: new Date('2024-01-01'),
            category: 'Food & Dining',
            subcategory: 'Restaurants',
            summary: 'Test receipt',
            createdAt: new Date('2024-01-01')
          }
        ]

        mockGetReceiptsByUserId.mockResolvedValue(mockReceipts as any)

        const request = createRequest({
          action: 'export',
          receiptIds: ['receipt-1']
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.action).toBe('export')
        expect(data.results).toHaveLength(1)
        expect(data.results[0].data.merchant).toBe('Test Store')
      })
    })
  })
}) 