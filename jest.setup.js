// ============================================================================
// JEST SETUP (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive test environment setup with proper isolation
// Follows master guide: Mocking Practices, Integration Testing

import '@testing-library/jest-dom'

// ============================================================================
// GLOBAL MOCKS (see master guide: Mocking Practices)
// ============================================================================

// Mock all external services to ensure test isolation
jest.mock('@/lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://test-url.com' },
      }),
      remove: jest.fn().mockResolvedValue({ error: null }),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
    })),
    removeChannel: jest.fn().mockResolvedValue(undefined),
  })),
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
    storage: {
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://test-url.com' },
      }),
    },
  })),
}))

// Mock Prisma client for complete database isolation
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    receipt: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    notificationPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $transaction: jest.fn((callback) => callback()),
  },
}))

// Mock database operations
jest.mock('@/lib/db', () => ({
  createReceipt: jest.fn(),
  getReceiptsByUserId: jest.fn(),
  updateReceipt: jest.fn(),
  deleteReceipt: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}))

// Mock external AI services
jest.mock('@/lib/services/openai', () => ({
  extractReceiptDataWithAI: jest.fn().mockResolvedValue({
    merchant: 'Test Merchant',
    total: 25.99,
    purchaseDate: new Date().toISOString(),
    category: 'Food & Dining',
    tags: ['test'],
    confidence: 95,
    summary: 'Test receipt',
  }),
}))

jest.mock('@/lib/services/cloudOcr', () => ({
  extractTextFromImage: jest.fn().mockResolvedValue('Test OCR text'),
  imageBufferToBase64: jest.fn().mockReturnValue('data:image/jpeg;base64,test'),
}))

// Mock rate limiting
jest.mock('@/lib/rate-limiter', () => ({
  analyticsRateLimiter: {
    isAllowed: jest.fn().mockReturnValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 3600000,
    }),
  },
}))

// Mock image processing
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test-image')),
  }))
})

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('test-file')),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}))

// Mock Next.js specific modules
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'test-cookie' }),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue('test-header'),
  }),
}))

// Mock authentication context
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}))

// Mock the realtime service to prevent Supabase client instantiation issues
jest.mock('@/lib/services/realtime', () => ({
  RealtimeService: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    broadcastAnalyticsUpdate: jest.fn(),
    getConnectionStatus: jest.fn(() => false),
    getActiveChannels: jest.fn(() => []),
  })),
  realtimeService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    broadcastAnalyticsUpdate: jest.fn(),
    getConnectionStatus: jest.fn(() => false),
    getActiveChannels: jest.fn(() => []),
  },
}))

// Mock all service instances
jest.mock('@/lib/services/notifications', () => ({
  NotificationService: {
    createNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getNotificationCount: jest.fn(),
  },
  notificationService: {
    createNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getNotificationCount: jest.fn(),
    notifyReceiptUploaded: jest.fn(),
    notifyReceiptProcessed: jest.fn(),
    notifyReceiptError: jest.fn(),
  },
}))

jest.mock('@/lib/services/export', () => ({
  ExportService: {
    exportData: jest.fn(),
    generateCsv: jest.fn(),
    generatePdf: jest.fn(),
  },
  exportService: {
    exportData: jest.fn(),
    generateCsv: jest.fn(),
    generatePdf: jest.fn(),
  },
}))

jest.mock('@/lib/services/analytics', () => ({
  AnalyticsService: {
    getSpendingAnalytics: jest.fn(),
    getCategoryBreakdown: jest.fn(),
    getMonthlyTrends: jest.fn(),
    getReceiptStats: jest.fn(),
  },
}))

jest.mock('@/lib/services/bulkOperations', () => ({
  BulkOperationsService: {
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
    bulkExport: jest.fn(),
  },
  bulkOperationsService: {
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
    bulkExport: jest.fn(),
  },
}))

jest.mock('@/lib/services/userProfile', () => ({
  UserProfileService: {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    createUserProfile: jest.fn(),
    deleteUserProfile: jest.fn(),
  },
  userProfileService: {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    createUserProfile: jest.fn(),
    deleteUserProfile: jest.fn(),
  },
}))

// ============================================================================
// TEST ENVIRONMENT SETUP (see master guide: Testing and Quality Assurance)
// ============================================================================

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.GOOGLE_CLOUD_VISION_API_KEY = 'test-vision-api-key'
process.env.OPENAI_API_KEY = 'test-openai-api-key'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock fetch globally
global.fetch = jest.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// ============================================================================
// TEST UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

// Helper function to reset all mocks between tests
global.resetAllMocks = () => {
  jest.clearAllMocks()
  
  // Reset Prisma mocks
  const { prisma } = require('@/lib/prisma')
  Object.values(prisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear()
        }
      })
    }
  })
  
  // Reset service mocks
  const services = [
    '@/lib/services/notifications',
    '@/lib/services/export',
    '@/lib/services/analytics',
    '@/lib/services/bulkOperations',
    '@/lib/services/userProfile',
    '@/lib/services/realtime',
  ]
  
  services.forEach((servicePath) => {
    try {
      jest.resetModules()
      require(servicePath)
    } catch (error) {
      // Service might not exist, ignore
    }
  })
}

// Helper function to create mock user data
global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  ...overrides,
})

// Helper function to create mock receipt data
global.createMockReceipt = (overrides = {}) => ({
  id: 'test-receipt-id',
  userId: 'test-user-id',
  imageUrl: 'https://test-url.com/receipt.jpg',
  rawText: 'Test receipt text',
  merchant: 'Test Merchant',
  total: 25.99,
  purchaseDate: new Date('2025-01-01'),
  category: 'Food & Dining',
  tags: ['test'],
  summary: 'Test receipt summary',
  confidence: 95,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

// Helper function to create mock file
global.createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

console.log('🧪 Test environment configured with comprehensive isolation')
console.log('📊 Coverage targets: 80% critical paths, 60% overall')
console.log('🔒 All external services are mocked for reliable test execution') 