// ============================================================================
// EMBEDDINGS SERVICE
// ============================================================================
// Vector embeddings for semantic search and RAG capabilities
// See: Master System Guide - AI and Processing, Performance and Scalability

import OpenAI from 'openai'
import { prisma } from '../prisma'
import { Decimal } from '../../generated/prisma/runtime/library'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EmbeddingContent {
  receiptId: string
  content: string
  metadata?: {
    merchant?: string
    category?: string
    subcategory?: string
    amount?: number
    date?: string
    summary?: string
  }
}

export interface EmbeddingSearchResult {
  receiptId: string
  similarity: number
  content: string
  metadata: {
    merchant: string
    category?: string
    subcategory?: string
    amount: number
    date: string
    summary?: string
  }
}

export interface EmbeddingSearchQuery {
  query: string
  userId: string
  limit?: number
  threshold?: number
  filters?: {
    category?: string
    minAmount?: number
    maxAmount?: number
    startDate?: Date
    endDate?: Date
    merchant?: string
  }
}

// ============================================================================
// EMBEDDINGS SERVICE CLASS
// ============================================================================

export class EmbeddingsService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  // ============================================================================
  // EMBEDDING GENERATION
  // ============================================================================

  async generateEmbedding(content: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
        encoding_format: 'float',
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error('Failed to generate embedding')
    }
  }

  async generateReceiptEmbedding(receipt: any): Promise<EmbeddingContent> {
    // Create rich content for embedding
    const contentParts = []

    // Basic receipt info
    contentParts.push(`Receipt from ${receipt.merchant}`)
    contentParts.push(`Amount: $${receipt.total}`)
    contentParts.push(`Date: ${receipt.purchaseDate.toISOString().split('T')[0]}`)

    // Category information
    if (receipt.category) {
      contentParts.push(`Category: ${receipt.category}`)
    }
    if (receipt.subcategory) {
      contentParts.push(`Subcategory: ${receipt.subcategory}`)
    }

    // AI-generated summary
    if (receipt.summary) {
      contentParts.push(`Summary: ${receipt.summary}`)
    }

    // Raw text (truncated to avoid token limits)
    if (receipt.rawText) {
      const truncatedText = receipt.rawText.length > 500 
        ? receipt.rawText.substring(0, 500) + '...'
        : receipt.rawText
      contentParts.push(`Receipt text: ${truncatedText}`)
    }

    const content = contentParts.join('\n')

    return {
      receiptId: receipt.id,
      content,
      metadata: {
        merchant: receipt.merchant,
        category: receipt.category,
        subcategory: receipt.subcategory,
        amount: parseFloat(receipt.total.toString()),
        date: receipt.purchaseDate.toISOString(),
        summary: receipt.summary
      }
    }
  }

  // ============================================================================
  // EMBEDDING STORAGE
  // ============================================================================

  async storeEmbedding(embeddingContent: EmbeddingContent): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(embeddingContent.content)

      await prisma.receiptEmbedding.upsert({
        where: {
          receiptId: embeddingContent.receiptId
        },
        update: {
          embedding,
          content: embeddingContent.content,
          updatedAt: new Date()
        },
        create: {
          receiptId: embeddingContent.receiptId,
          embedding,
          content: embeddingContent.content
        }
      })
    } catch (error) {
      console.error('Error storing embedding:', error)
      throw new Error('Failed to store embedding')
    }
  }

  async storeReceiptEmbedding(receipt: any): Promise<void> {
    const embeddingContent = await this.generateReceiptEmbedding(receipt)
    await this.storeEmbedding(embeddingContent)
  }

  // ============================================================================
  // SEMANTIC SEARCH
  // ============================================================================

  async semanticSearch(searchQuery: EmbeddingSearchQuery): Promise<EmbeddingSearchResult[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(searchQuery.query)

      // Build database query with filters
      const whereClause: any = {
        receipt: {
          userId: searchQuery.userId
        }
      }

      // Apply filters
      if (searchQuery.filters) {
        if (searchQuery.filters.category) {
          whereClause.receipt.category = searchQuery.filters.category
        }
        if (searchQuery.filters.merchant) {
          whereClause.receipt.merchant = { contains: searchQuery.filters.merchant, mode: 'insensitive' }
        }
        if (searchQuery.filters.minAmount !== undefined || searchQuery.filters.maxAmount !== undefined) {
          whereClause.receipt.total = {}
          if (searchQuery.filters.minAmount !== undefined) {
            whereClause.receipt.total.gte = new Decimal(searchQuery.filters.minAmount)
          }
          if (searchQuery.filters.maxAmount !== undefined) {
            whereClause.receipt.total.lte = new Decimal(searchQuery.filters.maxAmount)
          }
        }
        if (searchQuery.filters.startDate || searchQuery.filters.endDate) {
          whereClause.receipt.purchaseDate = {}
          if (searchQuery.filters.startDate) {
            whereClause.receipt.purchaseDate.gte = searchQuery.filters.startDate
          }
          if (searchQuery.filters.endDate) {
            whereClause.receipt.purchaseDate.lte = searchQuery.filters.endDate
          }
        }
      }

      // Get all embeddings for the user
      const embeddings = await prisma.receiptEmbedding.findMany({
        where: whereClause,
        include: {
          receipt: {
            select: {
              id: true,
              merchant: true,
              total: true,
              purchaseDate: true,
              category: true,
              subcategory: true,
              summary: true
            }
          }
        }
      })

      // Calculate cosine similarity for each embedding
      const results: EmbeddingSearchResult[] = []
      const threshold = searchQuery.threshold || 0.7

      for (const embedding of embeddings) {
        const similarity = this.cosineSimilarity(queryEmbedding, embedding.embedding)
        
        if (similarity >= threshold) {
          results.push({
            receiptId: embedding.receiptId,
            similarity,
            content: embedding.content,
            metadata: {
              merchant: embedding.receipt.merchant,
              category: embedding.receipt.category || undefined,
              subcategory: embedding.receipt.subcategory || undefined,
              amount: parseFloat(embedding.receipt.total.toString()),
              date: embedding.receipt.purchaseDate.toISOString(),
              summary: embedding.receipt.summary || undefined
            }
          })
        }
      }

      // Sort by similarity and limit results
      const limit = searchQuery.limit || 10
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

    } catch (error) {
      console.error('Error in semantic search:', error)
      throw new Error('Semantic search failed')
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async generateEmbeddingsForUser(userId: string): Promise<void> {
    try {
      const receipts = await prisma.receipt.findMany({
        where: { userId },
        include: { embedding: true }
      })

      for (const receipt of receipts) {
        // Skip if embedding already exists
        if (receipt.embedding) continue

        await this.storeReceiptEmbedding(receipt)
      }
    } catch (error) {
      console.error('Error generating embeddings for user:', error)
      throw new Error('Failed to generate embeddings')
    }
  }

  async updateEmbeddingForReceipt(receiptId: string): Promise<void> {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId }
      })

      if (!receipt) {
        throw new Error('Receipt not found')
      }

      await this.storeReceiptEmbedding(receipt)
    } catch (error) {
      console.error('Error updating embedding for receipt:', error)
      throw new Error('Failed to update embedding')
    }
  }

  // ============================================================================
  // ANALYTICS AND INSIGHTS
  // ============================================================================

  async generateSpendingInsights(userId: string, query: string): Promise<any> {
    try {
      const searchResults = await this.semanticSearch({
        query,
        userId,
        limit: 50,
        threshold: 0.6
      })

      if (searchResults.length === 0) {
        return {
          insights: [],
          totalAmount: 0,
          averageAmount: 0,
          topCategories: [],
          topMerchants: []
        }
      }

      // Calculate insights
      const totalAmount = searchResults.reduce((sum, result) => sum + result.metadata.amount, 0)
      const averageAmount = totalAmount / searchResults.length

      // Top categories
      const categoryCounts = new Map<string, number>()
      const categoryAmounts = new Map<string, number>()
      
      searchResults.forEach(result => {
        if (result.metadata.category) {
          categoryCounts.set(result.metadata.category, (categoryCounts.get(result.metadata.category) || 0) + 1)
          categoryAmounts.set(result.metadata.category, (categoryAmounts.get(result.metadata.category) || 0) + result.metadata.amount)
        }
      })

      const topCategories = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({
          category,
          count,
          totalAmount: categoryAmounts.get(category) || 0
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5)

      // Top merchants
      const merchantCounts = new Map<string, number>()
      const merchantAmounts = new Map<string, number>()
      
      searchResults.forEach(result => {
        merchantCounts.set(result.metadata.merchant, (merchantCounts.get(result.metadata.merchant) || 0) + 1)
        merchantAmounts.set(result.metadata.merchant, (merchantAmounts.get(result.metadata.merchant) || 0) + result.metadata.amount)
      })

      const topMerchants = Array.from(merchantCounts.entries())
        .map(([merchant, count]) => ({
          merchant,
          count,
          totalAmount: merchantAmounts.get(merchant) || 0
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5)

      return {
        insights: searchResults,
        totalAmount,
        averageAmount,
        topCategories,
        topMerchants,
        count: searchResults.length
      }
    } catch (error) {
      console.error('Error generating spending insights:', error)
      throw new Error('Failed to generate insights')
    }
  }
} 