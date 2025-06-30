import { createWorker } from 'tesseract.js'

// ============================================================================
// OCR SERVICE
// ============================================================================
// Handles optical character recognition for receipt images
// Uses tesseract.js for text extraction with optimized settings for receipts

export interface OCRResult {
  text: string
  confidence: number
  processingTime: number
}

export class OCRService {
  private worker: Tesseract.Worker | null = null
  private isInitialized = false

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.worker = await createWorker('eng', 1, {
        logger: process.env.NODE_ENV === 'development' ? m => console.log(m) : undefined,
        errorHandler: err => console.error('OCR Error:', err),
      })

      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error)
      throw new Error('OCR initialization failed')
    }
  }

  // ============================================================================
  // TEXT EXTRACTION
  // ============================================================================

  async extractText(imageUrl: string): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    const startTime = Date.now()

    try {
      const { data } = await this.worker.recognize(imageUrl)
      
      const processingTime = Date.now() - startTime

      return {
        text: data.text.trim(),
        confidence: data.confidence,
        processingTime
      }
    } catch (error) {
      console.error('OCR text extraction failed:', error)
      throw new Error('Failed to extract text from image')
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Clean and normalize extracted text for better processing
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,$€£¥@#%&*()_+\-=\[\]{}|;:'"/<>?\\~`]/g, '') // Remove invalid characters
      .trim()
  }

  /**
   * Check if OCR result is likely a receipt
   */
  isLikelyReceipt(text: string): boolean {
    const receiptKeywords = [
      'receipt', 'total', 'subtotal', 'tax', 'change', 'cash', 'card', 'credit',
      'debit', 'amount', 'price', 'cost', 'payment', 'transaction', 'purchase',
      'sale', 'invoice', 'bill', 'checkout', 'register', 'pos', 'terminal'
    ]

    const lowerText = text.toLowerCase()
    const keywordMatches = receiptKeywords.filter(keyword => 
      lowerText.includes(keyword)
    )

    return keywordMatches.length >= 2
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let ocrServiceInstance: OCRService | null = null

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService()
  }
  return ocrServiceInstance
} 