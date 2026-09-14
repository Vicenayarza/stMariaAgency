-- AlterTable
ALTER TABLE "Deliverable" ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DeliverableReview" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverableReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverableReview_deliverableId_idx" ON "DeliverableReview"("deliverableId");

-- CreateIndex
CREATE INDEX "DeliverableReview_createdById_idx" ON "DeliverableReview"("createdById");

-- CreateIndex
CREATE INDEX "DeliverableReview_createdAt_idx" ON "DeliverableReview"("createdAt");

-- AddForeignKey
ALTER TABLE "DeliverableReview" ADD CONSTRAINT "DeliverableReview_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableReview" ADD CONSTRAINT "DeliverableReview_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
