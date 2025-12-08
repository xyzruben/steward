# API Contract Verification

**Purpose**: Verify all API endpoints referenced in RECEIPT_DUPLICATE_FIX.md exist and document their current contracts.

**Status**: ⏳ In Progress
**Last Updated**: 2025-12-01
**Verified By**: [Name]

---

## Overview

This document verifies every API endpoint exists, documents current request/response formats, and confirms assumptions made in the duplicate fix plan.

---

## Endpoint Inventory

### Find All API Routes

**Command**:
```bash
find src/app/api -name "route.ts" -type f | sort
```

**Result**:
```
[Paste all API route files here]
```

**Total Count**: _____

---

## Critical Endpoints for Duplicate Fix

### 1. GET/POST /api/receipts/stats

**File**: `src/app/api/receipts/stats/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation here
```

**Current Contract**:

**Request**:
- Method: GET / POST / Both
- Headers: Authorization required? ⬜ Yes / ⬜ No
- Body: _____
- Query params: _____

**Response**:
```typescript
// Current response format
{
  totalReceipts: number
  totalSpent: number
  averageSpent: number
  // Other fields?
}
```

**Response Fields Found**: _____

**Calls Function**: `getReceiptStats(userId)` ⬜ Yes / ⬜ No
**Function Location**: _____

**Changes Required**:
- [ ] Update `getReceiptStats()` to exclude duplicates
- [ ] No changes to API contract
- [ ] Response format remains same
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

### 2. GET /api/dashboard/data

**File**: `src/app/api/dashboard/data/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation here
```

**Current Contract**:

**Request**:
- Method: GET
- Headers: _____
- Query params: _____

**Response**:
```typescript
// Expected format
{
  receipts: Receipt[]
  totalReceipts: number
  totalSpent: number
  averagePerReceipt: number
  // Other fields?
}
```

**Response Fields Found**: _____

**Receipt Counting Method**:
- [ ] Uses `getReceiptsByUserId()` then counts `receipts.length`
- [ ] Uses `getReceiptStats()`
- [ ] Direct Prisma query
- [ ] Other: _____

**Changes Required**:
- [ ] Update query to exclude duplicates
- [ ] Response format unchanged
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

### 3. POST /api/receipts/upload

**File**: `src/app/api/receipts/upload/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste relevant parts (especially processReceiptAsync function)
```

**Current Contract**:

**Request**:
- Method: POST
- Headers: Content-Type: multipart/form-data
- Body: FormData with file
- Max file size: _____

**Response**:
```typescript
{
  id: string
  imageUrl: string
  status: string  // "Processing..." or final status
  // Other fields?
}
```

**Async Processing**:
- [ ] Has `processReceiptAsync()` function ⬜ Yes / ⬜ No
- [ ] Function location: Line _____

**Changes Required**:
- [ ] Add duplicate detection after OCR/AI extraction
- [ ] Add response fields: `isDuplicate`, `duplicateOf`, `duplicateConfidence`
- [ ] Backwards compatible: ⬜ Yes / ⬜ No (new fields optional)

**New Response Format**:
```typescript
{
  id: string
  imageUrl: string
  status: string
  isDuplicate?: boolean        // ✅ NEW
  duplicateOf?: string         // ✅ NEW
  duplicateConfidence?: number // ✅ NEW
}
```

---

### 4. GET /api/receipts

**File**: `src/app/api/receipts/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation
```

**Current Contract**:

**Request**:
- Method: GET
- Query params:
  - `search?: string`
  - `category?: string`
  - `take?: number`
  - `skip?: number`
  - Other: _____

**Response**:
```typescript
{
  receipts: Receipt[]
  total?: number
  // Pagination info?
}
```

**Calls Function**: `getReceiptsByUserId()` / `getReceiptsWithPagination()` / Other: _____

**Changes Required**:
- [ ] Add query param: `includeDuplicates?: boolean` (default false)
- [ ] Update underlying function to filter duplicates
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

### 5. GET /api/export or /api/export/receipts

**File**: `src/app/api/export/route.ts` OR `src/app/api/export/receipts/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation
```

**Current Contract**:

**Request**:
- Method: GET
- Query params:
  - `format?: string` (csv / json)
  - `startDate?: string`
  - `endDate?: string`
  - Other: _____

**Response**:
- Content-Type: text/csv OR application/json
- Body: CSV file OR JSON array

**Calls Function**: _____

**Changes Required**:
- [ ] Add query param: `includeDuplicates?: boolean` (default false)
- [ ] Add CSV column: `isDuplicate` (if CSV export)
- [ ] Update export service to filter duplicates
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

### 6. POST /api/search

**File**: `src/app/api/search/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation
```

**Current Contract**:

**Request**:
- Method: POST
- Body:
  ```typescript
  {
    query: string
    filters?: {
      category?: string
      dateRange?: { start: Date, end: Date }
    }
  }
  ```

**Response**:
```typescript
{
  receipts: Receipt[]
  count: number
}
```

**Uses**: Semantic search with embeddings ⬜ Yes / ⬜ No

**Changes Required**:
- [ ] Add body field: `includeDuplicates?: boolean`
- [ ] Filter results by `isDuplicate: false`
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

### 7. POST /api/agent/query

**File**: `src/app/api/agent/query/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation
```

**Current Contract**:

**Request**:
- Method: POST
- Body:
  ```typescript
  {
    query: string
    streaming?: boolean
  }
  ```

**Response**:
- Streaming: Server-Sent Events (if streaming: true)
- Non-streaming: JSON response

**Calls**: `financeAgent.ts` and `financeFunctions.ts`

**Changes Required**:
- [ ] No direct changes (functions it calls will be updated)
- [ ] Ensure all called functions exclude duplicates
- [ ] Can handle queries about duplicates specifically
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

### 8. GET /api/analytics/advanced

**File**: `src/app/api/analytics/advanced/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Actual Path**: _____

**Current Implementation**:
```typescript
// Paste actual implementation
```

**Current Contract**:

**Request**:
- Method: GET
- Query params: _____

**Response**:
```typescript
// Document current response format
```

**Queries Receipts Directly**: ⬜ Yes / ⬜ No
**Uses Finance Functions**: ⬜ Yes / ⬜ No

**Changes Required**:
- [ ] Add `isDuplicate: false` to all receipt queries
- [ ] Backwards compatible: ⬜ Yes / ⬜ No

---

## New Endpoints to Create

### 9. POST /api/receipts/detect-duplicates (NEW)

**File**: `src/app/api/receipts/detect-duplicates/route.ts`

**Purpose**: Manually trigger duplicate detection for user's receipts

**Contract**:

**Request**:
- Method: POST
- Headers: Authorization required
- Body:
  ```typescript
  {
    autoMark?: boolean  // If true, automatically mark duplicates
    threshold?: number  // Confidence threshold (default 0.80)
  }
  ```

**Response**:
```typescript
{
  duplicatesFound: number
  duplicates: Array<{
    receiptId: string
    duplicateOf: string
    confidence: number
    merchant: string
    total: number
    purchaseDate: string
  }>
  autoMarked: number  // If autoMark was true
}
```

**Implementation Required**:
- [ ] Create route file
- [ ] Implement authentication
- [ ] Call batch duplicate detection function
- [ ] Return results

---

### 10. POST /api/receipts/re-categorize (Existing?)

**File**: `src/app/api/receipts/re-categorize/route.ts`

**Verification**:
- [ ] **File Exists**: ⬜ Yes / ⬜ No
- [ ] **Mentioned in Plan**: ⬜ Yes (line 719)

**If Exists, Current Contract**:

**Request**: _____

**Response**: _____

**Changes Required**: _____

---

## Authentication Patterns

### Current Auth Method

**Check authentication pattern**:
```bash
grep -A 10 "auth" src/app/api/receipts/stats/route.ts | head -20
```

**Pattern Found**:
- [ ] Supabase `createClient()` and `auth.getUser()`
- [ ] NextAuth `getServerSession()`
- [ ] Custom middleware
- [ ] Other: _____

**Standard for New Endpoints**:
```typescript
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... rest of implementation
}
```

---

## Response Format Standards

### Success Response

**Current Pattern**:
```typescript
// Simple success
return NextResponse.json({ data: result })

// OR direct data
return NextResponse.json(result)
```

**Standard to Follow**: _____

### Error Response

**Current Pattern**:
```typescript
return NextResponse.json(
  { error: 'Error message' },
  { status: 400 / 401 / 500 }
)
```

**Standard to Follow**: _____

---

## CORS and Headers

**Check CORS configuration**:
```bash
grep -r "Access-Control" src/app/api --include="*.ts"
```

**Pattern Found**: _____

**Standard Headers for New Endpoints**: _____

---

## Rate Limiting

**Check if rate limiting exists**:
```bash
grep -r "rateLimit\|rate-limit" src/ --include="*.ts"
```

**Pattern Found**: _____

**Location**: `src/lib/services/cache.ts` or similar

**Standard**: Apply same rate limiting to new duplicate detection endpoint.

---

## Endpoint Dependencies Map

### Endpoints that Call `getReceiptStats()`

1. GET /api/receipts/stats ⬜ Verified
2. GET /api/dashboard/data ⬜ Verified
3. Other: _____

**Impact**: When `getReceiptStats()` is updated, all these endpoints automatically get duplicate filtering.

---

### Endpoints that Call `getReceiptsByUserId()`

1. GET /api/receipts ⬜ Verified
2. GET /api/dashboard/data ⬜ Verified
3. GET /api/export ⬜ Verified
4. Other: _____

**Impact**: When `getReceiptsByUserId()` is updated to exclude duplicates by default, all these endpoints automatically filter duplicates.

---

### Endpoints that Call Finance Functions

1. POST /api/agent/query → calls financeFunctions.ts ⬜ Verified
2. GET /api/analytics/advanced → calls financeFunctions.ts ⬜ Verified
3. Other: _____

**Impact**: When finance functions are updated, these endpoints automatically exclude duplicates.

---

## Backwards Compatibility Analysis

### Breaking Changes

**Potential breaking changes**:
1. Statistics counts will decrease (because duplicates excluded)
2. Receipt lists will be shorter (because duplicates excluded)
3. Export files will have fewer records (because duplicates excluded)

**Mitigation**:
- [ ] Add optional `includeDuplicates` parameter to all endpoints
- [ ] Default to excluding duplicates (new behavior)
- [ ] Allow clients to opt-in to including duplicates
- [ ] Document behavior change in release notes

---

### Non-Breaking Changes

**These changes are additive** (backwards compatible):
1. Adding `isDuplicate`, `duplicateOf`, `duplicateConfidence` to Receipt type
2. Adding new `/api/receipts/detect-duplicates` endpoint
3. Adding new optional query parameters

**Clients**: Old clients will ignore new fields. No changes required.

---

## API Testing Checklist

### Before Deployment

**Test each modified endpoint**:

- [ ] **GET /api/receipts/stats**
  - [ ] Returns correct count (duplicates excluded)
  - [ ] Still returns same response format
  - [ ] Authentication works

- [ ] **GET /api/dashboard/data**
  - [ ] Counts are accurate
  - [ ] Receipts array doesn't include duplicates
  - [ ] Response format unchanged

- [ ] **POST /api/receipts/upload**
  - [ ] Upload still works
  - [ ] Duplicate detection runs asynchronously
  - [ ] Returns new fields if duplicate detected

- [ ] **GET /api/receipts**
  - [ ] Excludes duplicates by default
  - [ ] `includeDuplicates=true` shows all receipts
  - [ ] Pagination still works

- [ ] **GET /api/export**
  - [ ] Exports exclude duplicates by default
  - [ ] CSV includes `isDuplicate` column (if added)
  - [ ] File downloads successfully

- [ ] **POST /api/search**
  - [ ] Search results exclude duplicates
  - [ ] Search accuracy maintained
  - [ ] Performance acceptable

- [ ] **POST /api/agent/query**
  - [ ] Agent responses reference correct counts
  - [ ] Can answer questions about duplicates
  - [ ] Streaming still works

- [ ] **POST /api/receipts/detect-duplicates** (NEW)
  - [ ] Endpoint created
  - [ ] Authentication works
  - [ ] Returns correct duplicate list
  - [ ] Auto-marking works if enabled

---

## API Documentation Updates Needed

**After implementation**:
- [ ] Update API documentation with new `includeDuplicates` parameter
- [ ] Document new duplicate-related fields in Receipt type
- [ ] Document new `/api/receipts/detect-duplicates` endpoint
- [ ] Update response examples to show new fields
- [ ] Note behavior change in statistics (counts decreased)

---

## Verification Commands

### Test Endpoint Existence

```bash
# Check if all expected API routes exist
ls -la src/app/api/receipts/stats/route.ts
ls -la src/app/api/dashboard/data/route.ts
ls -la src/app/api/receipts/upload/route.ts
ls -la src/app/api/receipts/route.ts
ls -la src/app/api/export/route.ts
ls -la src/app/api/search/route.ts
ls -la src/app/api/agent/query/route.ts
ls -la src/app/api/analytics/advanced/route.ts
```

### Find All Receipt-Related Endpoints

```bash
# Find all API routes that might use receipts
find src/app/api -name "route.ts" -type f | xargs grep -l "receipt" -i
```

### Check Response Formats

```bash
# Find all NextResponse.json calls in API routes
find src/app/api -name "route.ts" -type f | xargs grep "NextResponse.json" -A 2
```

---

## Sign-Off

- [ ] **All endpoints verified to exist**: Date: _____ By: _____
- [ ] **All contracts documented**: Date: _____ By: _____
- [ ] **Dependencies mapped**: Date: _____ By: _____
- [ ] **Backwards compatibility assessed**: Date: _____ By: _____
- [ ] **Testing checklist prepared**: Date: _____ By: _____

**Overall Status**: ⬜ VERIFIED / ⬜ GAPS FOUND / ⬜ NEEDS UPDATES

---

**Next Step**: Once all API contracts are verified, proceed to TYPE_SAFETY_VERIFICATION.md
