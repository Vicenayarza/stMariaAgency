-- CreateEnum
CREATE TYPE "BrandRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BrandRegistrationRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "employeeCount" TEXT,
    "services" TEXT,
    "needs" TEXT,
    "discoverySource" TEXT,
    "status" "BrandRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandRegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandRegistrationRequest_status_idx" ON "BrandRegistrationRequest"("status");

-- CreateIndex
CREATE INDEX "BrandRegistrationRequest_email_idx" ON "BrandRegistrationRequest"("email");

-- CreateIndex
CREATE INDEX "BrandRegistrationRequest_createdAt_idx" ON "BrandRegistrationRequest"("createdAt");
