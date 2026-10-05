-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "creatorFee" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "CampaignOpportunityDismissal_dismissedAt_idx" ON "CampaignOpportunityDismissal"("dismissedAt");
