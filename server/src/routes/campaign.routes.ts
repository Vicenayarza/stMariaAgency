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
import {
  createNotification,
  notifyStaff,
} from "../services/notification.service.js";
import { sendCampaignNotificationEmail } from "../services/mail.service.js";

import {
  validateCollaborationStatusChange,
  collaborationWorkflowInclude,
} from "../services/collaboration-workflow.service.js";




const router = Router();

async function isCampaignDeleted(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });

  return !campaign || campaign.status === "DELETED";
}



type CampaignCreatorTx = Pick<
  typeof prisma,
  "campaignCreator" | "campaignProposal"
>;

type SelectionSource =
  | "PROPOSAL"
  | "DIRECT_STAFF"
  | "APPLICATION";

async function ensureSelectedCampaignCreator(
  tx: CampaignCreatorTx,
  campaignId: string,
  creatorId: string,
  fee?: string | null,
  selectionSource: SelectionSource = "DIRECT_STAFF"
) {
  const existing = await tx.campaignCreator.findUnique({
    where: {
      campaignId_creatorId: {
        campaignId,
        creatorId,
      },
    },
  });

  const include = {
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
  } as const;

  if (existing) {
    // Nunca sobrescribir una selección existente.
    // Tampoco reiniciar colaboraciones avanzadas.
    if (existing.status !== "PENDING") {
      throw new Error("CREATOR_ALREADY_SELECTED");
    }

    const hasProgress =
      existing.contactedAt !== null ||
      existing.acceptedAt !== null ||
      existing.productSentAt !== null ||
      existing.contentReceivedAt !== null ||
      existing.publishedAt !== null ||
      existing.paidAt !== null;

    if (hasProgress) {
      throw new Error("COLLABORATION_ALREADY_STARTED");
    }

    return tx.campaignCreator.update({
      where: {
        id: existing.id,
      },
      data: {
        status: "SELECTED",
        selectedAt: new Date(),
        selectionSource,
        ...(fee !== undefined ? { fee } : {}),
      },
      include,
    });
  }

  return tx.campaignCreator.create({
    data: {
      campaignId,
      creatorId,
      status: "SELECTED",
      selectedAt: new Date(),
      selectionSource,
      fee: fee ?? null,
    },
    include,
  });
}




async function countCampaignCreators(
  tx: CampaignCreatorTx,
  campaignId: string
) {
  const [registered, approvedExternal] =
    await Promise.all([
      tx.campaignCreator.findMany({
        where: {
          campaignId,
          status: {
            not: "PENDING",
          },
        },
        select: {
          creatorId: true,
        },
      }),

      tx.campaignProposal.findMany({
        where: {
          campaignId,
          status: "APPROVED",
          externalCreatorId: {
            not: null,
          },
        },
        select: {
          externalCreatorId: true,
          externalCreator: {
            select: {
              linkedCreatorId: true,
            },
          },
        },
      }),
    ]);

  const selectedRegistered = new Set(
    registered.map((creator) => creator.creatorId)
  );

  const selectedExternal = new Set<string>();

  for (const proposal of approvedExternal) {
    if (!proposal.externalCreatorId) {
      continue;
    }

    const linkedCreatorId =
      proposal.externalCreator?.linkedCreatorId;

    if (
      linkedCreatorId &&
      selectedRegistered.has(linkedCreatorId)
    ) {
      continue;
    }

    selectedExternal.add(
      linkedCreatorId
        ? `creator:${linkedCreatorId}`
        : `external:${proposal.externalCreatorId}`
    );
  }

  return selectedRegistered.size + selectedExternal.size;
}


type ProposalForStats = {
  status: string;
  externalCreatorId: string | null;
  externalCreator: {
    linkedCreatorId: string | null;
  } | null;
};

type CampaignCreatorForStats = {
  creatorId: string;
  status: string;
};

function calculateCampaignProposalStats(
  proposals: ProposalForStats[],
  creators: CampaignCreatorForStats[],
  targetCreatorCount: number | null
) {
  const pending = proposals.filter(
    (proposal) => proposal.status === "PROPOSED"
  ).length;

  const approved = proposals.filter(
    (proposal) => proposal.status === "APPROVED"
  ).length;

  const rejected = proposals.filter(
    (proposal) => proposal.status === "REJECTED"
  ).length;

  // Creadores registrados que ocupan una plaza.
  const selectedRegistered = new Set(
    creators
      .filter((creator) => creator.status !== "PENDING")
      .map((creator) => creator.creatorId)
  );

  // Externos aprobados, evitando contar dos veces
  // a los que ya tienen una colaboración registrada.
  const selectedExternal = new Set<string>();

  for (const proposal of proposals) {
    if (
      proposal.status !== "APPROVED" ||
      !proposal.externalCreatorId
    ) {
      continue;
    }

    const linkedCreatorId =
      proposal.externalCreator?.linkedCreatorId;

    if (
      linkedCreatorId &&
      selectedRegistered.has(linkedCreatorId)
    ) {
      continue;
    }

    selectedExternal.add(
      linkedCreatorId
        ? `creator:${linkedCreatorId}`
        : `external:${proposal.externalCreatorId}`
    );
  }

  const selected =
    selectedRegistered.size + selectedExternal.size;

  const available =
    targetCreatorCount == null
      ? null
      : Math.max(targetCreatorCount - selected, 0);

  return {
    pending,
    approved,
    rejected,
    selected,
    available,
    total: proposals.length,
  };
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


function canViewBrandProposals(
  user: NonNullable<AuthenticatedRequest["user"]>
): boolean {
  const membership = getBrandMembership(user);

  return Boolean(
    membership?.brandId &&
    membership.canViewProposals
  );
}

function canDecideBrandProposals(
  user: NonNullable<AuthenticatedRequest["user"]>
): boolean {
  const membership = getBrandMembership(user);

  return Boolean(
    membership?.brandId &&
    membership.canViewProposals &&
    membership.canApproveCreators
  );
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

     if (!canViewBrandProposals(user)) {
        return res.status(403).json({
          error: "PERMISSION_DENIED",
        });
      }

      const campaigns =
        await prisma.campaign.findMany({
          where: {
  brandId: membership.brandId,
  status: {
    not: "DELETED",
  },
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
    externalCreatorId: true,
    externalCreator: {
      select: {
        linkedCreatorId: true,
      },
    },
  },
},

creators: {
  select: {
    creatorId: true,
    status: true,
  },
},
          },

          orderBy: {
            createdAt: "desc",
          },
        });

     
const result = campaigns.map((campaign) => {
  const stats = calculateCampaignProposalStats(
    campaign.proposals,
    campaign.creators,
    campaign.targetCreatorCount
  );

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    platform: campaign.platform,
    platforms: campaign.platforms,
    campaignType: campaign.campaignType,
    targetCreatorCount: campaign.targetCreatorCount,
    stats,
  };
});


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

      if (!canViewBrandProposals(user)) {
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
  status: {
    not: "DELETED",
  },
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
    creatorId: true,
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

      
const pending = campaign.proposals.filter(
  (proposal) => proposal.status === "PROPOSED"
);

const approved = campaign.proposals.filter(
  (proposal) => proposal.status === "APPROVED"
);

const rejected = campaign.proposals.filter(
  (proposal) => proposal.status === "REJECTED"
);

const stats = calculateCampaignProposalStats(
  campaign.proposals,
  campaign.creators,
  campaign.targetCreatorCount
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

       stats,

        proposals: {
          pending,
          approved,
          rejected,
        },

       permissions: {
  canViewProposals:
    canViewBrandProposals(user),

  canApproveCreators:
    canDecideBrandProposals(user),
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
        // Comprobamos que la candidatura existe.
        const exists = await tx.campaignApplication.findFirst({
          where: {
            id: applicationId,
            campaignId,
          },
          select: {
            id: true,
          },
        });

        if (!exists) {
          throw new Error("APPLICATION_NOT_FOUND");
        }

        // Todas las selecciones de esta campaña deben
        // utilizar este mismo bloqueo antes de contar plazas.
        await tx.$queryRaw`
          SELECT id
          FROM "Campaign"
          WHERE id = ${campaignId}
          FOR UPDATE
        `;

        // Releemos la candidatura una vez adquirido el bloqueo.
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
                  status: true,
                  targetCreatorCount: true,
                  brandId: true,
                  brand: {
                    select: {
                      accessMode: true,
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

        if (application.campaign.status === "DELETED") {
          throw new Error("CAMPAIGN_NOT_AVAILABLE");
        }

        if (application.status !== "SHORTLISTED") {
          throw new Error("APPLICATION_NOT_SHORTLISTED");
        }

        const creatorId = application.creatorId;
        const brand = application.campaign.brand;

        // Si existe algún miembro de la marca con permiso
        // para ver y aprobar propuestas, decide el cliente.
        const clientCanApprove = brand.members.some(
          (member) =>
            member.canViewProposals &&
            member.canApproveCreators
        );

        if (clientCanApprove) {
          const existingProposal =
            await tx.campaignProposal.findUnique({
              where: {
                campaignId_creatorId: {
                  campaignId,
                  creatorId,
                },
              },
            });

          // Nunca reabrimos decisiones desde advance.
          if (existingProposal) {
            if (existingProposal.status !== "PROPOSED") {
              throw new Error("PROPOSAL_ALREADY_DECIDED");
            }

            return {
              mode: "CLIENT_APPROVAL" as const,
              proposal: existingProposal,
            };
          }

          const proposal =
            await tx.campaignProposal.create({
              data: {
                campaignId,
                creatorId,
                status: "PROPOSED",
              },
            });

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "CAMPAIGN_PROPOSAL_CREATED_BY_STAFF",
              entity: "CampaignProposal",
              entityId: proposal.id,
              metadata: {
                campaignId,
                applicationId,
                creatorId,
                source: "APPLICATION",
              },
            },
          });

          return {
            mode: "CLIENT_APPROVAL" as const,
            proposal,
          };
        }

        // Selección directa por STAFF.
        const existingCollaboration =
          await tx.campaignCreator.findUnique({
            where: {
              campaignId_creatorId: {
                campaignId,
                creatorId,
              },
            },
          });

        // Si ya estaba seleccionado, no volvemos a
        // seleccionar ni modificamos su colaboración.
        if (
          existingCollaboration &&
          existingCollaboration.status !== "PENDING"
        ) {
          throw new Error("CREATOR_ALREADY_SELECTED");
        }

        const target =
          application.campaign.targetCreatorCount;

        if (target != null) {
          const selectedCount =
            await countCampaignCreators(tx, campaignId);

          if (selectedCount >= target) {
            throw new Error(
              "CAMPAIGN_CREATOR_LIMIT_REACHED"
            );
          }
        }

        // Evitamos seleccionar directamente a alguien
        // cuya propuesta ya fue rechazada o aprobada.
        const existingProposal =
          await tx.campaignProposal.findUnique({
            where: {
              campaignId_creatorId: {
                campaignId,
                creatorId,
              },
            },
          });

        if (
          existingProposal &&
          existingProposal.status !== "WITHDRAWN"
        ) {
          throw new Error("PROPOSAL_REQUIRES_RESOLUTION");
        }

        const campaignCreator =
          await ensureSelectedCampaignCreator(
            tx,
            campaignId,
            creatorId,
              undefined,
  "APPLICATION"
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

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CAMPAIGN_CREATOR_SELECTED_BY_STAFF",
            entity: "CampaignCreator",
            entityId: campaignCreator.id,
            metadata: {
              campaignId,
              applicationId,
              creatorId,
              source: "APPLICATION",
            },
          },
        });

        return {
          mode: "STAFF_SELECTION" as const,
          campaignCreator,
          application: selectedApplication,
          notificationData: {
            userId: application.creator.user.id,
            campaignName: application.campaign.name,
          },
        };
      });

      // La notificación no debe convertir una
      // selección guardada correctamente en un error 500.
    if (result.mode === "STAFF_SELECTION") {
        const notificationTitle = "¡Has sido seleccionado!";

        const notificationMessage =
          `Has sido seleccionado para participar en la campaña ` +
          result.notificationData.campaignName +
          ".";

        const notificationLink =
          `/creator/campaigns/${result.campaignCreator.id}`;

        // 1. Notificación interna
        try {
          await createNotification({
            userId: result.notificationData.userId,
            type: "APPLICATION",
            title: notificationTitle,
            message: notificationMessage,
            link: notificationLink,
          });
        } catch (notificationError) {
          console.error(
            "Advance application notification error:",
            notificationError
          );
        }

        // 2. Notificación por correo electrónico
        try {
          await sendCampaignNotificationEmail({
            userId: result.notificationData.userId,
            title: notificationTitle,
            message: notificationMessage,
            link: notificationLink,
          });
        } catch (emailError) {
          console.error(
            "Advance application email error:",
            emailError
          );
        }
      }

      return res.json(result);
    } catch (error) {
      console.error(
        "Advance campaign application error:",
        error
      );

      const message =
        error instanceof Error ? error.message : "";

      if (message === "APPLICATION_NOT_FOUND") {
        return res.status(404).json({
          error: message,
        });
      }

      if (
        [
          "APPLICATION_NOT_SHORTLISTED",
          "CAMPAIGN_CREATOR_LIMIT_REACHED",
          "PROPOSAL_ALREADY_DECIDED",
          "CREATOR_ALREADY_SELECTED",
          "PROPOSAL_REQUIRES_RESOLUTION",
          "CAMPAIGN_NOT_AVAILABLE",
        ].includes(message)
      ) {
        return res.status(409).json({
          error: message,
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

    include: {
      creator: {
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },

      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
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

        const updateResult =
        await prisma.campaignApplication.updateMany({
          where: {
            id: application.id,
            campaignId,
            status: {
              notIn: ["NOT_SELECTED", "WITHDRAWN"],
            },
          },
          data: {
            status: "NOT_SELECTED",
          },
        });

      if (updateResult.count !== 1) {
        return res.status(409).json({
          error: "APPLICATION_ALREADY_RESOLVED",
          message:
            "Esta candidatura ya estaba rechazada o retirada.",
        });
      }

      const updatedApplication =
        await prisma.campaignApplication.findUniqueOrThrow({
          where: {
            id: application.id,
          },
        });

      const notificationTitle =
        "Actualización de tu candidatura";

      const notificationMessage =
        `Tu candidatura para la campaña ` +
        `${application.campaign.name} ha sido actualizada. ` +
        `En esta ocasión no has sido seleccionado.`;

      const notificationLink = "/creator/applications";

      // 1. Notificación interna
      try {
        await createNotification({
          userId: application.creator.user.id,
          type: "APPLICATION",
          title: notificationTitle,
          message: notificationMessage,
          link: notificationLink,
        });
      } catch (notificationError) {
        console.error(
          "Reject application notification error:",
          notificationError
        );
      }

      // 2. Notificación por correo electrónico
      try {
        await sendCampaignNotificationEmail({
          userId: application.creator.user.id,
          title: notificationTitle,
          message: notificationMessage,
          link: notificationLink,
        });
      } catch (emailError) {
        console.error(
          "Reject application email error:",
          emailError
        );
      }


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

      if (!user || user.role !== "STAFF") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaignId = String(req.params.campaignId);
      const proposalId = String(req.params.proposalId);
      const { status } = req.body;

      if (status !== "APPROVED" && status !== "REJECTED") {
        return res.status(400).json({
          error: "INVALID_STATUS",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Comprobamos que la propuesta pertenece a la campaña.
        const exists = await tx.campaignProposal.findFirst({
          where: {
            id: proposalId,
            campaignId,
          },
          select: { id: true },
        });

        if (!exists) {
          throw new Error("PROPOSAL_NOT_FOUND");
        }

        // Bloqueamos la campaña para serializar selecciones.
        await tx.$queryRaw`
          SELECT id
          FROM "Campaign"
          WHERE id = ${campaignId}
          FOR UPDATE
        `;

        // Releemos la propuesta después del bloqueo.
        const proposal = await tx.campaignProposal.findFirst({
          where: {
            id: proposalId,
            campaignId,
          },
          include: {
            campaign: {
              select: {
                targetCreatorCount: true,
                status: true,
              },
            },
          },
        });

        if (!proposal) {
          throw new Error("PROPOSAL_NOT_FOUND");
        }

        if (proposal.campaign.status === "DELETED") {
          throw new Error("CAMPAIGN_NOT_AVAILABLE");
        }

        if (proposal.status !== "PROPOSED") {
          throw new Error("PROPOSAL_ALREADY_DECIDED");
        }

        // Evitamos propuestas sin un creador identificado.
        if (!proposal.creatorId && !proposal.externalCreatorId) {
          throw new Error("PROPOSAL_WITHOUT_CREATOR");
        }

        if (status === "APPROVED") {
          const target = proposal.campaign.targetCreatorCount;

          if (target != null) {
            const existingCollaboration = proposal.creatorId
              ? await tx.campaignCreator.findUnique({
                  where: {
                    campaignId_creatorId: {
                      campaignId,
                      creatorId: proposal.creatorId,
                    },
                  },
                })
              : null;

            const alreadyOccupiesSlot =
              existingCollaboration != null &&
              existingCollaboration.status !== "PENDING";

            const selectedCount = await countCampaignCreators(
              tx,
              campaignId
            );

            if (!alreadyOccupiesSlot && selectedCount >= target) {
              throw new Error("CAMPAIGN_CREATOR_LIMIT_REACHED");
            }
          }
        }

        // Actualización condicional para impedir doble decisión.
        const updateResult = await tx.campaignProposal.updateMany({
          where: {
            id: proposal.id,
            status: "PROPOSED",
          },
          data: {
            status,
            decidedAt: new Date(),
          },
        });

        if (updateResult.count !== 1) {
          throw new Error("PROPOSAL_ALREADY_DECIDED");
        }

        const updated = await tx.campaignProposal.findUniqueOrThrow({
          where: {
            id: proposal.id,
          },
        });

        let campaignCreator = null;

        // Si STAFF aprueba un creador registrado,
        // creamos o actualizamos su colaboración.
        if (status === "APPROVED" && proposal.creatorId) {
          campaignCreator = await ensureSelectedCampaignCreator(
            tx,
            campaignId,
            proposal.creatorId,
            undefined,
            "PROPOSAL"
          );

          await tx.campaignApplication.updateMany({
            where: {
              campaignId,
              creatorId: proposal.creatorId,
              status: {
                in: ["APPLIED", "SHORTLISTED"],
              },
            },
            data: {
              status: "SELECTED",
              reviewedAt: new Date(),
            },
          });
        }

        // Si se rechaza, actualizamos la candidatura.
        if (status === "REJECTED" && proposal.creatorId) {
          await tx.campaignApplication.updateMany({
            where: {
              campaignId,
              creatorId: proposal.creatorId,
              status: {
                in: ["APPLIED", "SHORTLISTED"],
              },
            },
            data: {
              status: "NOT_SELECTED",
              reviewedAt: new Date(),
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action:
              status === "APPROVED"
                ? "CAMPAIGN_PROPOSAL_APPROVED_BY_STAFF"
                : "CAMPAIGN_PROPOSAL_REJECTED_BY_STAFF",
            entity: "CampaignProposal",
            entityId: updated.id,
            metadata: {
              campaignId,
              proposalId,
              decision: status,
              source: "STAFF",
              creatorId: proposal.creatorId,
              externalCreatorId: proposal.externalCreatorId,
            },
          },
        });

        return {
          proposal: updated,
          campaignCreator,
        };
      });

      return res.json({
        success: true,
        proposal: result.proposal,
        campaignCreator: result.campaignCreator,
      });
    } catch (error) {
      console.error("Staff proposal decision error:", error);

      const message =
        error instanceof Error ? error.message : "";

      if (message === "PROPOSAL_NOT_FOUND") {
        return res.status(404).json({ error: message });
      }

      if (
        [
          "PROPOSAL_ALREADY_DECIDED",
          "CAMPAIGN_CREATOR_LIMIT_REACHED",
          "CAMPAIGN_NOT_AVAILABLE",
        ].includes(message)
      ) {
        return res.status(409).json({ error: message });
      }

      if (message === "PROPOSAL_WITHOUT_CREATOR") {
        return res.status(400).json({ error: message });
      }

      return res.status(500).json({
        error: "STAFF_PROPOSAL_DECISION_ERROR",
      });
    }
  }
);

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

      const campaignId = String(req.params.campaignId);
      const proposalId = String(req.params.proposalId);

      const reason =
        typeof req.body?.reason === "string"
          ? req.body.reason.trim()
          : "";

      if (!reason) {
        return res.status(400).json({
          error: "REASON_REQUIRED",
          message: "Indica el motivo de la corrección.",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Verificar que la propuesta pertenece a la campaña.
        const exists = await tx.campaignProposal.findFirst({
          where: {
            id: proposalId,
            campaignId,
          },
          select: { id: true },
        });

        if (!exists) {
          throw new Error("PROPOSAL_NOT_FOUND");
        }

        // Usamos el mismo bloqueo que en las aprobaciones.
        await tx.$queryRaw`
          SELECT id
          FROM "Campaign"
          WHERE id = ${campaignId}
          FOR UPDATE
        `;

        // Volvemos a consultar tras obtener el bloqueo.
        const proposal = await tx.campaignProposal.findFirst({
          where: {
            id: proposalId,
            campaignId,
          },
        });

        if (!proposal) {
          throw new Error("PROPOSAL_NOT_FOUND");
        }

        if (
          proposal.status !== "APPROVED" &&
          proposal.status !== "REJECTED"
        ) {
          throw new Error("PROPOSAL_NOT_DECIDED");
        }

        const previousStatus = proposal.status;

        // Si estaba aprobada, comprobamos la colaboración.
        if (
          previousStatus === "APPROVED" &&
          proposal.creatorId
        ) {
          const collaboration =
            await tx.campaignCreator.findUnique({
              where: {
                campaignId_creatorId: {
                  campaignId,
                  creatorId: proposal.creatorId,
                },
              },
              include: {
                deliverables: {
                  select: { id: true },
                  take: 1,
                },
              },
            });

          if (collaboration) {
            if (collaboration.selectionSource !== "PROPOSAL") {
  throw new Error("STAFF_REVIEW_REQUIRED");
}
            // No revertimos trabajo que ya haya comenzado.
            const hasProgress =
              collaboration.status !== "SELECTED" ||
              collaboration.deliverables.length > 0 ||
              collaboration.contactedAt !== null ||
              collaboration.acceptedAt !== null ||
              collaboration.productSentAt !== null ||
              collaboration.contentReceivedAt !== null ||
              collaboration.publishedAt !== null ||
              collaboration.paidAt !== null;

            if (hasProgress) {
              throw new Error("COLLABORATION_ALREADY_STARTED");
            }

            // Liberamos la plaza, conservando el registro.
            await tx.campaignCreator.update({
              where: {
                id: collaboration.id,
              },
               data: {
  status: "PENDING",
  selectedAt: null,
  selectionSource: null,
},
            });
          }
        }

        // Restauramos la candidatura registrada.
        if (proposal.creatorId) {
          await tx.campaignApplication.updateMany({
            where: {
              campaignId,
              creatorId: proposal.creatorId,
              status:
                previousStatus === "APPROVED"
                  ? "SELECTED"
                  : "NOT_SELECTED",
            },
            data: {
              status: "SHORTLISTED",
              reviewedAt: new Date(),
            },
          });
        }

        // Evitamos deshacer dos veces la misma decisión.
        const updateResult =
          await tx.campaignProposal.updateMany({
            where: {
              id: proposal.id,
              status: previousStatus,
            },
            data: {
              status: "PROPOSED",
              decidedAt: null,
            },
          });

        if (updateResult.count !== 1) {
          throw new Error("PROPOSAL_STATE_CHANGED");
        }

        const updated =
          await tx.campaignProposal.findUniqueOrThrow({
            where: {
              id: proposal.id,
            },
          });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action:
              "CAMPAIGN_PROPOSAL_DECISION_UNDONE_BY_STAFF",
            entity: "CampaignProposal",
            entityId: updated.id,
            metadata: {
              campaignId,
              proposalId,
              previousStatus,
              newStatus: "PROPOSED",
              creatorId: proposal.creatorId,
              externalCreatorId: proposal.externalCreatorId,
              reason,
              source: "STAFF",
            },
          },
        });

        return {
          proposal: updated,
          previousStatus,
        };
      });

      return res.json({
        success: true,
        proposal: result.proposal,
        previousStatus: result.previousStatus,
        message: "La decisión se ha deshecho correctamente.",
      });
    } catch (error) {
      console.error(
        "Staff undo proposal decision error:",
        error
      );

      const message =
        error instanceof Error ? error.message : "";

      if (message === "PROPOSAL_NOT_FOUND") {
        return res.status(404).json({
          error: message,
        });
      }

      if (
        [
          "PROPOSAL_NOT_DECIDED",
          "PROPOSAL_STATE_CHANGED",
          "COLLABORATION_ALREADY_STARTED",
           "STAFF_REVIEW_REQUIRED",
        ].includes(message)
      ) {
        return res.status(409).json({
          error: message,
        });
      }

      return res.status(500).json({
        error: "STAFF_UNDO_PROPOSAL_DECISION_ERROR",
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

   if (!canDecideBrandProposals(user)) {
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
          await tx.$queryRaw`
            SELECT id
            FROM "Campaign"
            WHERE id = ${proposal.campaignId}
            FOR UPDATE
          `;
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

          const updateResult =
  await tx.campaignProposal.updateMany({
    where: {
      id: proposal.id,
      status: "PROPOSED",
    },
    data: {
      status,
      decidedAt: new Date(),
    },
  });

if (updateResult.count !== 1) {
  throw new Error("PROPOSAL_ALREADY_DECIDED");
}

const updated =
  await tx.campaignProposal.findUniqueOrThrow({
    where: {
      id: proposal.id,
    },
  });
            let campaignCreator = null;

            if (status === "APPROVED" && proposal.creatorId) {
              campaignCreator =
                      await ensureSelectedCampaignCreator(
                        tx,
                        proposal.campaignId,
                        proposal.creatorId,
                        undefined,
                        "PROPOSAL"
                      );

              await tx.campaignApplication.updateMany({
                where: {
                  campaignId: proposal.campaignId,
                  creatorId: proposal.creatorId,

                  status: {
                    in: ["APPLIED", "SHORTLISTED"],
                  },
                },

                data: {
                  status: "SELECTED",
                },
              });
            }

            if (status === "REJECTED" && proposal.creatorId) {
              await tx.campaignApplication.updateMany({
                where: {
                  campaignId: proposal.campaignId,
                  creatorId: proposal.creatorId,

                  status: {
                    in: ["APPLIED", "SHORTLISTED"],
                  },
                },

                data: {
                  status: "NOT_SELECTED",
                },
              });
            }
            await tx.auditLog.create({
              data: {
                userId: user.id,

                action:
                  status === "APPROVED"
                    ? "CAMPAIGN_PROPOSAL_APPROVED_BY_CLIENT"
                    : "CAMPAIGN_PROPOSAL_REJECTED_BY_CLIENT",

                entity: "CampaignProposal",

                entityId: updated.id,

                metadata: {
                  campaignId: updated.campaignId,
                  proposalId: updated.id,
                  decision: status,
                  source: "CLIENT",
                },
              },
            });
        

          return {
            proposal: updated,

            campaignCreator,

            creatorId: proposal.creatorId,

            campaignName:
              proposal.campaign.name,
          };
                  }
      );

      // La transacción ya se ha confirmado.
      // Un error de notificación no debe cambiar
      // el resultado de la decisión.

      if (result.creatorId) {
        try {
          const creator = await prisma.creator.findUnique({
            where: {
              id: result.creatorId,
            },
            select: {
              userId: true,
            },
          });

          if (creator) {
            if (
              status === "APPROVED" &&
              result.campaignCreator
            ) {
              await createNotification({
                userId: creator.userId,
                type: "APPLICATION",
                title: "¡Has sido seleccionado!",
                message:
                  `Tu perfil ha sido aprobado para participar ` +
                  `en la campaña ${result.campaignName}.`,
                link:
                  `/creator/campaigns/` +
                  result.campaignCreator.id,
              });
            }

            if (status === "REJECTED") {
              await createNotification({
                userId: creator.userId,
                type: "APPLICATION",
                title: "Actualización de tu candidatura",
                message:
                  `Tu candidatura para la campaña ` +
                  `${result.campaignName} ha sido actualizada. ` +
                  `En esta ocasión no has sido seleccionado.`,
                link: "/creator/applications",
              });
            }
          }
        } catch (notificationError) {
          console.error(
            "Creator proposal notification error:",
            notificationError
          );
        }
      }
        // ==========================================
      // EMAIL AL CREADOR TRAS DECISIÓN DE LA MARCA
      // ==========================================
      // La decisión ya está confirmada en la BD.
      // Si Resend falla, no se revierte la operación.

      if (result.creatorId) {
        try {
          const creator = await prisma.creator.findUnique({
            where: {
              id: result.creatorId,
            },
            select: {
              userId: true,
            },
          });

          if (creator) {
            if (
              status === "APPROVED" &&
              result.campaignCreator
            ) {
              await sendCampaignNotificationEmail({
                userId: creator.userId,
                title: "¡Has sido seleccionado!",
                message:
                  `Tu perfil ha sido aprobado para participar ` +
                  `en la campaña ${result.campaignName}. ` +
                  `Accede a ST.MARY Agency para consultar ` +
                  `los detalles de tu colaboración.`,
                link:
                  `/creator/campaigns/` +
                  result.campaignCreator.id,
              });
            }

            if (status === "REJECTED") {
              await sendCampaignNotificationEmail({
                userId: creator.userId,
                title: "Actualización de tu candidatura",
                message:
                  `Tu candidatura para la campaña ` +
                  `${result.campaignName} ha sido revisada. ` +
                  `En esta ocasión no has sido seleccionado. ` +
                  `Puedes seguir consultando otras oportunidades ` +
                  `desde ST.MARY Agency.`,
                link: "/creator/applications",
              });
            }
          }
        } catch (emailError) {
          console.error(
            "Creator proposal decision email error:",
            emailError
          );
        }
      }

      // Notificación al equipo de ST.MARY Agency.
      // Se intenta de forma independiente.
      try {
        await notifyStaff({
          type: "APPLICATION",
          title:
            status === "APPROVED"
              ? "Propuesta aprobada por el cliente"
              : "Propuesta rechazada por el cliente",
          message:
            status === "APPROVED"
              ? `El cliente ha aprobado un perfil para la campaña ${result.campaignName}.`
              : `El cliente ha rechazado un perfil para la campaña ${result.campaignName}.`,
          link:
            `/admin/campaigns/` +
            `${result.proposal.campaignId}/manage`,
        });
      } catch (notificationError) {
        console.error(
          "Staff proposal notification error:",
          notificationError
        );
      }

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

      const membership = user.brandMemberships?.[0];

      if (!membership) {
        return res.status(403).json({
          error: "NO_BRAND_MEMBERSHIP",
        });
      }

      if (
        !membership.canViewProposals ||
        !membership.canApproveCreators
      ) {
        return res.status(403).json({
          error: "PERMISSION_DENIED",
        });
      }

      const proposalId = String(req.params.proposalId);

      const result = await prisma.$transaction(async (tx) => {
        // Comprobamos que la propuesta pertenece a esta marca.
        const initialProposal =
          await tx.campaignProposal.findFirst({
            where: {
              id: proposalId,
              campaign: {
                brandId: membership.brandId,
              },
            },
            select: {
              id: true,
              campaignId: true,
            },
          });

        if (!initialProposal) {
          throw new Error("PROPOSAL_NOT_FOUND");
        }

        const campaignId = initialProposal.campaignId;

        // Bloqueo compartido con las aprobaciones
        // y selecciones directas de la campaña.
        await tx.$queryRaw`
          SELECT id
          FROM "Campaign"
          WHERE id = ${campaignId}
          FOR UPDATE
        `;

        // Releemos la propuesta tras obtener el bloqueo.
        const proposal =
          await tx.campaignProposal.findFirst({
            where: {
              id: proposalId,
              campaign: {
                brandId: membership.brandId,
              },
            },
          });

        if (!proposal) {
          throw new Error("PROPOSAL_NOT_FOUND");
        }

        if (
          proposal.status !== "APPROVED" &&
          proposal.status !== "REJECTED"
        ) {
          throw new Error("PROPOSAL_NOT_DECIDED");
        }

        const previousStatus = proposal.status;

        if (
          previousStatus === "APPROVED" &&
          proposal.creatorId
        ) {
          const collaboration =
            await tx.campaignCreator.findUnique({
              where: {
                campaignId_creatorId: {
                  campaignId,
                  creatorId: proposal.creatorId,
                },
              },
              include: {
                deliverables: {
                  select: {
                    id: true,
                  },
                  take: 1,
                },
              },
            });

          if (collaboration) {
            if (collaboration.selectionSource !== "PROPOSAL") {
  throw new Error("STAFF_REVIEW_REQUIRED");
}
            const hasStarted =
              collaboration.status !== "SELECTED" ||
              collaboration.contactedAt !== null ||
              collaboration.acceptedAt !== null ||
              collaboration.productSentAt !== null ||
              collaboration.contentReceivedAt !== null ||
              collaboration.publishedAt !== null ||
              collaboration.paidAt !== null ||
              collaboration.deliverables.length > 0;

            if (hasStarted) {
              throw new Error(
                "COLLABORATION_ALREADY_STARTED"
              );
            }

            // No podemos atribuir con certeza una
            // selección previa a esta propuesta.
            // Si la colaboración se seleccionó antes
            // de enviarla, exigimos revisión de STAFF.
            if (
              collaboration.selectedAt &&
              collaboration.selectedAt <
                proposal.proposedAt
            ) {
              throw new Error(
                "STAFF_REVIEW_REQUIRED"
              );
            }

            await tx.campaignCreator.update({
              where: {
                id: collaboration.id,
              },
             data: {
  status: "PENDING",
  selectedAt: null,
  selectionSource: null,
},
            });
          }
        }

        // Restauramos la candidatura únicamente
        // si conserva el estado esperado.
        if (proposal.creatorId) {
          await tx.campaignApplication.updateMany({
            where: {
              campaignId,
              creatorId: proposal.creatorId,
              status:
                previousStatus === "APPROVED"
                  ? "SELECTED"
                  : "NOT_SELECTED",
            },
            data: {
              status: "SHORTLISTED",
              reviewedAt: new Date(),
            },
          });
        }

        // Evitamos reversiones duplicadas.
        const updateResult =
          await tx.campaignProposal.updateMany({
            where: {
              id: proposal.id,
              status: previousStatus,
            },
            data: {
              status: "PROPOSED",
              decidedAt: null,
            },
          });

        if (updateResult.count !== 1) {
          throw new Error("PROPOSAL_STATE_CHANGED");
        }

        const updated =
          await tx.campaignProposal.findUniqueOrThrow({
            where: {
              id: proposal.id,
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
            entity: "CampaignProposal",
            entityId: updated.id,
            metadata: {
              campaignId,
              proposalId: updated.id,
              previousStatus,
              newStatus: "PROPOSED",
              creatorId: proposal.creatorId,
              externalCreatorId: proposal.externalCreatorId,
              source: "CLIENT",
            },
          },
        });

        return updated;
      });

      return res.json({
        success: true,
        proposal: result,
      });
    } catch (error) {
      console.error(
        "Client undo proposal decision error:",
        error
      );

      const message =
        error instanceof Error ? error.message : "";

      if (message === "PROPOSAL_NOT_FOUND") {
        return res.status(404).json({
          error: message,
        });
      }

      if (
        [
          "PROPOSAL_NOT_DECIDED",
          "PROPOSAL_STATE_CHANGED",
          "COLLABORATION_ALREADY_STARTED",
          "STAFF_REVIEW_REQUIRED",
        ].includes(message)
      ) {
        return res.status(409).json({
          error: message,
        });
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
      const matchId = String(req.params.matchId);

      const includeProposal = {
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
      } as const;

      const result = await prisma.$transaction(
        async (tx) => {
          // Verificamos que la campaña existe.
          const campaign = await tx.campaign.findUnique({
            where: { id: campaignId },
            select: { id: true },
          });

          if (!campaign) {
            throw new Error("CAMPAIGN_NOT_FOUND");
          }

          // Serializamos las operaciones de esta campaña.
          await tx.$queryRaw`
            SELECT id
            FROM "Campaign"
            WHERE id = ${campaignId}
            FOR UPDATE
          `;

          // Consultamos el matching después del bloqueo.
          const match = await tx.creatorMatch.findFirst({
            where: {
              id: matchId,
              campaignId,
            },
            select: {
              id: true,
              status: true,
              creatorId: true,
              externalCreatorId: true,
            },
          });

          if (!match) {
            throw new Error("MATCH_NOT_FOUND");
          }

          if (match.status !== "SHORTLISTED") {
            throw new Error("CREATOR_NOT_SHORTLISTED");
          }

          if (!match.creatorId && !match.externalCreatorId) {
            throw new Error("MATCH_WITHOUT_CREATOR");
          }

          // El matching debe representar un solo perfil.
          if (match.creatorId && match.externalCreatorId) {
            throw new Error("AMBIGUOUS_MATCH_CREATOR");
          }

          const proposalWhere = match.creatorId
            ? {
                campaignId_creatorId: {
                  campaignId,
                  creatorId: match.creatorId,
                },
              }
            : {
                campaignId_externalCreatorId: {
                  campaignId,
                  externalCreatorId: match.externalCreatorId!,
                },
              };

          // Si existe una propuesta, devolvemos su estado
          // sin modificarlo ni reabrirlo.
          const existingProposal =
            await tx.campaignProposal.findUnique({
              where: proposalWhere,
              include: includeProposal,
            });

          if (existingProposal) {
            return {
              alreadyProposed: true,
              proposal: existingProposal,
            };
          }

          const proposal = await tx.campaignProposal.create({
            data: {
              campaignId,
              creatorId: match.creatorId ?? null,
              externalCreatorId:
                match.externalCreatorId ?? null,
              status: "PROPOSED",
            },
            include: includeProposal,
          });

          // La auditoría forma parte de la misma transacción.
          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "CREATOR_PROPOSED_TO_CLIENT",
              entity: "CampaignProposal",
              entityId: proposal.id,
              metadata: {
                campaignId,
                matchId,
                creatorId: match.creatorId,
                externalCreatorId: match.externalCreatorId,
                source: "MATCH",
              },
            },
          });

          return {
            alreadyProposed: false,
            proposal,
          };
        }
      );

      return res.status(
        result.alreadyProposed ? 200 : 201
      ).json({
        success: true,
        alreadyProposed: result.alreadyProposed,
        proposal: result.proposal,
      });
    } catch (error) {
      console.error(
        "Create campaign proposal error:",
        error
      );

      const message =
        error instanceof Error ? error.message : "";

      if (
        message === "CAMPAIGN_NOT_FOUND" ||
        message === "MATCH_NOT_FOUND"
      ) {
        return res.status(404).json({
          error: message,
        });
      }

      if (
        message === "CREATOR_NOT_SHORTLISTED" ||
        message === "MATCH_WITHOUT_CREATOR" ||
        message === "AMBIGUOUS_MATCH_CREATOR"
      ) {
        return res.status(409).json({
          error: message,
        });
      }

      // Prisma P2002: violación de índice único.
      // Puede ocurrir si otro flujo ha creado
      // la misma propuesta concurrentemente.
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return res.status(409).json({
          error: "PROPOSAL_ALREADY_EXISTS",
          message:
            "El perfil ya tiene una propuesta en esta campaña. " +
            "Actualiza el listado para ver su estado.",
        });
      }

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
      const creatorId = String(req.params.creatorId);

      // Validación de la tarifa.
      const { fee } = req.body ?? {};
      let creatorFee: string | null = null;

      if (fee !== undefined && fee !== null && fee !== "") {
        const feeString = String(fee).trim();

        if (!/^\d+(\.\d{1,2})?$/.test(feeString)) {
          return res.status(400).json({
            error: "INVALID_FEE",
          });
        }

        creatorFee = feeString;
      }

      const result = await prisma.$transaction(async (tx) => {
        // Verificamos que existe la campaña.
        const exists = await tx.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true },
        });

        if (!exists) {
          throw new Error("CAMPAIGN_NOT_FOUND");
        }

        // Bloqueo por campaña: todas las rutas que
        // ocupen plazas deben utilizarlo.
        await tx.$queryRaw`
          SELECT id
          FROM "Campaign"
          WHERE id = ${campaignId}
          FOR UPDATE
        `;

        const campaign = await tx.campaign.findUnique({
          where: { id: campaignId },
          select: {
            id: true,
            name: true,
            status: true,
            targetCreatorCount: true,
          },
        });

        if (!campaign || campaign.status === "DELETED") {
          throw new Error("CAMPAIGN_NOT_AVAILABLE");
        }

        const creator = await tx.creator.findUnique({
          where: { id: creatorId },
          select: {
            id: true,
            username: true,
          },
        });

        if (!creator) {
          throw new Error("CREATOR_NOT_FOUND");
        }

        // Una propuesta existente debe resolverse
        // desde su flujo de aprobación/rechazo.
        const proposal = await tx.campaignProposal.findUnique({
          where: {
            campaignId_creatorId: {
              campaignId,
              creatorId,
            },
          },
        });

        if (
          proposal &&
          proposal.status !== "WITHDRAWN"
        ) {
          throw new Error("PROPOSAL_REQUIRES_RESOLUTION");
        }

        const existingCollaboration =
          await tx.campaignCreator.findUnique({
            where: {
              campaignId_creatorId: {
                campaignId,
                creatorId,
              },
            },
          });

        // No sobrescribimos una colaboración
        // seleccionada o ya iniciada.
        if (
          existingCollaboration &&
          existingCollaboration.status !== "PENDING"
        ) {
          throw new Error("CREATOR_ALREADY_SELECTED");
        }

        // Comprobamos el límite dentro de la transacción.
        if (campaign.targetCreatorCount != null) {
          const selectedCount = await countCampaignCreators(
            tx,
            campaignId
          );

          if (selectedCount >= campaign.targetCreatorCount) {
            throw new Error("CAMPAIGN_CREATOR_LIMIT_REACHED");
          }
        }

        const campaignCreator =
  await ensureSelectedCampaignCreator(
    tx,
    campaignId,
    creatorId,
    creatorFee,
    "DIRECT_STAFF"
  );

        // Actualizamos el matching.
        await tx.creatorMatch.updateMany({
          where: {
            campaignId,
            creatorId,
          },
          data: {
            status: "SELECTED",
          },
        });

        // Actualizamos la candidatura si existe.
        await tx.campaignApplication.updateMany({
          where: {
            campaignId,
            creatorId,
            status: {
              in: ["APPLIED", "SHORTLISTED"],
            },
          },
          data: {
            status: "SELECTED",
          },
        });

        // Registramos quién hizo la selección.
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "CREATOR_SELECTED_FOR_CAMPAIGN",
            entity: "CampaignCreator",
            entityId: campaignCreator.id,
            metadata: {
              campaignId,
              creatorId,
              creatorUsername: creator.username,
              fee: creatorFee,
              source: "DIRECT_STAFF_SELECTION",
            },
          },
        });

        return {
          campaignCreator,
        };
      });

      return res.json(result);
    } catch (error) {
      console.error("Select creator error:", error);

      const message =
        error instanceof Error ? error.message : "";

      if (
        message === "CAMPAIGN_NOT_FOUND" ||
        message === "CREATOR_NOT_FOUND"
      ) {
        return res.status(404).json({
          error: message,
        });
      }

      if (
        [
          "CAMPAIGN_NOT_AVAILABLE",
          "CREATOR_ALREADY_SELECTED",
          "CAMPAIGN_CREATOR_LIMIT_REACHED",
          "PROPOSAL_REQUIRES_RESOLUTION",
        ].includes(message)
      ) {
        return res.status(409).json({
          error: message,
        });
      }

      return res.status(500).json({
        error: "SELECT_CREATOR_ERROR",
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

      const campaign = await prisma.campaign.findFirst({
  where: {
    id: req.params.id,
    brandId: membership.brandId,
    status: {
      not: "DELETED",
    },
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
      const request = req as AuthenticatedRequest;
      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "STAFF") {
  return res.status(403).json({
    error: "STAFF_ACCESS_REQUIRED",
    message:
      "Solo Staff puede modificar el estado operativo de una colaboración.",
  });
}

      const campaignId = String(req.params.campaignId);
      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      if (await isCampaignDeleted(campaignId)) {
  return res.status(404).json({
    error: "CAMPAIGN_NOT_FOUND",
    message: "Esta campaña ya no está disponible.",
  });
}

      const { status, fee } = req.body ?? {};

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
          ? status.trim().toUpperCase()
          : "";

      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          error: "INVALID_STATUS",
          allowedStatuses,
        });
      }

      

      /*
       * Obtener colaboración, campaña
       * y entregables.
       */
   const collaboration =
  await prisma.campaignCreator.findFirst({
    where: {
      id: campaignCreatorId,
      campaignId,
    },
    include: collaborationWorkflowInclude,
  });

      if (!collaboration) {
        return res.status(404).json({
          error: "COLLABORATION_NOT_FOUND",
        });
      }

      /*
       * Validación del fee.
       */
      let creatorFee: string | undefined;

      if (
        fee !== undefined &&
        fee !== null &&
        fee !== ""
      ) {
        const feeString = String(fee).trim();

        if (!/^\d+(\.\d{1,2})?$/.test(feeString)) {
          return res.status(400).json({
            error: "INVALID_FEE",
          });
        }

        creatorFee = feeString;
      }
      const validation = validateCollaborationStatusChange(
        collaboration,
        normalizedStatus
      );

      if (!validation.ok) {
        return res.status(validation.statusCode).json({
          error: validation.error,
          message: validation.message,
        });
      }
      

      /*
       * No actualizar si no hay cambios.
       */
      const statusChanged =
        collaboration.status !== normalizedStatus;

      const feeChanged =
        creatorFee !== undefined &&
        Number(collaboration.fee) !== Number(creatorFee);
        /*
 * No permitir modificar el importe
 * después de publicar o pagar.
 */
if (
  feeChanged &&
  ["PUBLISHED", "PAID"].includes(collaboration.status)
) {
  return res.status(409).json({
    error: "COLLABORATION_FEE_LOCKED",
    message:
      "No se puede modificar el importe de una colaboración publicada o pagada.",
  });
}

      if (!statusChanged && !feeChanged) {
        const existing =
          await prisma.campaignCreator.findUniqueOrThrow({
            where: {
              id: campaignCreatorId,
            },
            include: {
              creator: true,
            },
          });

        return res.json({
          campaignCreator: existing,
          unchanged: true,
        });
      }

      /*
       * Fechas operativas.
       * Solo se guardan si todavía no existen.
       */
      const now = new Date();

      const timestampFields: Record<string, Date> = {};

      if (
        normalizedStatus === "CONTACTED" &&
        !collaboration.contactedAt
      ) {
        timestampFields.contactedAt = now;
      }

      if (
        normalizedStatus === "ACCEPTED" &&
        !collaboration.acceptedAt
      ) {
        timestampFields.acceptedAt = now;
      }

      if (
        normalizedStatus === "SELECTED" &&
        !collaboration.selectedAt
      ) {
        timestampFields.selectedAt = now;
      }

      if (
        normalizedStatus === "PRODUCT_SENT" &&
        !collaboration.productSentAt
      ) {
        timestampFields.productSentAt = now;
      }

      if (
        normalizedStatus === "CONTENT_RECEIVED" &&
        !collaboration.contentReceivedAt
      ) {
        timestampFields.contentReceivedAt = now;
      }

      if (
        normalizedStatus === "PUBLISHED" &&
        !collaboration.publishedAt
      ) {
        timestampFields.publishedAt = now;
      }

      if (
        normalizedStatus === "PAID" &&
        !collaboration.paidAt
      ) {
        timestampFields.paidAt = now;
      }

      /*
       * Actualización y auditoría
       * dentro de una transacción.
       */
      const updated = await prisma.$transaction(
        async (tx) => {
          const claimed = await tx.campaignCreator.updateMany({
  where: {
    id: collaboration.id,
    status: collaboration.status,
    ...(feeChanged
      ? { fee: collaboration.fee }
      : {}),
  },
  data: {
    status: normalizedStatus,
    ...(creatorFee !== undefined
      ? { fee: creatorFee }
      : {}),
    ...timestampFields,
  },
});

if (claimed.count !== 1) {
  throw new Error("COLLABORATION_CONFLICT");
}
         const result =
  await tx.campaignCreator.findUniqueOrThrow({
    where: {
      id: collaboration.id,
    },
    include: {
      creator: true,
    },
  });

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action: "COLLABORATION_UPDATED",
              entity: "CampaignCreator",
              entityId: result.id,
              metadata: {
                campaignId: result.campaignId,
                creatorId: result.creatorId,
                previousStatus: collaboration.status,
                newStatus: result.status,
                feeChanged,
previousFee: String(collaboration.fee),
newFee: String(result.fee),
              },
            },
          });

          return result;
        }
      );

      return res.json({
        campaignCreator: updated,
      });
    } catch (error) {
      if (
  error instanceof Error &&
  error.message === "COLLABORATION_CONFLICT"
) {
  return res.status(409).json({
    error: "COLLABORATION_CONFLICT",
    message:
      "La colaboración ha cambiado mientras se procesaba la solicitud. Actualiza la página e inténtalo de nuevo.",
  });
}
      console.error(
        "Update collaboration error:",
        error
      );

      return res.status(500).json({
        error: "UPDATE_COLLABORATION_ERROR",
      });
    }
  }
);

export default router;