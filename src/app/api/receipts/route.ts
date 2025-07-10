import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getReceiptsByUserId } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')
    const orderBy = searchParams.get('orderBy') as 'createdAt' | 'purchaseDate' | 'total' | 'merchant' || 'createdAt'
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc'
    
    // Search and filter parameters
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const subcategory = searchParams.get('subcategory') || undefined
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const minConfidence = searchParams.get('minConfidence') ? parseFloat(searchParams.get('minConfidence')!) : undefined

    // Validate numeric parameters
    if (minAmount !== undefined && isNaN(minAmount)) {
      return NextResponse.json(
        { error: 'Invalid minAmount parameter' },
        { status: 400 }
      )
    }
    
    if (maxAmount !== undefined && isNaN(maxAmount)) {
      return NextResponse.json(
        { error: 'Invalid maxAmount parameter' },
        { status: 400 }
      )
    }
    
    if (minConfidence !== undefined && (isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1)) {
      return NextResponse.json(
        { error: 'Invalid minConfidence parameter (must be between 0 and 1)' },
        { status: 400 }
      )
    }

    // Validate date parameters
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate parameter' },
        { status: 400 }
      )
    }
    
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid endDate parameter' },
        { status: 400 }
      )
    }

    // Validate amount range
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      return NextResponse.json(
        { error: 'minAmount cannot be greater than maxAmount' },
        { status: 400 }
      )
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate cannot be after endDate' },
        { status: 400 }
      )
    }

    // Try to get receipts from database
    try {
      const receipts = await getReceiptsByUserId(user.id, {
        skip,
        take: limit,
        orderBy,
        order,
        search,
        category,
        subcategory,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        minConfidence
      })

      return NextResponse.json(receipts)
    } catch (dbError) {
      console.warn('Receipts API: Database error, returning empty array:', dbError)
      
      // Return empty array if database is unavailable
      return NextResponse.json([], {
        headers: {
          'X-Database-Status': 'unavailable'
        }
      })
    }
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 