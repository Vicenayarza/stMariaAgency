-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "campaignCreatorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "platform" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "contentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deliverable_campaignCreatorId_idx" ON "Deliverable"("campaignCreatorId");

-- CreateIndex
CREATE INDEX "Deliverable_status_idx" ON "Deliverable"("status");

-- CreateIndex
CREATE INDEX "Deliverable_dueDate_idx" ON "Deliverable"("dueDate");

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_campaignCreatorId_fkey" FOREIGN KEY ("campaignCreatorId") REFERENCES "CampaignCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
