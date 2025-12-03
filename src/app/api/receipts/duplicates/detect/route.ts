import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { detectDuplicatesForUser } from '@/lib/services/duplicateDetection'
import { secureError } from '@/lib/services/errorHandler'

// ============================================================================
// BATCH DUPLICATE DETECTION API ROUTE
// ============================================================================
// Scans all existing receipts for duplicates and optionally marks them
// See: RECEIPT_DUPLICATE_FIX.md - Phase 5

export async function POST(request: NextRequest) {
  console.log('=== BATCH DUPLICATE DETECTION START ===')

  try {
    // ============================================================================
    // AUTHENTICATION & USER VALIDATION
    // ============================================================================
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return secureError.auth({
        endpoint: '/api/receipts/duplicates/detect',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
    }

    // ============================================================================
    // PARSE REQUEST OPTIONS
    // ============================================================================
    const options: {
      autoMark?: boolean
      confidenceThreshold?: number
      dateRange?: {
        start: Date
        end: Date
      }
    } = {}

    try {
      const body = await request.json()

      // Parse autoMark option (default: false for safety)
      if (typeof body.autoMark === 'boolean') {
        options.autoMark = body.autoMark
      }

      // Parse confidence threshold (default: 0.80)
      if (typeof body.confidenceThreshold === 'number') {
        options.confidenceThreshold = body.confidenceThreshold
      }

      // Parse date range if provided
      if (body.dateRange) {
        const { start, end } = body.dateRange
        if (start && end) {
          options.dateRange = {
            start: new Date(start),
            end: new Date(end)
          }
        }
      }
    } catch {
      // If body parsing fails, use defaults
      console.log('Using default options for batch detection')
    }

    console.log(`🔍 Starting batch duplicate detection for user: ${user.id}`, {
      autoMark: options.autoMark || false,
      confidenceThreshold: options.confidenceThreshold || 0.80,
      hasDateRange: !!options.dateRange
    })

    // ============================================================================
    // RUN BATCH DUPLICATE DETECTION
    // ============================================================================
    const result = await detectDuplicatesForUser(user.id, options)

    console.log(`✅ Batch duplicate detection completed for user: ${user.id}`, {
      totalScanned: result.totalScanned,
      duplicatesFound: result.duplicatesFound
    })

    // ============================================================================
    // SUCCESS RESPONSE
    // ============================================================================
    return NextResponse.json({
      success: true,
      message: `Successfully scanned ${result.totalScanned} receipts`,
      totalScanned: result.totalScanned,
      duplicatesFound: result.duplicatesFound,
      autoMarked: options.autoMark
        ? result.duplicates.filter(d => d.confidence >= 0.90).length
        : 0,
      duplicates: result.duplicates.map(match => ({
        receiptId: match.receipt.id,
        merchant: match.receipt.merchant,
        total: match.receipt.total,
        purchaseDate: match.receipt.purchaseDate,
        confidence: match.confidence,
        reasons: match.reasons,
        wasAutoMarked: options.autoMark && match.confidence >= 0.90
      }))
    })

  } catch (error) {
    console.error('💥 Batch duplicate detection failed:', error)

    return secureError.unknown(error, {
      endpoint: '/api/receipts/duplicates/detect',
    })
  }
}

// ============================================================================
// GET ENDPOINT FOR DUPLICATE STATISTICS
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return secureError.auth({
        endpoint: '/api/receipts/duplicates/detect',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
    }

    // ============================================================================
    // GET DUPLICATE STATISTICS
    // ============================================================================
    const [totalReceipts, duplicateCount, duplicateReceipts] = await Promise.all([
      // Total receipts for user
      prisma.receipt.count({
        where: { userId: user.id }
      }),

      // Count of duplicates
      prisma.receipt.count({
        where: {
          userId: user.id,
          isDuplicate: true
        }
      }),

      // Get duplicate receipts with details
      prisma.receipt.findMany({
        where: {
          userId: user.id,
          isDuplicate: true
        },
        select: {
          id: true,
          merchant: true,
          total: true,
          purchaseDate: true,
          duplicateOf: true,
          duplicateConfidence: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20 // Return most recent 20 duplicates
      })
    ])

    const originalCount = totalReceipts - duplicateCount

    return NextResponse.json({
      success: true,
      stats: {
        totalReceipts,
        originalCount,
        duplicateCount,
        duplicatePercentage: totalReceipts > 0
          ? ((duplicateCount / totalReceipts) * 100).toFixed(2)
          : '0.00',
        recentDuplicates: duplicateReceipts.map(receipt => ({
          id: receipt.id,
          merchant: receipt.merchant,
          total: receipt.total,
          purchaseDate: receipt.purchaseDate,
          duplicateOf: receipt.duplicateOf,
          confidence: receipt.duplicateConfidence,
          createdAt: receipt.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('💥 Failed to get duplicate statistics:', error)

    return secureError.unknown(error, {
      endpoint: '/api/receipts/duplicates/detect - GET'
    })
  }
}
