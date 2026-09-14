import { prisma } from "../lib/prisma.js";

export async function getBrandCampaigns(brandId: string) {
  return prisma.campaign.findMany({
    where: {
      brandId,
    },
    include: {
      _count: {
        select: {
          creators: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getBrandCampaignById(
  brandId: string,
  campaignId: string
) {
return prisma.campaign.findFirst({
  where: {
    id: campaignId,
    brandId,
  },
  include: {
    brand: true,

    creators: {
      include: {
        creator: true,
      },
    },
  },
});
}

export async function createBrandCampaign(params: {
  brandId: string;
  name: string;
  description?: string;
  budget: string;
  objective?: string;
  category?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
}) {
  return prisma.campaign.create({
    data: {
      brandId: params.brandId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      budget: params.budget,
      objective: params.objective || null,
      category: params.category || null,
      platform: params.platform || null,
      startDate: params.startDate
        ? new Date(params.startDate)
        : null,
      endDate: params.endDate
        ? new Date(params.endDate)
        : null,
    },
  });
}