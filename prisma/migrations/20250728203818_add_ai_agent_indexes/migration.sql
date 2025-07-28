-- CreateIndex
CREATE INDEX "receipts_userId_purchaseDate_total_idx" ON "receipts"("userId", "purchaseDate", "total");

-- CreateIndex
CREATE INDEX "receipts_userId_purchaseDate_category_idx" ON "receipts"("userId", "purchaseDate", "category");

-- CreateIndex
CREATE INDEX "receipts_userId_purchaseDate_merchant_idx" ON "receipts"("userId", "purchaseDate", "merchant");

-- CreateIndex
CREATE INDEX "receipts_purchaseDate_total_idx" ON "receipts"("purchaseDate", "total");

-- CreateIndex
CREATE INDEX "receipts_category_purchaseDate_idx" ON "receipts"("category", "purchaseDate");

-- CreateIndex
CREATE INDEX "receipts_merchant_purchaseDate_idx" ON "receipts"("merchant", "purchaseDate");
