# Database Migration Execution Plan

**Purpose**: Detailed step-by-step database migration procedure with verification, rollback, and safety checks.

**Status**: ⏳ Ready for Execution
**Last Updated**: 2025-12-01
**Database**: Supabase PostgreSQL (via Prisma)
**Migration Name**: `add_duplicate_tracking`

---

## Pre-Migration Checklist

### Environment Verification

- [ ] **Development Environment Ready**
  - [ ] Local database running and accessible
  - [ ] `.env` file configured with `DATABASE_URL`
  - [ ] Prisma CLI installed (`npx prisma --version`)
  - [ ] Node.js version compatible (v18+)

- [ ] **Database Connection Test**
  ```bash
  npx prisma db pull
  ```
  Expected: Schema pulled successfully without errors

- [ ] **Prisma Client Generated**
  ```bash
  npx prisma generate
  ```
  Expected: Client generated successfully

---

### Backup Procedures

#### 1. Full Database Backup (CRITICAL - DO NOT SKIP)

**For Supabase PostgreSQL**:

```bash
# Create backups directory if it doesn't exist
mkdir -p backups

# Generate backup with timestamp
BACKUP_FILE="backups/steward_backup_$(date +%Y%m%d_%H%M%S).sql"

# If using local Supabase:
pg_dump -h localhost -U postgres -d steward > "$BACKUP_FILE"

# If using Supabase cloud (get connection string from Supabase dashboard):
# Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" > "$BACKUP_FILE"
```

**Verification**:
- [ ] Backup file created: `ls -lh "$BACKUP_FILE"`
- [ ] Backup file has content (size > 0): _____KB/MB
- [ ] Backup file readable: `head -n 20 "$BACKUP_FILE"`

**Expected**: Should see SQL statements creating tables, including Receipt table.

---

#### 2. Receipt Data Snapshot

**Record current receipt counts for verification**:

```sql
-- Connect to database
psql "$DATABASE_URL"

-- Or use Supabase SQL Editor

-- Get current counts
SELECT COUNT(*) as total_receipts FROM "Receipt";
SELECT COUNT(DISTINCT "userId") as total_users FROM "Receipt";
SELECT MIN("createdAt") as oldest_receipt, MAX("createdAt") as newest_receipt FROM "Receipt";

-- Sample receipts for verification
SELECT id, merchant, total, "purchaseDate", "userId"
FROM "Receipt"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Record Results**:
- **Total Receipts**: _____
- **Total Users**: _____
- **Oldest Receipt**: _____
- **Newest Receipt**: _____
- **Sample Receipt IDs**: _____ , _____ , _____ , _____

---

#### 3. Schema Snapshot

**Current Receipt table structure**:

```sql
\d "Receipt"
```

**OR via Prisma**:
```bash
npx prisma db pull --print
```

**Record Current Columns**:
- [ ] id
- [ ] userId
- [ ] imageUrl
- [ ] rawText
- [ ] merchant
- [ ] total
- [ ] purchaseDate
- [ ] category
- [ ] confidenceScore
- [ ] summary
- [ ] createdAt
- [ ] updatedAt
- [ ] currency
- [ ] subcategory
- [ ] convertedCurrency
- [ ] convertedTotal
- [ ] (Other): _____

**Current Indexes**:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Receipt';
```

**Record**: _____

---

### Team Communication

- [ ] **Team Notified**: Date: _____ Time: _____
- [ ] **Migration Window Scheduled**: Date: _____ Time: _____
- [ ] **Estimated Downtime**: _____ minutes
- [ ] **Rollback Plan Communicated**: ⬜ Yes

---

## Migration Files Preparation

### 1. Update Prisma Schema

**File**: `prisma/schema.prisma`

**Add to Receipt model** (around line 67-101):

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

  // ✅ NEW: Duplicate tracking fields
  isDuplicate       Boolean           @default(false)
  duplicateOf       String?           @db.Uuid
  duplicateConfidence Decimal?        @db.Decimal(3, 2)

  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  // ✅ NEW: Self-referential relation for duplicate tracking
  originalReceipt   Receipt?          @relation("ReceiptDuplicates", fields: [duplicateOf], references: [id], onDelete: SetNull)
  duplicates        Receipt[]         @relation("ReceiptDuplicates")

  receiptEmbeddings ReceiptEmbedding[]
  notification      Notification[]

  @@index([userId])
  @@index([merchant])
  @@index([category])
  @@index([purchaseDate])
  @@index([createdAt])

  // ✅ NEW: Indexes for duplicate detection
  @@index([isDuplicate])
  @@index([duplicateOf])
  @@index([userId, merchant, purchaseDate])  // Composite index for duplicate search
}
```

**Checklist**:
- [ ] Added `isDuplicate Boolean @default(false)`
- [ ] Added `duplicateOf String? @db.Uuid`
- [ ] Added `duplicateConfidence Decimal? @db.Decimal(3, 2)`
- [ ] Added `originalReceipt` relation
- [ ] Added `duplicates` relation
- [ ] Added `@@index([isDuplicate])`
- [ ] Added `@@index([duplicateOf])`
- [ ] Added `@@index([userId, merchant, purchaseDate])`

---

### 2. Generate Migration

**Command**:
```bash
npx prisma migrate dev --name add_duplicate_tracking --create-only
```

**⚠️ Important**: Use `--create-only` flag to review migration before applying.

**Expected Output**:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "steward"

✔ Prisma Migrate created the following migration without applying it:

migrations/
  └─ 20251201XXXXXX_add_duplicate_tracking/
    └─ migration.sql
```

**Review Migration File**:
- [ ] Open: `prisma/migrations/[TIMESTAMP]_add_duplicate_tracking/migration.sql`
- [ ] Verify SQL contains:
  - [ ] `ALTER TABLE "Receipt" ADD COLUMN "isDuplicate" BOOLEAN NOT NULL DEFAULT false;`
  - [ ] `ALTER TABLE "Receipt" ADD COLUMN "duplicateOf" UUID;`
  - [ ] `ALTER TABLE "Receipt" ADD COLUMN "duplicateConfidence" DECIMAL(3,2);`
  - [ ] `CREATE INDEX "Receipt_isDuplicate_idx" ON "Receipt"("isDuplicate");`
  - [ ] `CREATE INDEX "Receipt_duplicateOf_idx" ON "Receipt"("duplicateOf");`
  - [ ] `CREATE INDEX "Receipt_userId_merchant_purchaseDate_idx" ON "Receipt"("userId", "merchant", "purchaseDate");`
  - [ ] Foreign key constraint for self-referential relation

**Example Expected Migration SQL**:
```sql
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "duplicateOf" UUID,
ADD COLUMN "duplicateConfidence" DECIMAL(3,2);

-- CreateIndex
CREATE INDEX "Receipt_isDuplicate_idx" ON "Receipt"("isDuplicate");

-- CreateIndex
CREATE INDEX "Receipt_duplicateOf_idx" ON "Receipt"("duplicateOf");

-- CreateIndex
CREATE INDEX "Receipt_userId_merchant_purchaseDate_idx" ON "Receipt"("userId", "merchant", "purchaseDate");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_duplicateOf_fkey" FOREIGN KEY ("duplicateOf") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

---

## Migration Execution (Development)

### Step 1: Apply Migration to Development Database

**Command**:
```bash
npx prisma migrate dev
```

**Expected Output**:
```
✔ Applying migration `20251201XXXXXX_add_duplicate_tracking`
✔ Generated Prisma Client
```

**If Errors Occur**: STOP and investigate. Do NOT proceed to production.

---

### Step 2: Verify Migration Success (Development)

**Check Schema**:
```sql
-- Connect to database
psql "$DATABASE_URL"

-- Describe Receipt table
\d "Receipt"
```

**Expected New Columns**:
```
isDuplicate          | boolean      | not null default false
duplicateOf          | uuid         |
duplicateConfidence  | numeric(3,2) |
```

**Check Indexes**:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Receipt'
ORDER BY indexname;
```

**Expected New Indexes**:
- `Receipt_isDuplicate_idx`
- `Receipt_duplicateOf_idx`
- `Receipt_userId_merchant_purchaseDate_idx`

**Checklist**:
- [ ] `isDuplicate` column exists with default `false`
- [ ] `duplicateOf` column exists (nullable)
- [ ] `duplicateConfidence` column exists (nullable)
- [ ] All three indexes created successfully
- [ ] Foreign key constraint created (`Receipt_duplicateOf_fkey`)

---

### Step 3: Verify Data Integrity (Development)

**Test Queries**:

```sql
-- 1. All existing receipts should have isDuplicate = false
SELECT COUNT(*) as should_be_zero
FROM "Receipt"
WHERE "isDuplicate" IS NULL;
-- Expected: 0

SELECT COUNT(*) as should_equal_total
FROM "Receipt"
WHERE "isDuplicate" = false;
-- Expected: Same as total receipts before migration

-- 2. All new columns should be nullable or have defaults
SELECT COUNT(*) as receipts_with_null_duplicateOf
FROM "Receipt"
WHERE "duplicateOf" IS NULL;
-- Expected: All receipts (total count)

-- 3. Verify no data loss
SELECT COUNT(*) as total_after_migration FROM "Receipt";
-- Expected: Same count as before migration
```

**Record Results**:
- **Total Receipts After Migration**: _____
- **Receipts with isDuplicate=false**: _____
- **Receipts with duplicateOf=NULL**: _____
- **Match Before Migration Count**: ⬜ Yes / ⬜ No

---

### Step 4: Test Prisma Client (Development)

**Generate Updated Client**:
```bash
npx prisma generate
```

**Test TypeScript Types**:

Create test file: `test-migration.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMigration() {
  // Test 1: Query receipts with new fields
  const receipt = await prisma.receipt.findFirst({
    select: {
      id: true,
      merchant: true,
      isDuplicate: true,        // ✅ Should be available
      duplicateOf: true,         // ✅ Should be available
      duplicateConfidence: true, // ✅ Should be available
    }
  })

  console.log('✅ Receipt with new fields:', receipt)

  // Test 2: Create a test duplicate relationship
  const testReceipt = await prisma.receipt.findFirst()
  if (testReceipt) {
    await prisma.receipt.update({
      where: { id: testReceipt.id },
      data: {
        isDuplicate: true,
        duplicateConfidence: 0.95,
      }
    })
    console.log('✅ Updated receipt with duplicate fields')

    // Rollback test change
    await prisma.receipt.update({
      where: { id: testReceipt.id },
      data: {
        isDuplicate: false,
        duplicateConfidence: null,
      }
    })
    console.log('✅ Rolled back test changes')
  }

  // Test 3: Query with isDuplicate filter
  const nonDuplicates = await prisma.receipt.count({
    where: { isDuplicate: false }
  })
  console.log(`✅ Non-duplicate receipts: ${nonDuplicates}`)

  await prisma.$disconnect()
}

testMigration().catch(console.error)
```

**Run Test**:
```bash
npx ts-node test-migration.ts
```

**Expected**: All tests pass without TypeScript or runtime errors.

**Checklist**:
- [ ] New fields available in TypeScript types
- [ ] Can query with new fields
- [ ] Can update with new fields
- [ ] Can filter by `isDuplicate`
- [ ] No TypeScript errors
- [ ] No runtime errors

---

## Staging/Production Migration (When Ready)

### Pre-Production Checklist

- [ ] **Development migration successful**: All tests passed
- [ ] **Code changes deployed to staging**: Application works with new schema
- [ ] **Team approval obtained**: Ready for production
- [ ] **Production backup completed**: Verified and tested
- [ ] **Maintenance window scheduled**: Users notified
- [ ] **Rollback plan prepared**: See below

---

### Production Migration Steps

**⚠️ CRITICAL**: Do this during low-traffic period.

#### Option A: Prisma Migrate Deploy (Recommended for Supabase)

```bash
# 1. Set production DATABASE_URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROD_HOST]:[PORT]/postgres"

# 2. Apply migration
npx prisma migrate deploy

# 3. Generate client
npx prisma generate
```

#### Option B: Manual SQL (If Prisma Deploy Not Available)

```bash
# 1. Connect to production database
psql "$PRODUCTION_DATABASE_URL"

# 2. Run migration SQL manually (from migration file)
# Copy contents of: prisma/migrations/[TIMESTAMP]_add_duplicate_tracking/migration.sql
# Paste and execute in psql
```

---

### Post-Production Verification

**Same verification steps as development**:

1. **Schema Verification**:
   ```sql
   \d "Receipt"
   ```
   - [ ] New columns exist
   - [ ] Defaults applied correctly

2. **Index Verification**:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'Receipt';
   ```
   - [ ] All new indexes created

3. **Data Integrity**:
   ```sql
   SELECT COUNT(*) FROM "Receipt";
   SELECT COUNT(*) FROM "Receipt" WHERE "isDuplicate" = false;
   ```
   - [ ] No data loss
   - [ ] All receipts have isDuplicate = false

4. **Application Test**:
   - [ ] Application starts without errors
   - [ ] Can fetch receipts
   - [ ] Can create receipts
   - [ ] API endpoints respond correctly

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Migration fails with errors
- Data corruption detected
- Application cannot start
- Critical functionality broken
- Data count mismatch

---

### Rollback Method 1: Restore from Backup (Safest)

**⚠️ This will lose any data created AFTER the backup**

```bash
# 1. Stop application (if possible)

# 2. Restore from backup
psql "$DATABASE_URL" < backups/steward_backup_YYYYMMDD_HHMMSS.sql

# 3. Verify restoration
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Receipt\";"

# 4. Revert Prisma schema
git checkout HEAD -- prisma/schema.prisma

# 5. Regenerate Prisma client
npx prisma generate

# 6. Restart application
```

**Verification**:
- [ ] Receipt count matches pre-migration count
- [ ] No new columns in Receipt table
- [ ] Application works normally

---

### Rollback Method 2: Reverse Migration (If No Data Loss Acceptable)

**Create reverse migration**:

```sql
-- File: rollback_duplicate_tracking.sql

-- Drop foreign key constraint
ALTER TABLE "Receipt" DROP CONSTRAINT IF EXISTS "Receipt_duplicateOf_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "Receipt_isDuplicate_idx";
DROP INDEX IF EXISTS "Receipt_duplicateOf_idx";
DROP INDEX IF EXISTS "Receipt_userId_merchant_purchaseDate_idx";

-- Drop columns
ALTER TABLE "Receipt" DROP COLUMN IF EXISTS "isDuplicate";
ALTER TABLE "Receipt" DROP COLUMN IF EXISTS "duplicateOf";
ALTER TABLE "Receipt" DROP COLUMN IF EXISTS "duplicateConfidence";
```

**Execute**:
```bash
psql "$DATABASE_URL" < rollback_duplicate_tracking.sql
```

**Then revert schema and regenerate**:
```bash
git checkout HEAD -- prisma/schema.prisma
npx prisma generate
```

---

## Migration Monitoring

### During Migration

**Monitor**:
- [ ] Migration execution time: _____ seconds
- [ ] Any error messages: _____
- [ ] Database CPU/Memory usage: Normal / High / Critical
- [ ] Application logs: No errors / Errors detected

### After Migration

**Monitor for 24-48 hours**:
- [ ] Application error rate: Normal / Elevated
- [ ] Database query performance: Normal / Degraded
- [ ] Receipt creation working: ⬜ Yes / ⬜ No
- [ ] Statistics accurate: ⬜ Yes / ⬜ No

---

## Common Issues and Solutions

### Issue 1: Migration Timeout

**Symptom**: Migration takes too long or times out
**Cause**: Large Receipt table
**Solution**:
- Add indexes in separate migration first
- Then add columns
- Run during low-traffic period

### Issue 2: Foreign Key Constraint Error

**Symptom**: `ERROR: insert or update on table "Receipt" violates foreign key constraint`
**Cause**: Self-referential relation issue
**Solution**:
- Ensure `duplicateOf` can be NULL
- Check `onDelete: SetNull` in schema

### Issue 3: Prisma Client Out of Sync

**Symptom**: TypeScript errors about missing fields
**Cause**: Prisma client not regenerated
**Solution**:
```bash
npx prisma generate
```

### Issue 4: Default Value Not Applied

**Symptom**: `isDuplicate` is NULL for some records
**Cause**: Database didn't apply default
**Solution**:
```sql
UPDATE "Receipt" SET "isDuplicate" = false WHERE "isDuplicate" IS NULL;
```

---

## Post-Migration Tasks

- [ ] **Delete test migration file**: `rm test-migration.ts`
- [ ] **Document migration completion**: Update this file with actual results
- [ ] **Commit migration files**: `git add prisma/migrations && git commit`
- [ ] **Update team**: Migration successful
- [ ] **Monitor production**: Check for 24 hours

---

## Migration Completion Sign-Off

### Development Environment

- [ ] **Migration Applied**: Date: _____ By: _____
- [ ] **Verification Passed**: Date: _____ By: _____
- [ ] **Tests Passed**: Date: _____ By: _____
- [ ] **Ready for Staging**: ⬜ Yes / ⬜ No

### Staging Environment (if applicable)

- [ ] **Migration Applied**: Date: _____ By: _____
- [ ] **Verification Passed**: Date: _____ By: _____
- [ ] **Ready for Production**: ⬜ Yes / ⬜ No

### Production Environment

- [ ] **Backup Completed**: Date: _____ Time: _____ Size: _____
- [ ] **Migration Applied**: Date: _____ Time: _____
- [ ] **Verification Passed**: Date: _____ By: _____
- [ ] **Monitoring Active**: Date: _____ By: _____
- [ ] **Migration Successful**: ⬜ Yes / ⬜ No / ⬜ Rolled Back

**Overall Status**: ⬜ SUCCESS / ⬜ FAILED / ⬜ ROLLED BACK

**Notes**: _____

---

**Next Step**: Once migration is complete, proceed to implementing duplicate detection logic (Phase 2 of RECEIPT_DUPLICATE_FIX.md)
