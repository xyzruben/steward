-- CreateTable
CREATE TABLE "receipt_embeddings" (
    "id" UUID NOT NULL,
    "receiptId" UUID NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "content" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipt_embeddings_receiptId_key" ON "receipt_embeddings"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_embeddings_receiptId_idx" ON "receipt_embeddings"("receiptId");

-- CreateIndex
CREATE INDEX "receipt_embeddings_model_idx" ON "receipt_embeddings"("model");

-- AddForeignKey
ALTER TABLE "receipt_embeddings" ADD CONSTRAINT "receipt_embeddings_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
