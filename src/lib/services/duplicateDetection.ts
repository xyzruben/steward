// ============================================================================
// DUPLICATE DETECTION SERVICE
// ============================================================================
// Intelligent duplicate receipt detection using multiple criteria
// See: RECEIPT_DUPLICATE_FIX.md - Phase 2

// External libraries
import { Decimal } from '@prisma/client/runtime/library'
import { startOfDay, endOfDay } from 'date-fns'

// Internal modules
import { prisma } from '@/lib/prisma'

// Type imports
import type { Receipt } from '@prisma/client'

// ============================================================================
// CONSTANTS
// ============================================================================

// Duplicate detection thresholds
export const DUPLICATE_CONFIDENCE_THRESHOLD = 0.80
export const AUTO_MARK_CONFIDENCE_THRESHOLD = 0.90
export const AMOUNT_TOLERANCE = 0.01 // $0.01
export const DATE_WINDOW_DAYS = 1 // Check receipts within 1 day

// Confidence scoring weights
export const CONFIDENCE_WEIGHTS = {
  EXACT_MERCHANT: 0.40,
  EXACT_TOTAL: 0.30,
  SAME_DATE: 0.20,
  SIMILAR_TEXT: 0.10,
} as const

// ============================================================================
// TYPES
// ============================================================================

export interface DuplicateCheckCriteria {
  userId: string
  merchant: string
  total: number
  purchaseDate: Date
  rawText?: string
}

export interface DuplicateDetectionResult {
  duplicates: DuplicateMatch[]
  totalScanned: number
  duplicatesFound: number
}

export interface DuplicateMatch {
  receipt: Receipt
  confidence: number
  reasons: string[]
}

export interface BatchDetectionOptions {
  autoMark?: boolean
  confidenceThreshold?: number
  dateRange?: {
    start: Date
    end: Date
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize merchant name for duplicate comparison
 * Removes special characters, extra spaces, and converts to lowercase
 */
export function normalizeMerchantName(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim()
}

/**
 * Calculate similarity between two strings using simple character matching
 * Returns a score between 0.0 (completely different) and 1.0 (identical)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  if (s1 === s2) return 1.0

  // Simple character overlap calculation
  const chars1 = new Set(s1.split(''))
  const chars2 = new Set(s2.split(''))

  let overlap = 0
  chars1.forEach(char => {
    if (chars2.has(char)) overlap++
  })

  const maxLength = Math.max(s1.length, s2.length)
  return overlap / maxLength
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Convert Decimal to number safely
 */
export function toNumber(value: Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber()
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate confidence score that two receipts are duplicates
 *
 * Scoring breakdown:
 * - Exact merchant match: +0.40
 * - Exact total match: +0.30
 * - Same purchase date: +0.20
 * - Similar raw text (>80%): +0.10
 *
 * @returns Confidence score between 0.00 and 1.00
 */
export function calculateDuplicateConfidence(
  receipt1: Receipt,
  receipt2: Receipt
): number {
  let confidence = 0
  const reasons: string[] = []

  // Check merchant match (40 points)
  const merchant1 = normalizeMerchantName(receipt1.merchant)
  const merchant2 = normalizeMerchantName(receipt2.merchant)

  if (merchant1 === merchant2) {
    confidence += CONFIDENCE_WEIGHTS.EXACT_MERCHANT
    reasons.push('Exact merchant match')
  } else {
    // Partial merchant match
    const similarity = calculateStringSimilarity(merchant1, merchant2)
    if (similarity > 0.8) {
      confidence += CONFIDENCE_WEIGHTS.EXACT_MERCHANT * similarity
      reasons.push(`Similar merchant (${Math.round(similarity * 100)}%)`)
    }
  }

  // Check total match (30 points)
  const total1 = toNumber(receipt1.total)
  const total2 = toNumber(receipt2.total)
  const totalDiff = Math.abs(total1 - total2)

  if (totalDiff <= AMOUNT_TOLERANCE) {
    confidence += CONFIDENCE_WEIGHTS.EXACT_TOTAL
    reasons.push('Exact total match')
  } else if (totalDiff <= 0.10) {
    // Close match within 10 cents
    const proximity = 1 - (totalDiff / 0.10)
    confidence += CONFIDENCE_WEIGHTS.EXACT_TOTAL * proximity
    reasons.push(`Similar total (within $${totalDiff.toFixed(2)})`)
  }

  // Check date match (20 points)
  const date1 = new Date(receipt1.purchaseDate)
  const date2 = new Date(receipt2.purchaseDate)

  if (isSameDay(date1, date2)) {
    confidence += CONFIDENCE_WEIGHTS.SAME_DATE
    reasons.push('Same purchase date')
  }

  // Check raw text similarity (10 points)
  if (receipt1.rawText && receipt2.rawText) {
    const textSimilarity = calculateStringSimilarity(receipt1.rawText, receipt2.rawText)
    if (textSimilarity > 0.8) {
      confidence += CONFIDENCE_WEIGHTS.SIMILAR_TEXT * textSimilarity
      reasons.push(`Similar text (${Math.round(textSimilarity * 100)}%)`)
    }
  }

  return Math.min(confidence, 1.0)
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Find potential duplicate receipts for given criteria
 * Searches for receipts with similar merchant, amount, and date
 */
export async function findDuplicates(
  criteria: DuplicateCheckCriteria
): Promise<Receipt[]> {
  try {
    // Validate input
    if (!criteria.userId) {
      throw new Error('userId is required for duplicate detection')
    }

    if (!criteria.merchant || !criteria.total || !criteria.purchaseDate) {
      throw new Error('merchant, total, and purchaseDate are required')
    }

    // Build where clause for potential duplicates
    const normalizedMerchant = normalizeMerchantName(criteria.merchant)
    const dateStart = startOfDay(criteria.purchaseDate)
    const dateEnd = endOfDay(criteria.purchaseDate)

    const whereClause: any = {
      userId: criteria.userId,
      isDuplicate: false, // Only check against originals
      merchant: {
        contains: normalizedMerchant,
        mode: 'insensitive'
      },
      purchaseDate: {
        gte: dateStart,
        lte: dateEnd,
      },
      total: {
        gte: criteria.total - 1.0, // Search within $1 range
        lte: criteria.total + 1.0,
      },
    }

    // Execute query
    const potentialDuplicates = await prisma.receipt.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }, // Oldest first (original)
    })

    console.log(`🔍 Duplicate Detection: Found ${potentialDuplicates.length} potential matches`, {
      userId: criteria.userId,
      merchant: criteria.merchant,
      total: criteria.total,
    })

    return potentialDuplicates
  } catch (error) {
    console.error('🔍 Duplicate Detection: Find duplicates failed:', error)
    throw error
  }
}

/**
 * Check if a receipt is a duplicate and return the best match
 * Returns null if no duplicate found above threshold
 */
export async function checkIsDuplicate(
  receipt: Receipt,
  threshold: number = DUPLICATE_CONFIDENCE_THRESHOLD
): Promise<DuplicateMatch | null> {
  try {
    const criteria: DuplicateCheckCriteria = {
      userId: receipt.userId,
      merchant: receipt.merchant,
      total: toNumber(receipt.total),
      purchaseDate: new Date(receipt.purchaseDate),
      rawText: receipt.rawText,
    }

    const potentialDuplicates = await findDuplicates(criteria)

    // Filter out the receipt itself
    const otherReceipts = potentialDuplicates.filter(r => r.id !== receipt.id)

    if (otherReceipts.length === 0) {
      return null
    }

    // Calculate confidence for each potential duplicate
    const matches: DuplicateMatch[] = otherReceipts.map(potentialDuplicate => {
      const confidence = calculateDuplicateConfidence(receipt, potentialDuplicate)

      return {
        receipt: potentialDuplicate,
        confidence,
        reasons: [] // Could be populated from confidence calculation
      }
    })

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence)

    // Return best match if above threshold
    const bestMatch = matches[0]
    if (bestMatch && bestMatch.confidence >= threshold) {
      console.log(`✅ Duplicate Detection: High confidence match found`, {
        receiptId: receipt.id,
        duplicateOfId: bestMatch.receipt.id,
        confidence: bestMatch.confidence.toFixed(2),
      })
      return bestMatch
    }

    return null
  } catch (error) {
    console.error('🔍 Duplicate Detection: Check failed:', error)
    throw error
  }
}

/**
 * Detect duplicates for a specific receipt and mark if confidence is high
 * Used during upload processing
 */
export async function detectAndMarkDuplicate(
  receiptId: string,
  autoMark: boolean = true
): Promise<DuplicateMatch | null> {
  try {
    // Get the receipt
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId }
    })

    if (!receipt) {
      throw new Error(`Receipt ${receiptId} not found`)
    }

    // Check if already marked as duplicate
    if (receipt.isDuplicate) {
      console.log(`⚠️ Duplicate Detection: Receipt already marked as duplicate`, {
        receiptId
      })
      return null
    }

    // Find duplicates
    const match = await checkIsDuplicate(receipt, DUPLICATE_CONFIDENCE_THRESHOLD)

    if (!match) {
      console.log(`✅ Duplicate Detection: No duplicates found`, { receiptId })
      return null
    }

    // Auto-mark if confidence is very high and autoMark is enabled
    if (autoMark && match.confidence >= AUTO_MARK_CONFIDENCE_THRESHOLD) {
      await markAsDuplicate(receiptId, match.receipt.id, match.confidence)
      console.log(`🔖 Duplicate Detection: Auto-marked as duplicate`, {
        receiptId,
        originalId: match.receipt.id,
        confidence: match.confidence.toFixed(2),
      })
    }

    return match
  } catch (error) {
    console.error('🔍 Duplicate Detection: Detect and mark failed:', error)
    throw error
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Mark a receipt as a duplicate of another receipt
 */
export async function markAsDuplicate(
  duplicateId: string,
  originalId: string,
  confidence: number
): Promise<void> {
  try {
    await prisma.receipt.update({
      where: { id: duplicateId },
      data: {
        isDuplicate: true,
        duplicateOf: originalId,
        duplicateConfidence: new Decimal(confidence),
      }
    })

    console.log(`✅ Duplicate Detection: Marked receipt as duplicate`, {
      duplicateId,
      originalId,
      confidence: confidence.toFixed(2)
    })
  } catch (error) {
    console.error('❌ Duplicate Detection: Mark as duplicate failed:', error)
    throw error
  }
}

/**
 * Unmark a receipt as duplicate (restore to original)
 */
export async function unmarkAsDuplicate(receiptId: string): Promise<void> {
  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        isDuplicate: false,
        duplicateOf: null,
        duplicateConfidence: null,
      }
    })

    console.log(`✅ Duplicate Detection: Unmarked receipt as duplicate`, {
      receiptId
    })
  } catch (error) {
    console.error('❌ Duplicate Detection: Unmark failed:', error)
    throw error
  }
}

/**
 * Get all duplicates of a specific receipt
 */
export async function getDuplicatesOf(receiptId: string): Promise<Receipt[]> {
  try {
    const duplicates = await prisma.receipt.findMany({
      where: {
        duplicateOf: receiptId,
        isDuplicate: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`🔍 Duplicate Detection: Found ${duplicates.length} duplicates`, {
      originalId: receiptId
    })

    return duplicates
  } catch (error) {
    console.error('🔍 Duplicate Detection: Get duplicates failed:', error)
    throw error
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Detect duplicates for all receipts in a user's account
 * Useful for initial scan or re-scanning after changes
 */
export async function detectDuplicatesForUser(
  userId: string,
  options: BatchDetectionOptions = {}
): Promise<DuplicateDetectionResult> {
  try {
    const {
      autoMark = false,
      confidenceThreshold = DUPLICATE_CONFIDENCE_THRESHOLD,
      dateRange
    } = options

    console.log(`🔍 Duplicate Detection: Starting batch detection for user`, {
      userId,
      autoMark,
      confidenceThreshold
    })

    // Build where clause for receipts to scan
    const whereClause: any = {
      userId,
      isDuplicate: false, // Only scan originals
    }

    if (dateRange) {
      whereClause.purchaseDate = {
        gte: dateRange.start,
        lte: dateRange.end,
      }
    }

    // Get all non-duplicate receipts
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    })

    console.log(`📊 Duplicate Detection: Scanning ${receipts.length} receipts`)

    const duplicateMatches: DuplicateMatch[] = []
    let processed = 0

    // Check each receipt for duplicates
    for (const receipt of receipts) {
      processed++

      // Find potential duplicates created before this receipt
      const olderReceipts = receipts.filter(r =>
        new Date(r.createdAt) < new Date(receipt.createdAt)
      )

      // Calculate confidence against each older receipt
      for (const olderReceipt of olderReceipts) {
        const confidence = calculateDuplicateConfidence(receipt, olderReceipt)

        if (confidence >= confidenceThreshold) {
          duplicateMatches.push({
            receipt,
            confidence,
            reasons: [`Matches receipt ${olderReceipt.id}`]
          })

          // Auto-mark if enabled and confidence is high enough
          if (autoMark && confidence >= AUTO_MARK_CONFIDENCE_THRESHOLD) {
            await markAsDuplicate(receipt.id, olderReceipt.id, confidence)
          }

          // Only match to one original
          break
        }
      }

      // Log progress every 10 receipts
      if (processed % 10 === 0) {
        console.log(`📊 Progress: ${processed}/${receipts.length} receipts scanned`)
      }
    }

    const result: DuplicateDetectionResult = {
      duplicates: duplicateMatches,
      totalScanned: receipts.length,
      duplicatesFound: duplicateMatches.length,
    }

    console.log(`✅ Duplicate Detection: Batch detection complete`, {
      userId,
      totalScanned: result.totalScanned,
      duplicatesFound: result.duplicatesFound,
      autoMarked: autoMark ? duplicateMatches.filter(m => m.confidence >= AUTO_MARK_CONFIDENCE_THRESHOLD).length : 0
    })

    return result
  } catch (error) {
    console.error('❌ Duplicate Detection: Batch detection failed:', error)
    throw error
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Detection functions
  findDuplicates,
  checkIsDuplicate,
  detectAndMarkDuplicate,
  detectDuplicatesForUser,

  // Database operations
  markAsDuplicate,
  unmarkAsDuplicate,
  getDuplicatesOf,

  // Utility functions
  normalizeMerchantName,
  calculateDuplicateConfidence,
  calculateStringSimilarity,

  // Constants
  DUPLICATE_CONFIDENCE_THRESHOLD,
  AUTO_MARK_CONFIDENCE_THRESHOLD,
  AMOUNT_TOLERANCE,
}
