-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "category" TEXT,
ADD COLUMN     "confidenceScore" DECIMAL(3,2),
ADD COLUMN     "subcategory" TEXT;

-- CreateIndex
CREATE INDEX "receipts_category_idx" ON "receipts"("category");

-- CreateIndex
CREATE INDEX "receipts_userId_purchaseDate_idx" ON "receipts"("userId", "purchaseDate");

-- CreateIndex
CREATE INDEX "receipts_userId_category_idx" ON "receipts"("userId", "category");
