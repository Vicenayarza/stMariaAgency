-- CreateEnum
CREATE TYPE "CreatorProposalStatus" AS ENUM ('NOT_SENT', 'PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "CampaignProposal" ADD COLUMN     "creatorDecidedAt" TIMESTAMP(3),
ADD COLUMN     "creatorStatus" "CreatorProposalStatus" NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN     "sentToCreatorAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CampaignProposal_creatorStatus_idx" ON "CampaignProposal"("creatorStatus");
