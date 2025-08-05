import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getReceiptsByUserId } from '@/lib/db'
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

    // Get export parameters
    const { filters = {}, searchTerm = '' } = await request.json()

    // Build query parameters for receipt fetching
    const queryParams: any = {
      take: 1000, // Get all receipts for export
      orderBy: 'createdAt',
      order: 'desc'
    }

    // Apply filters
    if (searchTerm) {
      queryParams.search = searchTerm
    }
    
    if (filters.category) {
      queryParams.category = filters.category
    }
    
    if (filters.merchant) {
      queryParams.merchant = filters.merchant
    }
    
    if (filters.minAmount !== undefined) {
      queryParams.minAmount = filters.minAmount
    }
    
    if (filters.maxAmount !== undefined) {
      queryParams.maxAmount = filters.maxAmount
    }

    // Fetch receipts
    const receipts = await getReceiptsByUserId(user.id, queryParams)

    // Convert to CSV
    const csvHeaders = [
      'ID',
      'Merchant',
      'Amount',
      'Date',
      'Category',
      'Subcategory',
      'Currency',
      'Confidence Score',
      'Created At'
    ]

    const csvRows = receipts.map(receipt => [
      receipt.id,
      receipt.merchant,
      receipt.total.toString(),
      receipt.purchaseDate.toISOString().split('T')[0],
      receipt.category || '',
      receipt.subcategory || '',
      receipt.currency || 'USD',
      receipt.confidenceScore?.toString() || '',
      receipt.createdAt.toISOString().split('T')[0]
    ])

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="receipts-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export receipts' },
      { status: 500 }
    )
  }
} 