import { Router } from "express";

import { prisma } from "../lib/prisma.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createBrandCampaign,
  getBrandCampaignById,
  getBrandCampaigns,
} from "../services/campaign.service.js";

import { getCampaignMatches } from "../services/matching.service.js";
import { discoverCreators } from "../services/creator-discovery.service.js";

const router = Router();

type CampaignCreatorTx = Pick<typeof prisma, "campaignCreator">;

async function ensureSelectedCampaignCreator(
  tx: CampaignCreatorTx,
  campaignId: string,
  creatorId: string,
  fee?: string | null
) {
  const existing = await tx.campaignCreator.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  });

  const data = {
    status: "SELECTED" as const,
    selectedAt: new Date(),
    ...(fee !== undefined ? { fee } : {}),
  };

  if (existing) {
    return tx.campaignCreator.update({
      where: { id: existing.id },
      data,
      include: {
        creator: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            socialAccounts: true,
          },
        },
      },
    });
  }

  return tx.campaignCreator.create({
    data: {
      campaignId,
      creatorId,
      status: "SELECTED",
      selectedAt: new Date(),
      fee: fee ?? null,
    },
    include: {
      creator: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          socialAccounts: true,
        },
      },
    },
  });
}

async function countCampaignCreators(
  tx: CampaignCreatorTx,
  campaignId: string
) {
  return tx.campaignCreator.count({
    where: {
      campaignId,
      status: { not: "PENDING" },
    },
  });
}

function getBrandMembership(
  user: NonNullable<AuthenticatedRequest["user"]>
) {
  if (user.role !== "BRAND") {
    return null;
  }

  return user.brandMemberships?.[0] ?? null;
}

function getBrandId(
  user: NonNullable<AuthenticatedRequest["user"]>
) {
  return getBrandMembership(user)?.brandId ?? null;
}

/*
 * ==========================================
 * TODAS LAS RUTAS DE CAMPAÑAS
 * ==========================================
 *
 * Todas requieren una sesión válida.
 */

router.use(requireAuth);

/*
 * ==========================================
 * GET /api/campaigns
 * ==========================================
 *
 * Una marca obtiene únicamente sus campañas.
 */

router.get("/", async (req, res) => {
  try {
    const request =
      req as AuthenticatedRequest;

    const user = request.user;

    if (!user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

        if (user.role !== "BRAND") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership = getBrandMembership(user);

      if (!membership) {
        return res.status(403).json({
          error: "BRAND_MEMBERSHIP_REQUIRED",
        });
      }

      if (!membership.canViewCampaigns) {
        return res.status(403).json({
          error: "BRAND_PERMISSION_DENIED",
        });
      }

      const campaigns = await getBrandCampaigns(
        membership.brandId
      );

    return res.json({
      campaigns,
    });
  } catch (error) {
    console.error(
      "Get campaigns error:",
      error
    );

    return res.status(500).json({
      error: "GET_CAMPAIGNS_ERROR",
    });
  }
});







router.patch(
  "/:campaignId/matches/:matchId",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      /*
       * Solo BRAND y STAFF pueden gestionar
       * la shortlist de una campaña.
       */
      if (
        user.role !== "STAFF" &&
        user.role !== "BRAND"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

     const membership =
  user.role === "BRAND"
    ? getBrandMembership(user)
    : null;

if (user.role === "BRAND") {
  if (!membership) {
    return res.status(403).json({
      error: "BRAND_MEMBERSHIP_REQUIRED",
    });
  }

  if (!membership.canApproveCreators) {
    return res.status(403).json({
      error: "BRAND_PERMISSION_DENIED",
    });
  }
}

      const {
        campaignId,
        matchId,
      } = req.params;

      const { status } = req.body;

      /*
       * Estados que permitimos modificar
       * manualmente desde el Matching Engine.
       *
       * SELECTED no lo usamos aquí porque
       * la selección real tendrá su propio
       * flujo y podrá crear CampaignCreator.
       */
      const allowedStatuses = [
        "RECOMMENDED",
        "SHORTLISTED",
        "REJECTED",
      ];

      if (
        !status ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          error:
            "INVALID_MATCH_STATUS",
        });
      }

      /*
       * Comprobamos que la campaña existe
       * y que BRAND solamente puede tocar
       * campañas propias.
       */
      const campaign =
        await prisma.campaign.findFirst({
          where: {
            id: campaignId,

            ...(user.role === "BRAND"
              ? {
                  
                   brandId: membership!.brandId,
                }
              : {}),
          },

          select: {
            id: true,
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error:
            "CAMPAIGN_NOT_FOUND",
        });
      }

      /*
       * El match tiene que pertenecer
       * necesariamente a esa campaña.
       */
      const match =
        await prisma.creatorMatch.findFirst({
          where: {
            id: matchId,
            campaignId,
          },

          include: {
            creator: {
              select: {
                id: true,
                username: true,
              },
            },

            externalCreator: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

      if (!match) {
        return res.status(404).json({
          error:
            "CREATOR_MATCH_NOT_FOUND",
        });
      }

      /*
       * Guardamos estado anterior para
       * AuditLog.
       */
      const previousStatus =
        match.status;

      const updatedMatch =
        await prisma.creatorMatch.update({
          where: {
            id: match.id,
          },

          data: {
            status,
          },

          include: {
            creator: {
              select: {
                id: true,
                username: true,
              },
            },

            externalCreator: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

      /*
       * Auditoría
       */
      await prisma.auditLog.create({
        data: {
          userId: user.id,

          action:
            "CREATOR_MATCH_STATUS_UPDATED",

          entity:
            "CreatorMatch",

          entityId:
            updatedMatch.id,

          metadata: {
            campaignId,

            previousStatus,

            newStatus:
              updatedMatch.status,

            source:
              updatedMatch.creatorId
                ? "INTERNAL"
                : "EXTERNAL",

            creatorId:
              updatedMatch.creatorId,

            externalCreatorId:
              updatedMatch.externalCreatorId,
          },
        },
      });

      return res.json({
        match: updatedMatch,
      });
    } catch (error) {
      console.error(
        "Creator match status update error:",
        error
      );

      return res.status(500).json({
        error:
          "CREATOR_MATCH_STATUS_UPDATE_ERROR",
      });
    }
  }
);


router.post(
  "/:campaignId/matches/:matchId/contact",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      /*
       * De momento el contacto de creadores
       * externos lo gestiona ST MARY AGENCY.
       */
      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const {
        campaignId,
        matchId,
      } = req.params;

      const match =
        await prisma.creatorMatch.findFirst({
          where: {
            id: matchId,
            campaignId,
          },

          include: {
            externalCreator: true,
          },
        });

      if (!match) {
        return res.status(404).json({
          error:
            "CREATOR_MATCH_NOT_FOUND",
        });
      }

      /*
       * Este endpoint solamente tiene
       * sentido para externos.
       */
      if (
        !match.externalCreatorId ||
        !match.externalCreator
      ) {
        return res.status(400).json({
          error:
            "MATCH_IS_NOT_EXTERNAL",
        });
      }

      /*
       * Solo contactamos candidatos que
       * ST.MARY AGENCY haya añadido previamente
       * a la shortlist.
       */
      if (
        match.status !== "SHORTLISTED"
      ) {
        return res.status(400).json({
          error:
            "CREATOR_NOT_SHORTLISTED",
        });
      }

      /*
       * Evitamos repetir la operación.
       */
      if (
        match.externalCreator.isContacted
      ) {
        return res.json({
          success: true,
          alreadyContacted: true,
          externalCreator:
            match.externalCreator,
        });
      }

      const externalCreator =
        await prisma.externalCreator.update({
          where: {
            id:
              match.externalCreatorId,
          },

          data: {
            isContacted: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: user.id,

          action:
            "EXTERNAL_CREATOR_CONTACTED",

          entity:
            "ExternalCreator",

          entityId:
            externalCreator.id,

          metadata: {
            campaignId,
            matchId,
            username:
              externalCreator.username,
          },
        },
      });

      return res.json({
        success: true,
        alreadyContacted: false,
        externalCreator,
      });
    } catch (error) {
      console.error(
        "External creator contact error:",
        error
      );

      return res.status(500).json({
        error:
          "EXTERNAL_CREATOR_CONTACT_ERROR",
      });
    }
  }
);

router.post(
  "/:campaignId/matches/:matchId/invite",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      /*
       * Las invitaciones a creadores externos
       * las gestiona ST.MARY AGENCY 
       */
      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const {
        campaignId,
        matchId,
      } = req.params;

      const match =
        await prisma.creatorMatch.findFirst({
          where: {
            id: matchId,
            campaignId,
          },

          include: {
            externalCreator: true,
          },
        });

      if (!match) {
        return res.status(404).json({
          error:
            "CREATOR_MATCH_NOT_FOUND",
        });
      }

      if (
        !match.externalCreatorId ||
        !match.externalCreator
      ) {
        return res.status(400).json({
          error:
            "MATCH_IS_NOT_EXTERNAL",
        });
      }

      /*
       * Tiene que seguir formando parte
       * de la shortlist.
       */
      if (
        match.status !== "SHORTLISTED"
      ) {
        return res.status(400).json({
          error:
            "CREATOR_NOT_SHORTLISTED",
        });
      }

      /*
       * Antes de invitar debe existir
       * contacto previo.
       */
      if (
        !match.externalCreator.isContacted
      ) {
        return res.status(400).json({
          error:
            "CREATOR_NOT_CONTACTED",
        });
      }

      /*
       * Operación idempotente.
       */
      if (
        match.externalCreator.isInvited
      ) {
        return res.json({
          success: true,
          alreadyInvited: true,
          externalCreator:
            match.externalCreator,
        });
      }

      const externalCreator =
        await prisma.externalCreator.update({
          where: {
            id:
              match.externalCreatorId,
          },

          data: {
            isInvited: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: user.id,

          action:
            "EXTERNAL_CREATOR_INVITED",

          entity:
            "ExternalCreator",

          entityId:
            externalCreator.id,

          metadata: {
            campaignId,
            matchId,

            username:
              externalCreator.username,
          },
        },
      });

      return res.json({
        success: true,
        alreadyInvited: false,
        externalCreator,
      });
    } catch (error) {
      console.error(
        "External creator invite error:",
        error
      );

      return res.status(500).json({
        error:
          "EXTERNAL_CREATOR_INVITE_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * GET /api/campaigns/:id/discover-creators
 * ==========================================
 *
 * Busca creadores externos compatibles con
 * la segmentación de una campaña.
 *
 * STAFF:
 *   Puede ejecutar Discovery sobre cualquier campaña.
 *
 * BRAND:
 *   Solo puede ejecutarlo sobre sus propias campañas.
 *
 * CREATOR:
 *   No tiene acceso.
 *
 * Discovery NO crea colaboraciones.
 * Los resultados se guardan como ExternalCreator.
 */

router.get(
  "/:id/discover-creators",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (
        user.role !== "STAFF" &&
        user.role !== "BRAND"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership =
  user.role === "BRAND"
    ? getBrandMembership(user)
    : null;

if (user.role === "BRAND") {
  if (!membership) {
    return res.status(403).json({
      error: "BRAND_MEMBERSHIP_REQUIRED",
    });
  }

  if (!membership.canDiscoverCreators) {
    return res.status(403).json({
      error: "BRAND_PERMISSION_DENIED",
    });
  }
}

      /*
       * STAFF puede consultar cualquier campaña.
       *
       * BRAND solamente puede consultar
       * campañas pertenecientes a su marca.
       */
      const campaign =
        await prisma.campaign.findFirst({
          where: {
            id: req.params.id,

            ...(user.role === "BRAND"
              ? {
                  brandId:
                    membership!.brandId,
                }
              : {}),
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      /*
       * Construimos los filtros para el
       * Creator Provider a partir de la campaña.
       */

      const platforms =
        campaign.platforms?.length
          ? campaign.platforms
          : campaign.platform
            ? campaign.platform
                .split(/[+,/|;&]+/)
                .map((value) =>
                  value.trim()
                )
                .filter(Boolean)
            : [];

      const categories =
        campaign.category
          ? [campaign.category]
          : [];

      const discovery =
        await discoverCreators({
          platforms,

          categories,

          countries:
            campaign.countries ?? [],

          provinces:
            campaign.provinces ?? [],

          gender:
            campaign.gender ??
            undefined,

          minAge:
            campaign.minAge ??
            undefined,

          maxAge:
            campaign.maxAge ??
            undefined,

          interests:
            campaign.interests ?? [],

          limit: 50,
        });

      /*
       * Auditamos la ejecución de Discovery.
       */

      await prisma.auditLog.create({
        data: {
          userId: user.id,

          action:
            "CREATOR_DISCOVERY_EXECUTED",

          entity:
            "Campaign",

          entityId:
            campaign.id,

          metadata: {
            provider:
              discovery.provider.name,

            providerType:
              discovery.provider.type,

            results:
              discovery.total,

            platforms,

            categories,
          },
        },
      });

      return res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
        },

        filters: {
          platforms,
          categories,

          countries:
            campaign.countries ?? [],

          provinces:
            campaign.provinces ?? [],

          gender:
            campaign.gender,

          minAge:
            campaign.minAge,

          maxAge:
            campaign.maxAge,

          interests:
            campaign.interests ?? [],
        },

        provider:
          discovery.provider,

        total:
          discovery.total,

        creators:
          discovery.creators,
      });
    } catch (error) {
      console.error(
        "Creator discovery error:",
        error
      );

      return res.status(500).json({
        error:
          "CREATOR_DISCOVERY_ERROR",
      });
    }
  }
);


 /*
  * ==========================================
  * GET /api/campaigns/:id/matches
  * ==========================================
  *
  * Devuelve los creadores recomendados
  * para una campaña.
  *
  * BRAND:
  *   Solo puede consultar sus propias campañas.
  *
  * STAFF:
  *   Puede consultar cualquier campaña.
  *
  * CREATOR:
  *   No tiene acceso.
  */

router.get(
  "/:id/matches",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      /*
       * ======================================
       * STAFF
       * ======================================
       *
       * El equipo interno de ST.MARY AGENCY  puede
       * consultar cualquier campaña.
       */

      if (user.role === "STAFF") {
        const campaign =
          await prisma.campaign.findUnique({
            where: {
              id: req.params.id,
            },
            select: {
              brandId: true,
            },
          });

        if (!campaign) {
          return res.status(404).json({
            error: "CAMPAIGN_NOT_FOUND",
          });
        }

        const matches =
          await getCampaignMatches(
            req.params.id,
            campaign.brandId
          );
          const proposals =
  await prisma.campaignProposal.findMany({
    where: {
      campaignId: String(req.params.id),
    },
    select: {
      id: true,
      creatorId: true,
      externalCreatorId: true,
      status: true,
      proposedAt: true,
      decidedAt: true,
    },
  });

        return res.json({
          matches,
          proposals,
        });
      }

      /*
       * ======================================
       * BRAND
       * ======================================
       *
       * La marca solamente puede consultar
       * sus propias campañas.
       */

      if (user.role === "BRAND") {
  const membership = getBrandMembership(user);

  if (!membership) {
    return res.status(403).json({
      error: "BRAND_MEMBERSHIP_REQUIRED",
    });
  }

  if (!membership.canViewCampaigns) {
    return res.status(403).json({
      error: "BRAND_PERMISSION_DENIED",
    });
  }

  const matches = await getCampaignMatches(
    req.params.id,
    membership.brandId
  );

  return res.json({
    matches,
  });
}

      /*
       * ======================================
       * RESTO DE ROLES
       * ======================================
       */

      return res.status(403).json({
        error: "FORBIDDEN",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "CAMPAIGN_NOT_FOUND"
      ) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      console.error(
        "Get campaign matches error:",
        error
      );

      return res.status(500).json({
        error:
          "GET_CAMPAIGN_MATCHES_ERROR",
      });
    }
  }
);

// ======================================================
// PROPUESTAS DEL CLIENTE
// ======================================================
router.get(
  "/proposals",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "BRAND") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership =
        user.brandMemberships?.[0];

      if (!membership) {
        return res.status(403).json({
          error: "NO_BRAND_MEMBERSHIP",
        });
      }

      if (!membership.canViewProposals) {
        return res.status(403).json({
          error: "PERMISSION_DENIED",
        });
      }

      const campaigns =
        await prisma.campaign.findMany({
          where: {
            brandId: membership.brandId,

            proposals: {
              some: {},
            },
          },

          select: {
            id: true,
            name: true,
            status: true,
            platform: true,
            platforms: true,
            campaignType: true,
            targetCreatorCount: true,

            proposals: {
              select: {
                id: true,
                status: true,
              },
            },

            creators: {
              select: {
                id: true,
                status: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      const result = campaigns.map(
        (campaign) => {
          const pending =
            campaign.proposals.filter(
              (proposal) =>
                proposal.status ===
                "PROPOSED"
            ).length;

          const approved =
            campaign.creators.filter(
              (creator) =>
                creator.status !== "PENDING"
            ).length;

          const rejected =
            campaign.proposals.filter(
              (proposal) =>
                proposal.status ===
                "REJECTED"
            ).length;

          const target =
            campaign.targetCreatorCount;

          const available =
            target == null
              ? null
              : Math.max(
                  target - approved,
                  0
                );

          return {
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            platform: campaign.platform,
            platforms:
              campaign.platforms,
            campaignType:
              campaign.campaignType,
            targetCreatorCount:
              target,

            stats: {
              pending,
              approved,
              rejected,
              available,
              total:
                campaign.proposals.length,
            },
          };
        }
      );

      return res.json({
        campaigns: result,
      });
    } catch (error) {
      console.error(
        "Load proposal campaigns error:",
        error
      );

      return res.status(500).json({
        error: "PROPOSALS_ERROR",
      });
    }
  }
);

router.get(
  "/proposals/campaigns/:campaignId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (
        !user ||
        user.role !== "BRAND"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership =
        user.brandMemberships?.[0];

      if (
        !membership ||
        !membership.canViewProposals
      ) {
        return res.status(403).json({
          error: "PERMISSION_DENIED",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const campaign =
        await prisma.campaign.findFirst({
          where: {
            id: campaignId,
            brandId: membership.brandId,
          },

          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            platform: true,
            platforms: true,
            campaignType: true,
            targetCreatorCount: true,

            creators: {
              select: {
                id: true,
                status: true,
              },
            },

            proposals: {
              include: {
                creator: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },

                    socialAccounts: true,
                  },
                },

                externalCreator: true,
              },

              orderBy: {
                proposedAt: "desc",
              },
            },
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      const pending =
        campaign.proposals.filter(
          (proposal) =>
            proposal.status ===
            "PROPOSED"
        );

      const approved =
        campaign.proposals.filter(
          (proposal) =>
            proposal.status ===
            "APPROVED"
        );

      const rejected =
        campaign.proposals.filter(
          (proposal) =>
            proposal.status ===
            "REJECTED"
        );

      const target =
        campaign.targetCreatorCount;

      const available =
        target == null
          ? null
          : Math.max(
              target -
                approved.length,
              0
            );

      return res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description:
            campaign.description,
          status: campaign.status,
          platform:
            campaign.platform,
          platforms:
            campaign.platforms,
          campaignType:
            campaign.campaignType,
          targetCreatorCount:
            target,
        },

        stats: {
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          available,
        },

        proposals: {
          pending,
          approved,
          rejected,
        },

        permissions: {
          canApproveCreators:
            membership.canApproveCreators,
        },
      });
    } catch (error) {
      console.error(
        "Load campaign proposals error:",
        error
      );

      return res.status(500).json({
        error:
          "CAMPAIGN_PROPOSALS_ERROR",
      });
    }
  }
);

router.get(
  "/:campaignId/applications",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(req.params.campaignId);

      const campaign = await prisma.campaign.findUnique({
        where: {
          id: campaignId,
        },
        select: {
          id: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      const applications =
        await prisma.campaignApplication.findMany({
          where: {
            campaignId,
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
                socialAccounts: true,
              },
            },
          },
          orderBy: {
            appliedAt: "desc",
          },
        });

      return res.json({
        applications,
      });
    } catch (error) {
      console.error(
        "Campaign applications error:",
        error
      );

      return res.status(500).json({
        error: "CAMPAIGN_APPLICATIONS_ERROR",
      });
    }
  }
);

router.patch(
  "/:campaignId/applications/:applicationId/shortlist",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(req.params.campaignId);
      const applicationId = String(req.params.applicationId);

      const application =
        await prisma.campaignApplication.findFirst({
          where: {
            id: applicationId,
            campaignId,
          },
        });

      if (!application) {
        return res.status(404).json({
          error: "APPLICATION_NOT_FOUND",
        });
      }

      if (application.status === "WITHDRAWN") {
        return res.status(409).json({
          error: "APPLICATION_WITHDRAWN",
          message:
            "El creador ha retirado esta candidatura.",
        });
      }

      const updatedApplication =
        await prisma.campaignApplication.update({
          where: {
            id: application.id,
          },
          data: {
            status: "SHORTLISTED",
          },
        });

      return res.json({
        application: updatedApplication,
      });
    } catch (error) {
      console.error(
        "Shortlist campaign application error:",
        error
      );

      return res.status(500).json({
        error: "SHORTLIST_APPLICATION_ERROR",
      });
    }
  }
);


/*
 * SHORTLIST -> siguiente paso real.
 *
 * - Si algún miembro de la marca puede aprobar creadores:
 *   crea/recupera CampaignProposal PROPOSED.
 * - Si la marca delega la selección:
 *   STAFF selecciona directamente y se crea CampaignCreator.
 *
 * En ambos casos se respeta targetCreatorCount.
 */
router.post(
  "/:campaignId/applications/:applicationId/advance",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(req.params.campaignId);
      const applicationId = String(req.params.applicationId);

      const result = await prisma.$transaction(async (tx) => {
        const application =
          await tx.campaignApplication.findFirst({
            where: {
              id: applicationId,
              campaignId,
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
                  socialAccounts: true,
                },
              },
              campaign: {
                select: {
                  id: true,
                  name: true,
                  targetCreatorCount: true,
                  brandId: true,
                  brand: {
                    select: {
                      members: {
                        select: {
                          canViewProposals: true,
                          canApproveCreators: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

        if (!application) {
          throw new Error("APPLICATION_NOT_FOUND");
        }

        if (application.status !== "SHORTLISTED") {
          throw new Error("APPLICATION_NOT_SHORTLISTED");
        }

        const creatorId = application.creatorId;

        const existingCampaignCreator =
          await tx.campaignCreator.findUnique({
            where: {
              campaignId_creatorId: {
                campaignId,
                creatorId,
              },
            },
          });

        if (!existingCampaignCreator) {
          const target =
            application.campaign.targetCreatorCount;

          if (target != null) {
            const selectedCount =
              await countCampaignCreators(
                tx,
                campaignId
              );

            if (selectedCount >= target) {
              throw new Error(
                "CAMPAIGN_CREATOR_LIMIT_REACHED"
              );
            }
          }
        }

        const clientCanApprove =
          application.campaign.brand.members.some(
            (member) =>
              member.canViewProposals &&
              member.canApproveCreators
          );

        if (clientCanApprove) {
          const existingProposal =
            await tx.campaignProposal.findFirst({
              where: {
                campaignId,
                creatorId,
              },
            });

          const proposal = existingProposal
            ? await tx.campaignProposal.update({
                where: {
                  id: existingProposal.id,
                },
                data: {
                  status: "PROPOSED",
                  proposedAt: new Date(),
                  decidedAt: null,
                },
              })
            : await tx.campaignProposal.create({
                data: {
                  campaignId,
                  creatorId,
                  status: "PROPOSED",
                },
              });

          return {
            mode: "CLIENT_APPROVAL" as const,
            proposal,
          };
        }

        const campaignCreator =
          await ensureSelectedCampaignCreator(
            tx,
            campaignId,
            creatorId
          );

        const selectedApplication =
          await tx.campaignApplication.update({
            where: {
              id: application.id,
            },
            data: {
              status: "SELECTED",
            },
          });

        return {
          mode: "STAFF_SELECTION" as const,
          campaignCreator,
          application: selectedApplication,
        };
      });

      return res.json(result);
    } catch (error) {
      console.error(
        "Advance campaign application error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "";

      if (message === "APPLICATION_NOT_FOUND") {
        return res.status(404).json({
          error: message,
        });
      }

      if (
        message ===
        "APPLICATION_NOT_SHORTLISTED"
      ) {
        return res.status(409).json({
          error: message,
          message:
            "La candidatura debe estar en shortlist.",
        });
      }

      if (
        message ===
        "CAMPAIGN_CREATOR_LIMIT_REACHED"
      ) {
        return res.status(409).json({
          error: message,
          message:
            "La campaña ya ha alcanzado el número máximo de creadores.",
        });
      }

      return res.status(500).json({
        error: "ADVANCE_APPLICATION_ERROR",
      });
    }
  }
);


router.patch(
  "/:campaignId/applications/:applicationId/reject",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(req.params.campaignId);
      const applicationId = String(req.params.applicationId);

      const application =
        await prisma.campaignApplication.findFirst({
          where: {
            id: applicationId,
            campaignId,
          },
        });

      if (!application) {
        return res.status(404).json({
          error: "APPLICATION_NOT_FOUND",
        });
      }

      if (application.status === "WITHDRAWN") {
        return res.status(409).json({
          error: "APPLICATION_WITHDRAWN",
          message:
            "El creador ya había retirado esta candidatura.",
        });
      }

      const updatedApplication =
        await prisma.campaignApplication.update({
          where: {
            id: application.id,
          },
          data: {
            status: "NOT_SELECTED",
          },
        });

      return res.json({
        application: updatedApplication,
      });
    } catch (error) {
      console.error(
        "Reject campaign application error:",
        error
      );

      return res.status(500).json({
        error: "REJECT_APPLICATION_ERROR",
      });
    }
  }
);


router.patch(
  "/:campaignId/proposals/:proposalId/staff-decision",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (
        !user ||
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const proposalId = String(
        req.params.proposalId
      );

      const { status } = req.body;

      if (
        status !== "APPROVED" &&
        status !== "REJECTED"
      ) {
        return res.status(400).json({
          error: "INVALID_STATUS",
        });
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const proposal =
            await tx.campaignProposal.findFirst({
              where: {
                id: proposalId,
                campaignId,
              },

              include: {
                campaign: {
                  select: {
                    targetCreatorCount:
                      true,
                  },
                },
              },
            });

          if (!proposal) {
            throw new Error(
              "PROPOSAL_NOT_FOUND"
            );
          }

          if (
            proposal.status !==
            "PROPOSED"
          ) {
            throw new Error(
              "PROPOSAL_ALREADY_DECIDED"
            );
          }

          if (status === "APPROVED") {
            const target =
              proposal.campaign
                .targetCreatorCount;

            if (target != null) {
              const existingCollaboration =
                proposal.creatorId
                  ? await tx.campaignCreator.findUnique({
                      where: {
                        campaignId_creatorId: {
                          campaignId,
                          creatorId: proposal.creatorId,
                        },
                      },
                    })
                  : null;

              const selectedCount =
                await countCampaignCreators(tx, campaignId);

              if (
                !existingCollaboration &&
                selectedCount >= target
              ) {
                throw new Error(
                  "CAMPAIGN_CREATOR_LIMIT_REACHED"
                );
              }
            }
          }

          const updated =
            await tx.campaignProposal.update({
              where: {
                id: proposal.id,
              },

              data: {
                status,
                decidedAt: new Date(),
              },
            });

          await tx.auditLog.create({
            data: {
              userId: user.id,

              action:
                status === "APPROVED"
                  ? "CAMPAIGN_PROPOSAL_APPROVED_BY_STAFF"
                  : "CAMPAIGN_PROPOSAL_REJECTED_BY_STAFF",

              entity:
                "CampaignProposal",

              entityId:
                updated.id,

              metadata: {
                campaignId,
                proposalId,
                decision: status,
                source: "STAFF",
              },
            },
          });

          return updated;
        }
      );

      return res.json({
        success: true,
        proposal: result,
      });
    } catch (error) {
      console.error(
        "Staff proposal decision error:",
        error
      );

      if (error instanceof Error) {
        if (
          error.message ===
          "PROPOSAL_NOT_FOUND"
        ) {
          return res.status(404).json({
            error: "PROPOSAL_NOT_FOUND",
          });
        }

        if (
          error.message ===
          "PROPOSAL_ALREADY_DECIDED"
        ) {
          return res.status(409).json({
            error:
              "PROPOSAL_ALREADY_DECIDED",
          });
        }

        if (
          error.message ===
          "CAMPAIGN_CREATOR_LIMIT_REACHED"
        ) {
          return res.status(409).json({
            error:
              "CAMPAIGN_CREATOR_LIMIT_REACHED",
          });
        }
      }

      return res.status(500).json({
        error:
          "STAFF_PROPOSAL_DECISION_ERROR",
      });
    }
  }
);

// ======================================================
// STAFF - DESHACER DECISIÓN DE UNA PROPUESTA
// ======================================================

router.patch(
  "/:campaignId/proposals/:proposalId/staff-undo-decision",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user || user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const proposalId = String(
        req.params.proposalId
      );

      const result = await prisma.$transaction(
        async (tx) => {
          const proposal =
            await tx.campaignProposal.findFirst({
              where: {
                id: proposalId,
                campaignId,
              },
            });

          if (!proposal) {
            throw new Error(
              "PROPOSAL_NOT_FOUND"
            );
          }

          /*
           * Solo tiene sentido deshacer una
           * propuesta que ya haya sido decidida.
           */
          if (
            proposal.status !== "APPROVED" &&
            proposal.status !== "REJECTED"
          ) {
            throw new Error(
              "PROPOSAL_NOT_DECIDED"
            );
          }

          const previousStatus =
            proposal.status;

          /*
           * Volvemos la propuesta a pendiente.
           *
           * Esto también libera una plaza si
           * estaba APPROVED.
           */
          const updated =
            await tx.campaignProposal.update({
              where: {
                id: proposal.id,
              },

             data: {
              status: "PROPOSED",
              decidedAt: null,
             },
            });

          await tx.auditLog.create({
            data: {
              userId: user.id,

              action:
                "CAMPAIGN_PROPOSAL_DECISION_UNDONE_BY_STAFF",

              entity:
                "CampaignProposal",

              entityId:
                updated.id,

              metadata: {
                campaignId,
                proposalId,

                previousStatus,

                newStatus:
                  "PROPOSED",

                source:
                  "STAFF",
              },
            },
          });

          return updated;
        }
      );

      return res.json({
        success: true,
        proposal: result,
      });
    } catch (error) {
      console.error(
        "Staff undo proposal decision error:",
        error
      );

      if (error instanceof Error) {
        if (
          error.message ===
          "PROPOSAL_NOT_FOUND"
        ) {
          return res.status(404).json({
            error:
              "PROPOSAL_NOT_FOUND",
          });
        }

        if (
          error.message ===
          "PROPOSAL_NOT_DECIDED"
        ) {
          return res.status(409).json({
            error:
              "PROPOSAL_NOT_DECIDED",
          });
        }
      }

      return res.status(500).json({
        error:
          "STAFF_UNDO_PROPOSAL_DECISION_ERROR",
      });
    }
  }
);


// ======================================================
// APROBAR / RECHAZAR PROPUESTA
// ======================================================

router.patch(
  "/proposals/:proposalId/status",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "BRAND") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership =
        user.brandMemberships?.[0];

      if (!membership) {
        return res.status(403).json({
          error: "NO_BRAND_MEMBERSHIP",
        });
      }

      if (!membership.canApproveCreators) {
        return res.status(403).json({
          error: "PERMISSION_DENIED",
        });
      }

      const proposalId = String(
        req.params.proposalId
      );

      const { status } = req.body;

      if (
        status !== "APPROVED" &&
        status !== "REJECTED"
      ) {
        return res.status(400).json({
          error: "INVALID_STATUS",
        });
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const proposal =
            await tx.campaignProposal.findFirst({
              where: {
                id: proposalId,

                campaign: {
                  brandId: membership.brandId,
                },
              },

              include: {
                campaign: {
                  select: {
                    id: true,
                    name: true,
                    brandId: true,
                    targetCreatorCount: true,
                  },
                },
              },
            });

          if (!proposal) {
            throw new Error(
              "PROPOSAL_NOT_FOUND"
            );
          }

          if (
            proposal.status !== "PROPOSED"
          ) {
            throw new Error(
              "PROPOSAL_ALREADY_DECIDED"
            );
          }

          /*
           * Solo necesitamos comprobar plazas
           * cuando se APRUEBA.
           */
          if (status === "APPROVED") {
            const target =
              proposal.campaign
                .targetCreatorCount;

            if (
              target !== null &&
              target !== undefined
            ) {
              const existingCollaboration =
                proposal.creatorId
                  ? await tx.campaignCreator.findUnique({
                      where: {
                        campaignId_creatorId: {
                          campaignId: proposal.campaignId,
                          creatorId: proposal.creatorId,
                        },
                      },
                    })
                  : null;

              const selectedCount =
                await countCampaignCreators(
                  tx,
                  proposal.campaignId
                );

              if (
                !existingCollaboration &&
                selectedCount >= target
              ) {
                throw new Error(
                  "CAMPAIGN_CREATOR_LIMIT_REACHED"
                );
              }
            }
          }

          const updated =
            await tx.campaignProposal.update({
              where: {
                id: proposal.id,
              },

              data: {
  status,
  decidedAt: new Date(),
},
            });

          await tx.auditLog.create({
            data: {
              userId: user.id,

              action:
                status === "APPROVED"
                  ? "CAMPAIGN_PROPOSAL_APPROVED_BY_CLIENT"
                  : "CAMPAIGN_PROPOSAL_REJECTED_BY_CLIENT",

              entity:
                "CampaignProposal",

              entityId:
                updated.id,

              metadata: {
                campaignId:
                  updated.campaignId,

                proposalId:
                  updated.id,

                decision:
                  status,

                source:
                  "CLIENT",
              },
            },
          });

          return updated;
        }
      );

      return res.json({
        success: true,
        proposal: result,
      });
    } catch (error) {
      console.error(
        "Proposal decision error:",
        error
      );

      if (error instanceof Error) {
        if (
          error.message ===
          "PROPOSAL_NOT_FOUND"
        ) {
          return res.status(404).json({
            error: "PROPOSAL_NOT_FOUND",
          });
        }

        if (
          error.message ===
          "PROPOSAL_ALREADY_DECIDED"
        ) {
          return res.status(409).json({
            error:
              "PROPOSAL_ALREADY_DECIDED",
          });
        }

        if (
          error.message ===
          "CAMPAIGN_CREATOR_LIMIT_REACHED"
        ) {
          return res.status(409).json({
            error:
              "CAMPAIGN_CREATOR_LIMIT_REACHED",
          });
        }
      }

      return res.status(500).json({
        error:
          "PROPOSAL_UPDATE_ERROR",
      });
    }
  }
);

// ======================================================
// CLIENTE - DESHACER DECISIÓN DE UNA PROPUESTA
// ======================================================

router.patch(
  "/proposals/:proposalId/undo-decision",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "BRAND") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership =
        user.brandMemberships?.[0];

      if (!membership) {
        return res.status(403).json({
          error:
            "NO_BRAND_MEMBERSHIP",
        });
      }

      if (!membership.canApproveCreators) {
        return res.status(403).json({
          error:
            "PERMISSION_DENIED",
        });
      }

      const proposalId = String(
        req.params.proposalId
      );

      const result = await prisma.$transaction(
        async (tx) => {
          /*
           * Además de buscar la propuesta,
           * comprobamos que pertenece a una
           * campaña de ESTA marca.
           */
          const proposal =
            await tx.campaignProposal.findFirst({
              where: {
                id: proposalId,

                campaign: {
                  brandId:
                    membership.brandId,
                },
              },
            });

          if (!proposal) {
            throw new Error(
              "PROPOSAL_NOT_FOUND"
            );
          }

          if (
            proposal.status !== "APPROVED" &&
            proposal.status !== "REJECTED"
          ) {
            throw new Error(
              "PROPOSAL_NOT_DECIDED"
            );
          }

          const previousStatus =
            proposal.status;

          const updated =
            await tx.campaignProposal.update({
              where: {
                id: proposal.id,
              },

              data: {
  status: "PROPOSED",
  decidedAt: null,
},

              include: {
                campaign: {
                  select: {
                    id: true,
                    name: true,
                    targetCreatorCount: true,
                  },
                },

                creator: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },

                    socialAccounts: true,
                  },
                },

                externalCreator: true,
              },
            });

          await tx.auditLog.create({
            data: {
              userId: user.id,

              action:
                "CAMPAIGN_PROPOSAL_DECISION_UNDONE_BY_CLIENT",

              entity:
                "CampaignProposal",

              entityId:
                updated.id,

              metadata: {
                campaignId:
                  updated.campaignId,

                proposalId:
                  updated.id,

                previousStatus,

                newStatus:
                  "PROPOSED",

                source:
                  "CLIENT",
              },
            },
          });

          return updated;
        }
      );

      return res.json({
        success: true,
        proposal: result,
      });
    } catch (error) {
      console.error(
        "Client undo proposal decision error:",
        error
      );

      if (error instanceof Error) {
        if (
          error.message ===
          "PROPOSAL_NOT_FOUND"
        ) {
          return res.status(404).json({
            error:
              "PROPOSAL_NOT_FOUND",
          });
        }

        if (
          error.message ===
          "PROPOSAL_NOT_DECIDED"
        ) {
          return res.status(409).json({
            error:
              "PROPOSAL_NOT_DECIDED",
          });
        }
      }

      return res.status(500).json({
        error:
          "CLIENT_UNDO_PROPOSAL_DECISION_ERROR",
      });
    }
  }
);




router.post(
  "/:campaignId/matches/:matchId/propose",
  async (req, res) => {
    try {
      const request = req as AuthenticatedRequest;
      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      // Solo ST.MARY AGENCY  puede enviar perfiles al cliente.
      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(
        req.params.campaignId
      );

      const matchId = String(
        req.params.matchId
      );

      // Buscamos el match y comprobamos que realmente
      // pertenece a esta campaña.
      const match =
        await prisma.creatorMatch.findFirst({
          where: {
            id: matchId,
            campaignId,
          },
          include: {
            creator: true,
            externalCreator: true,
            campaign: {
              select: {
                id: true,
                brandId: true,
              },
            },
          },
        });

      if (!match) {
        return res.status(404).json({
          error: "MATCH_NOT_FOUND",
        });
      }

      // Solo se pueden proponer perfiles que ST.MARY AGENCY 
      // haya metido previamente en la shortlist.
      if (match.status !== "SHORTLISTED") {
        return res.status(400).json({
          error: "CREATOR_NOT_SHORTLISTED",
        });
      }

      // El match tiene que representar algún creador.
      if (
        !match.creatorId &&
        !match.externalCreatorId
      ) {
        return res.status(400).json({
          error: "MATCH_WITHOUT_CREATOR",
        });
      }

      /*
       * Evitamos duplicados.
       *
       * Buscamos por separado porque una propuesta
       * puede pertenecer a Creator o ExternalCreator.
       */
      const existingProposal =
        await prisma.campaignProposal.findFirst({
          where: {
            campaignId,

            ...(match.creatorId
              ? {
                  creatorId: match.creatorId,
                }
              : {
                  externalCreatorId:
                    match.externalCreatorId!,
                }),
          },
        });

      if (existingProposal) {
        return res.json({
          success: true,
          alreadyProposed: true,
          proposal: existingProposal,
        });
      }

      const proposal =
        await prisma.campaignProposal.create({
          data: {
            campaignId,

            creatorId:
              match.creatorId ?? null,

            externalCreatorId:
              match.externalCreatorId ?? null,

            status: "PROPOSED",
          },
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

            externalCreator: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATOR_PROPOSED_TO_CLIENT",
          entity: "CampaignProposal",
          entityId: proposal.id,
          metadata: {
            campaignId,
            matchId,
            creatorId:
              match.creatorId ?? null,
            externalCreatorId:
              match.externalCreatorId ?? null,
          },
        },
      });

      return res.status(201).json({
        success: true,
        alreadyProposed: false,
        proposal,
      });
    } catch (error) {
      console.error(
        "Create campaign proposal error:",
        error
      );

      return res.status(500).json({
        error: "CREATE_CAMPAIGN_PROPOSAL_ERROR",
      });
    }
  }
);



/*
 * ==========================================
 * GET /api/campaigns/:id
 * ==========================================
 */

router.get(
  "/:id",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "BRAND") {
  return res.status(403).json({
    error: "FORBIDDEN",
  });
}

const membership = getBrandMembership(user);

if (!membership) {
  return res.status(403).json({
    error: "BRAND_MEMBERSHIP_REQUIRED",
  });
}

if (!membership.canViewCampaigns) {
  return res.status(403).json({
    error: "BRAND_PERMISSION_DENIED",
  });
}

const campaign = await getBrandCampaignById(
  membership.brandId,
  req.params.id
);
      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      return res.json({
        campaign,
      });
    } catch (error) {
      console.error(
        "Get campaign error:",
        error
      );

      return res.status(500).json({
        error: "GET_CAMPAIGN_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * POST /api/campaigns/:campaignId/select-creator/:creatorId
 * ==========================================
 *
 * STAFF selecciona un creador recomendado
 * por el Matching Engine.
 *
 * Opcionalmente establece la tarifa del creador.
 *
 */

router.post(
  "/:campaignId/select-creator/:creatorId",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      /*
       * Solo STAFF puede seleccionar
       * creadores desde el Matching Engine.
       */

      if (user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      /*
       * Comprobamos que la campaña existe.
       */

      const campaign =
        await prisma.campaign.findUnique({
          where: {
            id: req.params.campaignId,
          },
          select: {
            id: true,
            name: true,
            targetCreatorCount: true,
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      /*
       * Comprobamos que el creador existe.
       */

      const creator =
        await prisma.creator.findUnique({
          where: {
            id: req.params.creatorId,
          },
          select: {
            id: true,
            username: true,
          },
        });

      if (!creator) {
        return res.status(404).json({
          error: "CREATOR_NOT_FOUND",
        });
      }

      /*
       * Validación de la tarifa.
       */

      const { fee } = req.body ?? {};

      let creatorFee:
        | string
        | null = null;

      if (
        fee !== undefined &&
        fee !== null &&
        fee !== ""
      ) {
        const feeString =
          String(fee).trim();

        if (
          !/^\d+(\.\d{1,2})?$/.test(
            feeString
          )
        ) {
          return res.status(400).json({
            error: "INVALID_FEE",
          });
        }

        creatorFee = feeString;
      }

      const existing =
        await prisma.campaignCreator.findUnique({
          where: {
            campaignId_creatorId: {
              campaignId: campaign.id,
              creatorId: creator.id,
            },
          },
        });

      if (
        !existing &&
        campaign.targetCreatorCount != null
      ) {
        const selectedCount =
          await countCampaignCreators(
            prisma,
            campaign.id
          );

        if (
          selectedCount >=
          campaign.targetCreatorCount
        ) {
          return res.status(409).json({
            error:
              "CAMPAIGN_CREATOR_LIMIT_REACHED",
          });
        }
      }

      const campaignCreator =
        await ensureSelectedCampaignCreator(
          prisma,
          campaign.id,
          creator.id,
          creatorFee
        );

      await prisma.creatorMatch.updateMany({
        where: {
          campaignId: campaign.id,
          creatorId: creator.id,
        },
        data: {
          status: "SELECTED",
        },
      });

      await prisma.campaignApplication.updateMany({
        where: {
          campaignId: campaign.id,
          creatorId: creator.id,
          status: {
            in: ["APPLIED", "SHORTLISTED"],
          },
        },
        data: {
          status: "SELECTED",
        },
      });

      /*
       * Audit log
       */

      await prisma.auditLog.create({
        data: {
          userId: user.id,

          action:
            "CREATOR_SELECTED_FOR_CAMPAIGN",

          entity:
            "CampaignCreator",

          entityId:
            campaignCreator.id,

          metadata: {
            campaignId:
              campaign.id,

            creatorId:
              creator.id,

            creatorUsername:
              creator.username,

            fee:
              creatorFee,
          },
        },
      });

      return res.json({
        campaignCreator,
      });
    } catch (error) {
      console.error(
        "Select creator error:",
        error
      );

      return res.status(500).json({
        error:
          "SELECT_CREATOR_ERROR",
      });
    }
  }
);

router.post(
  "/",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHORIZED",
        });
      }

      /**
       * Buscamos la marca a la que
       * pertenece el usuario.
       */
      const membership =
        await prisma.brandMember.findFirst({
          where: {
            userId: user.id,
          },

          include: {
            brand: true,
          },
        });

      if (!membership) {
        return res.status(403).json({
          error:
            "BRAND_MEMBERSHIP_REQUIRED",
          message:
            "No perteneces a ninguna marca.",
        });
      }

      /**
       * Solo las marcas autogestionadas
       * pueden crear campañas.
       */
      if (
        membership.brand.accessMode !==
        "SELF_MANAGED"
      ) {
        return res.status(403).json({
          error:
            "CAMPAIGN_CREATION_NOT_ALLOWED",
          message:
            "Esta cuenta está gestionada por ST.MARY AGENCY .",
        });
      }

      /**
       * Comprobamos el permiso concreto
       * del miembro.
       */
      if (
        !membership.canCreateCampaigns
      ) {
        return res.status(403).json({
          error:
            "CAMPAIGN_CREATION_NOT_ALLOWED",
          message:
            "No tienes permiso para crear campañas.",
        });
      }

    const {
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

  

  // Ventana de publicación
  publicationStart,
  publicationDeadline,

  // Contenidos / entregables
  contentItems,

  requirements,
  hashtags,
  mentions,
  links,

  forbiddenContent,
  approvalRequired,
} = req.body;
      /**
       * Validaciones mínimas de request.
       *
       * El service realizará después
       * las validaciones completas.
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
            "Introduce un nombre para la campaña.",
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

      /**
       * Creamos la campaña mediante
       * el service común.
       */
     const campaign =
  await createBrandCampaign({
    brandId:
      membership.brandId,

    userId: user.id,

    source: "BRAND",

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

    // Ventana de publicación
    publicationStart,
    publicationDeadline,

    // Contenidos / entregables
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
        "Create brand campaign error:",
        error
      );

      /**
       * Errores controlados que puede
       * lanzar campaign.service.ts
       */
      if (
        error instanceof Error
      ) {
        const controlledErrors: Record<
          string,
          string
        > = {
          CAMPAIGN_NAME_REQUIRED:
            "Introduce un nombre para la campaña.",

          INVALID_BUDGET:
            "Introduce un presupuesto válido.",

          INVALID_CAMPAIGN_TYPE:
            "El tipo de campaña no es válido.",

          INVALID_MIN_AGE:
            "La edad mínima no es válida.",

          INVALID_MAX_AGE:
            "La edad máxima no es válida.",

          INVALID_AGE_RANGE:
            "La edad mínima no puede ser superior a la edad máxima.",

          INVALID_CREATOR_COUNT:
            "El número de creadores debe ser válido.",

          INVALID_START_DATE:
            "La fecha de inicio no es válida.",

          INVALID_END_DATE:
            "La fecha de finalización no es válida.",

          INVALID_DATE_RANGE:
            "La fecha de inicio no puede ser posterior a la fecha de finalización.",
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
          "CAMPAIGN_CREATE_ERROR",
        message:
          "No se ha podido crear la campaña.",
      });
    }
  }
);
router.patch(
  "/:id",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "BRAND") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const membership =
        getBrandMembership(user);

      if (!membership) {
        return res.status(403).json({
          error:
            "BRAND_MEMBERSHIP_REQUIRED",
        });
      }

      if (
        membership.brand.accessMode !==
          "SELF_MANAGED" ||
        !membership.canEditCampaigns
      ) {
        return res.status(403).json({
          error:
            "BRAND_PERMISSION_DENIED",
        });
      }

      const campaign =
        await prisma.campaign.findFirst({
          where: {
            id: req.params.id,
            brandId:
              membership.brandId,
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error:
            "CAMPAIGN_NOT_FOUND",
        });
      }

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

        status,
      } = req.body ?? {};

      /*
       * ============================
       * VALIDACIONES
       * ============================
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

      const normalizedBudget = String(
        budget ?? ""
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
        return res.status(400).json({
          error: "INVALID_BUDGET",
          message:
            "Introduce un presupuesto válido.",
        });
      }

      function parseOptionalInteger(
        value: unknown
      ) {
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return null;
        }

        return Number(value);
      }

      const parsedMinAge =
        parseOptionalInteger(minAge);

      const parsedMaxAge =
        parseOptionalInteger(maxAge);

      const parsedCreatorCount =
        parseOptionalInteger(
          targetCreatorCount
        );

      if (
        parsedMinAge !== null &&
        (!Number.isInteger(
          parsedMinAge
        ) ||
          parsedMinAge < 13 ||
          parsedMinAge > 100)
      ) {
        return res.status(400).json({
          error: "INVALID_MIN_AGE",
          message:
            "La edad mínima no es válida.",
        });
      }

      if (
        parsedMaxAge !== null &&
        (!Number.isInteger(
          parsedMaxAge
        ) ||
          parsedMaxAge < 13 ||
          parsedMaxAge > 100)
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

      if (
        parsedCreatorCount !== null &&
        (!Number.isInteger(
          parsedCreatorCount
        ) ||
          parsedCreatorCount < 1)
      ) {
        return res.status(400).json({
          error:
            "INVALID_CREATOR_COUNT",
          message:
            "El número de creadores debe ser mayor que cero.",
        });
      }

      function parseDate(
        value: unknown
      ) {
        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {
          return null;
        }

        return new Date(
          String(value)
        );
      }

      const parsedStartDate =
        parseDate(startDate);

      const parsedEndDate =
        parseDate(endDate);

      const parsedPublicationStart =
        parseDate(publicationStart);

      const parsedPublicationDeadline =
        parseDate(
          publicationDeadline
        );

      const dates = [
        parsedStartDate,
        parsedEndDate,
        parsedPublicationStart,
        parsedPublicationDeadline,
      ];

      if (
        dates.some(
          (date) =>
            date &&
            Number.isNaN(
              date.getTime()
            )
        )
      ) {
        return res.status(400).json({
          error: "INVALID_DATE",
          message:
            "Alguna de las fechas introducidas no es válida.",
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
       * ============================
       * ARRAYS
       * ============================
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
          : [];

      /*
       * ============================
       * UPDATE
       * ============================
       */

      const updated =
        await prisma.$transaction(
          async (tx) => {
            const updatedCampaign =
              await tx.campaign.update({
                where: {
                  id: campaign.id,
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

                  category:
                    category?.trim() ||
                    null,

                  campaignType:
                    campaignType ||
                    campaign.campaignType,

                  collaborationType:
                    collaborationType ||
                    campaign.collaborationType,

                  platforms:
                    normalizedPlatforms,

                  formats:
                    normalizedFormats,

                  // Compatibilidad
                  // temporal.
                  platform:
                    normalizedPlatforms.length >
                    0
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

                  ...(status
                    ? {
                        status: String(
                          status
                        )
                          .trim()
                          .toUpperCase(),
                      }
                    : {}),
                },
              });

            /*
             * Las instrucciones son la
             * representación del formulario.
             *
             * En edición las reconstruimos
             * con los datos actuales.
             */

            await tx.campaignInstruction.deleteMany(
              {
                where: {
                  campaignId:
                    campaign.id,
                },
              }
            );

            const hasGeneralBrief =
              Boolean(
                requirements?.trim()
              ) ||
              normalizedHashtags.length >
                0 ||
              normalizedMentions.length >
                0 ||
              normalizedLinks.length > 0 ||
              Boolean(
                forbiddenContent?.trim()
              ) ||
              Boolean(
                approvalRequired
              );

            if (hasGeneralBrief) {
              await tx.campaignInstruction.create(
                {
                  data: {
                    campaignId:
                      campaign.id,

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
                }
              );
            }

            /*
             * Entregables.
             */

            for (const item of
              normalizedContentItems) {
              const quantity =
                Number(
                  item?.quantity
                );

              if (
                !Number.isInteger(
                  quantity
                ) ||
                quantity < 1
              ) {
                continue;
              }

              const platform =
                String(
                  item?.platform || ""
                ).trim();

              const contentType =
                String(
                  item?.contentType ||
                    item?.format ||
                    ""
                ).trim();

              if (
                !platform &&
                !contentType
              ) {
                continue;
              }

              await tx.campaignInstruction.create(
                {
                  data: {
                    campaignId:
                      campaign.id,

                    title:
                      [
                        contentType,
                        platform,
                      ]
                        .filter(Boolean)
                        .join(" · ") ||
                      "Contenido",

                    platform:
                      platform || null,

                    contentType:
                      contentType ||
                      null,

                    quantity,

                    publicationDate:
                      null,

                    deadline:
                      parsedPublicationDeadline,

                    hashtags: [],
                    mentions: [],
                    tags: [],
                    links: [],

                    forbiddenContent:
                      null,

                    approvalRequired:
                      Boolean(
                        approvalRequired
                      ),
                  },
                }
              );
            }

            await tx.auditLog.create({
              data: {
                userId: user.id,

                action:
                  "CAMPAIGN_UPDATED",

                entity:
                  "Campaign",

                entityId:
                  updatedCampaign.id,

                metadata: {
                  name:
                    updatedCampaign.name,
                },
              },
            });

            return updatedCampaign;
          }
        );

      return res.json({
        campaign: updated,
      });
    } catch (error) {
      console.error(
        "Update campaign error:",
        error
      );

      return res.status(500).json({
        error:
          "UPDATE_CAMPAIGN_ERROR",
        message:
          "No se ha podido actualizar la campaña.",
      });
    }
  }
);

/*
 * ==========================================
 * PATCH /api/campaigns/:campaignId/creators/:campaignCreatorId
 * ==========================================
 *
 * Actualiza el estado de una colaboración
 * y, opcionalmente, la tarifa del creador.
 */

router.patch(
  "/:campaignId/creators/:campaignCreatorId",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      /*
       * BRAND y STAFF pueden gestionar
       * colaboraciones.
       */
      if (
        user.role !== "BRAND" &&
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      /*
       * BRAND debe tener una marca asociada.
       *
       * STAFF no necesita brand.
       */
     const membership =
  user.role === "BRAND"
    ? getBrandMembership(user)
    : null;

if (user.role === "BRAND") {
  if (!membership) {
    return res.status(403).json({
      error: "BRAND_MEMBERSHIP_REQUIRED",
    });
  }

  if (!membership.canApproveCreators) {
    return res.status(403).json({
      error: "BRAND_PERMISSION_DENIED",
    });
  }
}

      const {
        status,
        fee,
      } = req.body ?? {};

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
        typeof status === "string"
          ? status
              .trim()
              .toUpperCase()
          : "";

      if (
        !allowedStatuses.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          error: "INVALID_STATUS",
          allowedStatuses,
        });
      }

      /*
       * Buscamos la colaboración.
       *
       * La colaboración debe:
       * - pertenecer a la campaña indicada
       *
       * Además:
       * - BRAND -> solo puede modificar
       *           campañas de su propia marca.
       * - STAFF -> puede gestionar cualquier campaña.
       */

      const collaboration =
        await prisma.campaignCreator.findFirst({
          where: {
            id:
              req.params
                .campaignCreatorId,

            campaignId:
              req.params.campaignId,

            ...(user.role === "BRAND"
              ? {
                  campaign: {
                    brandId: membership!.brandId,
                  },
                }
              : {}),
          },
        });

      if (!collaboration) {
        return res.status(404).json({
          error:
            "COLLABORATION_NOT_FOUND",
        });
      }

      /*
       * Validación opcional de fee.
       */
      let creatorFee:
        | string
        | undefined =
        undefined;

      if (
        fee !== undefined &&
        fee !== null &&
        fee !== ""
      ) {
        const feeString =
          String(fee).trim();

        if (
          !/^\d+(\.\d{1,2})?$/.test(
            feeString
          )
        ) {
          return res.status(400).json({
            error: "INVALID_FEE",
          });
        }

        creatorFee = feeString;
      }

      const now = new Date();

      /*
       * Guardamos la fecha correspondiente
       * al estado.
       */
      const timestampFields = {
        contactedAt:
          normalizedStatus ===
          "CONTACTED"
            ? now
            : undefined,

        acceptedAt:
          normalizedStatus ===
          "ACCEPTED"
            ? now
            : undefined,

        selectedAt:
          normalizedStatus ===
          "SELECTED"
            ? now
            : undefined,

        productSentAt:
          normalizedStatus ===
          "PRODUCT_SENT"
            ? now
            : undefined,

        contentReceivedAt:
          normalizedStatus ===
          "CONTENT_RECEIVED"
            ? now
            : undefined,

        publishedAt:
          normalizedStatus ===
          "PUBLISHED"
            ? now
            : undefined,

        paidAt:
          normalizedStatus ===
          "PAID"
            ? now
            : undefined,
      };

      /*
       * Actualizamos la colaboración.
       */
      const updated =
        await prisma.campaignCreator.update({
          where: {
            id: collaboration.id,
          },

          data: {
            status:
              normalizedStatus,

            ...(creatorFee !==
            undefined
              ? {
                  fee: creatorFee,
                }
              : {}),

            ...timestampFields,
          },

          include: {
            creator: true,
          },
        });

      /*
       * Audit log
       */
      await prisma.auditLog.create({
        data: {
          userId: user.id,

          action:
            "COLLABORATION_UPDATED",

          entity:
            "CampaignCreator",

          entityId:
            updated.id,

          metadata: {
            campaignId:
              updated.campaignId,

            creatorId:
              updated.creatorId,

            status:
              normalizedStatus,
          },
        },
      });

      return res.json({
        campaignCreator:
          updated,
      });
    } catch (error) {
      console.error(
        "Update collaboration error:",
        error
      );

      return res.status(500).json({
        error:
          "UPDATE_COLLABORATION_ERROR",
      });
    }
  }
);
export default router;