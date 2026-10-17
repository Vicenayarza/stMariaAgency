-- CreateEnum
CREATE TYPE "CreatorRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CreatorRegistrationRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "instagram" TEXT,
    "tiktok" TEXT,
    "youtube" TEXT,
    "invitationCode" TEXT,
    "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "privacyAcceptedAt" TIMESTAMP(3),
    "status" "CreatorRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorRegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorRegistrationRequest_status_idx" ON "CreatorRegistrationRequest"("status");

-- CreateIndex
CREATE INDEX "CreatorRegistrationRequest_email_idx" ON "CreatorRegistrationRequest"("email");

-- CreateIndex
CREATE INDEX "CreatorRegistrationRequest_username_idx" ON "CreatorRegistrationRequest"("username");

-- CreateIndex
CREATE INDEX "CreatorRegistrationRequest_createdAt_idx" ON "CreatorRegistrationRequest"("createdAt");
