-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "convertedCurrency" TEXT,
ADD COLUMN     "convertedTotal" DECIMAL(65,30),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';
