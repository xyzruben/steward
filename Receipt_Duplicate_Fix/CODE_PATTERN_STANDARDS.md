# Code Pattern Standards

**Purpose**: Document existing code patterns in the Steward codebase to maintain consistency when implementing duplicate detection.

**Status**: ⏳ In Progress
**Last Updated**: 2025-12-01
**Verified By**: [Name]

---

## Overview

This document ensures new duplicate detection code follows existing patterns in the Steward codebase. Consistency is critical for maintainability.

---

## TypeScript Patterns

### Interface vs Type

**Current Pattern in Codebase**:
```bash
# Check which is more common
grep -r "^interface " src/ --include="*.ts" --include="*.tsx" | wc -l
grep -r "^type " src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Finding**: _____

**Standard to Follow**:
```typescript
// If codebase uses interfaces more:
interface DuplicateCheckCriteria {
  userId: string
  merchant: string
  total: number
  purchaseDate: Date
  rawText?: string
}

// If codebase uses types more:
type DuplicateCheckCriteria = {
  userId: string
  merchant: string
  total: number
  purchaseDate: Date
  rawText?: string
}
```

**Decision**: Use _____ (interface / type) for new duplicate detection types.

---

### Type Imports

**Current Pattern**:
```bash
# Check import style
grep -r "import type {" src/ --include="*.ts" | head -5
grep -r "import {" src/ --include="*.ts" | head -5
```

**Finding**: _____

**Standard to Follow**:
```typescript
// Option 1: Inline type keyword
import { type Receipt } from '@prisma/client'

// Option 2: Separate type import
import type { Receipt } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

// Option 3: No type keyword
import { Receipt, PrismaClient } from '@prisma/client'
```

**Decision**: Use _____ pattern.

---

### Nullable vs Optional

**Current Pattern in Prisma Schema**:
```prisma
// Check schema patterns
summary           String?   // Optional/nullable
category          String?   // Optional/nullable
```

**Standard**: Fields that can be absent use `?` for nullable/optional.

**For Duplicate Fields**:
```prisma
isDuplicate       Boolean   @default(false)  // NOT nullable, has default
duplicateOf       String?   @db.Uuid         // Nullable (can be NULL)
duplicateConfidence Decimal?  @db.Decimal(3, 2)  // Nullable
```

---

## Error Handling Patterns

### Current Error Handling Style

**Check existing patterns**:
```bash
# Find try-catch patterns
grep -A 5 "try {" src/lib/db.ts | head -20
grep -A 5 "catch" src/lib/db.ts | head -20
```

**Pattern Found**:
```typescript
// Example from existing code:
try {
  const result = await prisma.receipt.findMany({ ... })
  return result
} catch (error) {
  console.error('Error fetching receipts:', error)
  throw error  // OR return default value
}
```

**Standard to Follow for Duplicate Detection**:
```typescript
// duplicateDetection.ts
export async function findDuplicates(
  criteria: DuplicateCheckCriteria
): Promise<Receipt[]> {
  try {
    const duplicates = await prisma.receipt.findMany({
      where: { /* duplicate criteria */ }
    })
    return duplicates
  } catch (error) {
    console.error('Error finding duplicates:', error)
    throw error  // Follow existing pattern
  }
}
```

---

### Error Messages

**Current Pattern**:
```bash
# Check error message style
grep -r "console.error" src/lib --include="*.ts" | head -10
```

**Pattern Found**: _____

**Standard**:
- [ ] Use descriptive error messages
- [ ] Include function/context name
- [ ] Log error object for debugging
- [ ] Don't expose sensitive data in errors

**Example**:
```typescript
console.error('Error marking receipt as duplicate:', error)
console.error(`Duplicate detection failed for user ${userId}:`, error)
```

---

## Logging Patterns

### Current Logging Style

**Check existing logs**:
```bash
grep -r "console.log" src/lib/services --include="*.ts" | head -10
```

**Pattern Found**: _____

**Logging Levels Used**:
- [ ] `console.log` - General info
- [ ] `console.error` - Errors
- [ ] `console.warn` - Warnings
- [ ] `console.debug` - Debug info
- [ ] Custom logger service - Location: _____

**Standard for Duplicate Detection**:
```typescript
// During duplicate detection
console.log(`Checking for duplicates: ${merchant} - $${total}`)

// When duplicate found
console.log(`Duplicate detected: Receipt ${receiptId} is duplicate of ${originalId}`)

// Errors
console.error('Duplicate detection error:', error)
```

---

## Prisma Query Patterns

### Where Clause Structure

**Current Pattern in `db.ts`**:
```typescript
// Example from getReceiptsByUserId
const whereClause: any = {
  userId,
}

if (search) {
  whereClause.OR = [
    { merchant: { contains: search, mode: 'insensitive' } },
    { summary: { contains: search, mode: 'insensitive' } },
  ]
}

if (category) {
  whereClause.category = category
}

const receipts = await prisma.receipt.findMany({
  where: whereClause,
  orderBy: { createdAt: 'desc' },
})
```

**Standard to Follow**:
```typescript
// For duplicate detection queries
const whereClause: any = {
  userId,
  merchant: { contains: normalizedMerchant, mode: 'insensitive' },
  purchaseDate: {
    gte: startOfDay(purchaseDate),
    lte: endOfDay(purchaseDate),
  },
  total: {
    gte: total - 0.01,
    lte: total + 0.01,
  },
  isDuplicate: false,  // Only check against originals
}

const duplicates = await prisma.receipt.findMany({
  where: whereClause,
  orderBy: { createdAt: 'asc' },
})
```

---

### Aggregate Queries

**Current Pattern**:
```typescript
// From getReceiptStats
const [totalReceipts, totalSpent, averageSpent] = await Promise.all([
  prisma.receipt.count({ where: { userId } }),
  prisma.receipt.aggregate({
    where: { userId },
    _sum: { total: true }
  }),
  prisma.receipt.aggregate({
    where: { userId },
    _avg: { total: true }
  })
])
```

**Standard**: Use `Promise.all` for parallel queries.

**Updated Pattern with Duplicate Filter**:
```typescript
const whereClause = {
  userId,
  isDuplicate: false,  // ✅ Add this
}

const [totalReceipts, totalSpent, averageSpent] = await Promise.all([
  prisma.receipt.count({ where: whereClause }),
  prisma.receipt.aggregate({
    where: whereClause,
    _sum: { total: true }
  }),
  prisma.receipt.aggregate({
    where: whereClause,
    _avg: { total: true }
  })
])
```

---

## Function Naming Conventions

### Current Naming Patterns

**Check existing function names**:
```bash
grep -r "^export.*function" src/lib/db.ts
grep -r "^export.*function" src/lib/services/financeFunctions.ts | head -10
```

**Patterns Found**:
- `getReceipts...` - Fetch functions
- `create...` - Create functions
- `update...` - Update functions
- `delete...` - Delete functions

**Standard for Duplicate Functions**:
```typescript
// Detection functions
export async function findDuplicates() { }
export async function checkIsDuplicate() { }
export async function detectDuplicates() { }

// Action functions
export async function markAsDuplicate() { }
export async function unmarkAsDuplicate() { }

// Utility functions
export function normalizeMerchantName() { }
export function calculateDuplicateConfidence() { }
export function areDuplicates() { }
```

---

## Function Parameter Patterns

### Current Pattern

**From existing functions**:
```typescript
// Single object parameter for complex inputs
export async function getReceiptsByUserId(
  userId: string,
  options?: {
    take?: number
    skip?: number
    search?: string
    category?: string
    // ... more options
  }
)

// Multiple parameters for simple inputs
export async function getReceiptStats(userId: string)
```

**Standard for Duplicate Functions**:
```typescript
// Simple function - multiple parameters
export async function markAsDuplicate(
  duplicateId: string,
  originalId: string,
  confidence: number
): Promise<void>

// Complex function - options object
export async function findDuplicates(
  criteria: DuplicateCheckCriteria
): Promise<Receipt[]>
```

---

## Return Type Patterns

### Current Pattern

**Check return types**:
```typescript
// Explicit return types (preferred)
export async function getReceiptStats(userId: string): Promise<{
  totalReceipts: number
  totalSpent: number
  averageSpent: number
}> { }

// OR interface-based
interface ReceiptStats {
  totalReceipts: number
  totalSpent: number
  averageSpent: number
}

export async function getReceiptStats(userId: string): Promise<ReceiptStats> { }
```

**Standard for Duplicate Functions**:
```typescript
// Option 1: Inline return type
export async function calculateDuplicateConfidence(
  receipt1: Receipt,
  receipt2: Receipt
): Promise<number> { }

// Option 2: Interface for complex returns
interface DuplicateDetectionResult {
  duplicates: Receipt[]
  confidence: number[]
  originalReceipt: Receipt | null
}

export async function detectDuplicatesForReceipt(
  receiptId: string
): Promise<DuplicateDetectionResult> { }
```

---

## Comment and Documentation Style

### Current Style

**Check existing comments**:
```bash
grep -B 2 "^export.*function" src/lib/db.ts | head -20
```

**Pattern Found**: _____

**Standard**:
```typescript
/**
 * Find potential duplicate receipts based on merchant, amount, and date
 *
 * @param criteria - Search criteria including userId, merchant, total, purchaseDate
 * @returns Array of potential duplicate receipts, ordered by creation date
 * @throws Error if database query fails
 */
export async function findDuplicates(
  criteria: DuplicateCheckCriteria
): Promise<Receipt[]> {
  // Implementation
}

/**
 * Calculate confidence score that two receipts are duplicates
 *
 * Score based on:
 * - Exact merchant match: +0.40
 * - Exact total match: +0.30
 * - Same purchase date: +0.20
 * - Similar raw text (>80%): +0.10
 *
 * @returns Confidence score between 0.00 and 1.00
 */
export function calculateDuplicateConfidence(
  receipt1: Receipt,
  receipt2: Receipt
): number {
  // Implementation
}
```

---

## API Route Patterns

### Current Route Structure

**Check existing API routes**:
```bash
cat src/app/api/receipts/stats/route.ts
```

**Pattern**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
// OR
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = // ... get user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Business logic
    const stats = await getReceiptStats(user.id)

    // 3. Return response
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in /api/receipts/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Standard for New Duplicate Detection Endpoint**:
```typescript
// src/app/api/receipts/detect-duplicates/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { detectDuplicatesForUser } from '@/lib/services/duplicateDetection'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body (if needed)
    const body = await request.json()
    const { autoMark = false } = body

    // 3. Business logic
    const result = await detectDuplicatesForUser(user.id, autoMark)

    // 4. Return response
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in /api/receipts/detect-duplicates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## React Component Patterns

### Current Component Structure

**Check existing components**:
```bash
head -50 src/components/receipts/ReceiptList.tsx
```

**Pattern**: _____

**Common Patterns**:
- [ ] Functional components with hooks
- [ ] TypeScript props interface
- [ ] Destructured props
- [ ] Early returns for loading/error states

**Standard**:
```typescript
interface ReceiptListProps {
  receipts: Receipt[]
  onReceiptClick?: (receipt: Receipt) => void
  showDuplicates?: boolean  // ✅ New prop for duplicate filtering
}

export function ReceiptList({
  receipts,
  onReceiptClick,
  showDuplicates = false
}: ReceiptListProps) {
  // Filter duplicates if needed
  const displayReceipts = showDuplicates
    ? receipts
    : receipts.filter(r => !r.isDuplicate)

  // Rest of component
  return (
    // JSX
  )
}
```

---

## File Organization

### Service Layer Structure

**Current Structure**:
```
src/lib/services/
├── financeAgent.ts      - AI agent logic
├── financeFunctions.ts  - Financial query functions
├── cloudOcr.ts          - OCR service
├── openai.ts            - OpenAI integration
├── cache.ts             - Caching logic
├── search.ts            - Search logic
├── export.ts            - Export logic
└── ...
```

**Standard**: New duplicate detection should be in:
```
src/lib/services/duplicateDetection.ts  ✅ Follow this pattern
```

**NOT**:
- ❌ `src/lib/duplicate.ts`
- ❌ `src/services/duplicateDetection.ts`
- ❌ `src/lib/utils/duplicateDetection.ts`

---

### Test File Structure

**Current Pattern**:
```bash
find src -name "*.test.ts" -o -name "*.test.tsx" | head -5
# OR
find src -name "__tests__" -type d
```

**Pattern Found**: _____

**Standard for Duplicate Tests**:
```
# If tests are next to source files:
src/lib/services/duplicateDetection.ts
src/lib/services/duplicateDetection.test.ts

# If tests are in __tests__ folders:
src/lib/services/duplicateDetection.ts
src/lib/services/__tests__/duplicateDetection.test.ts
```

---

## Utility Function Patterns

### String Manipulation

**Current patterns in utils.ts**:
```bash
grep -A 10 "export function" src/lib/utils.ts | head -30
```

**Pattern for Merchant Normalization**:
```typescript
/**
 * Normalize merchant name for duplicate comparison
 * - Convert to lowercase
 * - Remove special characters
 * - Remove extra whitespace
 * - Handle common variations
 */
export function normalizeMerchantName(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim()
}
```

---

## Validation Patterns

### Input Validation

**Current Pattern**:
```bash
# Check if Zod is used
grep -r "z\." src/app/api --include="*.ts" | head -5
```

**If Zod is used**:
```typescript
import { z } from 'zod'

const duplicateDetectionSchema = z.object({
  userId: z.string().uuid(),
  merchant: z.string().min(1),
  total: z.number().positive(),
  purchaseDate: z.date(),
  rawText: z.string().optional(),
})

// Validate input
const validated = duplicateDetectionSchema.parse(criteria)
```

**If manual validation**:
```typescript
if (!userId || !merchant || !total || !purchaseDate) {
  throw new Error('Missing required fields for duplicate detection')
}
```

---

## Database Transaction Patterns

**Current Pattern**:
```bash
grep -r "prisma.\$transaction" src/ --include="*.ts" -A 5
```

**Pattern Found**: _____

**Standard for Marking Duplicates** (if multiple updates needed):
```typescript
export async function markAsDuplicate(
  duplicateId: string,
  originalId: string,
  confidence: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update duplicate receipt
    await tx.receipt.update({
      where: { id: duplicateId },
      data: {
        isDuplicate: true,
        duplicateOf: originalId,
        duplicateConfidence: confidence,
      }
    })

    // Any other related updates
  })
}
```

---

## Async/Await Patterns

### Current Pattern

**All async functions use async/await** (not .then() chains)

```typescript
// ✅ Good - matches codebase style
export async function findDuplicates(): Promise<Receipt[]> {
  const receipts = await prisma.receipt.findMany({ ... })
  return receipts
}

// ❌ Bad - doesn't match codebase style
export function findDuplicates(): Promise<Receipt[]> {
  return prisma.receipt.findMany({ ... })
    .then(receipts => receipts)
}
```

---

## Import Organization

### Current Pattern

**Check import order**:
```bash
head -20 src/lib/db.ts
```

**Standard Order**:
1. External libraries (React, Next.js, etc.)
2. Internal modules (@/...)
3. Relative imports (../, ./)
4. Type imports (if separate)

**Example**:
```typescript
// 1. External libraries
import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'

// 2. Internal modules
import { prisma } from '@/lib/prisma'

// 3. Types (if separate)
import type { Receipt } from '@prisma/client'
```

---

## Constant Definitions

### Current Pattern for Shared Constants

**Check existing constants**:
```bash
grep -r "export const.*=" src/lib --include="*.ts" | grep -i category
```

**Pattern Found**: CATEGORY_MAPPINGS likely in a shared file

**Standard for Duplicate Detection Constants**:
```typescript
// In duplicateDetection.ts OR shared constants file

// Duplicate detection thresholds
export const DUPLICATE_CONFIDENCE_THRESHOLD = 0.80
export const AUTO_MARK_CONFIDENCE_THRESHOLD = 0.90
export const AMOUNT_TOLERANCE = 0.01  // $0.01

// Confidence scoring weights
export const CONFIDENCE_WEIGHTS = {
  EXACT_MERCHANT: 0.40,
  EXACT_TOTAL: 0.30,
  SAME_DATE: 0.20,
  SIMILAR_TEXT: 0.10,
} as const
```

---

## Code Style Summary

### Checklist for New Duplicate Detection Code

- [ ] Use existing TypeScript patterns (interface/type)
- [ ] Follow function naming conventions (get/find/mark/calculate)
- [ ] Use try-catch for error handling
- [ ] Log errors with descriptive messages
- [ ] Build Prisma where clauses incrementally
- [ ] Use Promise.all for parallel queries
- [ ] Add JSDoc comments for exported functions
- [ ] Place files in correct directories (src/lib/services/)
- [ ] Use async/await (not .then())
- [ ] Import in correct order
- [ ] Define constants for magic numbers
- [ ] Follow existing validation patterns (Zod if used)
- [ ] Use transactions for multi-step updates
- [ ] Return explicit types (not 'any')

---

## Examples from Codebase

### Example 1: Well-Structured Function (Template to Follow)

**From**: `src/lib/db.ts` or similar

```typescript
// Paste actual example here after reviewing codebase
```

### Example 2: API Route Pattern (Template to Follow)

**From**: `src/app/api/receipts/stats/route.ts` or similar

```typescript
// Paste actual example here after reviewing codebase
```

---

## Sign-Off

- [ ] **Code patterns documented**: Date: _____ By: _____
- [ ] **Examples extracted from codebase**: Date: _____ By: _____
- [ ] **Standards clearly defined**: Date: _____ By: _____
- [ ] **Ready to guide implementation**: ⬜ Yes / ⬜ No

**Overall Status**: ⬜ COMPLETE / ⬜ NEEDS MORE EXAMPLES

---

**Next Step**: Use these patterns as a reference when writing duplicate detection code.
