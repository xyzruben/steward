# Test Scenario Specifications

**Purpose**: Detailed test scenarios with specific inputs, expected outputs, and assertions for duplicate detection implementation.

**Status**: ⏳ Ready for Testing
**Last Updated**: 2025-12-01
**Test Framework**: Jest + React Testing Library

---

## Overview

This document provides SPECIFIC test cases with exact inputs and expected outputs to eliminate ambiguity during testing.

---

## Unit Tests

### 1. Merchant Name Normalization

#### Test 1.1: Remove Special Characters

**Function**: `normalizeMerchantName()`

**Input**: `"Chick-fil-A"`
**Expected Output**: `"chickfila"`
**Assertion**:
```typescript
expect(normalizeMerchantName("Chick-fil-A")).toBe("chickfila")
```

---

#### Test 1.2: Handle Extra Whitespace

**Input**: `"  Starbucks  Coffee  "`
**Expected Output**: `"starbucks coffee"`
**Assertion**:
```typescript
expect(normalizeMerchantName("  Starbucks  Coffee  ")).toBe("starbucks coffee")
```

---

#### Test 1.3: Convert to Lowercase

**Input**: `"TARGET STORE #1234"`
**Expected Output**: `"target store 1234"`
**Assertion**:
```typescript
expect(normalizeMerchantName("TARGET STORE #1234")).toBe("target store 1234")
```

---

#### Test 1.4: Remove All Special Characters

**Input**: `"McDonald's®"`
**Expected Output**: `"mcdonalds"`
**Assertion**:
```typescript
expect(normalizeMerchantName("McDonald's®")).toBe("mcdonalds")
```

---

#### Test 1.5: Handle Empty String

**Input**: `""`
**Expected Output**: `""`
**Assertion**:
```typescript
expect(normalizeMerchantName("")).toBe("")
```

---

### 2. Duplicate Detection

#### Test 2.1: Exact Match (All Criteria)

**Function**: `areDuplicates()`

**Receipt 1**:
```typescript
{
  merchant: "Chick-fil-A",
  total: new Decimal(11.48),
  purchaseDate: new Date("2025-07-02T10:30:00Z"),
  rawText: "CHICK-FIL-A #1234\nTotal: $11.48"
}
```

**Receipt 2**:
```typescript
{
  merchant: "Chick-fil-A",
  total: new Decimal(11.48),
  purchaseDate: new Date("2025-07-02T14:00:00Z"),  // Same day, different time
  rawText: "CHICK-FIL-A #1234\nTotal: $11.48"
}
```

**Expected**: `true`
**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2)).toBe(true)
```

---

#### Test 2.2: Different Amount (NOT Duplicate)

**Receipt 1**:
```typescript
{
  merchant: "Starbucks",
  total: new Decimal(5.75),
  purchaseDate: new Date("2025-07-02"),
}
```

**Receipt 2**:
```typescript
{
  merchant: "Starbucks",
  total: new Decimal(4.25),  // Different amount
  purchaseDate: new Date("2025-07-02"),
}
```

**Expected**: `false`
**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2)).toBe(false)
```

---

#### Test 2.3: Different Date (NOT Duplicate)

**Receipt 1**:
```typescript
{
  merchant: "Target",
  total: new Decimal(45.99),
  purchaseDate: new Date("2025-07-02"),
}
```

**Receipt 2**:
```typescript
{
  merchant: "Target",
  total: new Decimal(45.99),
  purchaseDate: new Date("2025-07-03"),  // Next day
}
```

**Expected**: `false`
**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2)).toBe(false)
```

---

#### Test 2.4: Different Merchant (NOT Duplicate)

**Receipt 1**:
```typescript
{
  merchant: "Walmart",
  total: new Decimal(25.00),
  purchaseDate: new Date("2025-07-02"),
}
```

**Receipt 2**:
```typescript
{
  merchant: "Target",  // Different merchant
  total: new Decimal(25.00),
  purchaseDate: new Date("2025-07-02"),
}
```

**Expected**: `false`
**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2)).toBe(false)
```

---

#### Test 2.5: OCR Variation (IS Duplicate)

**Receipt 1**:
```typescript
{
  merchant: "Target",
  total: new Decimal(45.99),
  purchaseDate: new Date("2025-07-02"),
  rawText: "TARGET STORE #1234"
}
```

**Receipt 2** (same receipt, OCR spacing error):
```typescript
{
  merchant: "Target Store 1234",  // Different format
  total: new Decimal(45.99),
  purchaseDate: new Date("2025-07-02"),
  rawText: "TARGET STO RE #1234"  // Spacing error
}
```

**Expected**: `true` (after normalization)
**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2)).toBe(true)
```

---

#### Test 2.6: Amount Within Tolerance

**Receipt 1**:
```typescript
{
  merchant: "Starbucks",
  total: new Decimal(5.99),
  purchaseDate: new Date("2025-07-02"),
}
```

**Receipt 2**:
```typescript
{
  merchant: "Starbucks",
  total: new Decimal(6.00),  // $0.01 difference
  purchaseDate: new Date("2025-07-02"),
}
```

**Expected**: `true` (within $0.01 tolerance)
**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2, { amountTolerance: 0.01 })).toBe(true)
```

---

### 3. Confidence Score Calculation

#### Test 3.1: Perfect Match

**Function**: `calculateDuplicateConfidence()`

**Receipt 1 & 2**: Identical merchant, amount, date, and text

**Expected Confidence**: `1.00`
**Breakdown**:
- Exact merchant: +0.40
- Exact total: +0.30
- Same date: +0.20
- Identical text: +0.10
- **Total**: 1.00

**Assertion**:
```typescript
expect(calculateDuplicateConfidence(receipt1, receipt2)).toBe(1.00)
```

---

#### Test 3.2: High Confidence (No Text Match)

**Receipt 1 & 2**: Same merchant, amount, date but different raw text

**Expected Confidence**: `0.90`
**Breakdown**:
- Exact merchant: +0.40
- Exact total: +0.30
- Same date: +0.20
- Different text: +0.00
- **Total**: 0.90

**Assertion**:
```typescript
expect(calculateDuplicateConfidence(receipt1, receipt2)).toBe(0.90)
```

---

#### Test 3.3: Medium Confidence (Similar Merchant)

**Receipt 1**: merchant = "Starbucks Coffee"
**Receipt 2**: merchant = "Starbucks" (normalized to same)

**Expected Confidence**: `0.90` (treated as exact after normalization)

**Assertion**:
```typescript
expect(calculateDuplicateConfidence(receipt1, receipt2)).toBeGreaterThanOrEqual(0.90)
```

---

#### Test 3.4: Low Confidence (Below Threshold)

**Receipt 1 & 2**: Same date only, different merchant and amount

**Expected Confidence**: `0.20`
**Breakdown**:
- Different merchant: +0.00
- Different total: +0.00
- Same date: +0.20
- Different text: +0.00
- **Total**: 0.20

**Assertion**:
```typescript
const confidence = calculateDuplicateConfidence(receipt1, receipt2)
expect(confidence).toBeLessThan(0.80)  // Below auto-mark threshold
```

---

### 4. Database Operations

#### Test 4.1: Mark Receipt as Duplicate

**Function**: `markAsDuplicate()`

**Setup**:
```typescript
const originalId = "original-receipt-id"
const duplicateId = "duplicate-receipt-id"
const confidence = 0.95
```

**Action**:
```typescript
await markAsDuplicate(duplicateId, originalId, confidence)
```

**Expected Database State**:
```typescript
const updatedReceipt = await prisma.receipt.findUnique({
  where: { id: duplicateId }
})

expect(updatedReceipt.isDuplicate).toBe(true)
expect(updatedReceipt.duplicateOf).toBe(originalId)
expect(Number(updatedReceipt.duplicateConfidence)).toBe(0.95)
```

---

#### Test 4.2: Unmark Receipt as Duplicate

**Function**: `unmarkAsDuplicate()`

**Setup**: Receipt already marked as duplicate

**Action**:
```typescript
await unmarkAsDuplicate(duplicateId)
```

**Expected Database State**:
```typescript
const updatedReceipt = await prisma.receipt.findUnique({
  where: { id: duplicateId }
})

expect(updatedReceipt.isDuplicate).toBe(false)
expect(updatedReceipt.duplicateOf).toBe(null)
expect(updatedReceipt.duplicateConfidence).toBe(null)
```

---

#### Test 4.3: Find Duplicates Query

**Function**: `findDuplicates()`

**Setup**: Database has 3 receipts:
1. Original: Chick-fil-A, $11.48, 2025-07-02
2. Duplicate 1: Chick-fil-A, $11.48, 2025-07-02
3. Different: Starbucks, $5.75, 2025-07-02

**Action**:
```typescript
const duplicates = await findDuplicates({
  userId: "test-user",
  merchant: "Chick-fil-A",
  total: 11.48,
  purchaseDate: new Date("2025-07-02"),
})
```

**Expected**:
```typescript
expect(duplicates).toHaveLength(1)  // Only the original (Duplicate 1 might already be marked)
expect(duplicates[0].merchant).toBe("Chick-fil-A")
```

---

## Integration Tests

### 5. Statistics Calculations

#### Test 5.1: getReceiptStats Excludes Duplicates

**Setup**: Database has:
- 5 original receipts (total: $100)
- 2 duplicate receipts (total: $30)

**Action**:
```typescript
const stats = await getReceiptStats(userId)
```

**Expected**:
```typescript
expect(stats.totalReceipts).toBe(5)  // NOT 7
expect(Number(stats.totalSpent)).toBe(100)  // NOT 130
expect(Number(stats.averageSpent)).toBe(20)  // 100/5, NOT 130/7
```

---

#### Test 5.2: getReceiptStats with includeDuplicates

**Setup**: Same as above

**Action**:
```typescript
const stats = await getReceiptStats(userId, { includeDuplicates: true })
```

**Expected**:
```typescript
expect(stats.totalReceipts).toBe(7)  // All receipts
expect(Number(stats.totalSpent)).toBe(130)  // All spending
```

---

### 6. Receipt Query Functions

#### Test 6.1: getReceiptsByUserId Excludes Duplicates by Default

**Setup**: User has 10 receipts, 3 are duplicates

**Action**:
```typescript
const receipts = await getReceiptsByUserId(userId)
```

**Expected**:
```typescript
expect(receipts).toHaveLength(7)  // 10 - 3 duplicates
expect(receipts.every(r => !r.isDuplicate)).toBe(true)
```

---

#### Test 6.2: getReceiptsByUserId Includes Duplicates When Requested

**Setup**: Same as above

**Action**:
```typescript
const receipts = await getReceiptsByUserId(userId, { includeDuplicates: true })
```

**Expected**:
```typescript
expect(receipts).toHaveLength(10)  // All receipts
expect(receipts.filter(r => r.isDuplicate)).toHaveLength(3)
```

---

### 7. Upload and Duplicate Detection

#### Test 7.1: Upload Original Receipt (No Duplicate)

**Setup**: Database is empty for this user

**Action**: Upload receipt for "Chick-fil-A", $11.48, 2025-07-02

**Expected Response**:
```typescript
expect(response.status).toBe(200)
expect(response.body.isDuplicate).toBe(false)
expect(response.body.duplicateOf).toBeNull()
```

---

#### Test 7.2: Upload Duplicate Receipt

**Setup**: Database has receipt for "Chick-fil-A", $11.48, 2025-07-02

**Action**: Upload same receipt again

**Expected Response**:
```typescript
expect(response.status).toBe(200)
expect(response.body.isDuplicate).toBe(true)
expect(response.body.duplicateOf).toBeTruthy()  // ID of original
expect(response.body.duplicateConfidence).toBeGreaterThanOrEqual(0.90)
```

---

#### Test 7.3: Upload Similar But Not Duplicate

**Setup**: Database has receipt for "Chick-fil-A", $11.48, 2025-07-02

**Action**: Upload receipt for "Chick-fil-A", $8.99, 2025-07-02 (different amount)

**Expected Response**:
```typescript
expect(response.status).toBe(200)
expect(response.body.isDuplicate).toBe(false)  // Different amount
```

---

### 8. API Endpoint Tests

#### Test 8.1: GET /api/receipts/stats

**Setup**: User has 10 receipts, 2 are duplicates

**Request**:
```http
GET /api/receipts/stats
Authorization: Bearer <token>
```

**Expected Response**:
```json
{
  "totalReceipts": 8,
  "totalSpent": 150.00,
  "averageSpent": 18.75
}
```

**Assertion**:
```typescript
expect(response.status).toBe(200)
expect(response.body.totalReceipts).toBe(8)
```

---

#### Test 8.2: GET /api/dashboard/data

**Setup**: Same as above

**Request**:
```http
GET /api/dashboard/data
Authorization: Bearer <token>
```

**Expected Response**:
```json
{
  "receipts": [...],  // Array of 10 most recent (non-duplicate)
  "totalReceipts": 8,
  "totalSpent": 150.00,
  "averagePerReceipt": 18.75
}
```

**Assertion**:
```typescript
expect(response.body.receipts).toHaveLength(8)
expect(response.body.receipts.every(r => !r.isDuplicate)).toBe(true)
```

---

#### Test 8.3: POST /api/receipts/detect-duplicates

**Setup**: User has 20 receipts with 5 duplicates not yet marked

**Request**:
```http
POST /api/receipts/detect-duplicates
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoMark": true,
  "threshold": 0.80
}
```

**Expected Response**:
```json
{
  "duplicatesFound": 5,
  "duplicates": [
    {
      "receiptId": "dup-1-id",
      "duplicateOf": "orig-1-id",
      "confidence": 0.95,
      "merchant": "Chick-fil-A",
      "total": 11.48,
      "purchaseDate": "2025-07-02"
    },
    // ... 4 more
  ],
  "autoMarked": 5
}
```

**Assertion**:
```typescript
expect(response.status).toBe(200)
expect(response.body.duplicatesFound).toBe(5)
expect(response.body.autoMarked).toBe(5)
```

---

### 9. Finance Functions Tests

#### Test 9.1: getSpendingByCategory Excludes Duplicates

**Setup**:
- 3 "food" receipts (total $50)
- 1 "food" duplicate (total $15)

**Action**:
```typescript
const spending = await getSpendingByCategory(userId, "food")
```

**Expected**:
```typescript
expect(spending.total).toBe(50)  // NOT 65
expect(spending.count).toBe(3)   // NOT 4
```

---

#### Test 9.2: getSpendingByVendor with Duplicates

**Setup**:
- 5 "Starbucks" receipts (total $30)
- 2 "Starbucks" duplicates (total $12)

**Action**:
```typescript
const spending = await getSpendingByVendor(userId, "Starbucks")
```

**Expected**:
```typescript
expect(spending.total).toBe(30)  // NOT 42
expect(spending.count).toBe(5)   // NOT 7
```

---

### 10. Export Tests

#### Test 10.1: CSV Export Excludes Duplicates by Default

**Setup**: User has 10 receipts, 2 are duplicates

**Action**:
```typescript
const csv = await exportReceiptsToCSV(userId)
```

**Expected**:
```typescript
const lines = csv.split('\n')
expect(lines.length).toBe(9)  // Header + 8 receipts (not 10)
```

---

#### Test 10.2: CSV Export Includes Duplicates When Requested

**Action**:
```typescript
const csv = await exportReceiptsToCSV(userId, { includeDuplicates: true })
```

**Expected**:
```typescript
const lines = csv.split('\n')
expect(lines.length).toBe(11)  // Header + 10 receipts
```

---

#### Test 10.3: CSV Export Has isDuplicate Column

**Action**:
```typescript
const csv = await exportReceiptsToCSV(userId, { includeDuplicates: true })
```

**Expected**:
```typescript
const header = csv.split('\n')[0]
expect(header).toContain('isDuplicate')
expect(header).toContain('duplicateOf')
```

---

## End-to-End Tests

### 11. Complete Duplicate Flow

#### Test 11.1: Upload → Detect → Mark → Verify Stats

**Scenario**: User uploads the same receipt twice

**Steps**:
1. Upload original receipt
2. Verify stats show 1 receipt
3. Upload same receipt again
4. Verify duplicate detected automatically
5. Verify stats still show 1 receipt (duplicate excluded)

**Implementation**:
```typescript
test('Complete duplicate flow', async () => {
  // Step 1: Upload original
  const receipt1 = await uploadReceipt(userId, receiptFile)
  expect(receipt1.isDuplicate).toBe(false)

  // Step 2: Check stats
  let stats = await getReceiptStats(userId)
  expect(stats.totalReceipts).toBe(1)

  // Step 3: Upload duplicate
  const receipt2 = await uploadReceipt(userId, receiptFile)
  expect(receipt2.isDuplicate).toBe(true)
  expect(receipt2.duplicateOf).toBe(receipt1.id)

  // Step 4: Check stats again
  stats = await getReceiptStats(userId)
  expect(stats.totalReceipts).toBe(1)  // Still 1!
})
```

---

### 12. User Scenarios from Screenshots

#### Test 12.1: Tierra Mia Coffee Duplicates

**Based on**: User screenshots showing multiple "Tierra Mia Coffee Company" entries ($5.95, 2025-07-02)

**Setup**: Create 3 identical receipts

**Expected**:
- First upload: Original (isDuplicate: false)
- Second upload: Duplicate (isDuplicate: true, confidence: 1.00)
- Third upload: Duplicate (isDuplicate: true, confidence: 1.00)

**Stats After All Uploads**:
- totalReceipts: 1
- totalSpent: $5.95

**Assertion**:
```typescript
const duplicates = await prisma.receipt.findMany({
  where: { merchant: "Tierra Mia Coffee Company", isDuplicate: true }
})
expect(duplicates).toHaveLength(2)  // 2 duplicates, 1 original
```

---

#### Test 12.2: Chick-fil-A Duplicates

**Based on**: User screenshots showing multiple "Chick-fil-A" entries ($11.48, 2025-07-02)

**Setup**: Upload same Chick-fil-A receipt twice

**Expected**:
- Stats should show 1 receipt, not 2
- Total spent: $11.48, not $22.96

**Assertion**:
```typescript
const stats = await getReceiptStats(userId)
expect(stats.totalReceipts).toBe(1)
expect(Number(stats.totalSpent)).toBe(11.48)
```

---

## Edge Cases

### 13. Edge Case Tests

#### Test 13.1: Same Merchant, Same Day, Different Amounts

**Scenario**: User went to Starbucks twice in one day

**Receipt 1**: Starbucks, $5.75, 2025-07-02, 9:00 AM
**Receipt 2**: Starbucks, $8.50, 2025-07-02, 2:00 PM

**Expected**: NOT duplicates (different amounts)

**Assertion**:
```typescript
expect(areDuplicates(receipt1, receipt2)).toBe(false)
```

---

#### Test 13.2: Multiple Duplicates of Same Original

**Scenario**: User uploads same receipt 5 times

**Expected**:
- 1 original (isDuplicate: false)
- 4 duplicates (all with duplicateOf pointing to original)

**Assertion**:
```typescript
const duplicates = await prisma.receipt.findMany({
  where: { duplicateOf: originalId }
})
expect(duplicates).toHaveLength(4)
```

---

#### Test 13.3: Duplicate Chain (A → B → C)

**Scenario**: What if duplicate is marked as duplicate of another duplicate?

**Expected**: Should not happen. Duplicates always point to original.

**Test Implementation**:
```typescript
// Receipt A is original
// Receipt B is duplicate of A
await markAsDuplicate(receiptB.id, receiptA.id, 0.95)

// Receipt C should also be duplicate of A (not B)
await markAsDuplicate(receiptC.id, receiptA.id, 0.95)

const receiptC = await prisma.receipt.findUnique({ where: { id: receiptC.id } })
expect(receiptC.duplicateOf).toBe(receiptA.id)  // Points to A, not B
```

---

#### Test 13.4: Unmarking Duplicate Doesn't Break Relations

**Scenario**: Unmark a duplicate, ensure relations are cleaned up

**Action**:
```typescript
await unmarkAsDuplicate(duplicateId)
```

**Expected**:
```typescript
const receipt = await prisma.receipt.findUnique({
  where: { id: duplicateId },
  include: { originalReceipt: true }
})

expect(receipt.isDuplicate).toBe(false)
expect(receipt.duplicateOf).toBe(null)
expect(receipt.originalReceipt).toBe(null)
```

---

#### Test 13.5: Delete Original, Duplicates Not Orphaned

**Scenario**: Original receipt deleted

**Expected**: With `onDelete: SetNull`, duplicates should have duplicateOf set to null

**Action**:
```typescript
await prisma.receipt.delete({ where: { id: originalId } })
```

**Expected**:
```typescript
const duplicate = await prisma.receipt.findUnique({ where: { id: duplicateId } })
expect(duplicate.duplicateOf).toBe(null)
// Optionally: duplicate.isDuplicate could be reset to false
```

---

## Performance Tests

### 14. Performance Benchmarks

#### Test 14.1: Duplicate Detection Speed

**Setup**: Database with 1000 receipts

**Action**: Detect duplicates for new receipt upload

**Expected**: < 500ms

**Implementation**:
```typescript
test('Duplicate detection completes in under 500ms', async () => {
  const start = Date.now()
  await findDuplicates(criteria)
  const duration = Date.now() - start

  expect(duration).toBeLessThan(500)
})
```

---

#### Test 14.2: Statistics Query Performance

**Setup**: Database with 10,000 receipts

**Action**: Call getReceiptStats with duplicate filter

**Expected**: < 1000ms

**Implementation**:
```typescript
test('Stats query with 10k receipts completes in under 1s', async () => {
  const start = Date.now()
  await getReceiptStats(userId)
  const duration = Date.now() - start

  expect(duration).toBeLessThan(1000)
})
```

---

## Test Data Setup

### 15. Test Fixtures

#### Fixture 15.1: Mock Receipts

```typescript
// test/fixtures/receipts.ts

export const mockOriginalReceipt: Receipt = {
  id: 'receipt-original-1',
  userId: 'user-test-1',
  merchant: 'Chick-fil-A',
  total: new Decimal(11.48),
  purchaseDate: new Date('2025-07-02T10:00:00Z'),
  imageUrl: 'https://example.com/receipt1.jpg',
  rawText: 'CHICK-FIL-A #1234\nTotal: $11.48',
  category: 'food',
  isDuplicate: false,
  duplicateOf: null,
  duplicateConfidence: null,
  // ... other required fields
}

export const mockDuplicateReceipt: Receipt = {
  ...mockOriginalReceipt,
  id: 'receipt-duplicate-1',
  isDuplicate: true,
  duplicateOf: 'receipt-original-1',
  duplicateConfidence: new Decimal(0.95),
}

export const mockSimilarNotDuplicate: Receipt = {
  ...mockOriginalReceipt,
  id: 'receipt-similar-1',
  total: new Decimal(8.99),  // Different amount
  isDuplicate: false,
  duplicateOf: null,
}
```

---

## Test Coverage Goals

### Coverage Targets

- [ ] **Unit Tests**: > 90% coverage
  - `duplicateDetection.ts`: 100%
  - `db.ts` (modified functions): 100%
  - Utility functions: 100%

- [ ] **Integration Tests**: > 80% coverage
  - All API routes: 100%
  - Database operations: 100%

- [ ] **E2E Tests**: Critical paths
  - Upload duplicate flow: 100%
  - Statistics accuracy: 100%
  - Export functionality: 100%

---

## Test Execution Plan

### Phase 1: Unit Tests
1. Run merchant normalization tests
2. Run duplicate detection logic tests
3. Run confidence calculation tests

### Phase 2: Database Tests
4. Run mark/unmark duplicate tests
5. Run query filter tests

### Phase 3: Integration Tests
6. Run API endpoint tests
7. Run finance function tests
8. Run stats calculation tests

### Phase 4: E2E Tests
9. Run upload flow tests
10. Run user scenario tests

### Phase 5: Edge Cases
11. Run edge case tests
12. Run performance tests

---

## Sign-Off

- [ ] **All test scenarios documented**: Date: _____ By: _____
- [ ] **Test fixtures created**: Date: _____ By: _____
- [ ] **Tests implemented**: Date: _____ By: _____
- [ ] **All tests passing**: Date: _____ By: _____
- [ ] **Coverage goals met**: Date: _____ By: _____

**Overall Status**: ⬜ TESTS READY / ⬜ TESTS PASSING / ⬜ ISSUES FOUND

---

**Next Step**: Implement tests, then proceed to ENVIRONMENT_VARIABLES_AUDIT.md
