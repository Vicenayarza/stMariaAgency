import { prisma } from "../lib/prisma.js";

type CreateCampaignSource = "STAFF" | "BRAND";

type CreateCampaignParams = {
  brandId: string;
  userId: string;
  source: CreateCampaignSource;

  name: string;
  description?: string | null;
  budget: string | number;

  objective?: string | null;
  category?: string | null;

  campaignType?: string;

  collaborationType?: string;

  platforms?: string[];
  formats?: string[];

  countries?: string[];
  provinces?: string[];

  gender?: string | null;
  minAge?: string | number | null;
  maxAge?: string | number | null;

  interests?: string[];

  targetCreatorCount?: string | number | null;

  publicationStart?: string | null;
  publicationDeadline?: string | null;

  contentItems?: {
    platform: string;
    contentType: string;
    quantity: number;
  }[];

  startDate?: string | null;
  endDate?: string | null;

  requirements?: string | null;
  hashtags?: string[];
  mentions?: string[];
  links?: string[];

  forbiddenContent?: string | null;
  approvalRequired?: boolean;
};

/**
 * ==========================================
 * GET BRAND CAMPAIGNS
 * ==========================================
 */
export async function getBrandCampaigns(
  brandId: string
) {
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

/**
 * ==========================================
 * GET BRAND CAMPAIGN BY ID
 * ==========================================
 */
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

      instructions: {
        orderBy: {
          createdAt: "asc",
        },
      },

      creators: {
        include: {
          creator: true,
        },
      },
    },
  });
}

/**
 * ==========================================
 * CREATE CAMPAIGN
 * ==========================================
 *
 * Fuente única de creación de campañas.
 *
 * Utilizado tanto por:
 *
 * - STAFF
 * - BRAND
 *
 * Las rutas son responsables de comprobar
 * los permisos antes de llamar a este service.
 */
export async function createBrandCampaign(
  params: CreateCampaignParams
) {
  const normalizedName =
    params.name?.trim();

  if (!normalizedName) {
    throw new Error(
      "CAMPAIGN_NAME_REQUIRED"
    );
  }

  /**
   * ------------------------------
   * Presupuesto
   * ------------------------------
   */

  const normalizedBudget = String(
    params.budget ?? ""
  )
    .trim()
    .replace(",", ".");

  if (
    !normalizedBudget ||
    !/^\d+(\.\d{1,2})?$/.test(
      normalizedBudget
    ) ||
    Number(normalizedBudget) < 0
  ) {
    throw new Error("INVALID_BUDGET");
  }

  /**
   * ------------------------------
   * Tipo de campaña
   * ------------------------------
   */

  const allowedCampaignTypes = [
    "INFLUENCER_MARKETING",
    "UGC",
    "INFLUENCER_AND_UGC",
    "AMPLIFICATION",
  ];

  const campaignType =
    params.campaignType ||
    "INFLUENCER_MARKETING";

  if (
    !allowedCampaignTypes.includes(
      campaignType
    )
  ) {
    throw new Error(
      "INVALID_CAMPAIGN_TYPE"
    );
  }

  /**
   * ------------------------------
   * Arrays
   * ------------------------------
   */

  const normalizeArray = (
    value?: string[]
  ) =>
    Array.isArray(value)
      ? value
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean)
      : [];

  const platforms =
    normalizeArray(params.platforms);

  const formats =
    normalizeArray(params.formats);

  const countries =
    normalizeArray(params.countries);

  const provinces =
    normalizeArray(params.provinces);

  const interests =
    normalizeArray(params.interests);

  const hashtags =
    normalizeArray(params.hashtags);

  const mentions =
    normalizeArray(params.mentions);

  const links =
    normalizeArray(params.links);

  /**
   * ------------------------------
   * Edad
   * ------------------------------
   */

  const minAge =
    params.minAge === "" ||
    params.minAge === null ||
    params.minAge === undefined
      ? null
      : Number(params.minAge);

  const maxAge =
    params.maxAge === "" ||
    params.maxAge === null ||
    params.maxAge === undefined
      ? null
      : Number(params.maxAge);

  if (
    minAge !== null &&
    (!Number.isInteger(minAge) ||
      minAge < 13 ||
      minAge > 100)
  ) {
    throw new Error(
      "INVALID_MIN_AGE"
    );
  }

  if (
    maxAge !== null &&
    (!Number.isInteger(maxAge) ||
      maxAge < 13 ||
      maxAge > 100)
  ) {
    throw new Error(
      "INVALID_MAX_AGE"
    );
  }

  if (
    minAge !== null &&
    maxAge !== null &&
    minAge > maxAge
  ) {
    throw new Error(
      "INVALID_AGE_RANGE"
    );
  }

  /**
   * ------------------------------
   * Número de creadores
   * ------------------------------
   */

  const targetCreatorCount =
    params.targetCreatorCount === "" ||
    params.targetCreatorCount === null ||
    params.targetCreatorCount ===
      undefined
      ? null
      : Number(
          params.targetCreatorCount
        );

  if (
    targetCreatorCount !== null &&
    (!Number.isInteger(
      targetCreatorCount
    ) ||
      targetCreatorCount < 1)
  ) {
    throw new Error(
      "INVALID_CREATOR_COUNT"
    );
  }

  /**
   * ------------------------------
   * Fechas
   * ------------------------------
   */

  const startDate = params.startDate
    ? new Date(params.startDate)
    : null;

  const endDate = params.endDate
    ? new Date(params.endDate)
    : null;

  if (
    startDate &&
    Number.isNaN(startDate.getTime())
  ) {
    throw new Error(
      "INVALID_START_DATE"
    );
  }

  if (
    endDate &&
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error(
      "INVALID_END_DATE"
    );
  }

  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    throw new Error(
      "INVALID_DATE_RANGE"
    );
  }


  const publicationStart =
  params.publicationStart
    ? new Date(
        params.publicationStart
      )
    : null;

const publicationDeadline =
  params.publicationDeadline
    ? new Date(
        params.publicationDeadline
      )
    : null;

if (
  publicationStart &&
  Number.isNaN(
    publicationStart.getTime()
  )
) {
  throw new Error(
    "INVALID_PUBLICATION_START"
  );
}

if (
  publicationDeadline &&
  Number.isNaN(
    publicationDeadline.getTime()
  )
) {
  throw new Error(
    "INVALID_PUBLICATION_DEADLINE"
  );
}

if (
  publicationStart &&
  publicationDeadline &&
  publicationStart >
    publicationDeadline
) {
  throw new Error(
    "INVALID_PUBLICATION_RANGE"
  );
}

const contentItems =
  Array.isArray(params.contentItems)
    ? params.contentItems
        .map((item) => ({
          platform: String(
            item.platform || ""
          ).trim(),

          contentType: String(
            item.contentType || ""
          ).trim(),

          quantity: Number(
            item.quantity
          ),
        }))
        .filter(
          (item) =>
            item.platform &&
            item.contentType &&
            Number.isInteger(
              item.quantity
            ) &&
            item.quantity > 0
        )
    : [];

  /**
   * ------------------------------
   * Instrucciones
   * ------------------------------
   */

  const requirements =
    params.requirements?.trim() ||
    null;

  const forbiddenContent =
    params.forbiddenContent?.trim() ||
    null;

  const approvalRequired =
    Boolean(
      params.approvalRequired
    );

  const hasInstructions =
    Boolean(requirements) ||
    hashtags.length > 0 ||
    mentions.length > 0 ||
    links.length > 0 ||
    Boolean(forbiddenContent) ||
    approvalRequired ||
    formats.length > 0;

  /**
   * ==========================================
   * TRANSACCIÓN
   * ==========================================
   */

  return prisma.$transaction(
    async (tx) => {
      const campaign =
        await tx.campaign.create({
          data: {
            brandId: params.brandId,

            name: normalizedName,

            description:
              params.description?.trim() ||
              null,

            budget: normalizedBudget,

            status: "DRAFT",

            objective:
              params.objective?.trim() ||
              null,

            category:
              params.category?.trim() ||
              null,

            collaborationType:
              (params.collaborationType as
                | "PAID"
                | "PRODUCT"
                | "PAID_AND_PRODUCT") ||
              "PAID",
            

            /**
             * Campo antiguo.
             *
             * Lo mantenemos temporalmente
             * mientras migramos el frontend.
             */
            platform:
              platforms.length > 0
                ? platforms.join(" + ")
                : null,

            campaignType:
              campaignType as any,

            platforms,

            formats,

            countries,

            provinces,

            gender:
              params.gender &&
              params.gender !== "ALL"
                ? params.gender
                : null,

            minAge,

            maxAge,

            interests,

            targetCreatorCount,

            startDate,

            endDate,
            publicationStart,
            publicationDeadline,
          },
        });

      /**
       * Creamos el brief general.
       */

      if (hasInstructions) {
        await tx.campaignInstruction.create({
          data: {
            campaignId:
              campaign.id,

            title: "Brief general",

            description:
              requirements,

            contentType:
              formats.length === 1
                ? formats[0]
                : null,

            quantity: 1,

            hashtags,

            mentions,

            tags: [],

            links,

            forbiddenContent,

            approvalRequired,
          },
        });
      }
      if (contentItems.length > 0) {
  await tx.campaignInstruction.createMany({
    data: contentItems.map(
      (item) => ({
        campaignId:
          campaign.id,

        title: `${item.contentType} · ${item.platform}`,

        description: null,

        platform:
          item.platform,

        contentType:
          item.contentType,

        quantity:
          item.quantity,

        hashtags: [],

        mentions: [],

        tags: [],

        links: [],

        forbiddenContent: null,

        approvalRequired:
          false,
      })
    ),
  });
}

      /**
       * Auditoría.
       */

      await tx.auditLog.create({
        data: {
          userId: params.userId,

          action:
            params.source ===
            "STAFF"
              ? "CAMPAIGN_CREATED_BY_STAFF"
              : "CAMPAIGN_CREATED_BY_BRAND",

          entity: "Campaign",

          entityId: campaign.id,

          metadata: {
            brandId:
              params.brandId,

            campaignName:
              campaign.name,

            campaignType:
              campaign.campaignType,

            source:
              params.source,
          },
        },
      });

      return campaign;
    }
  );
}