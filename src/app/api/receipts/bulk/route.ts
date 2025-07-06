import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { deleteReceipt, updateReceipt, getReceiptsByUserId } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, receiptIds, category, subcategory } = body

    // Validate required fields
    if (!action || !receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: action and receiptIds array required' },
        { status: 400 }
      )
    }

    // Validate action type
    if (!['delete', 'categorize', 'export'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action: must be delete, categorize, or export' },
        { status: 400 }
      )
    }

    // Validate categorize action requires category
    if (action === 'categorize' && !category) {
      return NextResponse.json(
        { error: 'Category is required for categorize action' },
        { status: 400 }
      )
    }

    // Limit bulk operations to prevent abuse
    if (receiptIds.length > 100) {
      return NextResponse.json(
        { error: 'Cannot process more than 100 receipts at once' },
        { status: 400 }
      )
    }

    let results: any[] = []
    let errors: any[] = []

    switch (action) {
      case 'delete':
        // Delete receipts
        for (const receiptId of receiptIds) {
          try {
            const deletedReceipt = await deleteReceipt(receiptId)
            results.push({ id: receiptId, success: true, data: deletedReceipt })
          } catch (error) {
            console.error(`Failed to delete receipt ${receiptId}:`, error)
            errors.push({ id: receiptId, success: false, error: 'Failed to delete receipt' })
          }
        }
        break

      case 'categorize':
        // Update receipt categories
        for (const receiptId of receiptIds) {
          try {
            const updatedReceipt = await updateReceipt(receiptId, {
              category,
              subcategory
            })
            results.push({ id: receiptId, success: true, data: updatedReceipt })
          } catch (error) {
            console.error(`Failed to categorize receipt ${receiptId}:`, error)
            errors.push({ id: receiptId, success: false, error: 'Failed to categorize receipt' })
          }
        }
        break

      case 'export':
        // Get receipt data for export
        const receipts = await getReceiptsByUserId(user.id, { take: 1000 }) // Get all receipts for export
        const exportData = receipts
          .filter(receipt => receiptIds.includes(receipt.id))
          .map(receipt => ({
            id: receipt.id,
            merchant: receipt.merchant,
            total: receipt.total.toString(),
            purchaseDate: receipt.purchaseDate.toISOString(),
            category: receipt.category,
            subcategory: receipt.subcategory,
            summary: receipt.summary,
            createdAt: receipt.createdAt.toISOString()
          }))
        
        results = exportData.map(receipt => ({ id: receipt.id, success: true, data: receipt }))
        break
    }

    const successCount = results.length
    const errorCount = errors.length

    return NextResponse.json({
      success: true,
      action,
      summary: {
        total: receiptIds.length,
        successful: successCount,
        failed: errorCount
      },
      results,
      errors
    })

  } catch (error) {
    console.error('Error in bulk receipt operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 