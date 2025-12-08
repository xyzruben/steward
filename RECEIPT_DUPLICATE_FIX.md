# Receipt Duplicate Counting Fix Plan

## Problem Summary

HelloSteward is currently counting **ALL receipts** in statistics calculations, including duplicate receipts. Based on user screenshots, there are multiple identical receipts (same merchant, same amount, same date) being counted multiple times in statistics like "Total Receipts", which inflates the count and provides inaccurate financial insights.

**Evidence from Screenshots:**
- Multiple "Tierra Mia Coffee Company" entries ($5.95, 2025-07-02)
- Multiple "Chick-fil-A" entries ($11.48, 2025-07-02)
- Statistics showing "Total Receipts: 6" when there appear to be duplicate entries

---

## Current State Analysis

### 1. Database Schema (`prisma/schema.prisma`)

**Receipt Model (lines 67-101):**
```prisma
model Receipt {
  id                String            @id @default(uuid()) @db.Uuid
  userId            String            @db.Uuid
  imageUrl          String
  rawText           String
  merchant          String
  total             Decimal           @db.Decimal(10, 2)
  purchaseDate      DateTime
  summary           String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  category          String?
  confidenceScore   Decimal?          @db.Decimal(3, 2)
  subcategory       String?
  convertedCurrency String?
  convertedTotal    Decimal?
  currency          String            @default("USD")
  // ... relations
}
```

**FINDING:** No fields exist for duplicate tracking:
- No `isDuplicate` boolean field
- No `duplicateOf` reference field
- No `isOriginal` boolean field
- No `duplicateGroup` identifier

### 2. Statistics Calculation (`src/lib/db.ts:410-428`)

**Current Implementation:**
```typescript
export async function getReceiptStats(userId: string) {
  const [totalReceipts, totalSpent, averageSpent] = await Promise.all([
    prisma.receipt.count({ where: { userId } }),  // ❌ COUNTS ALL RECEIPTS
    prisma.receipt.aggregate({
      where: { userId },  // ❌ AGGREGATES ALL RECEIPTS
      _sum: { total: true }
    }),
    prisma.receipt.aggregate({
      where: { userId },  // ❌ AVERAGES ALL RECEIPTS
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

**PROBLEM:** This function counts ALL receipts without any duplicate filtering.

### 3. Dashboard Data API (`src/app/api/dashboard/data/route.ts:26-43`)

**Current Implementation:**
```typescript
const receipts = await getReceiptsByUserId(user.id, { take: 10 })
// ...
const totalSpent = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0)
const totalReceipts = receipts.length  // ❌ COUNTS ALL RECEIPTS IN ARRAY
const averagePerReceipt = totalReceipts > 0 ? totalSpent / totalReceipts : 0
```

**PROBLEM:** Counts all receipts returned from the query without filtering duplicates.

### 4. Receipt Query Functions (`src/lib/db.ts`)

**Functions Analyzed:**
- `getReceiptsByUserId()` (lines 98-223) - No duplicate filtering
- `getReceiptsWithPagination()` (lines 226-366) - No duplicate filtering

**FINDING:** Both functions have extensive filtering capabilities:
- Search filtering (merchant, summary, rawText)
- Category filtering
- Subcategory filtering
- Amount range filtering
- Date range filtering
- Confidence score filtering

**BUT:** No duplicate detection or filtering exists.

### 5. No Existing Duplicate Detection Logic

**Comprehensive Search Results:**
- No `isDuplicate` field usage found
- No `duplicateOf` field usage found
- No duplicate detection in upload process (`src/app/api/receipts/upload/route.ts`)
- No image similarity checking with embeddings
- No merchant + amount + date matching logic

**Mentions of "duplicate" only appear in:**
- Documentation (AWS_PLANNING.md - proposed fraud detection feature)
- This investigation prompt
- AI chat components (user queries about duplicates)

### 6. Upload Process (`src/app/api/receipts/upload/route.ts`)

**Current Flow:**
1. Validate file upload
2. Compress image
3. Upload to storage
4. Create receipt record immediately
5. Process OCR and AI extraction asynchronously
6. Update receipt with extracted data

**FINDING:** No duplicate checking occurs before creating the receipt record.

---

## Root Cause

The root cause is a **missing duplicate detection and filtering system**:

1. **No Database Schema Support**: The Receipt model has no fields to mark or track duplicates
2. **No Detection Logic**: No code exists to identify duplicate receipts during upload or post-processing
3. **No Filtering in Queries**: All statistics and query functions count every receipt without exclusion logic
4. **No User Feedback**: Users are not warned when uploading potential duplicates

This means:
- Users can upload the same receipt multiple times
- All instances are counted in statistics
- Financial insights are inflated and inaccurate
- No mechanism exists to mark or hide duplicates

---

## Solution Approach

### High-Level Strategy

Implement a **multi-layered duplicate detection and filtering system**:

1. **Database Schema Enhancement**: Add fields to track duplicate status
2. **Duplicate Detection Algorithm**: Implement logic to identify duplicates based on multiple criteria
3. **Upload-Time Detection**: Check for duplicates during receipt upload
4. **Post-Processing Detection**: Batch process existing receipts to identify duplicates
5. **Statistics Filtering**: Update all count/aggregate queries to exclude duplicates
6. **User Interface**: Show duplicate indicators and provide management options

### Duplicate Detection Criteria

A receipt is considered a **duplicate** if it matches an existing receipt on:

**Primary Criteria (MUST match all):**
- Same `userId`
- Same `merchant` (case-insensitive, normalized)
- Same `total` amount (within $0.01 tolerance)
- Same `purchaseDate` (same calendar day)

**Secondary Criteria (Optional but increases confidence):**
- Similar `rawText` (fuzzy matching, e.g., Levenshtein distance)
- Similar image content (if embeddings are available)

### Duplicate Handling Strategy

When a duplicate is detected:
1. **Mark the newer receipt** as a duplicate (keep original as primary)
2. **Link duplicates** to the original receipt
3. **Exclude duplicates** from all statistics by default
4. **Show duplicates** in UI with clear indicators
5. **Allow users** to manually mark receipts as duplicates or non-duplicates

---

## Implementation Plan

### Phase 1: Database Schema Changes

**Objective:** Add fields to track duplicate status in the Receipt model

#### Tasks:

- [ ] **1.1: Update Prisma Schema**
  - **File**: `prisma/schema.prisma`
  - **Changes**:
    ```prisma
    model Receipt {
      // ... existing fields ...

      // Duplicate tracking fields
      isDuplicate       Boolean   @default(false)
      duplicateOf       String?   @db.Uuid
      duplicateConfidence Decimal? @db.Decimal(3, 2)  // 0.00 to 1.00

      // Self-referential relation for duplicate tracking
      originalReceipt   Receipt?  @relation("ReceiptDuplicates", fields: [duplicateOf], references: [id], onDelete: SetNull)
      duplicates        Receipt[] @relation("ReceiptDuplicates")

      @@index([isDuplicate])
      @@index([duplicateOf])
    }
    ```

- [ ] **1.2: Generate Migration**
  - Run: `npx prisma migrate dev --name add_duplicate_tracking`
  - Review generated migration file

- [ ] **1.3: Test Migration on Development Database**
  - Backup current data
  - Run migration
  - Verify schema changes
  - Test rollback if needed

- [ ] **1.4: Update TypeScript Types**
  - Run: `npx prisma generate`
  - Verify generated types include new fields

**Estimated Time:** 1-2 hours

**Risk Mitigation:**
- Backup database before migration
- Test on development environment first
- Use `@default(false)` for `isDuplicate` to avoid breaking existing data
- Use `onDelete: SetNull` to prevent cascading deletes

---

### Phase 2: Duplicate Detection Logic

**Objective:** Create utility functions to detect and manage duplicates

#### Tasks:

- [ ] **2.1: Create Duplicate Detection Utility**
  - **File**: `src/lib/services/duplicateDetection.ts` (NEW)
  - **Functions**:
    ```typescript
    // Interface for duplicate detection criteria
    interface DuplicateCheckCriteria {
      userId: string
      merchant: string
      total: number
      purchaseDate: Date
      rawText?: string
    }

    // Normalize merchant name for comparison
    function normalizeMerchantName(merchant: string): string

    // Check if two receipts are duplicates based on criteria
    function areDuplicates(receipt1: Receipt, receipt2: Receipt): boolean

    // Find potential duplicates for a receipt
    async function findDuplicates(
      criteria: DuplicateCheckCriteria
    ): Promise<Receipt[]>

    // Calculate duplicate confidence score (0.00 - 1.00)
    function calculateDuplicateConfidence(
      receipt1: Receipt,
      receipt2: Receipt
    ): number

    // Mark receipt as duplicate of another
    async function markAsDuplicate(
      duplicateId: string,
      originalId: string,
      confidence: number
    ): Promise<void>

    // Unmark receipt as duplicate
    async function unmarkAsDuplicate(receiptId: string): Promise<void>
    ```

- [ ] **2.2: Implement Merchant Name Normalization**
  - Remove extra whitespace
  - Convert to lowercase
  - Remove special characters (e.g., "Chick-fil-A" → "chickfila")
  - Handle common variations (e.g., "Starbucks Coffee" → "starbucks")

- [ ] **2.3: Implement Duplicate Detection Algorithm**
  - Query database for receipts matching:
    - Same userId
    - Similar merchant (normalized)
    - Total within $0.01
    - Purchase date within same day
  - Calculate confidence score based on:
    - Exact merchant match: +0.40
    - Exact total match: +0.30
    - Same purchase date: +0.20
    - Similar raw text (>80% similarity): +0.10
  - Return receipts with confidence ≥ 0.80 as duplicates

- [ ] **2.4: Implement Raw Text Similarity**
  - Use Levenshtein distance or similar algorithm
  - Calculate similarity percentage
  - Optional: Use existing embeddings for semantic similarity

**Estimated Time:** 4-6 hours

**Technical Considerations:**
- Performance: Duplicate checking should be fast (< 500ms)
- Accuracy: Balance between false positives and false negatives
- Flexibility: Allow manual override of automatic detection

---

### Phase 3: Update Statistics Functions

**Objective:** Modify all statistics calculations to exclude duplicates

#### Tasks:

- [ ] **3.1: Update `getReceiptStats()` Function**
  - **File**: `src/lib/db.ts` (lines 410-428)
  - **Changes**:
    ```typescript
    export async function getReceiptStats(userId: string) {
      const whereClause = {
        userId,
        isDuplicate: false  // ✅ EXCLUDE DUPLICATES
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

      return {
        totalReceipts,
        totalSpent: totalSpent._sum.total || 0,
        averageSpent: averageSpent._avg.total || 0
      }
    }
    ```

- [ ] **3.2: Update `getReceiptsByUserId()` Function**
  - **File**: `src/lib/db.ts` (lines 98-223)
  - **Changes**:
    - Add optional parameter: `includeDuplicates?: boolean = false`
    - Add to whereClause: `isDuplicate: includeDuplicates ? undefined : false`
    - Default behavior: exclude duplicates

- [ ] **3.3: Update `getReceiptsWithPagination()` Function**
  - **File**: `src/lib/db.ts` (lines 226-366)
  - **Changes**:
    - Add optional parameter: `includeDuplicates?: boolean = false`
    - Add to whereClause: `isDuplicate: includeDuplicates ? undefined : false`
    - Update count query to also exclude duplicates

- [ ] **3.4: Update Dashboard Data API**
  - **File**: `src/app/api/dashboard/data/route.ts`
  - **Changes**:
    ```typescript
    // Receipts are already filtered by getReceiptsByUserId (which now excludes duplicates)
    const receipts = await getReceiptsByUserId(user.id, { take: 10 })

    // This now counts only non-duplicate receipts
    const totalReceipts = receipts.length
    ```

- [ ] **3.5: Add Utility Function for Duplicate-Aware Queries**
  - **File**: `src/lib/db.ts`
  - **Function**:
    ```typescript
    // Helper to build where clause that excludes duplicates
    export function excludeDuplicatesClause(
      baseWhere: any,
      includeDuplicates: boolean = false
    ): any {
      if (includeDuplicates) {
        return baseWhere
      }
      return {
        ...baseWhere,
        isDuplicate: false
      }
    }
    ```

**Estimated Time:** 3-4 hours

**Testing Requirements:**
- Verify counts match expected values (duplicates excluded)
- Test with `includeDuplicates: true` parameter
- Ensure backward compatibility
- Verify performance impact is minimal

---

### Phase 4: Upload-Time Duplicate Detection

**Objective:** Check for duplicates during receipt upload and warn users

#### Tasks:

- [ ] **4.1: Add Duplicate Check to Upload Flow**
  - **File**: `src/app/api/receipts/upload/route.ts`
  - **Location**: After OCR and AI extraction in `processReceiptAsync()` function
  - **Changes**:
    ```typescript
    // After extracting receipt data (merchant, total, purchaseDate)
    const duplicates = await findDuplicates({
      userId,
      merchant,
      total,
      purchaseDate,
      rawText: ocrText
    })

    if (duplicates.length > 0) {
      // Mark as duplicate of the first (oldest) matching receipt
      const original = duplicates[0]
      const confidence = calculateDuplicateConfidence(
        { merchant, total, purchaseDate, rawText: ocrText },
        original
      )

      await markAsDuplicate(receiptId, original.id, confidence)

      console.log(`Duplicate detected: Receipt ${receiptId} is duplicate of ${original.id}`)
    }
    ```

- [ ] **4.2: Update Upload Response**
  - Return duplicate status in API response
  - Include original receipt ID if duplicate
  - Include confidence score

- [ ] **4.3: Add User Notification**
  - Show warning toast when duplicate is detected
  - Provide option to keep or delete duplicate
  - Link to original receipt

**Estimated Time:** 3-4 hours

**User Experience Considerations:**
- Don't block upload if duplicate detected (mark it instead)
- Provide clear feedback about duplicate status
- Allow users to override if they believe it's not a duplicate

---

### Phase 5: Batch Duplicate Detection

**Objective:** Identify and mark duplicates in existing receipt data

#### Tasks:

- [ ] **5.1: Create Batch Processing Script**
  - **File**: `scripts/detect-duplicates.js` (NEW)
  - **Functionality**:
    ```javascript
    // Fetch all receipts grouped by user
    // For each user:
    //   Sort receipts by createdAt (oldest first)
    //   For each receipt:
    //     Check if it's a duplicate of any previous receipt
    //     If yes, mark as duplicate
    //   Report findings
    ```

- [ ] **5.2: Create API Endpoint for Manual Detection**
  - **File**: `src/app/api/receipts/detect-duplicates/route.ts` (NEW)
  - **Method**: POST
  - **Functionality**:
    - Trigger duplicate detection for user's receipts
    - Return list of duplicates found
    - Optionally auto-mark duplicates

- [ ] **5.3: Add Admin Interface (Optional)**
  - Page to trigger batch duplicate detection
  - Show duplicate statistics
  - Review and approve duplicate markings

**Estimated Time:** 4-5 hours

**Performance Considerations:**
- Process in batches to avoid memory issues
- Use transaction for database updates
- Provide progress feedback for long-running operations

---

### Phase 6: Frontend Updates

**Objective:** Update UI to show duplicate status and management options

#### Tasks:

- [ ] **6.1: Update Receipt List Component**
  - **File**: `src/components/receipts/ReceiptList.tsx`
  - **Changes**:
    - Add duplicate indicator badge
    - Add filter to show/hide duplicates
    - Show link to original receipt if duplicate

- [ ] **6.2: Update Receipt Stats Component**
  - **File**: `src/components/dashboard/ReceiptStats.tsx`
  - **Changes**:
    - Already receives filtered stats (no changes needed)
    - Optionally add tooltip explaining duplicate exclusion

- [ ] **6.3: Add Duplicate Management Actions**
  - "Mark as Duplicate" action in receipt context menu
  - "Unmark as Duplicate" action for marked duplicates
  - Bulk actions to manage multiple duplicates

- [ ] **6.4: Update Receipt Viewer Modal**
  - **File**: `src/components/receipts/ReceiptViewerModal.tsx`
  - **Changes**:
    - Show duplicate status badge
    - Show link to original if duplicate
    - Show list of duplicates if original

**Estimated Time:** 4-6 hours

**UI/UX Considerations:**
- Clear visual distinction for duplicates (e.g., gray badge, lower opacity)
- Easy toggle to show/hide duplicates
- Quick actions for duplicate management

---

### Phase 7: Analytics and Export Updates

**Objective:** Ensure all analytics and export functions exclude duplicates

#### Tasks:

- [ ] **7.1: Update Finance Functions**
  - **File**: `src/lib/services/financeFunctions.ts`
  - Review all functions that query receipts
  - Add `isDuplicate: false` filter where appropriate

- [ ] **7.2: Update Analytics Service**
  - **File**: `src/lib/services/analytics.ts` (if exists)
  - Update all aggregate queries to exclude duplicates
  - Add optional parameter to include duplicates for analysis

- [ ] **7.3: Update Export Service**
  - **File**: `src/lib/services/export.ts`
  - Add option to include/exclude duplicates in export
  - Default: exclude duplicates
  - Add duplicate column in CSV export

- [ ] **7.4: Update AI Finance Agent**
  - **File**: `src/lib/services/financeAgent.ts`
  - Update queries to exclude duplicates by default
  - Handle user queries about duplicates specifically

**Estimated Time:** 3-4 hours

---

### Phase 8: Testing Strategy

**Objective:** Comprehensive testing of duplicate detection and filtering

#### Test Cases:

- [ ] **8.1: Unit Tests - Duplicate Detection Logic**
  - Test `normalizeMerchantName()` with various inputs
  - Test `areDuplicates()` with matching/non-matching receipts
  - Test `calculateDuplicateConfidence()` with different scenarios
  - Test edge cases (null values, special characters, etc.)

- [ ] **8.2: Integration Tests - Database Operations**
  - Test marking receipt as duplicate
  - Test unmarking duplicate
  - Test querying with duplicate filter
  - Test cascading updates

- [ ] **8.3: API Tests - Statistics Endpoints**
  - Test `/api/receipts/stats` excludes duplicates
  - Test `/api/dashboard/data` excludes duplicates
  - Test with `includeDuplicates` parameter

- [ ] **8.4: End-to-End Tests - Upload Flow**
  - Upload receipt → verify not marked as duplicate
  - Upload same receipt → verify marked as duplicate
  - Verify statistics updated correctly

- [ ] **8.5: Edge Case Testing**
  - Multiple duplicates of same receipt
  - Similar but not duplicate receipts (same merchant, different amount)
  - Receipts at same merchant on same day (different items)
  - Manual override of duplicate status

- [ ] **8.6: Performance Testing**
  - Duplicate detection on large dataset (1000+ receipts)
  - Statistics query performance with duplicate filter
  - Upload flow performance with duplicate check

- [ ] **8.7: User Acceptance Testing**
  - Upload duplicate receipts and verify behavior
  - Check statistics accuracy
  - Test duplicate management actions
  - Verify export includes/excludes duplicates correctly

**Test Data Requirements:**
- Create test receipts with known duplicates
- Use screenshots from user report as test cases:
  - "Tierra Mia Coffee Company" ($5.95, 2025-07-02) - duplicate
  - "Chick-fil-A" ($11.48, 2025-07-02) - duplicate

**Estimated Time:** 6-8 hours

---

## Technical Considerations

### Performance Implications

1. **Database Queries**
   - Adding `isDuplicate: false` filter is efficient with index
   - Duplicate detection query needs optimization for large datasets
   - Consider caching duplicate check results

2. **Upload Processing**
   - Duplicate check adds ~100-300ms to upload flow
   - Acceptable as processing is already async
   - Most expensive operation is database query for potential duplicates

3. **Migration**
   - Adding fields is non-blocking operation
   - Existing data gets default values (`isDuplicate: false`)
   - No data loss risk

### Query Optimization

**Indexes Required:**
```prisma
@@index([isDuplicate])
@@index([duplicateOf])
@@index([userId, merchant, purchaseDate])  // For duplicate detection
```

**Optimized Duplicate Detection Query:**
```typescript
// Use compound index for efficient duplicate search
const potentialDuplicates = await prisma.receipt.findMany({
  where: {
    userId,
    merchant: { contains: normalizedMerchant, mode: 'insensitive' },
    purchaseDate: {
      gte: startOfDay(purchaseDate),
      lte: endOfDay(purchaseDate)
    },
    total: {
      gte: total - 0.01,
      lte: total + 0.01
    },
    isDuplicate: false  // Only check against originals
  },
  orderBy: { createdAt: 'asc' }
})
```

### Caching Considerations

1. **Statistics Cache**
   - Current in-memory cache remains valid
   - Cache key should include duplicate filter status
   - Invalidate on duplicate status changes

2. **Duplicate Check Cache**
   - Cache negative results (no duplicates found) for recent receipts
   - TTL: 1 hour
   - Invalidate on new receipt upload

### Data Migration Strategy

**For Existing Data:**

1. **Phase 1**: Add schema fields (all defaults to `isDuplicate: false`)
2. **Phase 2**: Run batch detection script on existing data
3. **Phase 3**: Review high-confidence duplicates (≥0.90)
4. **Phase 4**: Auto-mark high-confidence duplicates
5. **Phase 5**: Manually review medium-confidence duplicates (0.70-0.89)

**Rollback Plan:**
- If issues arise, set all `isDuplicate` to `false`
- Remove duplicate filter from queries
- Revert schema in new migration if necessary

---

## Files to Modify

### Database & Core Logic
1. `prisma/schema.prisma` - Add duplicate tracking fields
2. `src/lib/services/duplicateDetection.ts` - NEW - Duplicate detection logic
3. `src/lib/db.ts` - Update statistics and query functions
4. `scripts/detect-duplicates.js` - NEW - Batch duplicate detection

### API Routes
5. `src/app/api/receipts/stats/route.ts` - Update to use modified getReceiptStats
6. `src/app/api/dashboard/data/route.ts` - Update statistics calculation
7. `src/app/api/receipts/upload/route.ts` - Add upload-time duplicate detection
8. `src/app/api/receipts/detect-duplicates/route.ts` - NEW - Manual detection endpoint
9. `src/app/api/analytics/advanced/route.ts` - Ensure analytics exclude duplicates

### Services
10. `src/lib/services/financeFunctions.ts` - Update queries to exclude duplicates
11. `src/lib/services/export.ts` - Add duplicate handling to export
12. `src/lib/services/financeAgent.ts` - Update agent queries
13. `src/lib/services/analytics.ts` - Update analytics queries (if exists)

### Frontend Components
14. `src/components/receipts/ReceiptList.tsx` - Show duplicate indicators
15. `src/components/dashboard/ReceiptStats.tsx` - Already receives filtered stats (minimal changes)
16. `src/components/receipts/ReceiptViewerModal.tsx` - Show duplicate status and links
17. `src/components/dashboard/RecentReceipts.tsx` - Handle duplicate display

### Types & Utilities
18. `src/types/receipt.ts` - Update Receipt type if custom types exist
19. `src/lib/utils.ts` - Add any duplicate-related utility functions

---

## Risk Assessment

### High Risk Items

1. **Data Migration**
   - **Risk**: Migration fails or corrupts data
   - **Mitigation**:
     - Full database backup before migration
     - Test on development/staging first
     - Use safe defaults (`isDuplicate: false`)
     - Have rollback script ready

2. **False Positives**
   - **Risk**: Legitimate receipts marked as duplicates
   - **Mitigation**:
     - Use confidence scoring (only auto-mark ≥0.90)
     - Allow manual override
     - Provide clear UI for review
     - Log all automatic duplicate markings

3. **Performance Degradation**
   - **Risk**: Duplicate detection slows down uploads
   - **Mitigation**:
     - Optimize database queries with indexes
     - Cache duplicate check results
     - Run detection asynchronously (don't block upload)
     - Set timeout for duplicate detection (5 seconds max)

### Medium Risk Items

4. **Statistics Discrepancy**
   - **Risk**: Existing statistics suddenly change after filtering duplicates
   - **Mitigation**:
     - Communicate change to users
     - Show both counts (with/without duplicates) temporarily
     - Provide explanation in UI

5. **Backward Compatibility**
   - **Risk**: Breaking existing code that relies on current counts
   - **Mitigation**:
     - Add optional `includeDuplicates` parameter to queries
     - Default to new behavior (exclude duplicates)
     - Update all internal calls explicitly

### Low Risk Items

6. **UI Confusion**
   - **Risk**: Users don't understand duplicate indicators
   - **Mitigation**:
     - Clear labeling and tooltips
     - Help documentation
     - Onboarding tour highlighting feature

7. **Export Confusion**
   - **Risk**: Users expect different behavior in exports
   - **Mitigation**:
     - Clearly label export options
     - Show count of receipts being exported
     - Provide both options (with/without duplicates)

---

## Success Criteria

### Functional Requirements Met
✅ Duplicates are automatically detected with ≥80% confidence
✅ Statistics exclude duplicate receipts by default
✅ Users can view and manage duplicates
✅ Existing receipts are processed for duplicates
✅ No legitimate receipts are falsely marked as duplicates (< 1% false positive rate)

### Performance Requirements Met
✅ Duplicate detection completes in < 500ms
✅ Statistics queries remain under 1 second
✅ Upload flow not significantly impacted (< 300ms additional time)

### Data Integrity Requirements Met
✅ No data loss during migration
✅ All existing receipts have valid duplicate status
✅ Duplicate relationships are correctly maintained

### User Experience Requirements Met
✅ Clear indication of duplicate status in UI
✅ Easy way to manage duplicates
✅ Accurate statistics displayed
✅ No confusion about counts

---

## Timeline Estimate

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|---------------|----------|
| Phase 1: Database Schema | Migration, testing | 1-2 hours | P0 (Critical) |
| Phase 2: Detection Logic | Utility functions, algorithm | 4-6 hours | P0 (Critical) |
| Phase 3: Statistics Updates | Query modifications | 3-4 hours | P0 (Critical) |
| Phase 4: Upload Detection | Upload flow integration | 3-4 hours | P1 (High) |
| Phase 5: Batch Detection | Script, API endpoint | 4-5 hours | P1 (High) |
| Phase 6: Frontend Updates | UI components | 4-6 hours | P1 (High) |
| Phase 7: Analytics/Export | Service updates | 3-4 hours | P2 (Medium) |
| Phase 8: Testing | Unit, integration, E2E | 6-8 hours | P0 (Critical) |

**Total Estimated Time**: 28-39 hours (approximately 1 week for single developer)

**Recommended Approach**:
1. Complete Phases 1-3 first (core functionality) - ~8-12 hours
2. Test thoroughly with existing data
3. Deploy and monitor
4. Complete remaining phases iteratively

---

## Monitoring & Validation

### Metrics to Track

1. **Duplicate Detection Metrics**
   - Number of duplicates detected per day
   - Average confidence score of detections
   - False positive rate (manual reversals / total detections)
   - Detection latency (time to detect)

2. **Statistics Accuracy**
   - Before/after duplicate filtering counts
   - User feedback on accuracy
   - Discrepancy reports

3. **Performance Metrics**
   - Duplicate detection query time (p50, p95, p99)
   - Upload processing time (with duplicate check)
   - Statistics query time (with duplicate filter)

4. **User Engagement**
   - Manual duplicate markings/unmarkings
   - Duplicate filter usage (show/hide duplicates)
   - Export with/without duplicates

### Validation Steps Post-Deployment

1. **Immediate (Day 1)**
   - Verify no errors in logs
   - Check statistics match expected values
   - Test upload flow end-to-end
   - Monitor performance metrics

2. **Short-term (Week 1)**
   - Review duplicate detection accuracy
   - Collect user feedback
   - Monitor false positive reports
   - Check database query performance

3. **Long-term (Month 1)**
   - Analyze duplicate patterns
   - Optimize detection algorithm based on data
   - Refine confidence thresholds
   - Consider ML-based improvements

---

## Future Enhancements (Out of Scope)

These enhancements can be considered after the core duplicate detection is stable:

1. **Machine Learning-Based Detection**
   - Train model on user feedback (manual corrections)
   - Improve confidence scoring
   - Handle edge cases better

2. **Image Similarity Matching**
   - Use existing embeddings or image hashing
   - Detect duplicates even with OCR variations
   - Higher confidence for visually identical receipts

3. **Smart Duplicate Groups**
   - Group multiple duplicates together
   - Show one representative with count badge
   - Expand to show all duplicates

4. **Duplicate Analytics**
   - Dashboard showing duplicate trends
   - Identify problematic merchants or dates
   - User behavior insights

5. **Automatic Deletion**
   - Option to auto-delete duplicates above confidence threshold
   - Keep only original
   - User preference setting

---

## Questions & Clarifications Needed

Before implementation, clarify with stakeholders:

1. **Should duplicates be hidden or just marked?**
   - Option A: Hide completely from default views
   - Option B: Show with clear indicator
   - **Recommendation**: Option B (show with indicator) for transparency

2. **Should users be prevented from uploading duplicates?**
   - Option A: Block upload with error message
   - Option B: Allow upload but mark as duplicate
   - **Recommendation**: Option B (allow but mark) to avoid false positive blocking

3. **What confidence threshold for auto-marking?**
   - Suggested: ≥0.90 for automatic marking
   - 0.70-0.89 for manual review/user confirmation
   - **Needs**: User testing to validate threshold

4. **Should existing duplicates be auto-corrected?**
   - Option A: Auto-mark all detected duplicates
   - Option B: Mark only high-confidence, review others
   - **Recommendation**: Option B (manual review for existing data)

5. **Export default behavior?**
   - Should exports include duplicates by default?
   - **Recommendation**: No, exclude by default with option to include

---

## Appendix: Example Scenarios

### Scenario 1: Exact Duplicate

**Receipt A (Original):**
- Merchant: "Chick-fil-A"
- Total: $11.48
- Date: 2025-07-02
- Created: 2025-07-02 10:30 AM

**Receipt B (Uploaded later):**
- Merchant: "Chick-fil-A"
- Total: $11.48
- Date: 2025-07-02
- Created: 2025-07-02 11:45 AM

**Detection Result:**
- Match: ✅ All criteria matched
- Confidence: 1.00 (100%)
- Action: Mark Receipt B as duplicate of Receipt A
- User Notification: "This receipt appears to be a duplicate"

### Scenario 2: Similar but Not Duplicate

**Receipt A:**
- Merchant: "Starbucks"
- Total: $5.75
- Date: 2025-07-02
- Items: Grande Latte

**Receipt B:**
- Merchant: "Starbucks"
- Total: $4.25
- Date: 2025-07-02
- Items: Tall Coffee

**Detection Result:**
- Match: ❌ Total amount differs
- Confidence: 0.60 (below threshold)
- Action: No duplicate marking
- Reason: Same merchant and date, but different amounts (likely two separate purchases)

### Scenario 3: OCR Variation

**Receipt A:**
- Merchant: "Target"
- Total: $45.99
- Date: 2025-07-02
- Raw Text: "TARGET STORE #1234..."

**Receipt B (Same receipt, re-uploaded):**
- Merchant: "Target Store 1234"
- Total: $45.99
- Date: 2025-07-02
- Raw Text: "TARGET STO RE #1234..." (OCR spacing error)

**Detection Result:**
- Match: ✅ After normalization
- Confidence: 0.95 (high)
- Action: Mark Receipt B as duplicate of Receipt A
- Reason: Normalized merchants match, exact total and date match, high text similarity

---

## Document Version Control

- **Version**: 1.0
- **Created**: 2025-11-26
- **Author**: Investigation & Planning Phase
- **Status**: Ready for Implementation
- **Next Steps**: Review with team → Approve plan → Begin Phase 1

---

## References

- **Investigation Prompt**: `CLAUDE_CODE_INVESTIGATION_PROMPT.md`
- **Database Schema**: `prisma/schema.prisma`
- **Statistics Function**: `src/lib/db.ts:410-428`
- **Upload Flow**: `src/app/api/receipts/upload/route.ts`
- **Dashboard API**: `src/app/api/dashboard/data/route.ts`
