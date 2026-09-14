
import { prisma } from "../lib/prisma.js";

export async function searchCreators(params: {
  search?: string;
  category?: string;
  platform?: string;
  location?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
}) {
  const where: any = {};

  if (params.search) {
    where.OR = [
      {
        username: {
          contains: params.search,
          mode: "insensitive",
        },
      },
      {
        user: {
          name: {
            contains: params.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (params.category) {
    where.categories = {
      has: params.category,
    };
  }

  if (params.platform) {
    where.platforms = {
      has: params.platform,
    };
  }

  if (params.location) {
    where.location = {
      contains: params.location,
      mode: "insensitive",
    };
  }

  if (params.minFollowers !== undefined) {
    where.followers = {
      ...(where.followers || {}),
      gte: params.minFollowers,
    };
  }

  if (params.maxFollowers !== undefined) {
    where.followers = {
      ...(where.followers || {}),
      lte: params.maxFollowers,
    };
  }

  if (params.minEngagement !== undefined) {
    where.engagementRate = {
      gte: params.minEngagement,
    };
  }

  return prisma.creator.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      {
        engagementRate: "desc",
      },
      {
        followers: "desc",
      },
    ],
    take: 50,
  });
}
export async function getCreatorById(creatorId: string) {
  return prisma.creator.findUnique({
    where: {
      id: creatorId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}
