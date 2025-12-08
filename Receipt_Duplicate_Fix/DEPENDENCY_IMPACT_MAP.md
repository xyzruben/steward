# Dependency Impact Map

**Purpose**: Map all functions and files that depend on receipt queries to ensure complete coverage of changes.

**Status**: ⏳ In Progress
**Last Updated**: 2025-12-01
**Verified By**: [Name]

---

## Overview

This document maps the dependency tree for receipt-related queries to ensure NO functions are missed when implementing duplicate filtering.

---

## Core Receipt Query Functions (Entry Points)

### 1. `getReceiptStats(userId: string)`

**Location**: `src/lib/db.ts:_____`
**Purpose**: Calculate total receipts, total spent, average spent
**Current Behavior**: Counts ALL receipts
**Required Change**: Add `isDuplicate: false` filter
**Priority**: 🔴 CRITICAL

**Called By**:
- [ ] File: _____ Function: _____
- [ ] File: _____ Function: _____
- [ ] File: _____ Function: _____

**Grep Command**:
```bash
grep -r "getReceiptStats" src/ --include="*.ts" --include="*.tsx" -n
```

**Result**:
```
[Paste grep results here]
```

---

### 2. `getReceiptsByUserId(userId: string, options?)`

**Location**: `src/lib/db.ts:_____`
**Purpose**: Fetch user's receipts with filtering and pagination
**Current Behavior**: Returns ALL receipts matching filters
**Required Change**: Add `isDuplicate: false` to where clause (unless `includeDuplicates: true`)
**Priority**: 🔴 CRITICAL

**Called By**:
- [ ] File: _____ Function: _____
- [ ] File: _____ Function: _____
- [ ] File: _____ Function: _____

**Grep Command**:
```bash
grep -r "getReceiptsByUserId" src/ --include="*.ts" --include="*.tsx" -n
```

**Result**:
```
[Paste grep results here]
```

---

### 3. `getReceiptsWithPagination(userId: string, options?)`

**Location**: `src/lib/db.ts:_____`
**Purpose**: Fetch paginated receipts
**Current Behavior**: Returns ALL receipts in pagination
**Required Change**: Add `isDuplicate: false` to where clause (unless `includeDuplicates: true`)
**Priority**: 🔴 CRITICAL

**Called By**:
- [ ] File: _____ Function: _____
- [ ] File: _____ Function: _____
- [ ] File: _____ Function: _____

**Grep Command**:
```bash
grep -r "getReceiptsWithPagination" src/ --include="*.ts" --include="*.tsx" -n
```

**Result**:
```
[Paste grep results here]
```

---

## Direct Prisma Receipt Queries (Bypassing Utility Functions)

**⚠️ CRITICAL**: These queries bypass the utility functions and query `prisma.receipt` directly. They MUST be updated.

### Search for All Direct Queries

**Commands**:
```bash
# Find all prisma.receipt.count() calls
grep -r "prisma.receipt.count" src/ --include="*.ts" --include="*.tsx" -n

# Find all prisma.receipt.aggregate() calls
grep -r "prisma.receipt.aggregate" src/ --include="*.ts" --include="*.tsx" -n

# Find all prisma.receipt.findMany() calls
grep -r "prisma.receipt.findMany" src/ --include="*.ts" --include="*.tsx" -n

# Find all prisma.receipt.findFirst() calls
grep -r "prisma.receipt.findFirst" src/ --include="*.ts" --include="*.tsx" -n

# Find all prisma.receipt.groupBy() calls
grep -r "prisma.receipt.groupBy" src/ --include="*.ts" --include="*.tsx" -n
```

### Direct Query Locations

| File | Line | Query Type | Current Filter | Needs Update? | Priority |
|------|------|------------|----------------|---------------|----------|
| _____ | _____ | count | _____ | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |
| _____ | _____ | aggregate | _____ | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |
| _____ | _____ | findMany | _____ | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |
| _____ | _____ | findFirst | _____ | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |
| _____ | _____ | groupBy | _____ | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |

---

## Finance Functions Analysis

**File**: `src/lib/services/financeFunctions.ts`

### Functions That Query Receipts

**Commands to analyze**:
```bash
# List all exported functions
grep -n "^export.*function" src/lib/services/financeFunctions.ts

# Check for prisma.receipt usage in each function
grep -n "prisma.receipt" src/lib/services/financeFunctions.ts
```

### Function-by-Function Analysis

#### 1. `getSpendingByCategory()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 2. `getSpendingByTime()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 3. `getSpendingByVendor()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 4. `getDiningHistory()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 5. `getSpendingForCustomPeriod()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 6. `getSpendingComparison()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 7. `detectSpendingAnomalies()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 8. `getSpendingTrends()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 9. `summarizeTopVendors()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### 10. `summarizeTopCategories()`

**Lines**: _____
**Queries Receipts**: ⬜ Yes / ⬜ No
**Query Type**: count / aggregate / findMany / other: _____
**Current Filter**: _____
**Needs `isDuplicate: false` Filter**: ⬜ Yes / ⬜ No
**Priority**: 🔴 CRITICAL / 🟡 HIGH / 🟢 MEDIUM

---

#### Other Functions Found

| Function Name | Lines | Queries Receipts? | Needs Update? | Priority |
|---------------|-------|-------------------|---------------|----------|
| _____ | _____ | ⬜ Yes / ⬜ No | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |
| _____ | _____ | ⬜ Yes / ⬜ No | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |
| _____ | _____ | ⬜ Yes / ⬜ No | ⬜ Yes / ⬜ No | 🔴/🟡/🟢 |

---

## API Routes Analysis

### Receipt-Related API Routes

**Commands**:
```bash
# Find all API routes that might use receipts
find src/app/api -name "route.ts" -type f | xargs grep -l "receipt"

# List all API route files
find src/app/api -name "route.ts" -type f
```

### API Route Inventory

| Route | File | Uses Receipts? | How? | Needs Update? |
|-------|------|----------------|------|---------------|
| /api/receipts | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/receipts/stats | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/receipts/upload | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/dashboard/data | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/analytics/advanced | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/export | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/search | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| /api/agent/query | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |
| _____ | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No |

---

## Component Analysis (Client-Side Counting)

### Components That Display Receipt Counts

**⚠️ WARNING**: These components may do client-side counting on receipt arrays.

**Commands**:
```bash
# Find components that use receipts.length
grep -r "receipts.length" src/components --include="*.tsx" --include="*.ts" -n

# Find components that count or reduce receipts
grep -r "receipts.reduce" src/components --include="*.tsx" --include="*.ts" -n

# Find components that use totalReceipts
grep -r "totalReceipts" src/components --include="*.tsx" --include="*.ts" -n
```

### Component Inventory

| Component | File | Counts Receipts? | Method | Needs Update? | Notes |
|-----------|------|------------------|--------|---------------|-------|
| ReceiptList | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No | _____ |
| ReceiptStats | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No | _____ |
| RecentReceipts | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No | _____ |
| ReceiptViewerModal | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No | _____ |
| _____ | _____ | ⬜ Yes / ⬜ No | _____ | ⬜ Yes / ⬜ No | _____ |

---

## Service Layer Analysis

### Export Service

**File**: `src/lib/services/export.ts`

**Analysis**:
```bash
grep -n "prisma.receipt" src/lib/services/export.ts
grep -n "getReceipts" src/lib/services/export.ts
```

**Functions**:
- [ ] Function: _____ (Line: _____)
  - **Queries Receipts**: ⬜ Yes / ⬜ No
  - **Needs Update**: ⬜ Yes / ⬜ No
  - **Priority**: 🔴/🟡/🟢

---

### Finance Agent

**File**: `src/lib/services/financeAgent.ts`

**Analysis**:
```bash
grep -n "prisma.receipt" src/lib/services/financeAgent.ts
grep -n "getReceipts\|financeFunctions" src/lib/services/financeAgent.ts
```

**Functions Called**:
- [ ] Calls: _____ (from financeFunctions.ts)
- [ ] Calls: _____ (from db.ts)
- [ ] Direct queries: ⬜ Yes / ⬜ No

**Needs Update**: ⬜ Yes / ⬜ No (if it only calls other functions, those functions will be updated)

---

### Search Service

**File**: `src/lib/services/search.ts`

**Analysis**:
```bash
grep -n "prisma.receipt" src/lib/services/search.ts
grep -n "findMany\|count" src/lib/services/search.ts
```

**Functions**:
- [ ] Function: _____ (Line: _____)
  - **Queries Receipts**: ⬜ Yes / ⬜ No
  - **Needs Update**: ⬜ Yes / ⬜ No
  - **Priority**: 🔴/🟡/🟢

---

## TypeScript Import Analysis

### Receipt Type Usage

**Commands**:
```bash
# Find all imports of Receipt type
grep -r "import.*Receipt" src/ --include="*.ts" --include="*.tsx" -n

# Find Prisma client imports
grep -r "from '@prisma/client'" src/ --include="*.ts" --include="*.tsx" -n
```

**Files Importing Receipt Type**:
- [ ] File: _____ (Line: _____)
- [ ] File: _____ (Line: _____)
- [ ] File: _____ (Line: _____)

**Impact**: When we add `isDuplicate`, `duplicateOf`, `duplicateConfidence` fields, these files will automatically get updated types after `npx prisma generate`.

**Action Required**: ⬜ None (auto-update) / ⬜ Manual review needed

---

## Context/State Management Analysis

### Data Context

**File**: `src/context/DataContext.tsx`

**Analysis**:
```bash
grep -n "receipt" src/context/DataContext.tsx -i
```

**Findings**:
- [ ] Stores receipts in state: ⬜ Yes / ⬜ No
- [ ] Provides receipt count: ⬜ Yes / ⬜ No
- [ ] Fetches receipts from API: ⬜ Yes / ⬜ No
- [ ] Needs Update: ⬜ Yes / ⬜ No

---

## Dependency Chain Visualization

```
┌─────────────────────────────────────┐
│   Frontend Components               │
│   - ReceiptList.tsx                 │
│   - ReceiptStats.tsx                │
│   - RecentReceipts.tsx              │
└─────────────┬───────────────────────┘
              │ (fetch)
              ▼
┌─────────────────────────────────────┐
│   API Routes                        │
│   - /api/receipts/stats             │
│   - /api/dashboard/data             │
│   - /api/export                     │
│   - /api/analytics/advanced         │
└─────────────┬───────────────────────┘
              │ (calls)
              ▼
┌─────────────────────────────────────┐
│   Service Layer                     │
│   - financeFunctions.ts             │
│   - financeAgent.ts                 │
│   - export.ts                       │
│   - search.ts                       │
└─────────────┬───────────────────────┘
              │ (calls OR queries directly)
              ▼
┌─────────────────────────────────────┐
│   Database Layer (Core Functions)   │
│   - getReceiptStats()               │
│   - getReceiptsByUserId()           │
│   - getReceiptsWithPagination()     │
│   - OR Direct: prisma.receipt.*     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Database (Prisma + PostgreSQL)    │
│   - Receipt model                   │
└─────────────────────────────────────┘
```

---

## Critical Path Analysis

### Must Update (Cannot Miss)

🔴 **CRITICAL** - These MUST be updated or statistics will be wrong:

1. [ ] `getReceiptStats()` - Core statistics function
2. [ ] `getReceiptsByUserId()` - Primary receipt query
3. [ ] `getReceiptsWithPagination()` - Paginated queries
4. [ ] All functions in `financeFunctions.ts` that query receipts
5. [ ] Any direct `prisma.receipt.*` queries in API routes
6. [ ] Export service receipt queries
7. [ ] Search service receipt queries

### Should Update (Important but not critical)

🟡 **HIGH** - Should update but won't break core functionality:

1. [ ] Frontend components that display counts (will show correct data from API)
2. [ ] Analytics functions
3. [ ] Agent function calls (if they only call other functions)

### Optional Updates

🟢 **MEDIUM** - Nice to have:

1. [ ] Documentation updates
2. [ ] Test data updates
3. [ ] Mock data updates

---

## Missing Dependencies Check

**Question**: Are there ANY receipt queries NOT mentioned in the RECEIPT_DUPLICATE_FIX.md plan?

### Search Commands:
```bash
# Comprehensive search for ALL receipt queries
grep -r "prisma.receipt" src/ --include="*.ts" --include="*.tsx" -n > all_receipt_queries.txt

# Count total occurrences
grep -r "prisma.receipt" src/ --include="*.ts" --include="*.tsx" | wc -l
```

### Analysis Result:

**Total Receipt Queries Found**: _____
**Queries Mentioned in Plan**: _____
**Queries NOT Mentioned in Plan**: _____

**Missing Queries**:
1. File: _____ Line: _____ Query: _____
2. File: _____ Line: _____ Query: _____
3. File: _____ Line: _____ Query: _____

---

## Cross-Reference with Plan

### Files Mentioned in Plan ✓

- [ ] prisma/schema.prisma
- [ ] src/lib/db.ts
- [ ] src/lib/services/financeFunctions.ts
- [ ] src/lib/services/export.ts
- [ ] src/lib/services/financeAgent.ts
- [ ] src/app/api/receipts/stats/route.ts
- [ ] src/app/api/dashboard/data/route.ts
- [ ] src/app/api/receipts/upload/route.ts
- [ ] src/app/api/analytics/advanced/route.ts
- [ ] src/components/receipts/ReceiptList.tsx
- [ ] src/components/dashboard/ReceiptStats.tsx
- [ ] src/components/receipts/ReceiptViewerModal.tsx
- [ ] src/components/dashboard/RecentReceipts.tsx

### Additional Files Found (NOT in Plan) ⚠️

- [ ] File: _____ Queries Receipts: ⬜ Yes Needs Update: ⬜ Yes
- [ ] File: _____ Queries Receipts: ⬜ Yes Needs Update: ⬜ Yes
- [ ] File: _____ Queries Receipts: ⬜ Yes Needs Update: ⬜ Yes

---

## Action Items

### Before Implementation

- [ ] Run all grep commands to find actual dependencies
- [ ] Fill in all "\_\_\_\_\_" placeholders in this document
- [ ] Identify any files NOT mentioned in the original plan
- [ ] Update RECEIPT_DUPLICATE_FIX.md if new files discovered
- [ ] Verify no critical dependencies are missed

### High-Risk Areas

**List any areas where a missed update could cause data integrity issues**:

1. ❌ **Risk**: _____
   - **Location**: _____
   - **Impact**: _____
   - **Mitigation**: _____

---

## Sign-Off

- [ ] **All receipt query locations identified**: Date: _____ By: _____
- [ ] **All dependencies mapped**: Date: _____ By: _____
- [ ] **No missing queries found**: Date: _____ By: _____
- [ ] **Plan updated with new findings**: Date: _____ By: _____

**Overall Status**: ⬜ COMPLETE / ⬜ GAPS FOUND / ⬜ NEEDS UPDATES

---

**Next Step**: Once all dependencies are mapped, proceed to DATABASE_MIGRATION_EXECUTION_PLAN.md
