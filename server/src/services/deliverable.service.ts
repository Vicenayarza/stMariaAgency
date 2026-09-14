import { prisma } from "../lib/prisma.js";

export async function getCampaignCreatorDeliverables(
  campaignCreatorId: string
) {
  return prisma.deliverable.findMany({
    where: {
      campaignCreatorId,
    },
    orderBy: [
      {
        dueDate: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

export async function createDeliverable(params: {
  campaignCreatorId: string;
  type: string;
  platform?: string;
  quantity?: number;
  description?: string;
  dueDate?: Date;
}) {
  return prisma.deliverable.create({
    data: {
      campaignCreatorId: params.campaignCreatorId,
      type: params.type,
      platform: params.platform,
      quantity: params.quantity ?? 1,
      description: params.description,
      dueDate: params.dueDate,
    },
  });
}

export async function updateDeliverable(
  deliverableId: string,
  data: {
    type?: string;
    platform?: string;
    quantity?: number;
    description?: string;
    dueDate?: Date;
    status?: "PENDING" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
    contentUrl?: string;
    notes?: string;
  }
) {
  const now = new Date();

  return prisma.deliverable.update({
    where: {
      id: deliverableId,
    },
    data: {
      ...data,

      ...(data.status === "SUBMITTED"
        ? {
            submittedAt: now,
          }
        : {}),

      ...(data.status === "APPROVED"
        ? {
            approvedAt: now,
          }
        : {}),
    },
  });
}
