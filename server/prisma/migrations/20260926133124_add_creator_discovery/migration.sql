-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('INFLUENCER_MARKETING', 'UGC', 'INFLUENCER_AND_UGC', 'AMPLIFICATION');

-- CreateEnum
CREATE TYPE "CreatorProviderType" AS ENUM ('EXTERNAL_DATABASE', 'API', 'MANUAL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CreatorMatchStatus" AS ENUM ('RECOMMENDED', 'SHORTLISTED', 'REJECTED', 'SELECTED');

-- CreateEnum
CREATE TYPE "CreatorListType" AS ENUM ('GENERAL', 'CAMPAIGN', 'FAVORITES', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ExternalMetricSource" AS ENUM ('PROVIDER', 'API', 'MANUAL');

-- CreateEnum
CREATE TYPE "AudienceMetricType" AS ENUM ('AGE', 'GENDER', 'COUNTRY', 'REGION', 'CITY', 'INTEREST', 'LANGUAGE');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "campaignType" "CampaignType" NOT NULL DEFAULT 'INFLUENCER_MARKETING',
ADD COLUMN     "countries" TEXT[],
ADD COLUMN     "formats" TEXT[],
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "maxAge" INTEGER,
ADD COLUMN     "minAge" INTEGER,
ADD COLUMN     "platforms" TEXT[],
ADD COLUMN     "provinces" TEXT[],
ADD COLUMN     "publicationDeadline" TIMESTAMP(3),
ADD COLUMN     "publicationStart" TIMESTAMP(3),
ADD COLUMN     "targetCreatorCount" INTEGER;

-- CreateTable
CREATE TABLE "CampaignInstruction" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT,
    "contentType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "publicationDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "tags" TEXT[],
    "links" TEXT[],
    "forbiddenContent" TEXT,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CreatorProviderType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCreator" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "country" TEXT,
    "province" TEXT,
    "city" TEXT,
    "categories" TEXT[],
    "interests" TEXT[],
    "followers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profileUrl" TEXT,
    "isContacted" BOOLEAN NOT NULL DEFAULT false,
    "isInvited" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCreatorProfile" (
    "id" TEXT NOT NULL,
    "externalCreatorId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER,
    "posts" INTEGER,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalCreatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCreatorMetric" (
    "id" TEXT NOT NULL,
    "externalCreatorId" TEXT NOT NULL,
    "profileId" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER,
    "posts" INTEGER,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER,
    "impressions" INTEGER,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" "ExternalMetricSource" NOT NULL DEFAULT 'PROVIDER',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalCreatorMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCreatorAudience" (
    "id" TEXT NOT NULL,
    "externalCreatorId" TEXT NOT NULL,
    "platform" "SocialPlatform",
    "metricType" "AudienceMetricType" NOT NULL,
    "dimension" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalCreatorAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorMatch" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT,
    "externalCreatorId" TEXT,
    "status" "CreatorMatchStatus" NOT NULL DEFAULT 'RECOMMENDED',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "campaignFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "audienceFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formatFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locationFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demographicFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestFit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "audienceQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CreatorListType" NOT NULL DEFAULT 'GENERAL',
    "userId" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorListMember" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "creatorId" TEXT,
    "externalCreatorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorListMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignInstruction_campaignId_idx" ON "CampaignInstruction"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignInstruction_platform_idx" ON "CampaignInstruction"("platform");

-- CreateIndex
CREATE INDEX "CampaignInstruction_deadline_idx" ON "CampaignInstruction"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorProvider_name_key" ON "CreatorProvider"("name");

-- CreateIndex
CREATE INDEX "CreatorProvider_type_idx" ON "CreatorProvider"("type");

-- CreateIndex
CREATE INDEX "CreatorProvider_active_idx" ON "CreatorProvider"("active");

-- CreateIndex
CREATE INDEX "ExternalCreator_providerId_idx" ON "ExternalCreator"("providerId");

-- CreateIndex
CREATE INDEX "ExternalCreator_username_idx" ON "ExternalCreator"("username");

-- CreateIndex
CREATE INDEX "ExternalCreator_country_idx" ON "ExternalCreator"("country");

-- CreateIndex
CREATE INDEX "ExternalCreator_province_idx" ON "ExternalCreator"("province");

-- CreateIndex
CREATE INDEX "ExternalCreator_city_idx" ON "ExternalCreator"("city");

-- CreateIndex
CREATE INDEX "ExternalCreator_followers_idx" ON "ExternalCreator"("followers");

-- CreateIndex
CREATE INDEX "ExternalCreator_engagementRate_idx" ON "ExternalCreator"("engagementRate");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCreator_providerId_externalId_key" ON "ExternalCreator"("providerId", "externalId");

-- CreateIndex
CREATE INDEX "ExternalCreatorProfile_platform_idx" ON "ExternalCreatorProfile"("platform");

-- CreateIndex
CREATE INDEX "ExternalCreatorProfile_username_idx" ON "ExternalCreatorProfile"("username");

-- CreateIndex
CREATE INDEX "ExternalCreatorProfile_followers_idx" ON "ExternalCreatorProfile"("followers");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalCreatorProfile_externalCreatorId_platform_key" ON "ExternalCreatorProfile"("externalCreatorId", "platform");

-- CreateIndex
CREATE INDEX "ExternalCreatorMetric_externalCreatorId_idx" ON "ExternalCreatorMetric"("externalCreatorId");

-- CreateIndex
CREATE INDEX "ExternalCreatorMetric_profileId_idx" ON "ExternalCreatorMetric"("profileId");

-- CreateIndex
CREATE INDEX "ExternalCreatorMetric_recordedAt_idx" ON "ExternalCreatorMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "ExternalCreatorMetric_source_idx" ON "ExternalCreatorMetric"("source");

-- CreateIndex
CREATE INDEX "ExternalCreatorAudience_externalCreatorId_idx" ON "ExternalCreatorAudience"("externalCreatorId");

-- CreateIndex
CREATE INDEX "ExternalCreatorAudience_metricType_idx" ON "ExternalCreatorAudience"("metricType");

-- CreateIndex
CREATE INDEX "ExternalCreatorAudience_dimension_idx" ON "ExternalCreatorAudience"("dimension");

-- CreateIndex
CREATE INDEX "ExternalCreatorAudience_recordedAt_idx" ON "ExternalCreatorAudience"("recordedAt");

-- CreateIndex
CREATE INDEX "CreatorMatch_campaignId_idx" ON "CreatorMatch"("campaignId");

-- CreateIndex
CREATE INDEX "CreatorMatch_creatorId_idx" ON "CreatorMatch"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorMatch_externalCreatorId_idx" ON "CreatorMatch"("externalCreatorId");

-- CreateIndex
CREATE INDEX "CreatorMatch_status_idx" ON "CreatorMatch"("status");

-- CreateIndex
CREATE INDEX "CreatorMatch_score_idx" ON "CreatorMatch"("score");

-- CreateIndex
CREATE INDEX "CreatorMatch_calculatedAt_idx" ON "CreatorMatch"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorMatch_campaignId_creatorId_key" ON "CreatorMatch"("campaignId", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorMatch_campaignId_externalCreatorId_key" ON "CreatorMatch"("campaignId", "externalCreatorId");

-- CreateIndex
CREATE INDEX "CreatorList_userId_idx" ON "CreatorList"("userId");

-- CreateIndex
CREATE INDEX "CreatorList_campaignId_idx" ON "CreatorList"("campaignId");

-- CreateIndex
CREATE INDEX "CreatorList_type_idx" ON "CreatorList"("type");

-- CreateIndex
CREATE INDEX "CreatorListMember_listId_idx" ON "CreatorListMember"("listId");

-- CreateIndex
CREATE INDEX "CreatorListMember_creatorId_idx" ON "CreatorListMember"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorListMember_externalCreatorId_idx" ON "CreatorListMember"("externalCreatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorListMember_listId_creatorId_key" ON "CreatorListMember"("listId", "creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorListMember_listId_externalCreatorId_key" ON "CreatorListMember"("listId", "externalCreatorId");

-- CreateIndex
CREATE INDEX "Campaign_campaignType_idx" ON "Campaign"("campaignType");

-- AddForeignKey
ALTER TABLE "CampaignInstruction" ADD CONSTRAINT "CampaignInstruction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCreator" ADD CONSTRAINT "ExternalCreator_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "CreatorProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCreatorProfile" ADD CONSTRAINT "ExternalCreatorProfile_externalCreatorId_fkey" FOREIGN KEY ("externalCreatorId") REFERENCES "ExternalCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCreatorMetric" ADD CONSTRAINT "ExternalCreatorMetric_externalCreatorId_fkey" FOREIGN KEY ("externalCreatorId") REFERENCES "ExternalCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCreatorMetric" ADD CONSTRAINT "ExternalCreatorMetric_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExternalCreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCreatorAudience" ADD CONSTRAINT "ExternalCreatorAudience_externalCreatorId_fkey" FOREIGN KEY ("externalCreatorId") REFERENCES "ExternalCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorMatch" ADD CONSTRAINT "CreatorMatch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorMatch" ADD CONSTRAINT "CreatorMatch_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorMatch" ADD CONSTRAINT "CreatorMatch_externalCreatorId_fkey" FOREIGN KEY ("externalCreatorId") REFERENCES "ExternalCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorList" ADD CONSTRAINT "CreatorList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorList" ADD CONSTRAINT "CreatorList_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorListMember" ADD CONSTRAINT "CreatorListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CreatorList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorListMember" ADD CONSTRAINT "CreatorListMember_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorListMember" ADD CONSTRAINT "CreatorListMember_externalCreatorId_fkey" FOREIGN KEY ("externalCreatorId") REFERENCES "ExternalCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
