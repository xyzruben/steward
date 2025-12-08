# Integration Points Audit

**Purpose**: Find ALL places where receipts are counted, aggregated, or queried to ensure complete coverage when implementing duplicate filtering.

**Status**: ⏳ In Progress
**Last Updated**: 2025-12-01
**Verified By**: [Name]

---

## Overview

This is a comprehensive audit to find EVERY location in the codebase that:
1. Counts receipts
2. Aggregates receipt totals
3. Queries receipts from database
4. Displays receipt statistics
5. Processes receipt data

**Goal**: Ensure NO integration point is missed when implementing duplicate filtering.

---

## Search Strategy

### Comprehensive Search Commands

**Run ALL of these commands and record results**:

```bash
# 1. Find all prisma.receipt queries
grep -r "prisma\.receipt\." src/ --include="*.ts" --include="*.tsx" -n > audit_results/prisma_receipt_queries.txt

# 2. Find all count operations
grep -r "\.count(" src/ --include="*.ts" --include="*.tsx" -n | grep -i receipt > audit_results/count_operations.txt

# 3. Find all aggregate operations
grep -r "\.aggregate(" src/ --include="*.ts" --include="*.tsx" -n > audit_results/aggregate_operations.txt

# 4. Find all findMany operations
grep -r "\.findMany(" src/ --include="*.ts" --include="*.tsx" -n | grep -i receipt > audit_results/findMany_operations.txt

# 5. Find all groupBy operations
grep -r "\.groupBy(" src/ --include="*.ts" --include="*.tsx" -n | grep -i receipt > audit_results/groupBy_operations.txt

# 6. Find totalReceipts references
grep -r "totalReceipts" src/ --include="*.ts" --include="*.tsx" -n > audit_results/totalReceipts_references.txt

# 7. Find receipts.length usage
grep -r "receipts\.length" src/ --include="*.ts" --include="*.tsx" -n > audit_results/receipts_length.txt

# 8. Find receipts.reduce usage
grep -r "receipts\.reduce" src/ --include="*.ts" --include="*.tsx" -n > audit_results/receipts_reduce.txt

# 9. Find Receipt imports
grep -r "from.*Receipt" src/ --include="*.ts" --include="*.tsx" -n > audit_results/receipt_imports.txt

# 10. Find getReceipt function calls
grep -r "getReceipt" src/ --include="*.ts" --include="*.tsx" -n > audit_results/getReceipt_calls.txt
```

**Create audit results directory**:
```bash
mkdir -p Receipt_Duplicate_Fix/audit_results
```

---

## Database Layer (Critical Priority)

### File: `src/lib/db.ts`

**All Receipt-Related Functions**:

```bash
# List all exported functions in db.ts
grep -n "^export.*function" src/lib/db.ts
```

**Result**:
```
[Paste all function signatures here]
```

---

#### Function 1: `getReceiptStats`

**Location**: src/lib/db.ts:_____
**Current Implementation**: _____

**Queries**:
- [ ] `prisma.receipt.count()` - Line: _____
- [ ] `prisma.receipt.aggregate()` _sum - Line: _____
- [ ] `prisma.receipt.aggregate()` _avg - Line: _____

**Current Filter**: `{ userId: string }`

**Required Change**: ✅ Add `isDuplicate: false`

**Priority**: 🔴 CRITICAL

**Updated Code**:
```typescript
const whereClause = { userId, isDuplicate: false }
```

---

#### Function 2: `getReceiptsByUserId`

**Location**: src/lib/db.ts:_____
**Current Implementation**: _____

**Query**:
- [ ] `prisma.receipt.findMany()` - Line: _____

**Current Filters**: userId, search, category, date range, etc.

**Required Change**: ✅ Add `isDuplicate: false` (unless `includeDuplicates: true`)

**Priority**: 🔴 CRITICAL

**Updated Code**:
```typescript
const whereClause: any = {
  userId,
  isDuplicate: includeDuplicates ? undefined : false,
  // ... rest of filters
}
```

---

#### Function 3: `getReceiptsWithPagination`

**Location**: src/lib/db.ts:_____
**Current Implementation**: _____

**Queries**:
- [ ] `prisma.receipt.findMany()` - Line: _____
- [ ] `prisma.receipt.count()` - Line: _____

**Current Filters**: userId, pagination, search, etc.

**Required Change**: ✅ Add `isDuplicate: false` to BOTH queries

**Priority**: 🔴 CRITICAL

---

#### Other Functions in db.ts

**List all other functions that query receipts**:

1. Function: _____ (Line: _____)
   - Queries receipts: ⬜ Yes / ⬜ No
   - Needs update: ⬜ Yes / ⬜ No
   - Priority: 🔴 / 🟡 / 🟢

2. Function: _____ (Line: _____)
   - Queries receipts: ⬜ Yes / ⬜ No
   - Needs update: ⬜ Yes / ⬜ No
   - Priority: 🔴 / 🟡 / 🟢

---

## Service Layer (High Priority)

### File: `src/lib/services/financeFunctions.ts`

**Comprehensive Function Analysis**:

```bash
# List all functions and their line numbers
grep -n "^export.*function" src/lib/services/financeFunctions.ts
```

**Total Functions**: _____

---

#### Finance Function Template

**For EACH function, fill out this template**:

---

**Function**: `getSpendingByCategory`

**Lines**: _____
**Purpose**: _____

**Prisma Queries**:
```bash
# Find all prisma queries in this function
sed -n 'START_LINE,END_LINEp' src/lib/services/financeFunctions.ts | grep "prisma.receipt"
```

**Queries Found**:
- [ ] Type: count / aggregate / findMany / findFirst / groupBy
- [ ] Line: _____
- [ ] Current filter: _____

**Needs `isDuplicate: false`**: ⬜ Yes / ⬜ No

**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

**Updated Code**:
```typescript
where: {
  userId,
  category,
  isDuplicate: false,  // ✅ ADD
}
```

---

**Repeat for ALL functions**:

1. getSpendingByTime
2. getSpendingByVendor
3. getDiningHistory
4. getSpendingForCustomPeriod
5. getSpendingComparison
6. detectSpendingAnomalies
7. getSpendingTrends
8. summarizeTopVendors
9. summarizeTopCategories
10. (List all other functions)

---

### File: `src/lib/services/financeAgent.ts`

**Analysis**:
```bash
grep -n "prisma.receipt\|getReceipt\|financeFunctions" src/lib/services/financeAgent.ts
```

**Direct Receipt Queries**: _____

**Calls to Finance Functions**: _____

**Needs Direct Update**: ⬜ Yes / ⬜ No

**Reason**: If it only calls functions from `financeFunctions.ts`, those will be updated. If it has direct queries, those need updating.

---

### File: `src/lib/services/export.ts`

**Analysis**:
```bash
grep -n "prisma.receipt\|getReceipt" src/lib/services/export.ts
```

**Export Functions**:
1. Function: _____ (Line: _____)
   - Queries receipts: ⬜ Yes / ⬜ No
   - Query type: _____
   - Needs update: ⬜ Yes / ⬜ No

**Required Changes**:
- [ ] Add `isDuplicate: false` filter to queries
- [ ] Add optional `includeDuplicates` parameter
- [ ] Add `isDuplicate` column to CSV export

---

### File: `src/lib/services/search.ts`

**Analysis**:
```bash
grep -n "prisma.receipt\|ReceiptEmbedding" src/lib/services/search.ts
```

**Search Functions**:
1. Function: _____ (Line: _____)
   - Queries receipts: ⬜ Yes / ⬜ No
   - Uses embeddings: ⬜ Yes / ⬜ No
   - Needs update: ⬜ Yes / ⬜ No

**Required Changes**:
- [ ] Filter search results by `isDuplicate: false`

---

### Other Service Files

**Find all service files**:
```bash
ls -la src/lib/services/
```

**Audit each file**:
1. File: _____ Queries receipts: ⬜ Yes / ⬜ No
2. File: _____ Queries receipts: ⬜ Yes / ⬜ No
3. File: _____ Queries receipts: ⬜ Yes / ⬜ No

---

## API Routes (High Priority)

### Receipt-Related API Routes

**Find all receipt API routes**:
```bash
find src/app/api -name "route.ts" -type f | xargs grep -l "receipt" -i
```

**Result**:
```
[Paste list of files]
```

---

### API Route Audit Template

**For EACH API route with receipts**:

---

**Route**: `/api/receipts/stats`
**File**: `src/app/api/receipts/stats/route.ts`

**Analysis**:
```bash
grep -n "prisma.receipt\|getReceipt" src/app/api/receipts/stats/route.ts
```

**Receipt Operations**:
- [ ] Calls: `getReceiptStats()` ⬜ Yes / ⬜ No
- [ ] Direct query: ⬜ Yes / ⬜ No
- [ ] Line: _____

**Needs Direct Update**: ⬜ Yes / ⬜ No

**Reason**: If it only calls `getReceiptStats()`, that function will be updated.

---

**Route**: `/api/dashboard/data`
**File**: `src/app/api/dashboard/data/route.ts`

**Analysis**:
```bash
cat src/app/api/dashboard/data/route.ts | grep -n "receipt"
```

**Receipt Operations**:
- [ ] Calls: _____ function
- [ ] Direct query: ⬜ Yes / ⬜ No
- [ ] Uses `receipts.length`: ⬜ Yes / ⬜ No (Line: _____)

**Needs Direct Update**: ⬜ Yes / ⬜ No

---

**Repeat for ALL API routes**:

1. /api/receipts/upload
2. /api/receipts
3. /api/export
4. /api/search
5. /api/agent/query
6. /api/analytics/advanced
7. (List all other routes found)

---

## Frontend Components (Medium Priority)

### Components That Display Receipt Counts

**Find components with receipt stats**:
```bash
grep -r "totalReceipts\|Total Receipts" src/components --include="*.tsx" -n
```

**Result**:
```
[Paste results]
```

---

### Component Audit Template

**Component**: `ReceiptStats.tsx`
**File**: `src/components/dashboard/ReceiptStats.tsx`

**Analysis**:
```bash
cat src/components/dashboard/ReceiptStats.tsx | grep -n "receipt"
```

**Receipt Data Source**:
- [ ] Fetches from API: _____ endpoint
- [ ] Receives via props: _____ prop
- [ ] Uses context: _____ context

**Displays**:
- [ ] Total receipt count: ⬜ Yes / ⬜ No
- [ ] Total spending: ⬜ Yes / ⬜ No
- [ ] Average: ⬜ Yes / ⬜ No

**Needs Update**: ⬜ Yes / ⬜ No

**Reason**: If it receives data from API that's already filtered, no change needed. If it counts `receipts.length` client-side, may need update.

---

**Repeat for ALL components**:

1. ReceiptList.tsx
2. RecentReceipts.tsx
3. ReceiptViewerModal.tsx
4. Dashboard.tsx
5. (List all other components)

---

### Client-Side Counting

**Find client-side counting operations**:
```bash
grep -r "receipts\.length\|receipts\.reduce" src/components --include="*.tsx" -n
```

**Each Instance**:

**File**: _____
**Line**: _____
**Code**: _____

**Context**: What is this counting for?

**Needs Update**: ⬜ Yes / ⬜ No

**Reason**: _____

---

## Context/State Management

### DataContext

**File**: `src/context/DataContext.tsx`

**Analysis**:
```bash
grep -n "receipt" src/context/DataContext.tsx -i
```

**State Variables**:
- [ ] `receipts: Receipt[]` - Line: _____
- [ ] `totalReceipts: number` - Line: _____
- [ ] Other: _____

**Data Fetching**:
- [ ] Fetches from: _____ API endpoint
- [ ] Stores in state: _____ variable

**Needs Update**: ⬜ Yes / ⬜ No

**Reason**: If it fetches from API that's already filtered, no change needed.

---

### Other Contexts

**Find all contexts**:
```bash
ls -la src/context/
```

**Audit each**:
1. Context: _____ Uses receipts: ⬜ Yes / ⬜ No
2. Context: _____ Uses receipts: ⬜ Yes / ⬜ No

---

## Scripts and Utilities

### Find Scripts

```bash
ls -la scripts/
```

**Scripts That May Use Receipts**:

1. Script: _____ Uses receipts: ⬜ Yes / ⬜ No
2. Script: _____ Uses receipts: ⬜ Yes / ⬜ No

**Audit each script** for receipt queries.

---

## Test Files

### Find Receipt Tests

```bash
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -l "receipt" -i
```

**Result**:
```
[Paste list of test files]
```

**Test Files Using Receipts**:

1. Test: _____ (File: _____)
   - Tests receipt counting: ⬜ Yes / ⬜ No
   - Needs update: ⬜ Yes / ⬜ No

**Action Required**:
- [ ] Update test expectations (counts will decrease when duplicates excluded)
- [ ] Add tests for duplicate filtering
- [ ] Update mock data to include duplicate receipts

---

## Embeddings and Vector Search

### ReceiptEmbedding Model

**Prisma Schema**:
```prisma
model ReceiptEmbedding {
  id         String   @id @default(uuid())
  receiptId  String   @db.Uuid
  embedding  Float[]
  content    String
  model      String
  // ...
}
```

**Question**: Should embeddings be created for duplicate receipts?

**Decision**: _____

**If No**: Add check before creating embedding
```typescript
if (receipt.isDuplicate) {
  // Skip embedding creation
  return
}
```

---

### Search Integration

**File**: `src/lib/services/search.ts`

**Embedding Search Function**:

**Current**: Returns all matching receipts

**Required Change**: Filter out duplicates from results

```typescript
const results = await prisma.receipt.findMany({
  where: {
    id: { in: matchingIds },
    isDuplicate: false,  // ✅ ADD
  }
})
```

---

## Export Functionality

### CSV Export

**File**: `src/lib/services/export.ts` (assumed)

**Current CSV Columns**: _____

**New Columns to Add**:
- `isDuplicate` (boolean)
- `duplicateOf` (UUID or empty)
- `duplicateConfidence` (decimal or empty)

**Filter Logic**:
- [ ] By default, exclude duplicates
- [ ] Add option to include duplicates
- [ ] Clearly indicate duplicate status in export

---

### JSON Export

**Current Structure**: _____

**New Fields**: Automatically included (isDuplicate, duplicateOf, duplicateConfidence)

**Filter Logic**: Same as CSV

---

## Analytics and Reporting

### File: `src/app/api/analytics/advanced/route.ts`

**Analysis**:
```bash
cat src/app/api/analytics/advanced/route.ts | grep -n "prisma.receipt"
```

**Queries Found**:
1. Query type: _____ (Line: _____)
2. Query type: _____ (Line: _____)

**All Queries Need**: `isDuplicate: false` filter

---

### Dashboard Analytics

**Components**:
1. Component: _____ (File: _____)
   - Shows stats: ⬜ Yes / ⬜ No
   - Data source: _____
   - Needs update: ⬜ Yes / ⬜ No

---

## Notification System

**File**: `src/app/api/notifications/route.ts` (if exists)

**Question**: Should users be notified when duplicate detected?

**Decision**: _____

**If Yes**: Create notification when `isDuplicate` is set to true

---

## Cron Jobs / Background Tasks

**Find background tasks**:
```bash
grep -r "setInterval\|cron\|schedule" src/ --include="*.ts" -n
```

**Background Tasks Found**: _____

**Tasks That Process Receipts**:
1. Task: _____ Processes receipts: ⬜ Yes / ⬜ No

**Action Required**: Ensure tasks filter duplicates appropriately

---

## Integration Points Summary

### Critical Integration Points (MUST Update)

**Database Layer**:
- [ ] `getReceiptStats()` - src/lib/db.ts:_____
- [ ] `getReceiptsByUserId()` - src/lib/db.ts:_____
- [ ] `getReceiptsWithPagination()` - src/lib/db.ts:_____

**Finance Functions** (src/lib/services/financeFunctions.ts):
- [ ] `getSpendingByCategory()` - Line: _____
- [ ] `getSpendingByTime()` - Line: _____
- [ ] `getSpendingByVendor()` - Line: _____
- [ ] `getDiningHistory()` - Line: _____
- [ ] `getSpendingForCustomPeriod()` - Line: _____
- [ ] `getSpendingComparison()` - Line: _____
- [ ] `detectSpendingAnomalies()` - Line: _____
- [ ] `getSpendingTrends()` - Line: _____
- [ ] `summarizeTopVendors()` - Line: _____
- [ ] `summarizeTopCategories()` - Line: _____

**Service Layer**:
- [ ] Export service - src/lib/services/export.ts:_____
- [ ] Search service - src/lib/services/search.ts:_____

**API Routes**:
- [ ] /api/receipts/stats - src/app/api/receipts/stats/route.ts:_____
- [ ] /api/dashboard/data - src/app/api/dashboard/data/route.ts:_____
- [ ] /api/receipts/upload - src/app/api/receipts/upload/route.ts:_____
- [ ] (List all other routes)

---

### High Priority Integration Points (Should Update)

**Components**:
- [ ] Component: _____ (File: _____)
- [ ] Component: _____ (File: _____)

**Analytics**:
- [ ] Analytics route - src/app/api/analytics/advanced/route.ts:_____

---

### Medium Priority Integration Points (Consider Updating)

**Embeddings**:
- [ ] Skip embedding creation for duplicates

**Tests**:
- [ ] Update test expectations
- [ ] Add duplicate-specific tests

**Documentation**:
- [ ] Update API docs
- [ ] Update user guides

---

## Additional Integration Points Not in Original Plan

**Found But Not Mentioned in RECEIPT_DUPLICATE_FIX.md**:

1. **File/Location**: _____
   - **Type**: Database query / API route / Component / Other
   - **What it does**: _____
   - **Needs update**: ⬜ Yes / ⬜ No
   - **Priority**: 🔴 / 🟡 / 🟢
   - **Action required**: _____

2. **File/Location**: _____
   - **Type**: _____
   - **What it does**: _____
   - **Needs update**: ⬜ Yes / ⬜ No
   - **Priority**: 🔴 / 🟡 / 🟢
   - **Action required**: _____

---

## Verification Checklist

- [ ] Ran all comprehensive search commands
- [ ] Audited all database layer functions
- [ ] Audited all finance functions (10+ functions)
- [ ] Audited all API routes
- [ ] Audited all service layer files
- [ ] Audited frontend components
- [ ] Audited context/state management
- [ ] Audited export functionality
- [ ] Audited analytics
- [ ] Checked for client-side counting
- [ ] Identified additional integration points not in plan
- [ ] Documented all findings

---

## Sign-Off

- [ ] **All integration points identified**: Date: _____ By: _____
- [ ] **Priority assigned to each**: Date: _____ By: _____
- [ ] **Additional points added to plan**: Date: _____ By: _____
- [ ] **No integration points missed**: ⬜ Confident / ⬜ Need more review

**Overall Status**: ⬜ AUDIT COMPLETE / ⬜ GAPS FOUND / ⬜ NEEDS MORE INVESTIGATION

**Total Integration Points Found**: _____
**Critical Priority**: _____
**High Priority**: _____
**Medium Priority**: _____

---

**Next Step**: Update RECEIPT_DUPLICATE_FIX.md with any newly discovered integration points, then proceed to TEST_SCENARIO_SPECIFICATIONS.md
