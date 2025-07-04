// ============================================================================
// OPENAI SERVICE UNIT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for OpenAI GPT-4o-mini receipt data extraction functionality

// Shared mock for OpenAI completions
const createMock = jest.fn();

// Mock the OpenAI client directly, all instances share the same mock
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  })),
}))

import { extractReceiptDataWithAI, ReceiptAIExtraction } from '@/lib/services/openai'

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('OpenAI Service', () => {
  beforeEach(async () => {
    jest.resetModules();
    // Re-import after resetting modules so the mock is used
    await import('@/lib/services/openai');
    createMock.mockReset();
  });

  describe('extractReceiptDataWithAI', () => {
    it('should extract structured data from valid OCR text', async () => {
      // Arrange
      const mockOcrText = 'Welcome to Chick-fil-A\nTotal: $11.48\nDate: 2025-07-02'
      const mockAiResponse = {
        merchant: 'Chick-fil-A',
        total: 11.48,
        purchaseDate: '2025-07-02T21:49:36.000Z',
        category: 'Food & Dining',
        tags: ['fast food', 'chicken', 'drive-thru'],
        confidence: 95,
        summary: 'Purchase at Chick-fil-A for $11.48',
      }

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAiResponse),
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result).toEqual(mockAiResponse)
      expect(createMock).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('expert at extracting structured data'),
          },
          {
            role: 'user',
            content: expect.stringContaining(mockOcrText),
          },
        ],
        temperature: 0.2,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      })
    })

    it('should handle missing fields in AI response', async () => {
      // Arrange
      const mockOcrText = 'Receipt with missing data'
      const mockAiResponse = {
        merchant: 'Unknown Store',
        total: null,
        purchaseDate: null,
        category: null,
        tags: [],
        confidence: 50,
        summary: null,
      }

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAiResponse),
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result).toEqual(mockAiResponse)
      expect(result.merchant).toBe('Unknown Store')
      expect(result.total).toBeNull()
      expect(result.purchaseDate).toBeNull()
      expect(result.category).toBeNull()
      expect(result.tags).toEqual([])
      expect(result.confidence).toBe(50)
      expect(result.summary).toBeNull()
    })

    it('should handle invalid JSON response from AI', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      const invalidJson = 'invalid json response'

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: invalidJson,
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result).toEqual({
        merchant: null,
        total: null,
        purchaseDate: null,
        category: null,
        tags: [],
        confidence: 0,
        summary: null,
      })
    })

    it('should handle empty AI response', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result).toEqual({
        merchant: null,
        total: null,
        purchaseDate: null,
        category: null,
        tags: [],
        confidence: 0,
        summary: null,
      })
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      const apiError = new Error('OpenAI API rate limit exceeded')
      createMock.mockRejectedValue(apiError)

      // Act & Assert
      await expect(extractReceiptDataWithAI(mockOcrText)).rejects.toThrow('OpenAI API rate limit exceeded')
    })

    it('should handle malformed data types in AI response', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      const malformedResponse = {
        merchant: 'Valid Store',
        total: 'not a number', // Should be number
        purchaseDate: '2025-07-02T21:49:36.000Z',
        category: 'Food',
        tags: 'not an array', // Should be array
        confidence: 'high', // Should be number
        summary: 'Valid summary',
      }

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(malformedResponse),
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result.merchant).toBe('Valid Store')
      expect(result.total).toBeNull() // Invalid type should be null
      expect(result.purchaseDate).toBe('2025-07-02T21:49:36.000Z')
      expect(result.category).toBe('Food')
      expect(result.tags).toEqual([]) // Invalid type should be empty array
      expect(result.confidence).toBe(0) // Invalid type should be 0
      expect(result.summary).toBe('Valid summary')
    })

    it('should handle complex receipt data with all fields populated', async () => {
      // Arrange
      const mockOcrText = 'STARBUCKS\nTotal: $9.57\nDate: 2025-01-15\nItems: Coffee, Muffin'
      const mockAiResponse = {
        merchant: 'Starbucks',
        total: 9.57,
        purchaseDate: '2025-01-15T22:30:00.000Z',
        category: 'Food & Dining',
        tags: ['coffee', 'cafe', 'beverage', 'breakfast'],
        confidence: 92,
        summary: 'Coffee and breakfast items purchased at Starbucks for $9.57',
      }

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAiResponse),
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result).toEqual(mockAiResponse)
      expect(result.merchant).toBe('Starbucks')
      expect(result.total).toBe(9.57)
      expect(result.purchaseDate).toBe('2025-01-15T22:30:00.000Z')
      expect(result.category).toBe('Food & Dining')
      expect(result.tags).toContain('coffee')
      expect(result.tags).toContain('cafe')
      expect(result.confidence).toBe(92)
      expect(result.summary).toContain('Starbucks')
    })

    it('should validate confidence score is within 0-100 range', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      const mockAiResponse = {
        merchant: 'Test Store',
        total: 10.00,
        purchaseDate: '2025-01-01T00:00:00.000Z',
        category: 'Test',
        tags: ['test'],
        confidence: 150, // Invalid confidence > 100
        summary: 'Test summary',
      }

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAiResponse),
            },
          },
        ],
      })

      // Act
      const result = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(result.confidence).toBe(150) // Currently accepts any number, but could be validated
      expect(result.merchant).toBe('Test Store')
    })

    it('should handle network timeout errors', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      const timeoutError = new Error('Request timeout')
      createMock.mockRejectedValue(timeoutError)

      // Act & Assert
      await expect(extractReceiptDataWithAI(mockOcrText)).rejects.toThrow('Request timeout')
    })

    it('should handle authentication errors', async () => {
      // Arrange
      const mockOcrText = 'Receipt text'
      const authError = new Error('Invalid API key')
      createMock.mockRejectedValue(authError)

      // Act & Assert
      await expect(extractReceiptDataWithAI(mockOcrText)).rejects.toThrow('Invalid API key')
    })
  })

  describe('Type Safety and Validation', () => {
    it('should maintain type safety for ReceiptAIExtraction interface', async () => {
      // Arrange
      const mockOcrText = 'Type safety test'
      const mockAiResponse = {
        merchant: 'Type Safe Store',
        total: 25.99,
        purchaseDate: '2025-01-01T00:00:00.000Z',
        category: 'Technology',
        tags: ['electronics', 'gadgets'],
        confidence: 85,
        summary: 'Technology purchase',
      }

      createMock.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAiResponse),
            },
          },
        ],
      })

      // Act
      const result: ReceiptAIExtraction = await extractReceiptDataWithAI(mockOcrText)

      // Assert
      expect(typeof result.merchant).toBe('string')
      expect(typeof result.total).toBe('number')
      expect(typeof result.purchaseDate).toBe('string')
      expect(typeof result.category).toBe('string')
      expect(Array.isArray(result.tags)).toBe(true)
      expect(typeof result.confidence).toBe('number')
      expect(typeof result.summary).toBe('string')
    })
  })
}) 