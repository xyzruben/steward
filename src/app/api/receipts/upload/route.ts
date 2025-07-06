import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createReceipt, createUser, getUserById } from '@/lib/db'
import { cookies } from 'next/headers'
import { extractReceiptDataWithAI } from '@/lib/services/openai'
import { extractTextFromImage, imageBufferToBase64 } from '@/lib/services/cloudOcr'
import { AnalyticsService } from '@/lib/services/analytics'

// ============================================================================
// RECEIPT UPLOAD API ROUTE
// ============================================================================
// Handles receipt image upload, format conversion, OCR, and AI enrichment
// Follows STEWARD_MASTER_SYSTEM_GUIDE.md sections: API Route Principles, 
// Input Validation, File Access Controls, and Type Safety Requirements

export async function POST(request: NextRequest) {
  console.log('=== RECEIPT UPLOAD START ===')
  console.log('Receipt upload endpoint called')
  
  try {
    // ============================================================================
    // AUTHENTICATION & USER VALIDATION (see master guide: Authentication and Authorization)
    // ============================================================================
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ensure user exists in our database (see master guide: Data Persistence)
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

    // ============================================================================
    // FILE VALIDATION & PROCESSING (see master guide: Input Validation, File Storage Optimization)
    // ============================================================================
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (see master guide: Input Validation)
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/heic',
      'image/heif'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Unsupported file format',
          details: 'Supported formats: JPEG, PNG, GIF, WebP, HEIC (iPhone). Please convert to a supported format.'
        },
        { status: 400 }
      )
    }

    // Validate file size (see master guide: File Storage Optimization)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // ============================================================================
    // IMAGE FORMAT CONVERSION (see master guide: File Storage Optimization, Type Safety)
    // ============================================================================
    let processedBuffer: Buffer
    let fileExtension: string
    let contentType: string
    
    try {
      // Convert file to Buffer for processing
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      
      // Debug file information
      console.log('=== FILE DEBUG INFO ===')
      console.log('File name:', file.name)
      console.log('File type:', file.type)
      console.log('File size:', file.size, 'bytes')
      console.log('Buffer size:', fileBuffer.length, 'bytes')
      console.log('File extension:', file.name.split('.').pop()?.toLowerCase())
      
      // Check for HEIC/HEIF files (multiple detection methods)
      const isHeicByType = file.type === 'image/heic' || file.type === 'image/heif'
      const isHeicByExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
      const isHeic = isHeicByType || isHeicByExtension
      
      console.log('Is HEIC by type:', isHeicByType)
      console.log('Is HEIC by extension:', isHeicByExtension)
      console.log('Is HEIC overall:', isHeic)
      console.log('========================')
      
      // Early rejection for HEIC files with clear error message
      if (isHeic) {
        console.log('HEIC file detected, rejecting upload')
        return NextResponse.json(
          { 
            error: 'HEIC files are not supported. Please convert your receipt to JPEG or PNG format before uploading. You can use your phone\'s camera app to save as JPEG, or use online converters.' 
          }, 
          { status: 400 }
        )
      }
      
            // Standard formats - no conversion needed (HEIC files are rejected earlier)
      processedBuffer = fileBuffer
      fileExtension = file.name.split('.').pop() || 'jpg'
      contentType = file.type
      
      // Validate processed image (see master guide: Input Validation)
      if (processedBuffer.length === 0) {
        throw new Error('Image processing resulted in empty buffer')
      }
      
    } catch (conversionError) {
      console.error('Image processing failed:', conversionError)
      return NextResponse.json(
        { 
          error: 'Failed to process image format',
          details: 'Please try uploading a JPEG, PNG, or WebP image instead'
        },
        { status: 500 }
      )
    }

    // ============================================================================
    // FILE UPLOAD TO STORAGE (see master guide: File Access Controls)
    // ============================================================================
    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, processedBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL (see master guide: File Access Controls)
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)

    // ============================================================================
    // AI-POWERED OCR & ENRICHMENT (see master guide: OCR Processing, AI Categorization)
    // ============================================================================
    // 1. Run OCR on the uploaded image (using Google Cloud Vision API)
    let ocrText: string
    try {
      // Validate processed buffer before OCR (see master guide: Input Validation)
      console.log('Processed buffer size:', processedBuffer.length, 'bytes')
      console.log('Content type for OCR:', contentType)
      
      // Ensure we have a valid image buffer
      if (processedBuffer.length < 100) {
        throw new Error('Processed image buffer is too small - conversion may have failed')
      }
      
      // Use base64 encoding to ensure Google Vision API can access the image
      // This works for all formats including converted HEIC files (see master guide: API Integration)
      console.log('Converting image to base64 for Google Vision API processing')
      const base64Image = imageBufferToBase64(processedBuffer, contentType)
      console.log('Base64 image length:', base64Image.length)
      // Temporarily remove base64 prefix logging to test
      // console.log('Base64 image prefix:', base64Image.substring(0, 50) + '...')
      
      ocrText = await extractTextFromImage(base64Image)
    } catch (error) {
      console.error('OCR extraction failed:', error)
      return NextResponse.json({ 
        error: 'OCR extraction failed', 
        details: error instanceof Error ? error.message : error 
      }, { status: 500 })
    }

    // 2. Use OpenAI to extract structured data and summary (see master guide: AI Categorization)
    let aiData
    try {
      aiData = await extractReceiptDataWithAI(ocrText)
    } catch (err) {
      console.error('OpenAI extraction failed:', err)
      // Defensive: fallback to basic fields if AI fails (see master guide: Error Handling)
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

    // ============================================================================
    // DATA PERSISTENCE (see master guide: Data Persistence, Type Safety)
    // ============================================================================
    const merchant = aiData.merchant || 'Unknown Merchant'
    const total = typeof aiData.total === 'number' && !isNaN(aiData.total) ? aiData.total : 0
    const purchaseDate = aiData.purchaseDate ? new Date(aiData.purchaseDate) : new Date()
    const summary = aiData.summary || 'No summary generated'
    const ocrConfidence = typeof aiData.confidence === 'number' ? aiData.confidence : 0

    console.log('Creating receipt record for user:', user.id)

    const receipt = await createReceipt({
      userId: user.id,
      imageUrl: publicUrl,
      rawText: ocrText,
      merchant: merchant,
      total: total,
      purchaseDate: purchaseDate,
      summary: summary
    })

    // ============================================================================
    // CACHE INVALIDATION (see master guide: Scalability and Performance)
    // ============================================================================
    // Invalidate analytics cache when new receipt is added
    try {
      const analyticsService = new AnalyticsService();
      await analyticsService.invalidateUserCache(user.id);
      console.log('Analytics cache invalidated for user:', user.id);
    } catch (cacheError) {
      console.error('Failed to invalidate analytics cache:', cacheError);
      // Don't fail the upload if cache invalidation fails
    }

    // ============================================================================
    // API RESPONSE (see master guide: API Response Typing)
    // ============================================================================
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
    // ============================================================================
    // ERROR HANDLING (see master guide: Secure Error Handling)
    // ============================================================================
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

 