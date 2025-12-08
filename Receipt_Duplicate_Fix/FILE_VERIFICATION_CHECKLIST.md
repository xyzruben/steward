# File Verification Checklist

**Purpose**: Verify every file, function, and line number referenced in RECEIPT_DUPLICATE_FIX.md actually exists and matches current codebase state.

**Status**: ⏳ In Progress
**Last Updated**: 2025-12-01
**Verified By**: [Name]

---

## Critical: Files to Modify (from RECEIPT_DUPLICATE_FIX.md)

### Database & Core Logic

- [ ] **1. `prisma/schema.prisma`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Current Receipt Model Lines**: Expected 67-101, Actual: _____
  - **Fields Present**: id, userId, imageUrl, rawText, merchant, total, purchaseDate, category, etc.
  - **Notes**: _____

- [ ] **2. `src/lib/services/duplicateDetection.ts`**
  - **Status**: ❌ NEW FILE (Does not exist yet)
  - **Will Create**: Yes
  - **Dependencies Needed**: Prisma client, Receipt type
  - **Notes**: _____

- [ ] **3. `src/lib/db.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Function: `getReceiptStats()` at lines**: Expected 410-428, Actual: _____
  - **Function: `getReceiptsByUserId()` at lines**: Expected 98-223, Actual: _____
  - **Function: `getReceiptsWithPagination()` at lines**: Expected 226-366, Actual: _____
  - **Current Implementation Matches Plan**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **4. `scripts/detect-duplicates.js`**
  - **Status**: ❌ NEW FILE (Does not exist yet)
  - **Will Create**: Yes
  - **Notes**: _____

### API Routes

- [ ] **5. `src/app/api/receipts/stats/route.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Calls `getReceiptStats()`**: ⬜ Yes / ⬜ No
  - **Current Implementation**: _____
  - **Notes**: _____

- [ ] **6. `src/app/api/dashboard/data/route.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Lines Referenced**: Expected 26-43, Actual: _____
  - **Counts receipts using**: `receipts.length` / `getReceiptStats()` / Other: _____
  - **Current Implementation Matches Plan**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **7. `src/app/api/receipts/upload/route.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Function: `processReceiptAsync()` exists**: ⬜ Yes / ⬜ No
  - **Current upload flow matches plan**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **8. `src/app/api/receipts/detect-duplicates/route.ts`**
  - **Status**: ❌ NEW FILE (Does not exist yet)
  - **Will Create**: Yes
  - **Notes**: _____

- [ ] **9. `src/app/api/analytics/advanced/route.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Queries receipts**: ⬜ Yes / ⬜ No
  - **Uses Prisma directly or calls db.ts functions**: _____
  - **Notes**: _____

### Services

- [ ] **10. `src/lib/services/financeFunctions.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Line count**: Expected ~955 lines, Actual: _____
  - **Functions that query receipts**: List: _____
  - **Notes**: _____

- [ ] **11. `src/lib/services/export.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Exports receipts**: ⬜ Yes / ⬜ No
  - **Current format**: CSV / JSON / Both
  - **Notes**: _____

- [ ] **12. `src/lib/services/financeAgent.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Queries receipts for AI responses**: ⬜ Yes / ⬜ No
  - **Uses financeFunctions.ts**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **13. `src/lib/services/analytics.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found / ⬜ May Not Exist
  - **Notes**: _____

### Frontend Components

- [ ] **14. `src/components/receipts/ReceiptList.tsx`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Displays receipt list**: ⬜ Yes / ⬜ No
  - **Current structure compatible with duplicate badges**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **15. `src/components/dashboard/ReceiptStats.tsx`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Displays statistics**: ⬜ Yes / ⬜ No
  - **Data source**: API / Props / Context
  - **Notes**: _____

- [ ] **16. `src/components/receipts/ReceiptViewerModal.tsx`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Shows individual receipt details**: ⬜ Yes / ⬜ No
  - **Can be extended with duplicate info**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **17. `src/components/dashboard/RecentReceipts.tsx`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Displays recent receipts**: ⬜ Yes / ⬜ No
  - **Notes**: _____

### Types & Utilities

- [ ] **18. `src/types/receipt.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found / ⬜ May Not Exist
  - **Custom Receipt type defined**: ⬜ Yes / ⬜ No
  - **Or uses Prisma-generated type**: ⬜ Yes / ⬜ No
  - **Notes**: _____

- [ ] **19. `src/lib/utils.ts`**
  - **Status**: ⬜ Not Verified / ✅ Verified / ❌ Not Found
  - **Contains utility functions**: ⬜ Yes / ⬜ No
  - **Can accommodate duplicate utilities**: ⬜ Yes / ⬜ No
  - **Notes**: _____

---

## Code Snippet Verification

### 1. Current `getReceiptStats()` Implementation

**Expected Code (from plan lines 50-69)**:
```typescript
export async function getReceiptStats(userId: string) {
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

  return {
    totalReceipts,
    totalSpent: totalSpent._sum.total || 0,
    averageSpent: averageSpent._avg.total || 0
  }
}
```

**Actual Code Matches**: ⬜ Yes / ⬜ No / ⬜ Partially
**Differences Found**: _____
**File Location**: src/lib/db.ts:_____ (actual line numbers)

---

### 2. Current Dashboard Data API Implementation

**Expected Code (from plan lines 77-82)**:
```typescript
const receipts = await getReceiptsByUserId(user.id, { take: 10 })
// ...
const totalSpent = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0)
const totalReceipts = receipts.length
const averagePerReceipt = totalReceipts > 0 ? totalSpent / totalReceipts : 0
```

**Actual Code Matches**: ⬜ Yes / ⬜ No / ⬜ Partially
**Differences Found**: _____
**File Location**: src/app/api/dashboard/data/route.ts:_____ (actual line numbers)

---

### 3. Current Receipt Model Schema

**Expected Fields (from plan lines 19-38)**:
- [x] id (String/UUID)
- [x] userId (String/UUID)
- [x] imageUrl (String)
- [x] rawText (String)
- [x] merchant (String)
- [x] total (Decimal)
- [x] purchaseDate (DateTime)
- [x] category (String?)
- [x] confidenceScore (Decimal?)
- [x] summary (String?)
- [x] createdAt (DateTime)
- [x] updatedAt (DateTime)
- [ ] isDuplicate (Boolean) - **NEW FIELD TO ADD**
- [ ] duplicateOf (String?) - **NEW FIELD TO ADD**
- [ ] duplicateConfidence (Decimal?) - **NEW FIELD TO ADD**

**Actual Schema Matches Expected**: ⬜ Yes / ⬜ No / ⬜ Partially
**Additional Fields Not Mentioned in Plan**: _____

---

## Function Signature Verification

### `getReceiptsByUserId()`

**Location**: src/lib/db.ts:_____
**Current Signature**:
```typescript
// Paste actual signature here
```

**Expected Parameters**: userId, options (with take, skip, filters, etc.)
**Matches Expectation**: ⬜ Yes / ⬜ No
**Can Accept New `includeDuplicates` Parameter**: ⬜ Yes / ⬜ No

---

### `getReceiptsWithPagination()`

**Location**: src/lib/db.ts:_____
**Current Signature**:
```typescript
// Paste actual signature here
```

**Expected Parameters**: userId, pagination options, filters
**Matches Expectation**: ⬜ Yes / ⬜ No
**Can Accept New `includeDuplicates` Parameter**: ⬜ Yes / ⬜ No

---

## Import and Dependency Verification

### Files that import `getReceiptStats()`

- [ ] File: _____ (grep result)
- [ ] File: _____ (grep result)
- [ ] File: _____ (grep result)

**Command to Find**:
```bash
grep -r "getReceiptStats" src/ --include="*.ts" --include="*.tsx"
```

---

### Files that import `getReceiptsByUserId()`

- [ ] File: _____ (grep result)
- [ ] File: _____ (grep result)
- [ ] File: _____ (grep result)

**Command to Find**:
```bash
grep -r "getReceiptsByUserId" src/ --include="*.ts" --include="*.tsx"
```

---

### Files that import `getReceiptsWithPagination()`

- [ ] File: _____ (grep result)
- [ ] File: _____ (grep result)
- [ ] File: _____ (grep result)

**Command to Find**:
```bash
grep -r "getReceiptsWithPagination" src/ --include="*.ts" --include="*.tsx"
```

---

## Line Number Accuracy Check

**Important**: Code may have changed since the plan was written. Verify actual line numbers.

| Function/Code Block | Expected Lines | Actual Lines | Match? | Notes |
|---------------------|----------------|--------------|--------|-------|
| Receipt Model | 67-101 | _____ | ⬜ | _____ |
| getReceiptsByUserId | 98-223 | _____ | ⬜ | _____ |
| getReceiptsWithPagination | 226-366 | _____ | ⬜ | _____ |
| getReceiptStats | 410-428 | _____ | ⬜ | _____ |
| Dashboard API route | 26-43 | _____ | ⬜ | _____ |

---

## Prisma Client Generation Check

- [ ] **Prisma Client Generated**: Run `npx prisma generate` and verify no errors
- [ ] **TypeScript Types Available**: Import `Receipt` type from `@prisma/client`
- [ ] **Database Connection Works**: Test query in development

**Test Command**:
```bash
npx prisma generate
```

---

## Critical Blockers

**List any files that don't exist or don't match the plan**:

1. ❌ **Blocker**: _____
   - **Expected**: _____
   - **Actual**: _____
   - **Impact**: _____
   - **Resolution**: _____

2. ❌ **Blocker**: _____
   - **Expected**: _____
   - **Actual**: _____
   - **Impact**: _____
   - **Resolution**: _____

---

## Verification Commands

Run these commands to verify file existence and structure:

```bash
# Check all files exist
ls -la prisma/schema.prisma
ls -la src/lib/db.ts
ls -la src/lib/services/financeFunctions.ts
ls -la src/lib/services/financeAgent.ts
ls -la src/lib/services/export.ts
ls -la src/app/api/receipts/upload/route.ts
ls -la src/app/api/dashboard/data/route.ts
ls -la src/components/receipts/ReceiptList.tsx
ls -la src/components/receipts/ReceiptViewerModal.tsx
ls -la src/components/dashboard/ReceiptStats.tsx

# Count lines in key files
wc -l src/lib/db.ts
wc -l src/lib/services/financeFunctions.ts

# Search for key functions
grep -n "getReceiptStats" src/lib/db.ts
grep -n "getReceiptsByUserId" src/lib/db.ts
grep -n "getReceiptsWithPagination" src/lib/db.ts

# Check Receipt model in Prisma schema
grep -A 40 "model Receipt" prisma/schema.prisma
```

---

## Sign-Off

- [ ] **All files verified to exist**: Date: _____ By: _____
- [ ] **All line numbers verified**: Date: _____ By: _____
- [ ] **All code snippets match current code**: Date: _____ By: _____
- [ ] **All dependencies identified**: Date: _____ By: _____
- [ ] **No critical blockers found**: Date: _____ By: _____

**Overall Status**: ⬜ READY TO PROCEED / ⬜ BLOCKERS FOUND / ⬜ NEEDS UPDATES

**Notes**: _____

---

**Next Step**: Once all files are verified, proceed to DEPENDENCY_IMPACT_MAP.md
