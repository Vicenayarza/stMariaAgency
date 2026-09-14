-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "platforms" TEXT[];

-- CreateIndex
CREATE INDEX "Creator_location_idx" ON "Creator"("location");

-- CreateIndex
CREATE INDEX "Creator_followers_idx" ON "Creator"("followers");

-- CreateIndex
CREATE INDEX "Creator_engagementRate_idx" ON "Creator"("engagementRate");
