// ============================================================================
// TEST ISOLATION HELPERS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive test isolation utilities following master guide: Mocking Practices
// Provides consistent patterns for isolating tests from external dependencies

// ============================================================================
// MOCK DATA FACTORIES (see master guide: Testing and Quality Assurance)
// ============================================================================

/**
 * Creates mock user data for testing
 * Follows master guide: Unit Testing Strategy - consistent test data
 */
export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

/**
 * Creates mock receipt data for testing
 * Follows master guide: Unit Testing Strategy - consistent test data
 */
export const createMockReceipt = (overrides: any = {}) => ({
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

/**
 * Creates mock user profile data for testing
 * Follows master guide: Unit Testing Strategy - consistent test data
 */
export const createMockUserProfile = (overrides: any = {}) => ({
  id: 'test-profile-id',
  userId: 'test-user-id',
  displayName: 'Test User',
  bio: 'Test bio',
  preferences: {
    currency: 'USD',
    timezone: 'UTC',
    notifications: true,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
})

/**
 * Creates mock notification data for testing
 * Follows master guide: Unit Testing Strategy - consistent test data
 */
export const createMockNotification = (overrides: any = {}) => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'receipt_uploaded',
  title: 'Test Notification',
  message: 'Test notification message',
  read: false,
  createdAt: new Date('2025-01-01'),
  ...overrides,
})

// ============================================================================
// MOCK FILE UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

/**
 * Creates mock file for testing file uploads
 * Follows master guide: Component Testing - file handling
 */
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Creates mock FormData for testing file uploads
 * Follows master guide: Component Testing - form handling
 */
export const createMockFormData = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

// ============================================================================
// MOCK API RESPONSE UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

/**
 * Creates mock API response for testing
 * Follows master guide: Integration Testing - API response handling
 */
export const createMockApiResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Creates mock NextRequest for API route testing
 * Follows master guide: Integration Testing - API route testing
 */
export const createMockRequest = (url: string, method = 'GET', body?: any) => {
  const request = new Request(url, {
    method,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
  })
  
  // Add NextRequest compatibility
  ;(request as any).formData = async () => body instanceof FormData ? body : new FormData()
  ;(request as any).json = async () => typeof body === 'string' ? JSON.parse(body) : body
  
  return request
}

// ============================================================================
// TEST SETUP UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

/**
 * Complete test setup with all mocks
 * Follows master guide: Mocking Practices - comprehensive test isolation
 */
export const setupTestEnvironment = (overrides: any = {}) => {
  // Reset all mocks
  if (typeof jest !== 'undefined') {
    jest.clearAllMocks()
  }
  
  // Setup Prisma mocks if available
  try {
    const { prisma } = require('@/lib/prisma')
    if (prisma) {
      // Setup default Prisma mocks
      Object.keys(prisma).forEach((model) => {
        if (typeof prisma[model] === 'object' && prisma[model] !== null) {
          Object.keys(prisma[model]).forEach((method) => {
            if (typeof prisma[model][method] === 'function') {
              prisma[model][method].mockClear?.()
            }
          })
        }
      })
    }
  } catch (error) {
    // Prisma not available, continue
  }
  
  // Setup service mocks if available
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
      const service = require(servicePath)
      if (service) {
        Object.keys(service).forEach((key) => {
          if (typeof service[key] === 'function' && service[key].mockClear) {
            service[key].mockClear()
          }
        })
      }
    } catch (error) {
      // Service not available, continue
    }
  })
}

/**
 * Test cleanup utility
 * Follows master guide: Testing and Quality Assurance - proper cleanup
 */
export const cleanupTestEnvironment = () => {
  if (typeof jest !== 'undefined') {
    jest.clearAllMocks()
    jest.clearAllTimers()
  }
}

// ============================================================================
// ASSERTION HELPERS (see master guide: Testing and Quality Assurance)
// ============================================================================

/**
 * Asserts that a mock was called with specific arguments
 * Follows master guide: Unit Testing Strategy - precise assertions
 */
export const expectMockCalledWith = (mock: any, expectedArgs: any[]) => {
  expect(mock).toHaveBeenCalledWith(...expectedArgs)
}

/**
 * Asserts that a mock was called exactly once
 * Follows master guide: Unit Testing Strategy - precise assertions
 */
export const expectMockCalledOnce = (mock: any) => {
  expect(mock).toHaveBeenCalledTimes(1)
}

/**
 * Asserts that a mock was never called
 * Follows master guide: Unit Testing Strategy - precise assertions
 */
export const expectMockNeverCalled = (mock: any) => {
  expect(mock).not.toHaveBeenCalled()
}

// ============================================================================
// EXPORT ALL UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

export default {
  createMockUser,
  createMockReceipt,
  createMockUserProfile,
  createMockNotification,
  createMockFile,
  createMockFormData,
  createMockApiResponse,
  createMockRequest,
  setupTestEnvironment,
  cleanupTestEnvironment,
  expectMockCalledWith,
  expectMockCalledOnce,
  expectMockNeverCalled,
} 