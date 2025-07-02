import Tesseract from 'tesseract.js'

// ============================================================================
// OCR SERVICE (tesseract.js v4.0.2)
// ============================================================================
// Handles optical character recognition for receipt images
// Uses tesseract.js v4.0.2 for text extraction with optimized settings for receipts

export interface OCRResult {
  text: string
  confidence: number
  processingTime: number
}

export class OCRService {
  // ==========================================================================
  // TEXT EXTRACTION (v4.0.2 API)
  // ==========================================================================
  async extractText(imageUrl: string): Promise<OCRResult> {
    const startTime = Date.now()
    
    try {
      console.log('Starting OCR extraction for:', imageUrl)
      
      // Use tesseract.js v4.0.2 recognize method
      const result = await Tesseract.recognize(
        imageUrl,
        'eng', // English language
        {
          logger: m => {
            // Log progress for debugging (optional)
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
            }
          }
        }
      )
      
      const processingTime = Date.now() - startTime
      
      // Extract text and confidence from result
      const extractedText = result.data.text.trim()
      const confidence = result.data.confidence || 0
      
      console.log(`OCR completed in ${processingTime}ms with confidence: ${confidence}%`)
      
      // Validate that we got meaningful text
      if (!extractedText || extractedText.length < 10) {
        throw new Error('OCR extracted insufficient text - image may be unclear or not contain readable text')
      }
      
      return {
        text: extractedText,
        confidence,
        processingTime
      }
      
    } catch (error) {
      console.error('OCR extraction failed:', error)
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // ==========================================================================
  // RECEIPT DETECTION
  // ==========================================================================
  isReceiptText(text: string): boolean {
    const receiptKeywords = [
      'total', 'subtotal', 'tax', 'receipt', 'invoice', 'amount', 'payment',
      'cash', 'credit', 'debit', 'change', 'balance', 'due', 'paid',
      'store', 'merchant', 'vendor', 'business', 'company', 'inc', 'llc',
      'date', 'time', 'transaction', 'purchase', 'sale', 'item', 'quantity'
    ]
    
    const lowerText = text.toLowerCase()
    const keywordMatches = receiptKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length
    
    // Consider it a receipt if we find at least 3 receipt-related keywords
    return keywordMatches >= 3
  }
}

// Export singleton instance for consistent usage
export const ocrService = new OCRService() 