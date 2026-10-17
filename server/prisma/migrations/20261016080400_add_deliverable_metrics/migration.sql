-- CreateTable
CREATE TABLE "DeliverableMetric" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "reach" INTEGER,
    "impressions" INTEGER,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "source" "MetricSource" NOT NULL DEFAULT 'CREATOR',
    "verificationStatus" "MetricVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverableMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliverableMetric_deliverableId_recordedAt_idx" ON "DeliverableMetric"("deliverableId", "recordedAt");

-- CreateIndex
CREATE INDEX "DeliverableMetric_verificationStatus_idx" ON "DeliverableMetric"("verificationStatus");

-- CreateIndex
CREATE INDEX "DeliverableMetric_verifiedById_idx" ON "DeliverableMetric"("verifiedById");

-- AddForeignKey
ALTER TABLE "DeliverableMetric" ADD CONSTRAINT "DeliverableMetric_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableMetric" ADD CONSTRAINT "DeliverableMetric_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
