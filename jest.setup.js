// ============================================================================
// JEST SETUP CONFIGURATION (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Configures testing environment, custom matchers, and global test utilities

import '@testing-library/jest-dom'

// ============================================================================
// CUSTOM TEST UTILITIES (see master guide: Mocking Practices)
// ============================================================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    }
  },
}))

// ============================================================================
// GLOBAL TEST HELPERS (see master guide: Testing and Quality Assurance)
// ============================================================================

// Mock file upload helper
global.createMockFile = (name, type, size = 1024) => {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Mock FormData helper
global.createMockFormData = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

// Mock API response helper
global.createMockApiResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ============================================================================
// TEST ENVIRONMENT CONFIGURATION (see master guide: Testing and Quality Assurance)
// ============================================================================

// Add Web API globals for API route testing
global.Request = class MockRequest {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.body = init.body
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  
  async formData() {
    return this.body
  }
}

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
}

global.FormData = class MockFormData {
  constructor() {
    this.data = new Map()
  }
  
  append(key, value) {
    this.data.set(key, value)
  }
  
  get(key) {
    return this.data.get(key)
  }
}

global.File = class MockFile {
  constructor(content, name, options = {}) {
    // Ensure content is a string of the correct length
    this.content = Array.isArray(content) ? content.join('') : String(content)
    this.name = name
    this.type = options.type || 'text/plain'
    this.size = this.content.length
  }
  
  async arrayBuffer() {
    // Fill buffer with 'x' char code (120) to simulate real file content
    const arr = new Uint8Array(this.size).fill(120)
    return arr.buffer
  }
}

// Suppress console warnings in tests (but keep errors)
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})

// ============================================================================
// CUSTOM MATCHERS (see master guide: Testing and Quality Assurance)
// ============================================================================

// Custom matcher for API error responses
expect.extend({
  toBeApiError(received, expectedStatus = 400) {
    const pass = received.status === expectedStatus
    return {
      pass,
      message: () =>
        `expected API response to have status ${expectedStatus}, but got ${received.status}`,
    }
  },
})

// Custom matcher for file validation
expect.extend({
  toBeValidFile(received, expectedType) {
    const pass = received instanceof File && received.type === expectedType
    return {
      pass,
      message: () =>
        `expected valid ${expectedType} file, but got ${received?.type || 'invalid file'}`,
    }
  },
}) 