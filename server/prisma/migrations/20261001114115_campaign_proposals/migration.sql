-- CreateEnum
CREATE TYPE "CampaignProposalStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "CampaignProposal" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT,
    "externalCreatorId" TEXT,
    "status" "CampaignProposalStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "clientNotes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignProposal_campaignId_idx" ON "CampaignProposal"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignProposal_creatorId_idx" ON "CampaignProposal"("creatorId");

-- CreateIndex
CREATE INDEX "CampaignProposal_externalCreatorId_idx" ON "CampaignProposal"("externalCreatorId");

-- CreateIndex
CREATE INDEX "CampaignProposal_status_idx" ON "CampaignProposal"("status");

-- CreateIndex
CREATE INDEX "CampaignProposal_proposedAt_idx" ON "CampaignProposal"("proposedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignProposal_campaignId_creatorId_key" ON "CampaignProposal"("campaignId", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignProposal_campaignId_externalCreatorId_key" ON "CampaignProposal"("campaignId", "externalCreatorId");

-- AddForeignKey
ALTER TABLE "CampaignProposal" ADD CONSTRAINT "CampaignProposal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProposal" ADD CONSTRAINT "CampaignProposal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProposal" ADD CONSTRAINT "CampaignProposal_externalCreatorId_fkey" FOREIGN KEY ("externalCreatorId") REFERENCES "ExternalCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
