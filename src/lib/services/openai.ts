import { OpenAI } from 'openai'

// ============================================================================
// OPENAI SERVICE FOR RECEIPT DATA EXTRACTION & SUMMARIZATION
// ============================================================================
// This service provides functions to extract structured receipt data (merchant,
// total, date, category, etc.) and generate smart summaries using OpenAI's GPT-4o-mini.
// All code is type-safe and follows the standards in STEWARD_MASTER_SYSTEM_GUIDE.md.

// -----------------------------
// Types for AI Extraction
// -----------------------------
export interface ReceiptAIExtraction {
  merchant: string | null
  total: number | null
  purchaseDate: string | null // ISO string
  category: string | null
  tags: string[]
  confidence: number // 0-100
  summary: string | null
}

// -----------------------------
// OpenAI Client Initialization
// -----------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// -----------------------------
// Main Extraction Function
// -----------------------------
/**
 * Extracts structured receipt data and summary from OCR text using OpenAI GPT-4o-mini.
 * - Adheres to architecture, type safety, and commentary standards in the master guide.
 * - Returns merchant, total, date, category, tags, confidence, and summary.
 */
export async function extractReceiptDataWithAI(ocrText: string): Promise<ReceiptAIExtraction> {
  // Prompt engineering: clear, structured, and robust for receipts
  const systemPrompt = `You are an expert at extracting structured data from receipt OCR text. 
Return a JSON object with these fields: merchant, total, purchaseDate (ISO), category, tags (array), confidence (0-100), summary. 
If a field is missing, use null. Confidence is your best estimate of overall extraction accuracy.`

  const userPrompt = `OCR Text:\n${ocrText}\n\nExtract the following fields:\n- merchant (string)\n- total (number)\n- purchaseDate (ISO 8601 string)\n- category (string)\n- tags (array of strings)\n- confidence (0-100)\n- summary (string)`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: 'json_object' },
  })

  // Parse and validate the response
  let aiResult: ReceiptAIExtraction = {
    merchant: null,
    total: null,
    purchaseDate: null,
    category: null,
    tags: [],
    confidence: 0,
    summary: null,
  }
  try {
    const json = completion.choices[0].message.content
    if (json) {
      const parsed = JSON.parse(json)
      aiResult = {
        merchant: parsed.merchant ?? null,
        total: typeof parsed.total === 'number' ? parsed.total : null,
        purchaseDate: parsed.purchaseDate ?? null,
        category: parsed.category ?? null,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        summary: parsed.summary ?? null,
      }
    }
  } catch (err) {
    // Defensive: fallback to nulls if parsing fails
    // (see master guide: error handling, input validation)
    console.error('OpenAI extraction parse error:', err)
  }
  return aiResult
}

// ============================================================================
// All AI code is documented and validated per STEWARD_MASTER_SYSTEM_GUIDE.md
// ============================================================================ 