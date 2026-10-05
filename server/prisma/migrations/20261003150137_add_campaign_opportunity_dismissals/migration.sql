-- CreateTable
CREATE TABLE "CampaignOpportunityDismissal" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignOpportunityDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignOpportunityDismissal_campaignId_idx" ON "CampaignOpportunityDismissal"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignOpportunityDismissal_creatorId_idx" ON "CampaignOpportunityDismissal"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignOpportunityDismissal_campaignId_creatorId_key" ON "CampaignOpportunityDismissal"("campaignId", "creatorId");

-- AddForeignKey
ALTER TABLE "CampaignOpportunityDismissal" ADD CONSTRAINT "CampaignOpportunityDismissal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignOpportunityDismissal" ADD CONSTRAINT "CampaignOpportunityDismissal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
