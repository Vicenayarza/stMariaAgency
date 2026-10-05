-- CreateEnum
CREATE TYPE "CollaborationType" AS ENUM ('PAID', 'PRODUCT', 'PAID_AND_PRODUCT');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "collaborationType" "CollaborationType" NOT NULL DEFAULT 'PAID';
