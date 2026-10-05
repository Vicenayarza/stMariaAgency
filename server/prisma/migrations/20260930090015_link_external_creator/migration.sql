-- AlterTable
ALTER TABLE "ExternalCreator" ADD COLUMN     "linkedCreatorId" TEXT;

-- CreateIndex
CREATE INDEX "ExternalCreator_linkedCreatorId_idx" ON "ExternalCreator"("linkedCreatorId");

-- AddForeignKey
ALTER TABLE "ExternalCreator" ADD CONSTRAINT "ExternalCreator_linkedCreatorId_fkey" FOREIGN KEY ("linkedCreatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
