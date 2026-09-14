-- AlterTable
ALTER TABLE "CampaignCreator" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "contactedAt" TIMESTAMP(3),
ADD COLUMN     "contentReceivedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "productSentAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "selectedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CampaignCreator_status_idx" ON "CampaignCreator"("status");
