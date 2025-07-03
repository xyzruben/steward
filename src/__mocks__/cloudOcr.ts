// ============================================================================
// GOOGLE CLOUD VISION OCR MOCK (see STEWARD_MASTER_SYSTEM_GUIDE.md - Mocking Practices)
// ============================================================================
// Mock implementation of Google Cloud Vision API for testing

export interface MockOcrResponse {
  text: string
  confidence: number
  error?: string
}

// ============================================================================
// MOCK DATA (see master guide: Mocking Practices)
// ============================================================================

const mockReceiptTexts = {
  chickfila: {
    text: `Welcome to Chick-fil-A
Whittwood FSR (# 03404)
Whittier, CA
Operator: Thomas Purtell
562-902-1550

CUSTOMER COPY
7/2/2025 2:49:36 PM
DRIVE THRU

Order Number: 5628104
Guest: 51-rubin

1 GRL Club +CJ
10.39
+ No Sauce

Sub. Total: $10.39
Tax: $1.09
Total: $11.48

Change: $0.00
Visa: $11.48

Register:50
Cashier:Shane
Tran Seq No: 5628104`,
    confidence: 0.95,
  },
  starbucks: {
    text: `STARBUCKS
123 Main Street
Los Angeles, CA 90210

Order #12345
Date: 2025-01-15
Time: 14:30

1 Venti Latte
$5.45

1 Blueberry Muffin
$3.25

Subtotal: $8.70
Tax: $0.87
Total: $9.57

Payment: Credit Card
Thank you for your visit!`,
    confidence: 0.92,
  },
  walmart: {
    text: `WALMART
456 Commerce Blvd
Anaheim, CA 92801

Receipt #789012
Date: 2025-01-20
Time: 16:45

Milk 2% 1/2 Gal
$2.99

Bread Whole Wheat
$3.49

Bananas 2.5 lbs
$1.25

Subtotal: $7.73
Tax: $0.77
Total: $8.50

Payment: Debit Card
Thank you for shopping at Walmart!`,
    confidence: 0.88,
  },
}

// ============================================================================
// MOCK IMPLEMENTATION (see master guide: Mocking Practices)
// ============================================================================

export const extractTextFromImage = jest.fn(async (base64Image: string): Promise<string> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Determine which mock response to return based on image content
  let mockResponse: MockOcrResponse
  
  if (base64Image.includes('chickfila') || base64Image.includes('chicken')) {
    mockResponse = mockReceiptTexts.chickfila
  } else if (base64Image.includes('starbucks') || base64Image.includes('coffee')) {
    mockResponse = mockReceiptTexts.starbucks
  } else if (base64Image.includes('walmart') || base64Image.includes('grocery')) {
    mockResponse = mockReceiptTexts.walmart
  } else {
    // Default mock response
    mockResponse = {
      text: 'Sample receipt text for testing purposes',
      confidence: 0.85,
    }
  }
  
  // Simulate occasional errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Mock OCR service error: Bad image data')
  }
  
  return mockResponse.text
})

export const imageBufferToBase64 = jest.fn((buffer: Buffer, mimeType: string): string => {
  // Mock base64 conversion
  return `data:${mimeType};base64,${Buffer.from('mock-image-data').toString('base64')}`
})

// ============================================================================
// TEST UTILITIES (see master guide: Testing and Quality Assurance)
// ============================================================================

export const resetMocks = () => {
  extractTextFromImage.mockClear()
  imageBufferToBase64.mockClear()
}

export const setMockResponse = (text: string, confidence: number = 0.9) => {
  extractTextFromImage.mockResolvedValue(text)
}

export const setMockError = (error: string) => {
  extractTextFromImage.mockRejectedValue(new Error(error))
} 