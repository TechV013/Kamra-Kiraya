-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "transactionRef" TEXT;
