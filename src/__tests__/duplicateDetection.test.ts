// ============================================================================
// DUPLICATE DETECTION SERVICE TESTS
// ============================================================================
// Comprehensive tests for duplicate receipt detection functionality
// See: RECEIPT_DUPLICATE_FIX.md - Phase 8

import { Decimal } from '@prisma/client/runtime/library'
import {
  normalizeMerchantName,
  calculateStringSimilarity,
  isSameDay,
  toNumber,
  calculateDuplicateConfidence,
  DUPLICATE_CONFIDENCE_THRESHOLD,
  AUTO_MARK_CONFIDENCE_THRESHOLD,
  AMOUNT_TOLERANCE,
  CONFIDENCE_WEIGHTS
} from '@/lib/services/duplicateDetection'
import type { Receipt } from '@prisma/client'

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('Duplicate Detection - Utility Functions', () => {
  describe('normalizeMerchantName', () => {
    it('should convert to lowercase', () => {
      // Arrange
      const merchant = 'WALMART'

      // Act
      const result = normalizeMerchantName(merchant)

      // Assert
      expect(result).toBe('walmart')
    })

    it('should remove special characters', () => {
      // Arrange
      const merchant = "McDonald's #1234"

      // Act
      const result = normalizeMerchantName(merchant)

      // Assert
      expect(result).toBe('mcdonalds 1234')
    })

    it('should normalize whitespace', () => {
      // Arrange
      const merchant = 'Target    Store'

      // Act
      const result = normalizeMerchantName(merchant)

      // Assert
      expect(result).toBe('target store')
    })

    it('should trim leading and trailing spaces', () => {
      // Arrange
      const merchant = '  Starbucks  '

      // Act
      const result = normalizeMerchantName(merchant)

      // Assert
      expect(result).toBe('starbucks')
    })
  })

  describe('calculateStringSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      // Arrange
      const str1 = 'walmart'
      const str2 = 'walmart'

      // Act
      const result = calculateStringSimilarity(str1, str2)

      // Assert
      expect(result).toBe(1.0)
    })

    it('should return 0 for empty strings', () => {
      // Arrange
      const str1 = ''
      const str2 = 'walmart'

      // Act
      const result = calculateStringSimilarity(str1, str2)

      // Assert
      expect(result).toBe(0)
    })

    it('should calculate similarity for partially matching strings', () => {
      // Arrange
      const str1 = 'walmart'
      const str2 = 'walgreen'

      // Act
      const result = calculateStringSimilarity(str1, str2)

      // Assert
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1.0)
    })

    it('should be case-insensitive', () => {
      // Arrange
      const str1 = 'WalMart'
      const str2 = 'walmart'

      // Act
      const result = calculateStringSimilarity(str1, str2)

      // Assert
      expect(result).toBe(1.0)
    })
  })

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      // Arrange
      const date1 = new Date('2024-11-15T10:00:00Z')
      const date2 = new Date('2024-11-15T18:30:00Z')

      // Act
      const result = isSameDay(date1, date2)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for different days', () => {
      // Arrange
      const date1 = new Date('2024-11-15T00:00:00Z')
      const date2 = new Date('2024-11-16T00:00:00Z')

      // Act
      const result = isSameDay(date1, date2)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for different months', () => {
      // Arrange
      const date1 = new Date('2024-11-15T10:00:00Z')
      const date2 = new Date('2024-12-15T10:00:00Z')

      // Act
      const result = isSameDay(date1, date2)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for different years', () => {
      // Arrange
      const date1 = new Date('2023-11-15T10:00:00Z')
      const date2 = new Date('2024-11-15T10:00:00Z')

      // Act
      const result = isSameDay(date1, date2)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('toNumber', () => {
    it('should convert Decimal to number', () => {
      // Arrange
      const decimal = new Decimal(45.99)

      // Act
      const result = toNumber(decimal)

      // Assert
      expect(result).toBe(45.99)
      expect(typeof result).toBe('number')
    })

    it('should return number as-is', () => {
      // Arrange
      const number = 45.99

      // Act
      const result = toNumber(number)

      // Assert
      expect(result).toBe(45.99)
      expect(typeof result).toBe('number')
    })
  })
})

// ============================================================================
// CONFIDENCE SCORING TESTS
// ============================================================================

describe('Duplicate Detection - Confidence Scoring', () => {
  describe('calculateDuplicateConfidence', () => {
    it('should return 1.0 for exact duplicates', () => {
      // Arrange
      const receipt1: Receipt = {
        id: '1',
        userId: 'user1',
        merchant: 'Walmart',
        total: new Decimal(45.99),
        purchaseDate: new Date('2024-11-15'),
        rawText: 'Walmart Receipt Total: $45.99',
        imageUrl: 'url1',
        summary: null,
        category: null,
        subcategory: null,
        confidenceScore: null,
        convertedCurrency: null,
        convertedTotal: null,
        currency: 'USD',
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const receipt2: Receipt = {
        ...receipt1,
        id: '2',
        createdAt: new Date(Date.now() + 1000)
      }

      // Act
      const confidence = calculateDuplicateConfidence(receipt1, receipt2)

      // Assert
      expect(confidence).toBeCloseTo(1.0, 2)
    })

    it('should award points for exact merchant match', () => {
      // Arrange
      const receipt1: Receipt = {
        id: '1',
        userId: 'user1',
        merchant: 'Walmart',
        total: new Decimal(45.99),
        purchaseDate: new Date('2024-11-15'),
        rawText: '',
        imageUrl: 'url1',
        summary: null,
        category: null,
        subcategory: null,
        confidenceScore: null,
        convertedCurrency: null,
        convertedTotal: null,
        currency: 'USD',
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const receipt2: Receipt = {
        ...receipt1,
        id: '2',
        total: new Decimal(100.00), // Different amount
        purchaseDate: new Date('2024-11-20'), // Different date
        createdAt: new Date(Date.now() + 1000)
      }

      // Act
      const confidence = calculateDuplicateConfidence(receipt1, receipt2)

      // Assert - Should get merchant match points (0.40)
      expect(confidence).toBeGreaterThanOrEqual(CONFIDENCE_WEIGHTS.EXACT_MERCHANT)
      expect(confidence).toBeLessThan(0.50) // But not much more
    })

    it('should award points for exact total match', () => {
      // Arrange
      const receipt1: Receipt = {
        id: '1',
        userId: 'user1',
        merchant: 'Store A',
        total: new Decimal(45.99),
        purchaseDate: new Date('2024-11-15'),
        rawText: '',
        imageUrl: 'url1',
        summary: null,
        category: null,
        subcategory: null,
        confidenceScore: null,
        convertedCurrency: null,
        convertedTotal: null,
        currency: 'USD',
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const receipt2: Receipt = {
        ...receipt1,
        id: '2',
        merchant: 'Store B', // Different merchant
        purchaseDate: new Date('2024-11-20'), // Different date
        createdAt: new Date(Date.now() + 1000)
      }

      // Act
      const confidence = calculateDuplicateConfidence(receipt1, receipt2)

      // Assert - Should get total match points (0.30) plus some merchant similarity
      expect(confidence).toBeGreaterThanOrEqual(CONFIDENCE_WEIGHTS.EXACT_TOTAL)
      expect(confidence).toBeLessThan(0.80)
    })

    it('should award points for same date', () => {
      // Arrange
      const receipt1: Receipt = {
        id: '1',
        userId: 'user1',
        merchant: 'Store A',
        total: new Decimal(45.99),
        purchaseDate: new Date('2024-11-15'),
        rawText: '',
        imageUrl: 'url1',
        summary: null,
        category: null,
        subcategory: null,
        confidenceScore: null,
        convertedCurrency: null,
        convertedTotal: null,
        currency: 'USD',
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const receipt2: Receipt = {
        ...receipt1,
        id: '2',
        merchant: 'Store B', // Different merchant
        total: new Decimal(100.00), // Different amount
        createdAt: new Date(Date.now() + 1000)
      }

      // Act
      const confidence = calculateDuplicateConfidence(receipt1, receipt2)

      // Assert - Should get date match points (0.20) plus some merchant similarity
      expect(confidence).toBeGreaterThanOrEqual(CONFIDENCE_WEIGHTS.SAME_DATE)
      expect(confidence).toBeLessThan(0.80)
    })

    it('should handle amounts within tolerance', () => {
      // Arrange
      const receipt1: Receipt = {
        id: '1',
        userId: 'user1',
        merchant: 'Walmart',
        total: new Decimal(45.99),
        purchaseDate: new Date('2024-11-15'),
        rawText: '',
        imageUrl: 'url1',
        summary: null,
        category: null,
        subcategory: null,
        confidenceScore: null,
        convertedCurrency: null,
        convertedTotal: null,
        currency: 'USD',
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const receipt2: Receipt = {
        ...receipt1,
        id: '2',
        total: new Decimal(46.00), // Within $0.01 tolerance
        createdAt: new Date(Date.now() + 1000)
      }

      // Act
      const confidence = calculateDuplicateConfidence(receipt1, receipt2)

      // Assert - Merchant (0.40) + Total (0.30) + Date (0.20) = 0.90
      expect(confidence).toBeCloseTo(0.90, 1) // Allow 0.1 precision tolerance
    })

    it('should never exceed 1.0 confidence', () => {
      // Arrange
      const receipt1: Receipt = {
        id: '1',
        userId: 'user1',
        merchant: 'Walmart',
        total: new Decimal(45.99),
        purchaseDate: new Date('2024-11-15'),
        rawText: 'Walmart Receipt Total: $45.99',
        imageUrl: 'url1',
        summary: null,
        category: null,
        subcategory: null,
        confidenceScore: null,
        convertedCurrency: null,
        convertedTotal: null,
        currency: 'USD',
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const receipt2: Receipt = {
        ...receipt1,
        id: '2',
        createdAt: new Date(Date.now() + 1000)
      }

      // Act
      const confidence = calculateDuplicateConfidence(receipt1, receipt2)

      // Assert
      expect(confidence).toBeLessThanOrEqual(1.0)
    })
  })
})

// ============================================================================
// CONSTANTS VALIDATION TESTS
// ============================================================================

describe('Duplicate Detection - Constants', () => {
  it('should have correct confidence thresholds', () => {
    // Assert
    expect(DUPLICATE_CONFIDENCE_THRESHOLD).toBe(0.80)
    expect(AUTO_MARK_CONFIDENCE_THRESHOLD).toBe(0.90)
    expect(AUTO_MARK_CONFIDENCE_THRESHOLD).toBeGreaterThan(DUPLICATE_CONFIDENCE_THRESHOLD)
  })

  it('should have correct amount tolerance', () => {
    // Assert
    expect(AMOUNT_TOLERANCE).toBe(0.01)
  })

  it('should have correct confidence weights that sum to 1.0', () => {
    // Act
    const sum = Object.values(CONFIDENCE_WEIGHTS).reduce((a, b) => a + b, 0)

    // Assert
    expect(sum).toBeCloseTo(1.0, 10) // High precision for floating point sum
    expect(CONFIDENCE_WEIGHTS.EXACT_MERCHANT).toBe(0.40)
    expect(CONFIDENCE_WEIGHTS.EXACT_TOTAL).toBe(0.30)
    expect(CONFIDENCE_WEIGHTS.SAME_DATE).toBe(0.20)
    expect(CONFIDENCE_WEIGHTS.SIMILAR_TEXT).toBe(0.10)
  })
})

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================

describe('Duplicate Detection - Edge Cases', () => {
  describe('normalizeMerchantName', () => {
    it('should handle empty string', () => {
      // Arrange
      const merchant = ''

      // Act
      const result = normalizeMerchantName(merchant)

      // Assert
      expect(result).toBe('')
    })

    it('should handle only special characters', () => {
      // Arrange
      const merchant = '@#$%^&*()'

      // Act
      const result = normalizeMerchantName(merchant)

      // Assert
      expect(result).toBe('')
    })
  })

  describe('calculateStringSimilarity', () => {
    it('should handle null or undefined strings', () => {
      // Arrange
      const str1 = null as any
      const str2 = 'test'

      // Act
      const result = calculateStringSimilarity(str1, str2)

      // Assert
      expect(result).toBe(0)
    })

    it('should handle both strings being empty', () => {
      // Arrange
      const str1 = ''
      const str2 = ''

      // Act
      const result = calculateStringSimilarity(str1, str2)

      // Assert
      expect(result).toBe(0)
    })
  })

  describe('toNumber', () => {
    it('should handle zero', () => {
      // Arrange
      const decimal = new Decimal(0)

      // Act
      const result = toNumber(decimal)

      // Assert
      expect(result).toBe(0)
    })

    it('should handle negative numbers', () => {
      // Arrange
      const decimal = new Decimal(-45.99)

      // Act
      const result = toNumber(decimal)

      // Assert
      expect(result).toBe(-45.99)
    })

    it('should handle large numbers', () => {
      // Arrange
      const decimal = new Decimal(999999.99)

      // Act
      const result = toNumber(decimal)

      // Assert
      expect(result).toBe(999999.99)
    })
  })
})
