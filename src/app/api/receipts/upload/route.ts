import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createReceipt, createUser, getUserById, updateReceipt } from '@/lib/db'
import { Decimal } from '@/generated/prisma/runtime/library'
import { cookies } from 'next/headers'
import { extractReceiptDataWithAI } from '@/lib/services/openai'
import { extractTextFromImage, imageBufferToBase64, compressImage } from '@/lib/services/cloudOcr'
import { AnalyticsService } from '@/lib/services/analytics'
import { realtimeService } from '@/lib/services/realtime'

// ============================================================================
// RECEIPT UPLOAD API ROUTE - PERFORMANCE OPTIMIZED
// ============================================================================
// Handles receipt image upload with async processing for better UX
// Follows STEWARD_MASTER_SYSTEM_GUIDE.md sections: Scalability and Performance,
// Concurrent Upload Handling, and File Storage Optimization

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
    // IMAGE COMPRESSION & OPTIMIZATION (see master guide: File Storage Optimization)
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
      
      // Compress image for better performance (see master guide: File Storage Optimization)
      console.log('Compressing image for better performance...')
      processedBuffer = await compressImage(fileBuffer, file.type)
      fileExtension = file.name.split('.').pop() || 'jpg'
      contentType = 'image/jpeg' // Always use JPEG for compressed images
      
      console.log('Compression complete - Original size:', fileBuffer.length, 'bytes, Compressed size:', processedBuffer.length, 'bytes')
      
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
    // IMMEDIATE RESPONSE WITH ASYNC PROCESSING (see master guide: Scalability and Performance)
    // ============================================================================
    // Create a temporary receipt record immediately for better UX
    console.log('Creating temporary receipt record for user:', user.id)

    const tempReceipt = await createReceipt({
      userId: user.id,
      imageUrl: publicUrl,
      rawText: 'Processing...',
      merchant: 'Processing...',
      total: 0,
      purchaseDate: new Date(),
      summary: 'Processing receipt...'
    })

    // Start async processing in the background (see master guide: Concurrent Upload Handling)
    processReceiptAsync(tempReceipt.id, processedBuffer, contentType, user.id).catch(error => {
      console.error('Async receipt processing failed:', error)
    })

    // ============================================================================
    // IMMEDIATE API RESPONSE (see master guide: API Response Typing)
    // ============================================================================
    return NextResponse.json({
      success: true,
      receipt: {
        id: tempReceipt.id,
        imageUrl: publicUrl,
        merchant: 'Processing...',
        total: 0,
        purchaseDate: tempReceipt.purchaseDate,
        ocrConfidence: 0,
        category: null,
        tags: [],
        summary: 'Processing receipt...',
        status: 'processing'
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

// ============================================================================
// ASYNC RECEIPT PROCESSING FUNCTION (see master guide: Concurrent Upload Handling)
// ============================================================================
/**
 * Processes receipt asynchronously in the background
 * This allows the upload to return immediately while processing continues
 */
async function processReceiptAsync(
  receiptId: string, 
  imageBuffer: Buffer, 
  contentType: string, 
  userId: string
) {
  console.log('Starting async processing for receipt:', receiptId)
  
  try {
    // 1. Run OCR on the uploaded image (using Google Cloud Vision API)
    let ocrText: string
    try {
      console.log('Starting OCR processing for receipt:', receiptId)
      const base64Image = imageBufferToBase64(imageBuffer, contentType)
      ocrText = await extractTextFromImage(base64Image)
      console.log('OCR completed for receipt:', receiptId)
    } catch (error) {
      console.error('OCR extraction failed for receipt:', receiptId, error)
      ocrText = 'OCR processing failed'
    }

    // 2. Use OpenAI to extract structured data and summary (see master guide: AI Categorization)
    let aiData
    try {
      console.log('Starting AI processing for receipt:', receiptId)
      aiData = await extractReceiptDataWithAI(ocrText)
      console.log('AI processing completed for receipt:', receiptId)
    } catch (err) {
      console.error('OpenAI extraction failed for receipt:', receiptId, err)
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

    // 3. Update the receipt record with processed data (see master guide: Data Persistence)
    const merchant = aiData.merchant || 'Unknown Merchant'
    const total = typeof aiData.total === 'number' && !isNaN(aiData.total) ? aiData.total : 0
    const purchaseDate = aiData.purchaseDate ? new Date(aiData.purchaseDate) : new Date()
    const summary = aiData.summary || 'No summary generated'
    const ocrConfidence = typeof aiData.confidence === 'number' ? aiData.confidence : 0

    // Update the receipt with processed data (see master guide: Data Persistence)
    await updateReceipt(receiptId, {
      merchant,
      total: new Decimal(total),
      purchaseDate,
      summary
    })
    
    console.log('Receipt processing completed and database updated:', {
      receiptId,
      merchant,
      total,
      purchaseDate,
      summary,
      ocrConfidence
    })

    // 4. Invalidate analytics cache (see master guide: Scalability and Performance)
    try {
      const analyticsService = new AnalyticsService();
      await analyticsService.invalidateUserCache(userId);
      console.log('Analytics cache invalidated for user:', userId);
      
      // 5. Broadcast real-time analytics update (see master guide: Scalability and Performance)
      try {
        await realtimeService.broadcastAnalyticsUpdate(userId);
        console.log('Real-time analytics update broadcasted for user:', userId);
      } catch (broadcastError) {
        console.error('Failed to broadcast analytics update:', broadcastError);
        // Don't fail the processing if broadcasting fails
      }
    } catch (cacheError) {
      console.error('Failed to invalidate analytics cache:', cacheError);
      // Don't fail the processing if cache invalidation fails
    }

    console.log('Async processing completed successfully for receipt:', receiptId)
    
  } catch (error) {
    console.error('Async processing failed for receipt:', receiptId, error)
  }
}

 