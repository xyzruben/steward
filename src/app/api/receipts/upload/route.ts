import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createReceipt, createUser, getUserById } from '@/lib/db'
import { cookies } from 'next/headers'
import { OCRService } from '@/lib/services/ocr'
import { extractReceiptDataWithAI } from '@/lib/services/openai'

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

    // Ensure user exists in our database
    let dbUser = await getUserById(user.id)
    if (!dbUser) {
      console.log('User not found in database, creating...', user.id)
      try {
        dbUser = await createUser({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
        console.log('User created in database:', dbUser.id)
      } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        )
      }
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('receipt') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}/${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)

    // =============================
    // AI-POWERED OCR & ENRICHMENT
    // =============================
    // 1. Run OCR on the uploaded image (see master guide: OCR Processing)
    const ocrService = new OCRService()
    let ocrResult
    try {
      ocrResult = await ocrService.extractText(publicUrl)
    } catch (err) {
      console.error('OCR extraction failed:', err)
      return NextResponse.json(
        { error: 'Failed to extract text from image' },
        { status: 500 }
      )
    }

    // 2. Use OpenAI to extract structured data and summary (see master guide: AI Categorization)
    let aiData
    try {
      aiData = await extractReceiptDataWithAI(ocrResult.text)
    } catch (err) {
      console.error('OpenAI extraction failed:', err)
      // Defensive: fallback to basic fields if AI fails
      aiData = {
        merchant: null,
        total: null,
        purchaseDate: null,
        category: null,
        tags: [],
        confidence: 0,
        summary: null,
      }
    }

    // 3. Prepare fields for DB (see master guide: Data Persistence, Type Safety)
    const merchant = aiData.merchant || 'Unknown Merchant'
    const total = typeof aiData.total === 'number' && !isNaN(aiData.total) ? aiData.total : 0
    const purchaseDate = aiData.purchaseDate ? new Date(aiData.purchaseDate) : new Date()
    const summary = aiData.summary || 'No summary generated'
    const ocrConfidence = typeof aiData.confidence === 'number' ? aiData.confidence : 0

    // Log the user ID before saving
    console.log('user.id being used for receipt:', user.id)

    // 4. Create receipt record in database (see master guide: Database Schema Design)
    const receipt = await createReceipt({
      userId: user.id,
      imageUrl: publicUrl,
      rawText: ocrResult.text,
      merchant: merchant,
      total: total,
      purchaseDate: purchaseDate,
      summary: summary
    })

    // 5. Return enriched response (see master guide: API Response Typing)
    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        imageUrl: publicUrl,
        merchant: receipt.merchant,
        total: receipt.total,
        purchaseDate: receipt.purchaseDate,
        ocrConfidence: ocrConfidence,
        category: aiData.category,
        tags: aiData.tags,
        summary: summary
      }
    })

  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractMerchantFromText(text: string): string | null {
  // Simple merchant extraction - will be enhanced with AI later
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Look for common merchant patterns
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    const cleanLine = line.trim()
    if (cleanLine.length > 3 && cleanLine.length < 50) {
      // Skip lines that look like prices or dates
      if (!/^\$?\d+\.?\d*$/.test(cleanLine) && !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cleanLine)) {
        return cleanLine
      }
    }
  }
  
  return null
}

function extractTotalFromText(text: string): number | null {
  // Simple total extraction - will be enhanced with AI later
  const totalPatterns = [
    /total.*?\$?(\d+\.?\d*)/i,
    /amount.*?\$?(\d+\.?\d*)/i,
    /sum.*?\$?(\d+\.?\d*)/i,
    /\$(\d+\.?\d*)/g
  ]
  
  for (const pattern of totalPatterns) {
    const matches = text.match(pattern)
    if (matches && matches[1]) {
      const amount = parseFloat(matches[1])
      if (!isNaN(amount) && amount > 0) {
        return amount
      }
    }
  }
  
  return null
} 