# Investigation Prompt for Claude Code: Duplicate Receipt Counting Issue

## CRITICAL INSTRUCTIONS

**DO NOT BUILD OR EDIT ANYTHING. ONLY INVESTIGATE AND CREATE A PLAN.**

You are tasked with investigating a duplicate receipt counting issue in the Steward codebase. Your ONLY output should be a file called `RECEIPT_DUPLICATE_FIX.md` that contains a comprehensive plan to solve this issue.

## Problem Description

From user screenshots, HelloSteward is counting ALL receipts in statistics, including duplicates. This is incorrect behavior. HelloSteward should only count receipts that are NOT duplicates when calculating statistics.

### Evidence from Screenshots:
- Multiple identical receipts appear in the expense list (same merchant, same amount, same date)
- Statistics show "Total Receipts: 6" but there appear to be duplicate entries
- Examples seen: Multiple "Tierra Mia Coffee Company" entries ($5.95, 2025-07-02) and multiple "Chick-fil-A" entries ($11.48, 2025-07-02)

## Investigation Tasks

### 1. Understand the Current Implementation

Investigate the following areas of the codebase:

#### A. Receipt Statistics Calculation
- **File**: `src/lib/db.ts`
  - Function: `getReceiptStats(userId: string)` (lines 410-428)
  - Current implementation: Uses `prisma.receipt.count({ where: { userId } })` which counts ALL receipts
  - Identify all places where this function is called

#### B. Statistics API Endpoints
- **File**: `src/app/api/receipts/stats/route.ts`
  - How it uses `getReceiptStats()`
  - What data it returns

- **File**: `src/app/api/dashboard/data/route.ts`
  - How it calculates `totalReceipts` (line 43: `receipts.length`)
  - Whether it filters duplicates

#### C. Database Schema
- **File**: `prisma/schema.prisma`
  - Receipt model (lines 67-101)
  - Check if there's any field to mark duplicates (e.g., `isDuplicate`, `duplicateOf`, `isOriginal`)
  - Current fields: id, userId, imageUrl, rawText, merchant, total, purchaseDate, summary, category, etc.

#### D. Frontend Statistics Display
- **File**: `src/components/dashboard/ReceiptStats.tsx`
  - How statistics are displayed
  - What data structure it expects

#### E. Receipt Query Functions
- **File**: `src/lib/db.ts`
  - `getReceiptsByUserId()` function
  - `getReceiptsWithPagination()` function
  - Check if any duplicate filtering exists

#### F. Analytics Service
- **File**: `src/app/api/analytics/advanced/route.ts`
  - How analytics calculates receipt counts
  - Whether it filters duplicates

### 2. Identify Duplicate Detection Logic

Search for any existing duplicate detection mechanisms:
- Search for "duplicate" in the codebase
- Check if there's any image similarity checking
- Check if there's any merchant + amount + date matching logic
- Review `src/app/api/receipts/upload/route.ts` for duplicate prevention during upload

### 3. Understand Duplicate Criteria

Based on the screenshots and codebase analysis, determine what makes a receipt a "duplicate":
- Same merchant name?
- Same total amount?
- Same purchase date?
- Same image URL?
- Combination of the above?
- Image similarity (if embeddings are used)?

### 4. Identify All Affected Areas

List all places where receipt counts are calculated or displayed:
- Statistics calculations
- Dashboard displays
- Analytics endpoints
- Receipt listing pages
- Export functions
- Any aggregation queries

## Required Output: RECEIPT_DUPLICATE_FIX.md

Create a comprehensive plan document with the following structure:

### Document Structure:

```markdown
# Receipt Duplicate Counting Fix Plan

## Problem Summary
[Brief description of the issue]

## Current State Analysis
[What you found in your investigation]

## Root Cause
[Why duplicates are being counted]

## Solution Approach
[High-level approach to fix the issue]

## Implementation Plan

### Phase 1: Database Schema Changes (if needed)
- [ ] Determine if schema changes are needed
- [ ] Add duplicate tracking fields if necessary
- [ ] Create migration plan

### Phase 2: Duplicate Detection Logic
- [ ] Define duplicate criteria
- [ ] Implement duplicate detection algorithm
- [ ] Create utility functions for duplicate checking

### Phase 3: Update Statistics Functions
- [ ] Modify `getReceiptStats()` in `src/lib/db.ts`
- [ ] Update `src/app/api/receipts/stats/route.ts`
- [ ] Update `src/app/api/dashboard/data/route.ts`
- [ ] Update analytics endpoints

### Phase 4: Update Query Functions
- [ ] Modify `getReceiptsByUserId()` to exclude duplicates
- [ ] Modify `getReceiptsWithPagination()` to exclude duplicates
- [ ] Ensure backward compatibility

### Phase 5: Frontend Updates
- [ ] Update `ReceiptStats.tsx` if needed
- [ ] Ensure UI displays correct counts

### Phase 6: Testing Strategy
- [ ] Unit tests for duplicate detection
- [ ] Integration tests for statistics
- [ ] Edge case testing

## Technical Considerations
- Performance implications
- Database query optimization
- Caching considerations
- Migration strategy for existing data

## Files to Modify
[List all files that will need changes]

## Risk Assessment
[Potential risks and mitigation strategies]
```

## Important Constraints

1. **DO NOT** write any code
2. **DO NOT** modify any files
3. **DO NOT** create any implementation
4. **ONLY** create the plan document `RECEIPT_DUPLICATE_FIX.md`
5. The plan should be detailed enough for another developer to implement
6. Include specific file paths and function names
7. Consider performance implications
8. Consider backward compatibility
9. Consider data migration needs

## Codebase Context

- **Database**: PostgreSQL with Prisma ORM
- **Backend**: Next.js API routes
- **Frontend**: React/Next.js
- **Key Files**:
  - `src/lib/db.ts` - Database operations
  - `src/app/api/receipts/stats/route.ts` - Statistics API
  - `src/app/api/dashboard/data/route.ts` - Dashboard data API
  - `prisma/schema.prisma` - Database schema
  - `src/components/dashboard/ReceiptStats.tsx` - Statistics display

## Investigation Approach

1. Read and understand the current statistics calculation flow
2. Trace how receipts are counted from database to UI
3. Identify all query points where counts are calculated
4. Determine what constitutes a "duplicate" receipt
5. Design a solution that excludes duplicates from counts
6. Document the complete plan in `RECEIPT_DUPLICATE_FIX.md`

---

**Remember**: Your ONLY deliverable is the `RECEIPT_DUPLICATE_FIX.md` file with a comprehensive plan. Do not implement anything.

