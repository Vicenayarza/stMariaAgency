/*
  Warnings:

  - You are about to drop the column `creatorDecidedAt` on the `CampaignProposal` table. All the data in the column will be lost.
  - You are about to drop the column `creatorStatus` on the `CampaignProposal` table. All the data in the column will be lost.
  - You are about to drop the column `sentToCreatorAt` on the `CampaignProposal` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CampaignApplicationStatus" AS ENUM ('APPLIED', 'SHORTLISTED', 'NOT_SELECTED', 'SELECTED', 'WITHDRAWN');

-- DropIndex
DROP INDEX "CampaignProposal_creatorStatus_idx";

-- AlterTable
ALTER TABLE "CampaignProposal" DROP COLUMN "creatorDecidedAt",
DROP COLUMN "creatorStatus",
DROP COLUMN "sentToCreatorAt";

-- DropEnum
DROP TYPE "CreatorProposalStatus";

-- CreateTable
CREATE TABLE "CampaignApplication" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" "CampaignApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignApplication_campaignId_idx" ON "CampaignApplication"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignApplication_creatorId_idx" ON "CampaignApplication"("creatorId");

-- CreateIndex
CREATE INDEX "CampaignApplication_status_idx" ON "CampaignApplication"("status");

-- CreateIndex
CREATE INDEX "CampaignApplication_appliedAt_idx" ON "CampaignApplication"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignApplication_campaignId_creatorId_key" ON "CampaignApplication"("campaignId", "creatorId");

-- AddForeignKey
ALTER TABLE "CampaignApplication" ADD CONSTRAINT "CampaignApplication_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignApplication" ADD CONSTRAINT "CampaignApplication_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
