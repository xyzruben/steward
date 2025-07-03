// ============================================================================
// OPENAI SERVICE MOCK (see STEWARD_MASTER_SYSTEM_GUIDE.md - Mocking Practices)
// ============================================================================
// Mock implementation of OpenAI API for testing

export interface MockAiResponse {
  merchant: string | null
  total: number | null
  purchaseDate: string | null
  category: string | null
  tags: string[]
  confidence: number
  summary: string | null
}

// ============================================================================
// MOCK DATA (see master guide: Mocking Practices)
// ============================================================================

const mockAiResponses = {
  chickfila: {
    merchant: 'Chick-fil-A',
    total: 11.48,
    purchaseDate: '2025-07-02T21:49:36.000Z',
    category: 'Food & Dining',
    tags: ['fast food', 'chicken', 'drive-thru'],
    confidence: 0.95,
    summary: 'Purchase at Chick-fil-A Whittwood FSR on July 2, 2025, for a total of $11.48 using Visa.',
  },
  starbucks: {
    merchant: 'Starbucks',
    total: 9.57,
    purchaseDate: '2025-01-15T22:30:00.000Z',
    category: 'Food & Dining',
    tags: ['coffee', 'cafe', 'beverage'],
    confidence: 0.92,
    summary: 'Coffee and snack purchase at Starbucks on January 15, 2025, totaling $9.57.',
  },
  walmart: {
    merchant: 'Walmart',
    total: 8.50,
    purchaseDate: '2025-01-20T00:45:00.000Z',
    category: 'Shopping',
    tags: ['grocery', 'retail', 'essentials'],
    confidence: 0.88,
    summary: 'Grocery shopping at Walmart on January 20, 2025, for $8.50.',
  },
}

// ============================================================================
// MOCK IMPLEMENTATION (see master guide: Mocking Practices)
// ============================================================================

export const extractReceiptDataWithAI = jest.fn(async (ocrText: string): Promise<MockAiResponse> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Determine which mock response to return based on OCR text
  let mockResponse: MockAiResponse
  
  if (ocrText.toLowerCase().includes('chick-fil-a') || ocrText.toLowerCase().includes('chickfila')) {
    mockResponse = mockAiResponses.chickfila
  } else if (ocrText.toLowerCase().includes('starbucks')) {
    mockResponse = mockAiResponses.starbucks
  } else if (ocrText.toLowerCase().includes('walmart')) {
    mockResponse = mockAiResponses.walmart
  } else {
    // Default mock response for unknown merchants
    mockResponse = {
      merchant: 'Unknown Merchant',
      total: 0.00,
      purchaseDate: new Date().toISOString(),
      category: 'Uncategorized',
      tags: [],
      confidence: 0.5,
      summary: 'Receipt processed with limited confidence.',
    }
  }
  
  // Simulate occasional errors (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Mock OpenAI service error: Rate limit exceeded')
  }
  
  // Simulate low confidence responses (10% chance)
  if (Math.random() < 0.1) {
    mockResponse.confidence = Math.random() * 0.5 // 0-0.5 confidence
  }
  
  return mockResponse
})

// ============================================================================
// TEST UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

export const resetMocks = () => {
  extractReceiptDataWithAI.mockClear()
}

export const setMockResponse = (response: MockAiResponse) => {
  extractReceiptDataWithAI.mockResolvedValue(response)
}

export const setMockError = (error: string) => {
  extractReceiptDataWithAI.mockRejectedValue(new Error(error))
}

export const setMockLowConfidence = () => {
  extractReceiptDataWithAI.mockResolvedValue({
    merchant: 'Low Confidence Merchant',
    total: null,
    purchaseDate: null,
    category: null,
    tags: [],
    confidence: 0.3,
    summary: 'Low confidence extraction result.',
  })
} 