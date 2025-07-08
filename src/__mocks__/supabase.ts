// ============================================================================
// SUPABASE MOCK (see STEWARD_MASTER_SYSTEM_GUIDE.md - Mocking Practices)
// ============================================================================
// Mock implementation of Supabase client for testing

export interface MockUser {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

export interface MockAuthResponse {
  data: { user: MockUser | null }
  error: { message: string } | null
}

export interface MockReceipt {
  id: string
  userId: string
  imageUrl: string
  merchant: string
  total: number
  purchaseDate: string
  category?: string
  tags: string[]
  summary?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MOCK DATA (see master guide: Mocking Practices)
// ============================================================================

const mockUsers: Record<string, MockUser> = {
  'test-user-1': {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  'test-user-2': {
    id: 'test-user-2',
    email: 'user2@example.com',
    name: 'User Two',
  },
}

const mockReceipts: MockReceipt[] = [
  {
    id: 'receipt-1',
    userId: 'test-user-1',
    imageUrl: 'https://example.com/receipt1.jpg',
    merchant: 'Chick-fil-A',
    total: 11.48,
    purchaseDate: '2025-07-02T21:49:36.000Z',
    category: 'Food & Dining',
    tags: ['fast food', 'chicken'],
    summary: 'Chick-fil-A purchase',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'receipt-2',
    userId: 'test-user-1',
    imageUrl: 'https://example.com/receipt2.jpg',
    merchant: 'Starbucks',
    total: 9.57,
    purchaseDate: '2025-01-15T22:30:00.000Z',
    category: 'Food & Dining',
    tags: ['coffee', 'cafe'],
    summary: 'Starbucks coffee',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
]

// ============================================================================
// MOCK SUPABASE CLIENT (see master guide: Mocking Practices)
// ============================================================================

const createSupabaseServerClientFn = () => ({
  auth: {
    getUser: jest.fn(async (): Promise<MockAuthResponse> => {
      // Simulate authenticated user
      return {
        data: { user: mockUsers['test-user-1'] },
        error: null,
      }
    }),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(async (path: string) => {
        // Simulate successful upload
        return {
          data: { path },
          error: null,
        }
      }),
      getPublicUrl: jest.fn((path: string) => ({
        data: { publicUrl: `https://example.com/storage/${path}` },
      })),
    })),
  },
})

export const createSupabaseServerClient = Object.assign(createSupabaseServerClientFn, {
  mockClear: jest.fn(),
  mockReset: jest.fn(),
  mockReturnValue: jest.fn(),
})

export const createSupabaseClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn(async () => ({
      data: { user: mockUsers['test-user-1'] },
      error: null,
    })),
    signInWithOAuth: jest.fn(async () => ({
      data: { user: mockUsers['test-user-1'] },
      error: null,
    })),
    signOut: jest.fn(async () => ({
      error: null,
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(async () => ({
            data: mockReceipts,
            error: null,
          })),
        })),
      })),
    })),
    insert: jest.fn(async (data: Record<string, unknown>) => ({
      data: { id: 'new-receipt-id', ...data },
      error: null,
    })),
    update: jest.fn(() => ({
      eq: jest.fn(async () => ({
        data: mockReceipts[0],
        error: null,
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(async () => ({
        data: null,
        error: null,
      })),
    })),
  })),
}))

// Mock for browser client (used in realtime service)
const createSupabaseBrowserClientFn = () => ({
  auth: {
    getUser: jest.fn(async () => ({
      data: { user: mockUsers['test-user-1'] },
      error: null,
    })),
    signInWithOAuth: jest.fn(async () => ({
      data: { user: mockUsers['test-user-1'] },
      error: null,
    })),
    signOut: jest.fn(async () => ({
      error: null,
    })),
  },
  channel: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
  removeAllChannels: jest.fn(),
})

export const createSupabaseBrowserClient = Object.assign(createSupabaseBrowserClientFn, {
  mockClear: jest.fn(),
  mockReset: jest.fn(),
  mockReturnValue: jest.fn(),
})

// ============================================================================
// MOCK DATABASE FUNCTIONS (see master guide: Mocking Practices)
// ============================================================================

export const createUser = jest.fn(async (userData: Partial<MockUser>) => {
  const newUser: MockUser = {
    id: userData.id || 'new-user-id',
    email: userData.email || 'new@example.com',
    name: userData.name,
    avatarUrl: userData.avatarUrl,
  }
  mockUsers[newUser.id] = newUser
  return newUser
})

export const getUserById = jest.fn(async (userId: string) => {
  return mockUsers[userId] || null
})

export const createReceipt = jest.fn(async (receiptData: Partial<MockReceipt>) => {
  const newReceipt: MockReceipt = {
    id: receiptData.id || `receipt-${Date.now()}`,
    userId: receiptData.userId || 'test-user-1',
    imageUrl: receiptData.imageUrl || 'https://example.com/receipt.jpg',
    merchant: receiptData.merchant || 'Unknown Merchant',
    total: receiptData.total || 0,
    purchaseDate: receiptData.purchaseDate || new Date().toISOString(),
    category: receiptData.category,
    tags: receiptData.tags || [],
    summary: receiptData.summary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockReceipts.push(newReceipt)
  return newReceipt
})

export const getReceiptsByUserId = jest.fn(async (userId: string, limit?: number) => {
  const userReceipts = mockReceipts.filter(receipt => receipt.userId === userId)
  return limit ? userReceipts.slice(0, limit) : userReceipts
})

export const getReceiptStats = jest.fn(async (userId: string) => {
  const userReceipts = mockReceipts.filter(receipt => receipt.userId === userId)
  const totalSpent = userReceipts.reduce((sum, receipt) => sum + receipt.total, 0)
  
  return {
    totalReceipts: userReceipts.length,
    totalSpent,
    averageSpent: userReceipts.length > 0 ? totalSpent / userReceipts.length : 0,
    topMerchants: userReceipts
      .reduce((acc, receipt) => {
        acc[receipt.merchant] = (acc[receipt.merchant] || 0) + 1
        return acc
      }, {} as Record<string, number>),
  }
})

// ============================================================================
// TEST UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

export const resetMocks = () => {
  createSupabaseServerClient.mockClear()
  createSupabaseClient.mockClear()
  createUser.mockClear()
  getUserById.mockClear()
  createReceipt.mockClear()
  getReceiptsByUserId.mockClear()
  getReceiptStats.mockClear()
}

export const setMockUser = (user: MockUser) => {
  mockUsers[user.id] = user
}

export const setMockReceipts = (receipts: MockReceipt[]) => {
  mockReceipts.length = 0
  mockReceipts.push(...receipts)
}

export const setMockAuthError = () => {
  createSupabaseServerClient.mockReturnValue({
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: null },
        error: { message: 'Authentication failed' },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(async (path: string) => {
          return {
            data: { path },
            error: null,
          }
        }),
        getPublicUrl: jest.fn((path: string) => ({
          data: { publicUrl: `https://example.com/storage/${path}` },
        })),
      })),
    },
  })
} 

export default {
  createSupabaseServerClient,
  createSupabaseClient,
  createSupabaseBrowserClient,
  createUser,
  getUserById,
  createReceipt,
  getReceiptsByUserId,
  getReceiptStats,
  resetMocks,
  setMockUser,
  setMockReceipts,
  setMockAuthError,
} 