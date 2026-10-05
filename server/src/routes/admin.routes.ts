import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import argon2 from "argon2";

import {
  createBrandCampaign,
} from "../services/campaign.service.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * Comprueba que el usuario autenticado sea STAFF.
 */
function requireStaff(req: AuthenticatedRequest) {
  return req.user?.role === "STAFF";
}

/**
 * GET /api/admin/overview
 *
 * Datos reales para el resumen del backoffice.
 */
router.get("/overview", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (!requireStaff(request)) {
      return res.status(403).json({
        error: "STAFF_ACCESS_REQUIRED",
      });
    }

    const [
      totalBrands,
      totalCreators,
      totalCampaigns,
      activeCampaigns,
      totalCollaborations,
      pendingMetrics,
    ] = await Promise.all([
      prisma.brand.count(),

      prisma.creator.count(),

      prisma.campaign.count(),

      prisma.campaign.count({
        where: {
          status: {
            not: "DRAFT",
          },
        },
      }),

      prisma.campaignCreator.count(),

      prisma.creatorMetric.count({
        where: {
          verificationStatus: "PENDING",
        },
      }),
    ]);

    const campaigns = await prisma.campaign.findMany({
      select: {
        budget: true,
      },
    });

    const totalCampaignBudget = campaigns.reduce(
      (total, campaign) => total + Number(campaign.budget),
      0
    );

    const collaborations = await prisma.campaignCreator.findMany({
      select: {
        fee: true,
        status: true,
      },
    });

    const committedCreatorFees = collaborations.reduce(
      (total, collaboration) =>
        total + Number(collaboration.fee ?? 0),
      0
    );

    const paidCreatorFees = collaborations
      .filter((collaboration) => collaboration.status === "PAID")
      .reduce(
        (total, collaboration) =>
          total + Number(collaboration.fee ?? 0),
        0
      );

    return res.json({
      overview: {
        totalBrands,
        totalCreators,
        totalCampaigns,
        activeCampaigns,
        totalCollaborations,
        pendingMetrics,
        totalCampaignBudget,
        committedCreatorFees,
        paidCreatorFees,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return res.status(500).json({
      error: "ADMIN_OVERVIEW_ERROR",
    });
  }
});

/**
 * GET /api/admin/brands
 *
 * Listado global de clientes para STAFF.
 */
router.get("/brands", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (!requireStaff(request)) {
      return res.status(403).json({
        error: "STAFF_ACCESS_REQUIRED",
      });
    }

   const brands = await prisma.brand.findMany({
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    },

    _count: {
      select: {
        campaigns: true,
        members: true,
      },
    },
  },

  orderBy: {
    createdAt: "desc",
  },
});

    return res.json({
      brands,
    });
  } catch (error) {
    console.error("Admin brands error:", error);

    return res.status(500).json({
      error: "ADMIN_BRANDS_ERROR",
    });
  }
});
/*
 * ==========================================
 * POST /api/admin/brands
 * ==========================================
 *
 * Crea un nuevo cliente gestionado
 * inicialmente por la agencia.
 *
 * IMPORTANTE:
 * - No crea User
 * - No crea BrandMember
 * - No crea contraseña
 * - El cliente comienza como MANAGED
 *
 * Más adelante podremos darle acceso desde
 * su ficha mediante "Dar acceso".
 */
router.post(
  "/brands",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user || user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const {
        companyName,
        industry,
        website,
        contactName,
        contactEmail,
        contactPhone,
      } = req.body ?? {};

      /*
       * Empresa es el único campo obligatorio.
       */
      if (
        typeof companyName !== "string" ||
        !companyName.trim()
      ) {
        return res.status(400).json({
          error: "COMPANY_NAME_REQUIRED",
        });
      }

      /*
       * Validamos los campos opcionales.
       */
      if (
        industry !== undefined &&
        industry !== null &&
        typeof industry !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_INDUSTRY",
        });
      }

      if (
        website !== undefined &&
        website !== null &&
        typeof website !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_WEBSITE",
        });
      }

      if (
        contactName !== undefined &&
        contactName !== null &&
        typeof contactName !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_CONTACT_NAME",
        });
      }

      if (
        contactEmail !== undefined &&
        contactEmail !== null &&
        typeof contactEmail !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_CONTACT_EMAIL",
        });
      }

      if (
        contactPhone !== undefined &&
        contactPhone !== null &&
        typeof contactPhone !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_CONTACT_PHONE",
        });
      }

      /*
       * Normalizamos campos opcionales.
       *
       * Si vienen vacíos guardamos null.
       */
      const normalizedIndustry =
        typeof industry === "string" &&
        industry.trim()
          ? industry.trim()
          : null;

      const normalizedWebsite =
        typeof website === "string" &&
        website.trim()
          ? website.trim()
          : null;

      const normalizedContactName =
        typeof contactName === "string" &&
        contactName.trim()
          ? contactName.trim()
          : null;

      const normalizedContactEmail =
        typeof contactEmail === "string" &&
        contactEmail.trim()
          ? contactEmail
              .trim()
              .toLowerCase()
          : null;

      const normalizedContactPhone =
        typeof contactPhone === "string" &&
        contactPhone.trim()
          ? contactPhone.trim()
          : null;

      /*
       * Creamos únicamente Brand.
       *
       * No existe todavía usuario del portal.
       */
      const brand =
        await prisma.brand.create({
          data: {
            companyName:
              companyName.trim(),

            industry:
              normalizedIndustry,

            website:
              normalizedWebsite,

            contactName:
              normalizedContactName,

            contactEmail:
              normalizedContactEmail,

            contactPhone:
              normalizedContactPhone,

            accessMode: "MANAGED",
          },
        });

      return res.status(201).json({
        brand,
      });
    } catch (error) {
      console.error(
        "Create brand error:",
        error
      );

      return res.status(500).json({
        error: "CREATE_BRAND_ERROR",
      });
    }
  }
);

/**
 * GET /api/admin/brands/:id
 *
 * Detalle de un cliente.
 */
router.get("/brands/:id", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (!requireStaff(request)) {
      return res.status(403).json({
        error: "STAFF_ACCESS_REQUIRED",
      });
    }

    const brand = await prisma.brand.findUnique({
  where: {
    id: req.params.id,
  },

  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    },

    campaigns: {
      orderBy: {
        createdAt: "desc",
      },

      include: {
        _count: {
          select: {
            creators: true,
          },
        },
      },
    },

    _count: {
      select: {
        members: true,
        campaigns: true,
      },
    },
  },
});

    if (!brand) {
      return res.status(404).json({
        error: "BRAND_NOT_FOUND",
      });
    }

    return res.json({
      brand,
    });
  } catch (error) {
    console.error("Admin brand detail error:", error);

    return res.status(500).json({
      error: "ADMIN_BRAND_DETAIL_ERROR",
    });
  }
});

/**
 * POST /api/admin/brands/:brandId/campaigns
 *
 * Crea una campaña para un cliente desde el backoffice.
 * Solo STAFF.
 */
router.post(
  "/brands/:brandId/campaigns",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      /*
       * ==========================================
       * AUTH
       * ==========================================
       */

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!requireStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      /*
       * ==========================================
       * BRAND
       * ==========================================
       */

      const brandId = String(
        req.params.brandId
      );

      const brand =
        await prisma.brand.findUnique({
          where: {
            id: brandId,
          },

          select: {
            id: true,
            companyName: true,
          },
        });

      if (!brand) {
        return res.status(404).json({
          error: "BRAND_NOT_FOUND",
          message:
            "El cliente no existe.",
        });
      }

      /*
       * ==========================================
       * REQUEST BODY
       * ==========================================
       */
const {
  name,
  description,
  objective,
  budget,
  collaborationType,
  campaignType,

  platforms,
  formats,
  category,

  countries,
  provinces,
  gender,
  minAge,
  maxAge,
  interests,
  targetCreatorCount,

  startDate,
  endDate,

  publicationStart,
  publicationDeadline,
  contentItems,

  requirements,
  hashtags,
  mentions,
  links,
  forbiddenContent,
  approvalRequired,
} = req.body;

      /*
       * ==========================================
       * VALIDACIONES BÁSICAS DE REQUEST
       * ==========================================
       *
       * Las validaciones completas se realizan
       * dentro de campaign.service.ts.
       */

      if (
        !name ||
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "CAMPAIGN_NAME_REQUIRED",
          message:
            "El nombre de la campaña es obligatorio.",
        });
      }

      if (
        budget === undefined ||
        budget === null ||
        String(budget).trim() === ""
      ) {
        return res.status(400).json({
          error:
            "CAMPAIGN_BUDGET_REQUIRED",
          message:
            "Introduce el presupuesto de la campaña.",
        });
      }

      /*
       * ==========================================
       * CREACIÓN
       * ==========================================
       *
       * STAFF y BRAND utilizan exactamente
       * el mismo service.
       */

      const campaign =
  await createBrandCampaign({
    brandId,

    userId: request.user.id,

    source: "STAFF",

    name,
    description,
    budget,

    objective,
    category,

    campaignType,

    collaborationType,

    platforms,
    formats,

    countries,
    provinces,

    gender,
    minAge,
    maxAge,

    interests,

    targetCreatorCount,

    startDate,
    endDate,

    publicationStart,
    publicationDeadline,
    contentItems,

    requirements,
    hashtags,
    mentions,
    links,

    forbiddenContent,
    approvalRequired,
  });

      return res.status(201).json({
        campaign,
      });
    } catch (error) {
      console.error(
        "Admin campaign creation error:",
        error
      );

      /*
       * ==========================================
       * ERRORES DEL SERVICE
       * ==========================================
       */

      if (error instanceof Error) {
        const controlledErrors: Record<
          string,
          string
        > = {
          CAMPAIGN_NAME_REQUIRED:
            "El nombre de la campaña es obligatorio.",

          INVALID_BUDGET:
            "Introduce un presupuesto válido.",

          INVALID_CAMPAIGN_TYPE:
            "El tipo de campaña no es válido.",

          INVALID_MIN_AGE:
            "La edad mínima no es válida.",

          INVALID_MAX_AGE:
            "La edad máxima no es válida.",

          INVALID_AGE_RANGE:
            "La edad mínima no puede ser mayor que la edad máxima.",

          INVALID_CREATOR_COUNT:
            "El número de creadores debe ser mayor que cero.",

          INVALID_START_DATE:
            "La fecha de inicio no es válida.",

          INVALID_END_DATE:
            "La fecha de finalización no es válida.",

          INVALID_DATE_RANGE:
            "La fecha de inicio no puede ser posterior a la fecha de finalización.",
            INVALID_PUBLICATION_START:
              "La fecha de inicio de publicación no es válida.",

            INVALID_PUBLICATION_DEADLINE:
              "La fecha límite de publicación no es válida.",

            INVALID_PUBLICATION_RANGE:
              "La fecha de inicio de publicación no puede ser posterior a la fecha límite.",
        };

        const message =
          controlledErrors[
            error.message
          ];

        if (message) {
          return res.status(400).json({
            error: error.message,
            message,
          });
        }
      }

      return res.status(500).json({
        error:
          "ADMIN_CAMPAIGN_CREATION_ERROR",

        message:
          "No se ha podido crear la campaña.",
      });
    }
  }
);

/**
 * GET /api/admin/campaigns
 *
 * Todas las campañas de ST.MARY AGENCY.
 */
router.get("/campaigns", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (!requireStaff(request)) {
      return res.status(403).json({
        error: "STAFF_ACCESS_REQUIRED",
      });
    }

    const campaigns = await prisma.campaign.findMany({
  include: {
    brand: {
      select: {
        id: true,
        companyName: true,
        accessMode: true,

        members: {
          select: {
            role: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    },

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

    return res.json({
      campaigns,
    });
  } catch (error) {
    console.error("Admin campaigns error:", error);

    return res.status(500).json({
      error: "ADMIN_CAMPAIGNS_ERROR",
    });
  }
});

/**
 * GET /api/admin/campaigns/:id
 *
 * Detalle global de una campaña para STAFF.
 */
router.get("/campaigns/:id", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (!requireStaff(request)) {
      return res.status(403).json({
        error: "STAFF_ACCESS_REQUIRED",
      });
    }

  const campaign = await prisma.campaign.findUnique({
  where: {
    id: req.params.id,
  },

  include: {
    brand: {
      select: {
        id: true,
        companyName: true,
        website: true,
        industry: true,
        accessMode: true,

        members: {
          select: {
            id: true,
            role: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    },

    creators: {
      include: {
        creator: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },

        deliverables: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    },

    instructions: {
      orderBy: {
        createdAt: "asc",
      },
    },
  },
});

    if (!campaign) {
      return res.status(404).json({
        error: "CAMPAIGN_NOT_FOUND",
      });
    }

    return res.json({
      campaign,
    });
  } catch (error) {
    console.error("Admin campaign detail error:", error);

    return res.status(500).json({
      error: "ADMIN_CAMPAIGN_DETAIL_ERROR",
    });
  }
});

/**
 * PATCH /api/admin/campaigns/:id/status
 *
 * Cambia el estado operativo de una campaña.
 * Solo STAFF.
 */
router.patch(
  "/campaigns/:id/status",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!requireStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const campaignId = String(
        req.params.id
      );

      const { status } = req.body ?? {};

      const allowedStatuses = [
        "DRAFT",
        "ACTIVE",
        "COMPLETED",
      ];

      if (
        !status ||
        !allowedStatuses.includes(
          String(status).toUpperCase()
        )
      ) {
        return res.status(400).json({
          error: "INVALID_CAMPAIGN_STATUS",
          message:
            "El estado de la campaña no es válido.",
        });
      }

      const campaign =
        await prisma.campaign.findUnique({
          where: {
            id: campaignId,
          },

          select: {
            id: true,
            name: true,
            status: true,

            brand: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
          message:
            "La campaña no existe.",
        });
      }

      const normalizedStatus =
        String(status).toUpperCase();

      /*
       * No hacemos nada si ya tiene
       * ese estado.
       */
      if (
        campaign.status === normalizedStatus
      ) {
        return res.json({
          campaign,
        });
      }

      const updatedCampaign =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.campaign.update({
                where: {
                  id: campaignId,
                },

                data: {
                  status:
                    normalizedStatus,
                },

                include: {
                  brand: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              });

            await tx.auditLog.create({
              data: {
                userId:
                  request.user!.id,

                action:
                  "CAMPAIGN_STATUS_CHANGED_BY_STAFF",

                entity: "Campaign",

                entityId:
                  updated.id,

                metadata: {
                  campaignName:
                    updated.name,

                  brandId:
                    updated.brandId,

                  brandName:
                    updated.brand
                      .companyName,

                  previousStatus:
                    campaign.status,

                  newStatus:
                    updated.status,
                },
              },
            });

            return updated;
          }
        );

      return res.json({
        campaign:
          updatedCampaign,
      });
    } catch (error) {
      console.error(
        "Admin campaign status update error:",
        error
      );

      return res.status(500).json({
        error:
          "ADMIN_CAMPAIGN_STATUS_UPDATE_ERROR",

        message:
          "No se ha podido actualizar el estado de la campaña.",
      });
    }
  }
);

/**
 * ==========================================
 * GET /api/admin/campaigns/:campaignId/creators/:campaignCreatorId
 * ==========================================
 *
 * Devuelve una colaboración concreta.
 * Solo STAFF.
 */
router.get(
  "/campaigns/:campaignId/creators/:campaignCreatorId",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!requireStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const collaboration =
        await prisma.campaignCreator.findFirst({
          where: {
            id: campaignCreatorId,
            campaignId,
          },

          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
                budget: true,

                brand: {
                  select: {
                    id: true,
                    companyName: true,
                  },
                },
              },
            },

            creator: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },

            deliverables: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      if (!collaboration) {
        return res.status(404).json({
          error:
            "CAMPAIGN_CREATOR_NOT_FOUND",

          message:
            "La colaboración no existe.",
        });
      }

      return res.json({
        collaboration,
      });
    } catch (error) {
      console.error(
        "Admin collaboration detail error:",
        error
      );

      return res.status(500).json({
        error:
          "ADMIN_COLLABORATION_DETAIL_ERROR",

        message:
          "No se ha podido cargar la colaboración.",
      });
    }
  }
);/**
 * ==========================================
 * PATCH /api/admin/campaigns/:campaignId/creators/:campaignCreatorId/status
 * ==========================================
 */
router.patch(
  "/campaigns/:campaignId/creators/:campaignCreatorId/status",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!requireStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const { status } = req.body ?? {};

      const allowedStatuses = [
        "PENDING",
        "CONTACTED",
        "ACCEPTED",
        "SELECTED",
        "PRODUCT_SENT",
        "CONTENT_PENDING",
        "CONTENT_RECEIVED",
        "PUBLISHED",
        "PAID",
      ];

      const normalizedStatus =
        String(status || "").toUpperCase();

      if (
        !allowedStatuses.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_COLLABORATION_STATUS",

          message:
            "El estado de la colaboración no es válido.",
        });
      }

      const existing =
        await prisma.campaignCreator.findFirst({
          where: {
            id: campaignCreatorId,
            campaignId,
          },
        });

      if (!existing) {
        return res.status(404).json({
          error:
            "CAMPAIGN_CREATOR_NOT_FOUND",

          message:
            "La colaboración no existe.",
        });
      }

      const now = new Date();

      /*
       * Además del status guardamos las fechas
       * operativas que ya tienes en CampaignCreator.
       */
      const milestoneData: Record<
        string,
        Date
      > = {};

      if (
        normalizedStatus === "CONTACTED" &&
        !existing.contactedAt
      ) {
        milestoneData.contactedAt = now;
      }

      if (
        normalizedStatus === "ACCEPTED" &&
        !existing.acceptedAt
      ) {
        milestoneData.acceptedAt = now;
      }

      if (
        normalizedStatus === "SELECTED" &&
        !existing.selectedAt
      ) {
        milestoneData.selectedAt = now;
      }

      if (
        normalizedStatus === "PRODUCT_SENT" &&
        !existing.productSentAt
      ) {
        milestoneData.productSentAt = now;
      }

      if (
        normalizedStatus ===
          "CONTENT_RECEIVED" &&
        !existing.contentReceivedAt
      ) {
        milestoneData.contentReceivedAt =
          now;
      }

      if (
        normalizedStatus === "PUBLISHED" &&
        !existing.publishedAt
      ) {
        milestoneData.publishedAt = now;
      }

      if (
        normalizedStatus === "PAID" &&
        !existing.paidAt
      ) {
        milestoneData.paidAt = now;
      }

      const collaboration =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.campaignCreator.update({
                where: {
                  id: campaignCreatorId,
                },

                data: {
                  status:
                    normalizedStatus,

                  ...milestoneData,
                },

                include: {
                  creator: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },

                  deliverables: true,
                },
              });

            await tx.auditLog.create({
              data: {
                userId:
                  request.user!.id,

                action:
                  "CAMPAIGN_CREATOR_STATUS_CHANGED_BY_STAFF",

                entity:
                  "CampaignCreator",

                entityId:
                  updated.id,

                metadata: {
                  campaignId,

                  creatorId:
                    updated.creatorId,

                  previousStatus:
                    existing.status,

                  newStatus:
                    updated.status,
                },
              },
            });

            return updated;
          }
        );

      return res.json({
        collaboration,
      });
    } catch (error) {
      console.error(
        "Admin collaboration status update error:",
        error
      );

      return res.status(500).json({
        error:
          "ADMIN_COLLABORATION_STATUS_UPDATE_ERROR",

        message:
          "No se ha podido actualizar la colaboración.",
      });
    }
  }
);

router.patch(
  "/campaigns/:campaignId/creators/:campaignCreatorId/fee",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!requireStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const normalizedFee = String(
        req.body?.fee ?? ""
      )
        .trim()
        .replace(",", ".");

      if (
        !normalizedFee ||
        !/^\d+(\.\d{1,2})?$/.test(
          normalizedFee
        ) ||
        Number(normalizedFee) < 0
      ) {
        return res.status(400).json({
          error: "INVALID_FEE",
          message:
            "Introduce un fee válido.",
        });
      }

      const existing =
        await prisma.campaignCreator.findFirst({
          where: {
            id: campaignCreatorId,
            campaignId,
          },
        });

      if (!existing) {
        return res.status(404).json({
          error:
            "CAMPAIGN_CREATOR_NOT_FOUND",
        });
      }

      const collaboration =
        await prisma.campaignCreator.update({
          where: {
            id: campaignCreatorId,
          },

          data: {
            fee: normalizedFee,
          },

          include: {
            creator: {
              include: {
                user: true,
              },
            },

            deliverables: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: request.user.id,

          action:
            "CAMPAIGN_CREATOR_FEE_UPDATED_BY_STAFF",

          entity: "CampaignCreator",

          entityId:
            collaboration.id,

          metadata: {
            campaignId,

            creatorId:
              collaboration.creatorId,

            previousFee:
              existing.fee
                ? String(existing.fee)
                : null,

            newFee:
              String(
                collaboration.fee
              ),
          },
        },
      });

      return res.json({
        collaboration,
      });
    } catch (error) {
      console.error(
        "Admin collaboration fee update error:",
        error
      );

      return res.status(500).json({
        error:
          "ADMIN_COLLABORATION_FEE_UPDATE_ERROR",
      });
    }
  }
);


/**
 * GET /api/admin/finance
 *
 * Resumen financiero operativo.
 *
 * De momento trabaja con los datos existentes de campañas
 * y colaboraciones. Stripe se conectará posteriormente.
 */
router.get("/finance", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;

    if (!request.user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (!requireStaff(request)) {
      return res.status(403).json({
        error: "STAFF_ACCESS_REQUIRED",
      });
    }

    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        budget: true,
        status: true,
        createdAt: true,
        brand: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const collaborations = await prisma.campaignCreator.findMany({
      select: {
        id: true,
        campaignId: true,
        creatorId: true,
        fee: true,
        status: true,
        creator: {
          select: {
            username: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        campaign: {
          select: {
            name: true,
            brand: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalCampaignBudget = campaigns.reduce(
      (total, campaign) => total + Number(campaign.budget),
      0
    );

    const totalCreatorFees = collaborations.reduce(
      (total, collaboration) =>
        total + Number(collaboration.fee ?? 0),
      0
    );

    const paidCreatorFees = collaborations
      .filter((collaboration) => collaboration.status === "PAID")
      .reduce(
        (total, collaboration) =>
          total + Number(collaboration.fee ?? 0),
        0
      );

    const pendingCreatorFees = collaborations
      .filter((collaboration) => collaboration.status !== "PAID")
      .reduce(
        (total, collaboration) =>
          total + Number(collaboration.fee ?? 0),
        0
      );

    return res.json({
      finance: {
        totalCampaignBudget,
        totalCreatorFees,
        paidCreatorFees,
        pendingCreatorFees,
        estimatedGrossMargin:
          totalCampaignBudget - totalCreatorFees,
        campaigns,
        collaborations,
      },
    });
  } catch (error) {
    console.error("Admin finance error:", error);

    return res.status(500).json({
      error: "ADMIN_FINANCE_ERROR",
    });
  }
});
/**
 * ==========================================
 * PATCH /api/admin/campaigns/:id
 * ==========================================
 *
 * STAFF puede editar la configuración completa
 * de cualquier campaña.
 */
router.patch(
  "/campaigns/:id",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      /*
       * ==========================================
       * AUTH
       * ==========================================
       */

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!requireStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      /*
       * ==========================================
       * CAMPAIGN
       * ==========================================
       */

      const campaignId = String(
        req.params.id
      );

      const existingCampaign =
        await prisma.campaign.findUnique({
          where: {
            id: campaignId,
          },

          select: {
            id: true,
            brandId: true,
            status: true,
          },
        });

      if (!existingCampaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
          message:
            "La campaña no existe.",
        });
      }

      /*
       * ==========================================
       * BODY
       * ==========================================
       */

      const {
        name,
        description,
        objective,
        budget,

        campaignType,
        collaborationType,

        platforms,
        formats,
        category,

        countries,
        provinces,

        gender,
        minAge,
        maxAge,

        interests,
        targetCreatorCount,

        startDate,
        endDate,

        publicationStart,
        publicationDeadline,

        contentItems,

        requirements,
        hashtags,
        mentions,
        links,

        forbiddenContent,
        approvalRequired,
      } = req.body ?? {};

      /*
       * ==========================================
       * VALIDACIONES
       * ==========================================
       */

      if (
        !name ||
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "CAMPAIGN_NAME_REQUIRED",

          message:
            "El nombre de la campaña es obligatorio.",
        });
      }

      const normalizedBudget =
        String(budget ?? "")
          .trim()
          .replace(",", ".");

      if (
        !normalizedBudget ||
        !/^\d+(\.\d{1,2})?$/.test(
          normalizedBudget
        ) ||
        Number(normalizedBudget) < 0
      ) {
        return res.status(400).json({
          error: "INVALID_BUDGET",
          message:
            "Introduce un presupuesto válido.",
        });
      }

      const allowedCampaignTypes = [
        "INFLUENCER_MARKETING",
        "UGC",
        "INFLUENCER_AND_UGC",
        "AMPLIFICATION",
      ];

      if (
        campaignType &&
        !allowedCampaignTypes.includes(
          campaignType
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_CAMPAIGN_TYPE",

          message:
            "El tipo de campaña no es válido.",
        });
      }

      const parsedMinAge =
        minAge === "" ||
        minAge === null ||
        minAge === undefined
          ? null
          : Number(minAge);

      const parsedMaxAge =
        maxAge === "" ||
        maxAge === null ||
        maxAge === undefined
          ? null
          : Number(maxAge);

      if (
        parsedMinAge !== null &&
        (
          !Number.isInteger(
            parsedMinAge
          ) ||
          parsedMinAge < 13 ||
          parsedMinAge > 100
        )
      ) {
        return res.status(400).json({
          error: "INVALID_MIN_AGE",
          message:
            "La edad mínima no es válida.",
        });
      }

      if (
        parsedMaxAge !== null &&
        (
          !Number.isInteger(
            parsedMaxAge
          ) ||
          parsedMaxAge < 13 ||
          parsedMaxAge > 100
        )
      ) {
        return res.status(400).json({
          error: "INVALID_MAX_AGE",
          message:
            "La edad máxima no es válida.",
        });
      }

      if (
        parsedMinAge !== null &&
        parsedMaxAge !== null &&
        parsedMinAge > parsedMaxAge
      ) {
        return res.status(400).json({
          error:
            "INVALID_AGE_RANGE",

          message:
            "La edad mínima no puede ser mayor que la edad máxima.",
        });
      }

      const parsedCreatorCount =
        targetCreatorCount === "" ||
        targetCreatorCount === null ||
        targetCreatorCount ===
          undefined
          ? null
          : Number(
              targetCreatorCount
            );

      if (
        parsedCreatorCount !== null &&
        (
          !Number.isInteger(
            parsedCreatorCount
          ) ||
          parsedCreatorCount < 1
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_CREATOR_COUNT",

          message:
            "El número de creadores debe ser mayor que cero.",
        });
      }

      /*
       * ==========================================
       * FECHAS
       * ==========================================
       */

      const parseDate = (
        value: unknown
      ) => {
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return null;
        }

        const date =
          new Date(String(value));

        return date;
      };

      const parsedStartDate =
        parseDate(startDate);

      const parsedEndDate =
        parseDate(endDate);

      const parsedPublicationStart =
        parseDate(
          publicationStart
        );

      const parsedPublicationDeadline =
        parseDate(
          publicationDeadline
        );

      if (
        parsedStartDate &&
        Number.isNaN(
          parsedStartDate.getTime()
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_START_DATE",
          message:
            "La fecha de inicio no es válida.",
        });
      }

      if (
        parsedEndDate &&
        Number.isNaN(
          parsedEndDate.getTime()
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_END_DATE",
          message:
            "La fecha de finalización no es válida.",
        });
      }

      if (
        parsedStartDate &&
        parsedEndDate &&
        parsedStartDate >
          parsedEndDate
      ) {
        return res.status(400).json({
          error:
            "INVALID_DATE_RANGE",

          message:
            "La fecha de inicio no puede ser posterior a la fecha de finalización.",
        });
      }

      if (
        parsedPublicationStart &&
        Number.isNaN(
          parsedPublicationStart.getTime()
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_PUBLICATION_START",

          message:
            "La fecha de inicio de publicación no es válida.",
        });
      }

      if (
        parsedPublicationDeadline &&
        Number.isNaN(
          parsedPublicationDeadline.getTime()
        )
      ) {
        return res.status(400).json({
          error:
            "INVALID_PUBLICATION_DEADLINE",

          message:
            "La fecha límite de publicación no es válida.",
        });
      }

      if (
        parsedPublicationStart &&
        parsedPublicationDeadline &&
        parsedPublicationStart >
          parsedPublicationDeadline
      ) {
        return res.status(400).json({
          error:
            "INVALID_PUBLICATION_RANGE",

          message:
            "La fecha de inicio de publicación no puede ser posterior a la fecha límite.",
        });
      }

      /*
       * ==========================================
       * ARRAYS
       * ==========================================
       */

      const normalizedPlatforms =
        Array.isArray(platforms)
          ? platforms.filter(Boolean)
          : [];

      const normalizedFormats =
        Array.isArray(formats)
          ? formats.filter(Boolean)
          : [];

      const normalizedCountries =
        Array.isArray(countries)
          ? countries.filter(Boolean)
          : [];

      const normalizedProvinces =
        Array.isArray(provinces)
          ? provinces.filter(Boolean)
          : [];

      const normalizedInterests =
        Array.isArray(interests)
          ? interests.filter(Boolean)
          : [];

      const normalizedHashtags =
        Array.isArray(hashtags)
          ? hashtags.filter(Boolean)
          : [];

      const normalizedMentions =
        Array.isArray(mentions)
          ? mentions.filter(Boolean)
          : [];

      const normalizedLinks =
        Array.isArray(links)
          ? links.filter(Boolean)
          : [];

      const normalizedContentItems =
        Array.isArray(contentItems)
          ? contentItems
              .filter(
                (item) =>
                  item &&
                  typeof item ===
                    "object"
              )
              .map((item) => ({
                platform:
                  String(
                    item.platform || ""
                  ).trim(),

                contentType:
                  String(
                    item.contentType ||
                      ""
                  ).trim(),

                quantity:
                  Math.max(
                    1,
                    Number(
                      item.quantity || 1
                    )
                  ),
              }))
              .filter(
                (item) =>
                  item.platform &&
                  item.contentType
              )
          : [];

      /*
       * ==========================================
       * UPDATE TRANSACTION
       * ==========================================
       */

      const updatedCampaign =
        await prisma.$transaction(
          async (tx) => {
            const updated =
              await tx.campaign.update({
                where: {
                  id: campaignId,
                },

                data: {
                  name: name.trim(),

                  description:
                    description?.trim() ||
                    null,

                  objective:
                    objective?.trim() ||
                    null,

                  budget:
                    normalizedBudget,

                  campaignType:
                    campaignType ||
                    "INFLUENCER_MARKETING",

                  collaborationType:
                    collaborationType ||
                    "PAID",

                  platforms:
                    normalizedPlatforms,

                  formats:
                    normalizedFormats,

                  category:
                    category?.trim() ||
                    null,

                  /*
                   * Compatibilidad con
                   * código antiguo.
                   */
                  platform:
                    normalizedPlatforms
                      .length > 0
                      ? normalizedPlatforms.join(
                          " + "
                        )
                      : null,

                  countries:
                    normalizedCountries,

                  provinces:
                    normalizedProvinces,

                  gender:
                    gender &&
                    gender !== "ALL"
                      ? gender
                      : null,

                  minAge:
                    parsedMinAge,

                  maxAge:
                    parsedMaxAge,

                  interests:
                    normalizedInterests,

                  targetCreatorCount:
                    parsedCreatorCount,

                  startDate:
                    parsedStartDate,

                  endDate:
                    parsedEndDate,

                  publicationStart:
                    parsedPublicationStart,

                  publicationDeadline:
                    parsedPublicationDeadline,
                },
              });

            /*
             * ======================================
             * INSTRUCCIONES
             * ======================================
             *
             * Como CampaignForm representa el
             * estado completo de la configuración,
             * reconstruimos las instrucciones.
             */

            await tx.campaignInstruction.deleteMany({
              where: {
                campaignId,
              },
            });

            const hasGeneralInstruction =
              Boolean(
                requirements?.trim()
              ) ||
              normalizedHashtags.length >
                0 ||
              normalizedMentions.length >
                0 ||
              normalizedLinks.length >
                0 ||
              Boolean(
                forbiddenContent?.trim()
              ) ||
              Boolean(
                approvalRequired
              );

            if (
              hasGeneralInstruction
            ) {
              await tx.campaignInstruction.create({
                data: {
                  campaignId,

                  title:
                    "Brief general",

                  description:
                    requirements?.trim() ||
                    null,

                  quantity: 1,

                  hashtags:
                    normalizedHashtags,

                  mentions:
                    normalizedMentions,

                  tags: [],

                  links:
                    normalizedLinks,

                  forbiddenContent:
                    forbiddenContent?.trim() ||
                    null,

                  approvalRequired:
                    Boolean(
                      approvalRequired
                    ),
                },
              });
            }

            /*
             * Contenidos solicitados:
             *
             * Ej:
             * Instagram / Reel / 2
             * Instagram / Story / 3
             * TikTok / TikTok / 1
             */

            for (
              const item of
              normalizedContentItems
            ) {
              await tx.campaignInstruction.create({
                data: {
                  campaignId,

                  title:
                    `${item.platform} · ${item.contentType}`,

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

                  approvalRequired:
                    Boolean(
                      approvalRequired
                    ),
                },
              });
            }

            /*
             * ======================================
             * AUDIT
             * ======================================
             */

            await tx.auditLog.create({
              data: {
                userId:
                  request.user!.id,

                action:
                  "CAMPAIGN_UPDATED_BY_STAFF",

                entity:
                  "Campaign",

                entityId:
                  campaignId,

                metadata: {
                  campaignName:
                    updated.name,

                  brandId:
                    updated.brandId,
                },
              },
            });

            return updated;
          }
        );

      return res.json({
        campaign:
          updatedCampaign,
      });
    } catch (error) {
      console.error(
        "Admin campaign update error:",
        error
      );

      return res.status(500).json({
        error:
          "ADMIN_CAMPAIGN_UPDATE_ERROR",

        message:
          "No se ha podido actualizar la campaña.",
      });
    }
  }
);
/*
 * ==========================================
 * POST /api/admin/brands/:id/access
 * ==========================================
 *
 * Crea acceso al portal para un cliente
 * existente.
 *
 * NO crea una nueva Brand.
 *
 * Crea:
 * User -> BrandMember -> Brand existente
 */
router.post(
  "/brands/:id/access",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (
        !user ||
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const {
        name,
        email,
        password,
        accessMode = "PORTAL",
        role = "VIEWER",

        canViewCampaigns = true,
        canCreateCampaigns = false,
        canEditCampaigns = false,

        canViewProposals = true,
        canApproveCreators = false,

        canViewDeliverables = true,
        canApproveContent = false,

        canViewResults = true,
        canExportReports = false,

        canDiscoverCreators = false,
        canContactCreators = false,
        canSelectCreators = false,
      } = req.body ?? {};

      /*
       * Validaciones básicas
       */
      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "PASSWORD_TOO_SHORT",
        });
      }

      if (
        ![
          "PORTAL",
          "SELF_MANAGED",
        ].includes(accessMode)
      ) {
        return res.status(400).json({
          error: "INVALID_ACCESS_MODE",
        });
      }

      if (
        ![
          "OWNER",
          "ADMIN",
          "MARKETING",
          "VIEWER",
        ].includes(role)
      ) {
        return res.status(400).json({
          error: "INVALID_MEMBER_ROLE",
        });
      }

      /*
       * Comprobamos que la empresa exista.
       */
      const brand =
        await prisma.brand.findUnique({
          where: {
            id: req.params.id,
          },

          include: {
            members: true,
          },
        });

      if (!brand) {
        return res.status(404).json({
          error: "BRAND_NOT_FOUND",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      /*
       * De momento no permitimos reutilizar
       * una cuenta existente.
       *
       * Más adelante podremos permitir que
       * una misma persona pertenezca a varias
       * marcas.
       */
      const existingUser =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          error: "EMAIL_ALREADY_EXISTS",
        });
      }

      /*
       * Hash de contraseña.
       *
       * Requiere:
       * import argon2 from "argon2";
       */
      const passwordHash =
        await argon2.hash(password);

      /*
       * Todo se ejecuta en una transacción.
       *
       * Si falla cualquier paso, no queda
       * un usuario huérfano.
       */
      const result =
        await prisma.$transaction(
          async (tx) => {
            const newUser =
              await tx.user.create({
                data: {
                  name: name.trim(),
                  email:
                    normalizedEmail,
                  passwordHash,
                  role: "BRAND",
                  status: "ACTIVE",
                },
              });

            const membership =
              await tx.brandMember.create({
                data: {
                  brandId: brand.id,
                  userId: newUser.id,

                  role,

                  canViewCampaigns:
                    Boolean(
                      canViewCampaigns
                    ),

                  canCreateCampaigns:
                    Boolean(
                      canCreateCampaigns
                    ),

                  canEditCampaigns:
                    Boolean(
                      canEditCampaigns
                    ),

                  canViewProposals:
                    Boolean(
                      canViewProposals
                    ),

                  canApproveCreators:
                    Boolean(
                      canApproveCreators
                    ),

                  canViewDeliverables:
                    Boolean(
                      canViewDeliverables
                    ),

                  canApproveContent:
                    Boolean(
                      canApproveContent
                    ),

                  canViewResults:
                    Boolean(
                      canViewResults
                    ),

                  canExportReports:
                    Boolean(
                      canExportReports
                    ),

                  canDiscoverCreators:
                    Boolean(
                      canDiscoverCreators
                    ),

                  canContactCreators:
                    Boolean(
                      canContactCreators
                    ),

                  canSelectCreators:
                    Boolean(
                      canSelectCreators
                    ),
                },
              });

            const updatedBrand =
              await tx.brand.update({
                where: {
                  id: brand.id,
                },

                data: {
                  accessMode,
                },
              });

            return {
              user: newUser,
              membership,
              brand: updatedBrand,
            };
          }
        );

      return res.status(201).json({
        access: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            status:
              result.user.status,
          },

          membership:
            result.membership,

          brand: result.brand,
        },
      });
    } catch (error) {
      console.error(
        "Create brand access error:",
        error
      );

      return res.status(500).json({
        error:
          "CREATE_BRAND_ACCESS_ERROR",
      });
    }
  }
);
/**
 * ==========================================
 * PATCH /api/admin/brands/:brandId/members/:memberId
 * ==========================================
 *
 * Modifica el rol y los permisos de acceso
 * de un usuario perteneciente a una marca.
 *
 * Solo STAFF.
 */
router.patch(
  "/brands/:brandId/members/:memberId",
  async (req, res) => {
    try {
      const request = req as AuthenticatedRequest;
      const user = request.user;

      if (!user || user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const brandId = String(req.params.brandId);
      const memberId = String(req.params.memberId);

      const {
        accessMode,
        role,

        canViewCampaigns,
        canCreateCampaigns,
        canEditCampaigns,

        canViewProposals,
        canApproveCreators,

        canViewDeliverables,
        canApproveContent,

        canViewResults,
        canExportReports,

        canDiscoverCreators,
        canContactCreators,
        canSelectCreators,
      } = req.body ?? {};

      /*
       * Comprobamos que el BrandMember exista
       * y pertenezca realmente a esta marca.
       */
      const existingMember =
        await prisma.brandMember.findFirst({
          where: {
            id: memberId,
            brandId,
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
              },
            },

            brand: {
              select: {
                id: true,
                companyName: true,
                accessMode: true,
              },
            },
          },
        });

      if (!existingMember) {
        return res.status(404).json({
          error: "BRAND_MEMBER_NOT_FOUND",
        });
      }

      /*
       * Validamos el rol solamente si viene
       * incluido en la petición.
       */
      if (
        role !== undefined &&
        ![
          "OWNER",
          "ADMIN",
          "MARKETING",
          "VIEWER",
        ].includes(role)
      ) {
        return res.status(400).json({
          error: "INVALID_MEMBER_ROLE",
        });
      }

      /*
       * Validamos accessMode solamente si viene.
       */
      if (
        accessMode !== undefined &&
        ![
          "PORTAL",
          "SELF_MANAGED",
        ].includes(accessMode)
      ) {
        return res.status(400).json({
          error: "INVALID_ACCESS_MODE",
        });
      }

      /*
       * Construimos únicamente los campos
       * enviados por el frontend.
       */
      const permissionData: Record<
        string,
        boolean | string
      > = {};

      if (role !== undefined) {
        permissionData.role = role;
      }

      const booleanPermissions = {
        canViewCampaigns,
        canCreateCampaigns,
        canEditCampaigns,

        canViewProposals,
        canApproveCreators,

        canViewDeliverables,
        canApproveContent,

        canViewResults,
        canExportReports,

        canDiscoverCreators,
        canContactCreators,
        canSelectCreators,
      };

      for (const [key, value] of Object.entries(
        booleanPermissions
      )) {
        if (typeof value === "boolean") {
          permissionData[key] = value;
        }
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const membership =
            await tx.brandMember.update({
              where: {
                id: existingMember.id,
              },

              data: permissionData,

              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    status: true,
                  },
                },
              },
            });

          let brand = existingMember.brand;

          if (accessMode !== undefined) {
            brand = await tx.brand.update({
              where: {
                id: brandId,
              },

              data: {
                accessMode,
              },

              select: {
                id: true,
                companyName: true,
                accessMode: true,
              },
            });
          }

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action:
                "BRAND_MEMBER_PERMISSIONS_UPDATED",
              entity: "BrandMember",
              entityId: membership.id,

              metadata: {
                brandId,
                memberId: membership.id,
                role: membership.role,
                accessMode: brand.accessMode,
              },
            },
          });

          return {
            membership,
            brand,
          };
        }
      );

      return res.json({
        access: result,
      });
    } catch (error) {
      console.error(
        "Update brand member permissions error:",
        error
      );

      return res.status(500).json({
        error:
          "UPDATE_BRAND_MEMBER_PERMISSIONS_ERROR",
      });
    }
  }
);
export default router;