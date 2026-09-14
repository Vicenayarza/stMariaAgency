import { Router } from "express";

import { prisma } from "../lib/prisma.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  getCreatorById,
  searchCreators,
} from "../services/creator.service.js";

const router = Router();

router.use(requireAuth);

/*
 * ==========================================
 * GET /api/creators/:id/trust-score
 * ==========================================
 *
 * Calcula el Trust Score de un creador.
 *
 * Visible para:
 * - BRAND
 * - STAFF
 *
 */

router.get(
  "/:id/trust-score",
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
        user.role !== "BRAND" &&
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const {
        calculateTrustScore,
      } = await import(
        "../services/trust-score.service.js"
      );

      const result =
        await calculateTrustScore(
          req.params.id
        );

      return res.json(result);
    } catch (error) {
      console.error(
        "Trust score error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "CREATOR_NOT_FOUND"
      ) {
        return res.status(404).json({
          error:
            "CREATOR_NOT_FOUND",
        });
      }

      return res.status(500).json({
        error: "TRUST_SCORE_ERROR",
      });
    }
  }
);
router.get(
  "/:id/audience-quality",
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
        user.role !== "BRAND" &&
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const {
        calculateAudienceQuality,
      } = await import(
        "../services/audience-quality.service.js"
      );

      const result =
        await calculateAudienceQuality(
          req.params.id
        );

      return res.json(result);
    } catch (error) {
      console.error(
        "Audience quality error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "CREATOR_NOT_FOUND"
      ) {
        return res.status(404).json({
          error: "CREATOR_NOT_FOUND",
        });
      }

      return res.status(500).json({
        error:
          "AUDIENCE_QUALITY_ERROR",
      });
    }
  }
);
/*
 * ==========================================
 * GET /api/creators
 * ==========================================
 *
 * Búsqueda de creadores.
 *
 */

router.get("/", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;
    const user = request.user;

    if (!user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (
      user.role !== "BRAND" &&
      user.role !== "STAFF"
    ) {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    const minFollowers =
      req.query.minFollowers !== undefined
        ? Number(req.query.minFollowers)
        : undefined;

    const maxFollowers =
      req.query.maxFollowers !== undefined
        ? Number(req.query.maxFollowers)
        : undefined;

    const minEngagement =
      req.query.minEngagement !== undefined
        ? Number(req.query.minEngagement)
        : undefined;

    const creators = await searchCreators({
      search:
        typeof req.query.search === "string"
          ? req.query.search
          : undefined,

      category:
        typeof req.query.category === "string"
          ? req.query.category
          : undefined,

      platform:
        typeof req.query.platform === "string"
          ? req.query.platform
          : undefined,

      location:
        typeof req.query.location === "string"
          ? req.query.location
          : undefined,

      minFollowers,
      maxFollowers,
      minEngagement,
    });

    return res.json({
      creators,
    });
  } catch (error) {
    console.error(
      "Search creators error:",
      error
    );

    return res.status(500).json({
      error: "SEARCH_CREATORS_ERROR",
    });
  }
});
/*
 * ==========================================
 * GET /api/creators/:id/metrics-history
 * ==========================================
 *
 * Histórico de métricas verificadas.
 *
 * Visible para:
 * - BRAND
 * - STAFF
 */

router.get(
  "/:id/metrics-history",
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
        user.role !== "BRAND" &&
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const creator =
        await prisma.creator.findUnique({
          where: {
            id: req.params.id,
          },
          select: {
            id: true,
          },
        });

      if (!creator) {
        return res.status(404).json({
          error: "CREATOR_NOT_FOUND",
        });
      }

      const metrics =
        await prisma.creatorMetric.findMany({
          where: {
            socialAccount: {
              creatorId: creator.id,
            },
            verificationStatus: "VERIFIED",
          },
          include: {
            socialAccount: {
              select: {
                id: true,
                platform: true,
                username: true,
              },
            },
          },
          orderBy: {
            recordedAt: "asc",
          },
        });

      return res.json({
        creatorId: creator.id,

        metrics: metrics.map((metric) => ({
          id: metric.id,

          platform:
            metric.socialAccount.platform,

          username:
            metric.socialAccount.username,

          followers: metric.followers,

          following: metric.following,

          posts: metric.posts,

          likes: metric.likes,

          comments: metric.comments,

          views: metric.views,

          reach: metric.reach,

          impressions:
            metric.impressions,

          engagementRate:
            metric.engagementRate,

          recordedAt:
            metric.recordedAt,

          verificationStatus:
            metric.verificationStatus,
        })),
      });
    } catch (error) {
      console.error(
        "Metrics history error:",
        error
      );

      return res.status(500).json({
        error: "METRICS_HISTORY_ERROR",
      });
    }
  }
);
/*
 * ==========================================
 * GET /api/creators/:id/risk-analysis
 * ==========================================
 *
 * Análisis de riesgo del creador.
 *
 * Visible para:
 * - BRAND
 * - STAFF
 */

router.get(
  "/:id/risk-analysis",
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
        user.role !== "BRAND" &&
        user.role !== "STAFF"
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const { analyzeCreatorRisk } =
        await import(
          "../services/creator-risk.service.js"
        );

      const result =
        await analyzeCreatorRisk(req.params.id);

      return res.json(result);
    } catch (error) {
      console.error(
        "Creator risk analysis error:",
        error
      );

      if (
        error instanceof Error &&
        error.message === "CREATOR_NOT_FOUND"
      ) {
        return res.status(404).json({
          error: "CREATOR_NOT_FOUND",
        });
      }

      return res.status(500).json({
        error: "CREATOR_RISK_ANALYSIS_ERROR",
      });
    }
  }
);
/*
 * ==========================================
 * GET /api/creators/:id
 * ==========================================
 *
 * Perfil completo de un creador.
 *
 */

router.get("/:id", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;
    const user = request.user;

    if (!user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (
      user.role !== "BRAND" &&
      user.role !== "STAFF"
    ) {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    const creator = await getCreatorById(
      req.params.id
    );

    if (!creator) {
      return res.status(404).json({
        error: "CREATOR_NOT_FOUND",
      });
    }

    return res.json({
      creator,
    });
  } catch (error) {
    console.error(
      "Get creator error:",
      error
    );

    return res.status(500).json({
      error: "GET_CREATOR_ERROR",
    });
  }
});

/*
 * ==========================================
 * POST /api/creators/:creatorId/campaigns/:campaignId
 * ==========================================
 *
 * Añade un creador a una campaña de una marca.
 *
 */

router.post(
  "/:creatorId/campaigns/:campaignId",
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
        user.role !== "BRAND" ||
        !user.brand
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const creator =
        await prisma.creator.findUnique({
          where: {
            id: req.params.creatorId,
          },
        });

      if (!creator) {
        return res.status(404).json({
          error: "CREATOR_NOT_FOUND",
        });
      }

      const campaign =
        await prisma.campaign.findFirst({
          where: {
            id: req.params.campaignId,
            brandId: user.brand.id,
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
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

      if (existing) {
        return res.status(409).json({
          error:
            "CREATOR_ALREADY_IN_CAMPAIGN",
        });
      }

      const { fee } = req.body ?? {};

      let creatorFee = null;

      if (
        fee !== undefined &&
        fee !== null &&
        fee !== ""
      ) {
        const feeString = String(fee).trim();

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

      const campaignCreator =
        await prisma.campaignCreator.create({
          data: {
            campaignId: campaign.id,
            creatorId: creator.id,
            fee: creatorFee,
            status: "PENDING",
          },
          include: {
            creator: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action:
            "CREATOR_ADDED_TO_CAMPAIGN",
          entity: "CampaignCreator",
          entityId: campaignCreator.id,
          metadata: {
            campaignId: campaign.id,
            creatorId: creator.id,
          },
        },
      });

      return res.status(201).json({
        campaignCreator,
      });
    } catch (error) {
      console.error(
        "Add creator to campaign error:",
        error
      );

      return res.status(500).json({
        error: "ADD_CREATOR_ERROR",
      });
    }
  }
);

export default router;