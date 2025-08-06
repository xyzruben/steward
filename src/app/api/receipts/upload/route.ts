import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { createReceipt, createUser, getUserById, updateReceipt } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@/generated/prisma/runtime/library'
import { cookies } from 'next/headers'
import { extractReceiptDataWithAI } from '@/lib/services/openai'
import { extractTextFromImage, imageBufferToBase64, compressImage } from '@/lib/services/cloudOcr'
import { categorizeReceipt } from '@/lib/services/financeFunctions'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'
import { createReceiptImageValidator } from '@/lib/services/fileUploadSecurity'
import { SecureUrlService } from '@/lib/services/secureUrlService'
// Removed analytics, realtime, notifications, userProfile, and embeddings services for performance optimization
// Removed: import { convertCurrency } from '@/lib/services/currency'

// ============================================================================
// RECEIPT UPLOAD API ROUTE - PERFORMANCE OPTIMIZED
// ============================================================================
// Handles receipt image upload with async processing for better UX
// Follows STEWARD_MASTER_SYSTEM_GUIDE.md sections: Scalability and Performance,
// Concurrent Upload Handling, and File Storage Optimization

export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting to upload endpoint
  return withRateLimit(request, RATE_LIMIT_CONFIGS.UPLOAD, async () => {
    return handleUpload(request);
  });
}

async function handleUpload(request: NextRequest) {
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
    // ENHANCED FILE VALIDATION & SECURITY (SECURITY FIX: File Upload Security)
    // ============================================================================
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to Buffer for enhanced security validation
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // SECURITY: Enhanced file validation with signature checking
    const fileValidator = createReceiptImageValidator()
    const validationResult = await fileValidator.validateFile(file, fileBuffer)
    
    if (!validationResult.isValid) {
      console.warn('File validation failed:', {
        fileName: file.name,
        declaredType: file.type,
        detectedType: validationResult.detectedMimeType,
        errors: validationResult.errors,
        warnings: validationResult.securityWarnings
      })
      
      return NextResponse.json(
        { 
          error: 'File validation failed',
          details: validationResult.errors.join('; '),
          securityIssues: validationResult.securityWarnings.length > 0 ? 'Security concerns detected' : undefined
        },
        { status: 400 }
      )
    }

    // Log security warnings (but allow upload to proceed)
    if (validationResult.securityWarnings.length > 0) {
      console.warn('File security warnings:', {
        fileName: file.name,
        warnings: validationResult.securityWarnings
      })
    }

    // SECURITY: Malware scanning (integration point for future enhancement)
    if (fileValidator.config.enableMalwareScanning) {
      try {
        console.log('🔍 Initiating malware scan...')
        const malwareScanResult = await fileValidator.scanForMalware(fileBuffer)
        
        if (!malwareScanResult.isClean) {
          console.error('Malware detected in uploaded file:', {
            fileName: file.name,
            threats: malwareScanResult.threats,
            userId: user.id
          })
          
          return NextResponse.json(
            { 
              error: 'File rejected due to security concerns',
              details: 'The uploaded file was flagged by security scanning'
            },
            { status: 400 }
          )
        }
        console.log('✅ Malware scan completed - file is clean')
      } catch (scanError) {
        console.warn('Malware scanning failed, proceeding with upload:', scanError)
        // Continue with upload even if scanning fails (graceful degradation)
      }
    }

    // Early rejection for HEIC files with clear error message (legacy support)
    const isHeicByType = file.type === 'image/heic' || file.type === 'image/heif'
    const isHeicByExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
    const isHeic = isHeicByType || isHeicByExtension
    
    if (isHeic) {
      console.log('HEIC file detected, rejecting upload')
      return NextResponse.json(
        { 
          error: 'HEIC files are not supported. Please convert your receipt to JPEG or PNG format before uploading. You can use your phone\'s camera app to save as JPEG, or use online converters.' 
        }, 
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
      // Debug file information
      console.log('=== FILE DEBUG INFO ===')
      console.log('File name:', file.name)
      console.log('File type:', file.type)
      console.log('File size:', file.size, 'bytes')
      console.log('Buffer size:', fileBuffer.length, 'bytes')
      console.log('File extension:', file.name.split('.').pop()?.toLowerCase())
      console.log('Validation result:', validationResult.isValid ? 'PASSED' : 'FAILED')
      console.log('Security warnings:', validationResult.securityWarnings.length)
      console.log('========================')
      
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
    // SECURE FILE UPLOAD TO STORAGE (SECURITY FIX: Expiring URLs)
    // ============================================================================
    // Generate secure filename with proper user isolation
    const secureFileName = SecureUrlService.generateSecureFileName(user.id, file.name)

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(secureFileName, processedBuffer, {
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

    // SECURITY: Generate secure signed URL with expiration instead of public URL
    let imageUrl: string
    try {
      const secureUrlResult = await SecureUrlService.createReceiptImageUrl(secureFileName, {
        expiresIn: 7200, // 2 hours for initial processing
        transform: { width: 800, quality: 80 }
      })
      imageUrl = secureUrlResult.signedUrl
      console.log(`Generated secure URL expiring at: ${secureUrlResult.expiresAt.toISOString()}`)
    } catch (urlError) {
      console.error('Failed to create secure URL, falling back to public URL:', urlError)
      // Fallback to public URL if signed URL fails
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(secureFileName)
      imageUrl = publicUrl
    }

    // ============================================================================
    // IMMEDIATE RESPONSE WITH ASYNC PROCESSING (see master guide: Scalability and Performance)
    // ============================================================================
    // Create a temporary receipt record immediately for better UX
    console.log('Creating temporary receipt record for user:', user.id)

    const tempReceipt = await createReceipt({
      userId: user.id,
      imageUrl: imageUrl,
      rawText: 'Processing...',
      merchant: 'Processing...',
      total: 0,
      purchaseDate: new Date(),
      summary: 'Processing receipt...'
    })

    // Start async processing in the background (see master guide: Concurrent Upload Handling)
    console.log(`🚀 Starting async processing for receipt ${tempReceipt.id}`)
    
    // Use a more robust async processing approach
    setImmediate(async () => {
      console.log(`⚡ setImmediate triggered for receipt ${tempReceipt.id}`)
      try {
        console.log(`🔄 About to call processReceiptAsync for receipt ${tempReceipt.id}`)
        await processReceiptAsync(tempReceipt.id, processedBuffer, contentType, user.id)
        console.log(`✅ Async processing completed successfully for receipt ${tempReceipt.id}`)
      } catch (error) {
        console.error(`❌ Async processing failed for receipt ${tempReceipt.id}:`, error)
        
        // Update receipt with error state so user knows something went wrong
        try {
          await updateReceipt(tempReceipt.id, {
            merchant: 'Processing Failed',
            total: new Decimal(0),
            summary: 'Receipt processing failed. Please try uploading again.'
          })
          console.log(`📝 Updated receipt ${tempReceipt.id} with error state`)
        } catch (updateError) {
          console.error(`❌ Failed to update receipt ${tempReceipt.id} with error state:`, updateError)
        }
      }
    })

    // FALLBACK: If setImmediate doesn't work, process immediately
    // This ensures processing happens even in serverless environments
    setTimeout(async () => {
      console.log(`⏰ Fallback timeout triggered for receipt ${tempReceipt.id}`)
      try {
        // Check if receipt is still in processing state
        const currentReceipt = await prisma.receipt.findUnique({
          where: { id: tempReceipt.id },
          select: { merchant: true }
        })
        
        if (currentReceipt && currentReceipt.merchant === 'Processing...') {
          console.log(`🔄 Fallback processing for receipt ${tempReceipt.id}`)
          await processReceiptAsync(tempReceipt.id, processedBuffer, contentType, user.id)
          console.log(`✅ Fallback processing completed for receipt ${tempReceipt.id}`)
        } else {
          console.log(`✅ Receipt ${tempReceipt.id} already processed, skipping fallback`)
        }
      } catch (error) {
        console.error(`❌ Fallback processing failed for receipt ${tempReceipt.id}:`, error)
      }
    }, 1000) // 1 second fallback

    // ============================================================================
    // RETRY STUCK RECEIPTS (NEW: Process any receipts stuck in "Processing..." state)
    // ============================================================================
    // Check for and retry any receipts stuck in processing state
    setImmediate(async () => {
      console.log(`🔄 About to retry stuck receipts for user ${user.id}`)
      try {
        await retryStuckReceipts(user.id)
        console.log(`✅ Retry stuck receipts completed for user ${user.id}`)
      } catch (error) {
        console.error('❌ Failed to retry stuck receipts:', error)
      }
    })

    // IMMEDIATE PROCESSING: Process the current receipt right away
    // This ensures the receipt gets processed even if async fails
    console.log(`⚡ Starting immediate processing for receipt ${tempReceipt.id}`)
    try {
      await processReceiptAsync(tempReceipt.id, processedBuffer, contentType, user.id)
      console.log(`✅ Immediate processing completed for receipt ${tempReceipt.id}`)
    } catch (error) {
      console.error(`❌ Immediate processing failed for receipt ${tempReceipt.id}:`, error)
      
      // Update receipt with error state
      try {
        await updateReceipt(tempReceipt.id, {
          merchant: 'Processing Failed',
          total: new Decimal(0),
          summary: 'Receipt processing failed. Please try uploading again.'
        })
        console.log(`📝 Updated receipt ${tempReceipt.id} with error state`)
      } catch (updateError) {
        console.error(`❌ Failed to update receipt ${tempReceipt.id} with error state:`, updateError)
      }
    }

    // Log upload start
    console.log(`Receipt upload started for user ${user.id}, receipt ${tempReceipt.id}`)

    // ============================================================================
    // IMMEDIATE API RESPONSE (see master guide: API Response Typing)
    // ============================================================================
    return NextResponse.json({
      success: true,
      receipt: {
        id: tempReceipt.id,
        imageUrl: imageUrl,
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
// RETRY STUCK RECEIPTS FUNCTION (NEW: Process receipts stuck in "Processing..." state)
// ============================================================================
/**
 * Finds and retries processing for any receipts stuck in "Processing..." state
 * This helps recover from failed async processing
 */
async function retryStuckReceipts(userId: string) {
  console.log(`🔍 Checking for stuck receipts for user: ${userId}`)
  
  try {
    // Find receipts stuck in processing state
    const stuckReceipts = await prisma.receipt.findMany({
      where: {
        userId,
        merchant: 'Processing...'
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true
      }
    })
    
    if (stuckReceipts.length === 0) {
      console.log(`✅ No stuck receipts found for user: ${userId}`)
      return
    }
    
    console.log(`🔄 Found ${stuckReceipts.length} stuck receipts, attempting to retry processing`)
    
    // Process each stuck receipt
    for (const receipt of stuckReceipts) {
      try {
        console.log(`🔄 Retrying processing for stuck receipt: ${receipt.id}`)
        
        // Download the image from storage
        const imageResponse = await fetch(receipt.imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
        
        // Retry processing
        await processReceiptAsync(receipt.id, imageBuffer, contentType, userId)
        console.log(`✅ Successfully retried processing for receipt: ${receipt.id}`)
        
      } catch (error) {
        console.error(`❌ Failed to retry processing for receipt ${receipt.id}:`, error)
        
        // Update with error state
        try {
          await updateReceipt(receipt.id, {
            merchant: 'Processing Failed',
            total: new Decimal(0),
            summary: 'Receipt processing failed. Please try uploading again.'
          })
          console.log(`📝 Updated stuck receipt ${receipt.id} with error state`)
        } catch (updateError) {
          console.error(`❌ Failed to update stuck receipt ${receipt.id}:`, updateError)
        }
      }
    }
    
    console.log(`✅ Completed retry processing for ${stuckReceipts.length} stuck receipts`)
    
  } catch (error) {
    console.error(`💥 Error in retryStuckReceipts for user ${userId}:`, error)
    throw error
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
  console.log(`🔍 Starting async processing for receipt: ${receiptId}`)
  
  try {
    // 1. Run OCR on the uploaded image (using Google Cloud Vision API)
    let ocrText: string
    try {
      console.log(`📸 Starting OCR processing for receipt: ${receiptId}`)
      const base64Image = imageBufferToBase64(imageBuffer, contentType)
      ocrText = await extractTextFromImage(base64Image)
      console.log(`✅ OCR completed for receipt: ${receiptId}, text length: ${ocrText.length}`)
    } catch (error) {
      console.error(`❌ OCR extraction failed for receipt: ${receiptId}`, error)
      ocrText = 'OCR processing failed'
    }

    // 2. Use OpenAI to extract structured data and summary (see master guide: AI Categorization)
    let aiData
    try {
      console.log(`🤖 Starting AI processing for receipt: ${receiptId}`)
      // Pass user ID for rate limiting OpenAI calls per user
      aiData = await extractReceiptDataWithAI(ocrText, userId)
      console.log(`✅ AI processing completed for receipt: ${receiptId}`, {
        merchant: aiData.merchant,
        total: aiData.total,
        category: aiData.category
      })
    } catch (err) {
      console.error(`❌ OpenAI extraction failed for receipt: ${receiptId}`, err)
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

    // 4. Apply intelligent categorization using our categorizeReceipt function
    const category = categorizeReceipt(merchant)
    console.log(`🏷️ Categorized receipt: ${merchant} -> ${category}`)

    console.log(`💾 Updating receipt ${receiptId} with processed data:`, {
      merchant,
      total,
      category,
      purchaseDate: purchaseDate.toISOString(),
      summary: summary.substring(0, 50) + '...'
    })

    // Get user profile (simplified)
    console.log(`👤 Processing receipt for user ${userId}`)
    const receiptCurrency = aiData.currency || 'USD' // Assume AI can extract currency, else default
    // Design decision: Only store original currency, no conversion (see Steward Master System Guide, Multi-Currency section)
    await updateReceipt(receiptId, {
      merchant,
      total: new Decimal(total),
      purchaseDate,
      summary,
      category,
      currency: receiptCurrency
    })
    
    console.log(`✅ Receipt processing completed and database updated: ${receiptId}`, {
      receiptId,
      merchant,
      total,
      purchaseDate,
      summary,
      ocrConfidence
    })

    // Analytics, embeddings, and notifications removed for performance optimization
    console.log(`🎉 Async processing completed successfully for receipt: ${receiptId}`)
    
  } catch (error) {
    console.error(`💥 Async processing failed for receipt: ${receiptId}`, error)
    
    // Error notification removed for performance optimization
    console.error(`❌ Receipt processing failed: ${receiptId}`, error)
    
    // Re-throw the error so the caller can handle it
    throw error
  }
}

 