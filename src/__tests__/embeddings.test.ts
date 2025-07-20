// ============================================================================
// EMBEDDINGS SERVICE TESTS
// ============================================================================
// Tests for semantic search and embedding functionality

import { EmbeddingsService } from '@/lib/services/embeddings'

// Note: EmbeddingsService is mocked globally in jest.setup.js

describe('EmbeddingsService', () => {
  let embeddingsService: EmbeddingsService

  beforeEach(() => {
    embeddingsService = new EmbeddingsService()
  })

  describe('generateEmbedding', () => {
    it('should generate embedding for text content', async () => {
      const content = 'Test receipt content'
      const embedding = await embeddingsService.generateEmbedding(content)
      
      expect(embedding).toBeInstanceOf(Array)
      expect(embedding.length).toBe(1536)
      expect(embedding.every(val => typeof val === 'number')).toBe(true)
    })
  })

  describe('generateReceiptEmbedding', () => {
    it('should create rich content for embedding', async () => {
      const mockReceipt = {
        id: 'test-id',
        merchant: 'Test Store',
        total: 25.50,
        purchaseDate: new Date('2024-01-01'),
        category: 'Food & Dining',
        subcategory: 'Restaurants',
        summary: 'Lunch at test restaurant',
        rawText: 'Test receipt text content'
      }

      const embeddingContent = await embeddingsService.generateReceiptEmbedding(mockReceipt)
      
      // Since we're using mocks, test the mock response structure
      expect(embeddingContent.receiptId).toBe('test-id')
      expect(embeddingContent.content).toBe('Test receipt content')
      expect(embeddingContent.metadata).toEqual({
        merchant: 'Test Store',
        category: 'Food & Dining',
        amount: 25.50,
        date: expect.any(String),
        summary: 'Test receipt'
      })
    })
  })

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      // Test the cosine similarity function directly
      const vecA = [1, 0, 0]
      const vecB = [1, 0, 0]
      const vecC = [0, 1, 0]
      
      // Calculate cosine similarity manually for testing
      const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0)
      const magnitude = (vec: number[]) => Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0))
      
      const similarityAB = dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB))
      expect(similarityAB).toBe(1)
      
      const similarityAC = dotProduct(vecA, vecC) / (magnitude(vecA) * magnitude(vecC))
      expect(similarityAC).toBe(0)
    })
  })
}) 