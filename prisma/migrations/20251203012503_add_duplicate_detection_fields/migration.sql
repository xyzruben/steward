-- Add duplicate detection fields to receipts table
-- Migration: add_duplicate_detection_fields
-- Date: 2025-12-03

-- Add new columns for duplicate detection
ALTER TABLE "receipts" ADD COLUMN "isDuplicate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "receipts" ADD COLUMN "duplicateOf" UUID;
ALTER TABLE "receipts" ADD COLUMN "duplicateConfidence" DECIMAL(3,2);

-- Add indexes for efficient duplicate queries
CREATE INDEX "receipts_isDuplicate_idx" ON "receipts"("isDuplicate");
CREATE INDEX "receipts_userId_isDuplicate_idx" ON "receipts"("userId", "isDuplicate");
CREATE INDEX "receipts_duplicateOf_idx" ON "receipts"("duplicateOf");

-- Add foreign key constraint for self-referential relation
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_duplicateOf_fkey"
  FOREIGN KEY ("duplicateOf") REFERENCES "receipts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Comments for documentation
COMMENT ON COLUMN "receipts"."isDuplicate" IS 'Flag indicating if this receipt is a duplicate of another';
COMMENT ON COLUMN "receipts"."duplicateOf" IS 'UUID of the original receipt if this is a duplicate';
COMMENT ON COLUMN "receipts"."duplicateConfidence" IS 'Confidence score (0.00-1.00) that this is a duplicate';
