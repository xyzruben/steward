import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { categorizeReceipt } from '@/lib/services/financeFunctions'

// ============================================================================
// BATCH RE-CATEGORIZATION API ROUTE
// ============================================================================
// Re-categorizes all existing "Uncategorized" receipts using intelligent merchant matching
// This endpoint processes receipts in batches for performance and provides progress feedback

export async function POST(request: NextRequest) {
  console.log('=== BATCH RE-CATEGORIZATION START ===')
  
  try {
    // ============================================================================
    // AUTHENTICATION & USER VALIDATION
    // ============================================================================
    const supabase = createSupabaseServerClient(request.cookies as any)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ============================================================================
    // GET ALL UNCATEGORIZED RECEIPTS FOR THE USER
    // ============================================================================
    console.log(`🔍 Finding uncategorized receipts for user: ${user.id}`)
    
    const uncategorizedReceipts = await prisma.receipt.findMany({
      where: {
        userId: user.id,
        OR: [
          { category: null },
          { category: 'Uncategorized' },
          { category: '' }
        ]
      },
      select: {
        id: true,
        merchant: true,
        category: true
      }
    })

    console.log(`📊 Found ${uncategorizedReceipts.length} uncategorized receipts`)

    if (uncategorizedReceipts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No uncategorized receipts found',
        processed: 0,
        categorized: 0,
        unchanged: 0
      })
    }

    // ============================================================================
    // BATCH RE-CATEGORIZATION PROCESSING
    // ============================================================================
    console.log(`🏷️ Starting batch re-categorization for ${uncategorizedReceipts.length} receipts`)
    
    let categorized = 0
    let unchanged = 0
    const results: Array<{
      id: string
      merchant: string
      oldCategory: string | null
      newCategory: string
      changed: boolean
    }> = []

    // Process each receipt
    for (const receipt of uncategorizedReceipts) {
      const oldCategory = receipt.category
      const newCategory = categorizeReceipt(receipt.merchant)
      const changed = oldCategory !== newCategory

      // Update the receipt in the database
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { category: newCategory }
      })

      results.push({
        id: receipt.id,
        merchant: receipt.merchant,
        oldCategory,
        newCategory,
        changed
      })

      if (changed) {
        categorized++
        console.log(`✅ Re-categorized: ${receipt.merchant} -> ${newCategory}`)
      } else {
        unchanged++
        console.log(`⏭️ No change: ${receipt.merchant} (${newCategory})`)
      }
    }

    // ============================================================================
    // SUCCESS RESPONSE
    // ============================================================================
    console.log(`🎉 Batch re-categorization completed successfully`)
    console.log(`📊 Results: ${categorized} categorized, ${unchanged} unchanged`)

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${uncategorizedReceipts.length} receipts`,
      processed: uncategorizedReceipts.length,
      categorized,
      unchanged,
      results: results.slice(0, 10) // Return first 10 results for preview
    })

  } catch (error) {
    console.error('💥 Batch re-categorization failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to re-categorize receipts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET ENDPOINT FOR STATUS CHECK
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request.cookies as any)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get statistics about receipt categories
    const categoryStats = await prisma.receipt.groupBy({
      by: ['category'],
      where: {
        userId: user.id
      },
      _count: {
        id: true
      }
    })

    const uncategorizedCount = categoryStats.find(stat => 
      !stat.category || stat.category === 'Uncategorized' || stat.category === ''
    )?._count.id || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalReceipts: categoryStats.reduce((sum, stat) => sum + stat._count.id, 0),
        uncategorizedCount,
        categoryBreakdown: categoryStats.map(stat => ({
          category: stat.category || 'Uncategorized',
          count: stat._count.id
        }))
      }
    })

  } catch (error) {
    console.error('💥 Failed to get categorization stats:', error)
    
    return NextResponse.json(
      { error: 'Failed to get categorization statistics' },
      { status: 500 }
    )
  }
} 