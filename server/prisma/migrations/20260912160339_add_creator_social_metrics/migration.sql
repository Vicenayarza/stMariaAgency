-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'TWITCH', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "MetricSource" AS ENUM ('CREATOR', 'STMARIA', 'API');

-- CreateEnum
CREATE TYPE "MetricVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "CreatorSocialAccount" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorSocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorMetric" (
    "id" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER,
    "posts" INTEGER,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER,
    "impressions" INTEGER,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "MetricSource" NOT NULL DEFAULT 'CREATOR',
    "verificationStatus" "MetricVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorSocialAccount_creatorId_idx" ON "CreatorSocialAccount"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorSocialAccount_platform_idx" ON "CreatorSocialAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorSocialAccount_creatorId_platform_key" ON "CreatorSocialAccount"("creatorId", "platform");

-- CreateIndex
CREATE INDEX "CreatorMetric_socialAccountId_idx" ON "CreatorMetric"("socialAccountId");

-- CreateIndex
CREATE INDEX "CreatorMetric_recordedAt_idx" ON "CreatorMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "CreatorMetric_verificationStatus_idx" ON "CreatorMetric"("verificationStatus");

-- CreateIndex
CREATE INDEX "CreatorMetric_verifiedById_idx" ON "CreatorMetric"("verifiedById");

-- AddForeignKey
ALTER TABLE "CreatorSocialAccount" ADD CONSTRAINT "CreatorSocialAccount_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorMetric" ADD CONSTRAINT "CreatorMetric_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "CreatorSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorMetric" ADD CONSTRAINT "CreatorMetric_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
