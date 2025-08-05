import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getReceiptsByUserId } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    },
    auth: {},
    database: {},
    receipts: {}
  }

  try {
    // 1. Test Supabase Auth
    console.log('🔍 Debug: Testing Supabase Auth...')
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      debugInfo.auth = {
        status: 'ERROR',
        error: authError.message,
        user: null
      }
    } else if (!user) {
      debugInfo.auth = {
        status: 'UNAUTHENTICATED',
        error: 'No user session found',
        user: null
      }
    } else {
      debugInfo.auth = {
        status: 'SUCCESS',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      }
    }

    // 2. Test Database Connection
    console.log('🔍 Debug: Testing Database Connection...')
    try {
      await prisma.$connect()
      const dbResult = await prisma.$queryRaw`SELECT 1 as test`
      debugInfo.database = {
        status: 'SUCCESS',
        connection: 'Connected',
        testQuery: dbResult
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      debugInfo.database = {
        status: 'ERROR',
        connection: 'Failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    }

    // 3. Test Receipt Queries (only if user is authenticated)
    if (user && debugInfo.database.status === 'SUCCESS') {
      console.log('🔍 Debug: Testing Receipt Queries...')
      try {
        // Test direct Prisma query
        const directReceipts = await prisma.receipt.findMany({
          where: { userId: user.id },
          take: 5,
          orderBy: { createdAt: 'desc' }
        })

        // Test via our helper function
        const helperReceipts = await getReceiptsByUserId(user.id, { take: 5 })

        debugInfo.receipts = {
          status: 'SUCCESS',
          directQuery: {
            count: directReceipts.length,
            receipts: directReceipts.map(r => ({
              id: r.id,
              merchant: r.merchant,
              total: r.total,
              purchaseDate: r.purchaseDate,
              category: r.category,
              createdAt: r.createdAt
            }))
          },
          helperQuery: {
            count: helperReceipts.length,
            receipts: helperReceipts.map(r => ({
              id: r.id,
              merchant: r.merchant,
              total: r.total,
              purchaseDate: r.purchaseDate,
              category: r.category,
              createdAt: r.createdAt
            }))
          }
        }

        // Test user existence in database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        })
        
        debugInfo.receipts.userInDatabase = dbUser ? 'EXISTS' : 'NOT FOUND'

      } catch (receiptError) {
        console.error('Receipt query error:', receiptError)
        debugInfo.receipts = {
          status: 'ERROR',
          error: receiptError instanceof Error ? receiptError.message : 'Unknown receipt query error'
        }
      }
    } else {
      debugInfo.receipts = {
        status: 'SKIPPED',
        reason: user ? 'Database connection failed' : 'User not authenticated'
      }
    }

    // 4. Test API endpoint directly
    console.log('🔍 Debug: Testing API endpoint...')
    try {
      if (user) {
        const apiUrl = `${request.nextUrl.origin}/api/receipts?limit=5`
        const apiResponse = await fetch(apiUrl, {
          headers: {
            'Cookie': request.headers.get('Cookie') || ''
          }
        })
        
        const apiData = await apiResponse.json()
        
        debugInfo.apiTest = {
          status: apiResponse.ok ? 'SUCCESS' : 'ERROR',
          statusCode: apiResponse.status,
          data: apiResponse.ok ? {
            count: Array.isArray(apiData) ? apiData.length : 'Not an array',
            sample: Array.isArray(apiData) ? apiData.slice(0, 2) : apiData
          } : apiData
        }
      } else {
        debugInfo.apiTest = {
          status: 'SKIPPED',
          reason: 'User not authenticated'
        }
      }
    } catch (apiError) {
      debugInfo.apiTest = {
        status: 'ERROR',
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    debugInfo.globalError = error instanceof Error ? error.message : 'Unknown global error'
    return NextResponse.json(debugInfo, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}