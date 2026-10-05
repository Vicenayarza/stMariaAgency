import {
  AudienceMetricType,
  CreatorProviderType,
  ExternalMetricSource,
  SocialPlatform,
} from "../generated/prisma/enums.js";

import { prisma } from "../lib/prisma.js";

import type {
  CreatorDiscoveryFilters,
  CreatorProviderService,
  ExternalCreatorResult,
} from "./creator-provider.service.js";

import { mockCreatorProvider } from "./mock-creator.provider.js";

/**
 * Provider used during development.
 *
 * Later this can be replaced with:
 *
 * - InfluencityCreatorProvider
 * - ModashCreatorProvider
 * - HypeAuditorCreatorProvider
 * - another licensed provider
 *
 * without changing the rest of the application.
 */
const DEFAULT_PROVIDER_NAME = "ST.MARY AGENCY Mock Provider";

function getProviderService(
  type: CreatorProviderType
): CreatorProviderService {
  switch (type) {
    case CreatorProviderType.INTERNAL:
      return mockCreatorProvider;

    default:
      throw new Error(
        `Creator provider not implemented: ${type}`
      );
  }
}

function parseSocialPlatform(
  value: string
): SocialPlatform | null {
  const normalized = value
    .trim()
    .toUpperCase();

  if (
    Object.values(SocialPlatform).includes(
      normalized as SocialPlatform
    )
  ) {
    return normalized as SocialPlatform;
  }

  return null;
}

function parseAudienceMetricType(
  value: string
): AudienceMetricType | null {
  const normalized = value
    .trim()
    .toUpperCase();

  /**
   * The mock currently returns values such as:
   *
   * AGE_18_24
   * AGE_25_34
   * GENDER_MALE
   * GENDER_FEMALE
   * COUNTRY
   *
   * ExternalCreatorAudience stores the general
   * dimension type separately from the dimension.
   */
  if (normalized.startsWith("AGE_")) {
    return AudienceMetricType.AGE;
  }

  if (normalized.startsWith("GENDER_")) {
    return AudienceMetricType.GENDER;
  }

  if (normalized === "COUNTRY") {
    return AudienceMetricType.COUNTRY;
  }

  if (normalized === "REGION") {
    return AudienceMetricType.REGION;
  }

  if (normalized === "CITY") {
    return AudienceMetricType.CITY;
  }

  if (normalized === "LANGUAGE") {
    return AudienceMetricType.LANGUAGE;
  }

  if (normalized === "INTEREST") {
    return AudienceMetricType.INTEREST;
  }

  return null;
}

async function getOrCreateProvider() {
  return prisma.creatorProvider.upsert({
    where: {
      name: DEFAULT_PROVIDER_NAME,
    },

    update: {
      active: true,
      type: CreatorProviderType.INTERNAL,
    },

    create: {
      name: DEFAULT_PROVIDER_NAME,
      type: CreatorProviderType.INTERNAL,
      active: true,
      metadata: {
        environment: "development",
        description:
          "Local mock creator discovery provider",
      },
    },
  });
}

async function persistExternalCreator(
  providerId: string,
  result: ExternalCreatorResult
) {
  const now = new Date();

  const externalCreator =
    await prisma.externalCreator.upsert({
      where: {
        providerId_externalId: {
          providerId,
          externalId: result.externalId,
        },
      },

      update: {
        username: result.username,
        displayName:
          result.displayName ?? null,
        bio: result.bio ?? null,
        location: result.location ?? null,
        country: result.country ?? null,
        province: result.province ?? null,

        categories:
          result.categories ?? [],

        interests:
          result.interests ?? [],

        followers:
          result.followers ?? 0,

        engagementRate:
          result.engagementRate ?? 0,

        profileUrl:
          result.profileUrl ?? null,

        lastSyncedAt: now,
      },

      create: {
        providerId,
        externalId: result.externalId,

        username: result.username,

        displayName:
          result.displayName ?? null,

        bio: result.bio ?? null,

        location: result.location ?? null,

        country: result.country ?? null,

        province: result.province ?? null,

        categories:
          result.categories ?? [],

        interests:
          result.interests ?? [],

        followers:
          result.followers ?? 0,

        engagementRate:
          result.engagementRate ?? 0,

        profileUrl:
          result.profileUrl ?? null,

        lastSyncedAt: now,
      },
    });

  /*
   * -------------------------------------------------
   * SOCIAL PROFILES
   * -------------------------------------------------
   */

  for (const profile of result.profiles ?? []) {
    const platform =
      parseSocialPlatform(profile.platform);

    if (!platform) {
      console.warn(
        `Unsupported social platform "${profile.platform}" for ${result.username}`
      );

      continue;
    }

    const savedProfile =
      await prisma.externalCreatorProfile.upsert({
        where: {
          externalCreatorId_platform: {
            externalCreatorId:
              externalCreator.id,

            platform,
          },
        },

        update: {
          username: profile.username,

          profileUrl:
            profile.profileUrl ?? null,

          followers:
            profile.followers ?? 0,

          engagementRate:
            profile.engagementRate ?? 0,

          lastSyncedAt: now,
        },

        create: {
          externalCreatorId:
            externalCreator.id,

          platform,

          username: profile.username,

          profileUrl:
            profile.profileUrl ?? null,

          followers:
            profile.followers ?? 0,

          engagementRate:
            profile.engagementRate ?? 0,

          lastSyncedAt: now,
        },
      });

    /*
     * Store a historical metric snapshot.
     *
     * Unlike ExternalCreatorProfile, metrics are
     * historical, so we CREATE instead of UPSERT.
     */
    await prisma.externalCreatorMetric.create({
      data: {
        externalCreatorId:
          externalCreator.id,

        profileId:
          savedProfile.id,

        followers:
          profile.followers ?? 0,

        engagementRate:
          profile.engagementRate ?? 0,

        source:
          ExternalMetricSource.PROVIDER,

        recordedAt: now,
      },
    });
  }

  /*
   * -------------------------------------------------
   * AUDIENCE
   * -------------------------------------------------
   *
   * Audience data represents the latest snapshot.
   *
   * For this first implementation we replace the
   * previous audience snapshot each time the creator
   * is synchronized.
   */

  await prisma.externalCreatorAudience.deleteMany({
    where: {
      externalCreatorId:
        externalCreator.id,
    },
  });

  for (const audienceItem of result.audience ?? []) {
    const metricType =
      parseAudienceMetricType(
        audienceItem.metricType
      );

    if (!metricType) {
      console.warn(
        `Unsupported audience metric "${audienceItem.metricType}" for ${result.username}`
      );

      continue;
    }

    await prisma.externalCreatorAudience.create({
      data: {
        externalCreatorId:
          externalCreator.id,

        metricType,

        dimension:
          audienceItem.value,

        value:
          audienceItem.percentage,

        recordedAt: now,
      },
    });
  }

  return prisma.externalCreator.findUnique({
    where: {
      id: externalCreator.id,
    },

    include: {
      provider: true,
      profiles: true,
      audienceMetrics: true,
    },
  });
}

export async function discoverCreators(
  filters: CreatorDiscoveryFilters
) {
  const provider =
    await getOrCreateProvider();

  if (!provider.active) {
    throw new Error(
      `Creator provider "${provider.name}" is disabled`
    );
  }

  const providerService =
    getProviderService(provider.type);

  const results =
    await providerService.searchCreators(
      filters
    );

  const creators = [];

  for (const result of results) {
    const creator =
      await persistExternalCreator(
        provider.id,
        result
      );

    if (creator) {
      creators.push(creator);
    }
  }

  return {
    provider: {
      id: provider.id,
      name: provider.name,
      type: provider.type,
    },

    total: creators.length,

    creators,
  };
}