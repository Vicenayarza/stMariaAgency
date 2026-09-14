import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

async function getAuthenticatedCreator(
  req: AuthenticatedRequest
) {
  if (!req.user) {
    return null;
  }

  return prisma.creator.findUnique({
    where: {
      userId: req.user.id,
    },
  });
}

function isValidPlatform(value: unknown) {
  return [
    "INSTAGRAM",
    "TIKTOK",
    "YOUTUBE",
    "TWITTER",
    "FACEBOOK",
    "TWITCH",
    "LINKEDIN",
    "OTHER",
  ].includes(String(value));
}

/**
 * GET /api/social/accounts
 *
 * Obtiene las cuentas sociales del creador autenticado.
 */
router.get("/accounts", async (req: AuthenticatedRequest, res) => {
  try {
    const creator = await getAuthenticatedCreator(req);

    if (!creator) {
      return res.status(403).json({
        error: "CREATOR_ACCESS_REQUIRED",
      });
    }

    const accounts = await prisma.creatorSocialAccount.findMany({
      where: {
        creatorId: creator.id,
      },
      include: {
        metrics: {
          orderBy: {
            recordedAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({
      accounts,
    });
  } catch (error) {
    console.error("Get social accounts error:", error);

    return res.status(500).json({
      error: "SOCIAL_ACCOUNTS_FETCH_ERROR",
    });
  }
});

/**
 * POST /api/social/accounts
 *
 * Añade una cuenta social al creador autenticado.
 */
router.post("/accounts", async (req: AuthenticatedRequest, res) => {
  try {
    const creator = await getAuthenticatedCreator(req);

    if (!creator) {
      return res.status(403).json({
        error: "CREATOR_ACCESS_REQUIRED",
      });
    }

    const {
      platform,
      username,
      profileUrl,
    } = req.body;

    if (!platform || !isValidPlatform(platform)) {
      return res.status(400).json({
        error: "INVALID_PLATFORM",
      });
    }

    if (
      !username ||
      typeof username !== "string" ||
      !username.trim()
    ) {
      return res.status(400).json({
        error: "INVALID_USERNAME",
      });
    }

    if (
      profileUrl !== undefined &&
      profileUrl !== null &&
      typeof profileUrl !== "string"
    ) {
      return res.status(400).json({
        error: "INVALID_PROFILE_URL",
      });
    }

    const normalizedPlatform = String(platform);

    const existing =
      await prisma.creatorSocialAccount.findUnique({
        where: {
          creatorId_platform: {
            creatorId: creator.id,
            platform: normalizedPlatform as any,
          },
        },
      });

    if (existing) {
      return res.status(409).json({
        error: "SOCIAL_ACCOUNT_ALREADY_EXISTS",
      });
    }

    const account =
      await prisma.creatorSocialAccount.create({
        data: {
          creatorId: creator.id,
          platform: normalizedPlatform as any,
          username: username.trim(),
          profileUrl:
            profileUrl?.trim() || null,
        },
      });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "CREATOR_SOCIAL_ACCOUNT_CREATED",
        entity: "CreatorSocialAccount",
        entityId: account.id,
        metadata: {
          platform: normalizedPlatform,
        },
      },
    });

    return res.status(201).json({
      account,
    });
  } catch (error) {
    console.error("Create social account error:", error);

    return res.status(500).json({
      error: "SOCIAL_ACCOUNT_CREATE_ERROR",
    });
  }
});

/**
 * PATCH /api/social/accounts/:id
 *
 * Actualiza una cuenta social.
 */
router.patch(
  "/accounts/:id",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const account =
        await prisma.creatorSocialAccount.findFirst({
          where: {
            id: String(req.params.id),
            creatorId: creator.id,
          },
        });

      if (!account) {
        return res.status(404).json({
          error: "SOCIAL_ACCOUNT_NOT_FOUND",
        });
      }

      const {
        username,
        profileUrl,
      } = req.body;

      const data: {
        username?: string;
        profileUrl?: string | null;
      } = {};

      if (username !== undefined) {
        if (
          typeof username !== "string" ||
          !username.trim()
        ) {
          return res.status(400).json({
            error: "INVALID_USERNAME",
          });
        }

        data.username = username.trim();
      }

      if (profileUrl !== undefined) {
        if (
          profileUrl !== null &&
          typeof profileUrl !== "string"
        ) {
          return res.status(400).json({
            error: "INVALID_PROFILE_URL",
          });
        }

        data.profileUrl =
          profileUrl?.trim() || null;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error: "NO_CHANGES",
        });
      }

      const updated =
        await prisma.creatorSocialAccount.update({
          where: {
            id: account.id,
          },
          data,
        });

      return res.json({
        account: updated,
      });
    } catch (error) {
      console.error("Update social account error:", error);

      return res.status(500).json({
        error: "SOCIAL_ACCOUNT_UPDATE_ERROR",
      });
    }
  }
);

/**
 * DELETE /api/social/accounts/:id
 *
 * Elimina una cuenta social.
 */
router.delete(
  "/accounts/:id",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const account =
        await prisma.creatorSocialAccount.findFirst({
          where: {
            id: String(req.params.id),
            creatorId: creator.id,
          },
        });

      if (!account) {
        return res.status(404).json({
          error: "SOCIAL_ACCOUNT_NOT_FOUND",
        });
      }

      await prisma.creatorSocialAccount.delete({
        where: {
          id: account.id,
        },
      });

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error("Delete social account error:", error);

      return res.status(500).json({
        error: "SOCIAL_ACCOUNT_DELETE_ERROR",
      });
    }
  }
);

/**
 * GET /api/social/accounts/:id/metrics
 *
 * Obtiene el histórico de métricas de una cuenta.
 */
router.get(
  "/accounts/:id/metrics",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const account =
        await prisma.creatorSocialAccount.findFirst({
          where: {
            id: String(req.params.id),
            creatorId: creator.id,
          },
        });

      if (!account) {
        return res.status(404).json({
          error: "SOCIAL_ACCOUNT_NOT_FOUND",
        });
      }

      const metrics =
        await prisma.creatorMetric.findMany({
          where: {
            socialAccountId: account.id,
          },
          orderBy: {
            recordedAt: "desc",
          },
        });

      return res.json({
        metrics,
      });
    } catch (error) {
      console.error("Get social metrics error:", error);

      return res.status(500).json({
        error: "SOCIAL_METRICS_FETCH_ERROR",
      });
    }
  }
);

/**
 * POST /api/social/accounts/:id/metrics
 *
 * El creador introduce/actualiza manualmente sus métricas.
 */
router.post(
  "/accounts/:id/metrics",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const account =
        await prisma.creatorSocialAccount.findFirst({
          where: {
            id: String(req.params.id),
            creatorId: creator.id,
          },
        });

      if (!account) {
        return res.status(404).json({
          error: "SOCIAL_ACCOUNT_NOT_FOUND",
        });
      }

      const {
        followers,
        following,
        posts,
        likes,
        comments,
        views,
        reach,
        impressions,
        engagementRate,
      } = req.body;

      if (
        followers === undefined ||
        !Number.isInteger(Number(followers)) ||
        Number(followers) < 0
      ) {
        return res.status(400).json({
          error: "INVALID_FOLLOWERS",
        });
      }

      const metric =
        await prisma.creatorMetric.create({
          data: {
            socialAccountId: account.id,

            followers: Number(followers),

            following:
              following !== undefined &&
              following !== null
                ? Number(following)
                : null,

            posts:
              posts !== undefined &&
              posts !== null
                ? Number(posts)
                : null,

            likes:
              likes !== undefined
                ? Number(likes)
                : 0,

            comments:
              comments !== undefined
                ? Number(comments)
                : 0,

            views:
              views !== undefined
                ? Number(views)
                : 0,

            reach:
              reach !== undefined &&
              reach !== null
                ? Number(reach)
                : null,

            impressions:
              impressions !== undefined &&
              impressions !== null
                ? Number(impressions)
                : null,

            engagementRate:
              engagementRate !== undefined
                ? Number(engagementRate)
                : 0,

            source: "CREATOR",
            verificationStatus: "UNVERIFIED",
          },
        });

      await prisma.creator.update({
        where: {
          id: creator.id,
        },
        data: {
          followers: Number(followers),
          engagementRate:
            engagementRate !== undefined
              ? Number(engagementRate)
              : creator.engagementRate,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: "CREATOR_METRICS_CREATED",
          entity: "CreatorMetric",
          entityId: metric.id,
          metadata: {
            socialAccountId: account.id,
            platform: account.platform,
          },
        },
      });

      return res.status(201).json({
        metric,
      });
    } catch (error) {
      console.error("Create social metric error:", error);

      return res.status(500).json({
        error: "SOCIAL_METRIC_CREATE_ERROR",
      });
    }
  }
);
/**
 * GET /api/social/metrics/pending
 *
 * Devuelve las métricas que están pendientes
 * de verificación por parte de ST.MARIA.
 *
 * Solo STAFF.
 */
router.get(
  "/metrics/pending",
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (req.user.role !== "STAFF") {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const metrics =
        await prisma.creatorMetric.findMany({
          where: {
            verificationStatus: "PENDING",
          },
          include: {
            socialAccount: {
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
              },
            },
          },
          orderBy: {
            recordedAt: "asc",
          },
        });

      return res.json({
        metrics,
      });
    } catch (error) {
      console.error(
        "Pending creator metrics error:",
        error
      );

      return res.status(500).json({
        error: "PENDING_METRICS_ERROR",
      });
    }
  }
);
/**
 * PATCH /api/social/metrics/:id/verify
 *
 * ST.MARIA verifica una métrica.
 */
router.patch(
  "/metrics/:id/verify",
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (req.user.role !== "STAFF") {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const metric =
        await prisma.creatorMetric.findUnique({
          where: {
            id: String(req.params.id),
          },
          include: {
            socialAccount: {
              include: {
                creator: true,
              },
            },
          },
        });

      if (!metric) {
        return res.status(404).json({
          error: "METRIC_NOT_FOUND",
        });
      }

      const updated =
        await prisma.creatorMetric.update({
          where: {
            id: metric.id,
          },
          data: {
            verificationStatus: "VERIFIED",
            source: "STMARIA",
            verifiedById: req.user.id,
            verifiedAt: new Date(),
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "CREATOR_METRIC_VERIFIED",
          entity: "CreatorMetric",
          entityId: metric.id,
          metadata: {
            creatorId:
              metric.socialAccount.creatorId,
            socialAccountId:
              metric.socialAccountId,
            platform:
              metric.socialAccount.platform,
          },
        },
      });

      return res.json({
        metric: updated,
      });
    } catch (error) {
      console.error(
        "Verify creator metric error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_METRIC_VERIFY_ERROR",
      });
    }
  }
);

/**
 * PATCH /api/social/metrics/:id/reject
 *
 * ST.MARIA rechaza una métrica.
 */
router.patch(
  "/metrics/:id/reject",
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (req.user.role !== "STAFF") {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const metric =
        await prisma.creatorMetric.findUnique({
          where: {
            id: String(req.params.id),
          },
          include: {
            socialAccount: {
              include: {
                creator: true,
              },
            },
          },
        });

      if (!metric) {
        return res.status(404).json({
          error: "METRIC_NOT_FOUND",
        });
      }

      const updated =
        await prisma.creatorMetric.update({
          where: {
            id: metric.id,
          },
          data: {
            verificationStatus: "REJECTED",
            verifiedById: null,
            verifiedAt: null,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "CREATOR_METRIC_REJECTED",
          entity: "CreatorMetric",
          entityId: metric.id,
          metadata: {
            creatorId:
              metric.socialAccount.creatorId,
            socialAccountId:
              metric.socialAccountId,
            platform:
              metric.socialAccount.platform,
          },
        },
      });

      return res.json({
        metric: updated,
      });
    } catch (error) {
      console.error(
        "Reject creator metric error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_METRIC_REJECT_ERROR",
      });
    }
  }
);
/**
 * PATCH /api/social/metrics/:id/request-verification
 *
 * El creador solicita que ST.MARIA verifique sus métricas.
 */
router.patch(
  "/metrics/:id/request-verification",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator =
        await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const metric =
        await prisma.creatorMetric.findFirst({
          where: {
            id: String(req.params.id),
            socialAccount: {
              creatorId: creator.id,
            },
          },
        });

      if (!metric) {
        return res.status(404).json({
          error: "METRIC_NOT_FOUND",
        });
      }

      if (
        metric.verificationStatus === "VERIFIED"
      ) {
        return res.status(400).json({
          error: "METRIC_ALREADY_VERIFIED",
        });
      }

      const updated =
        await prisma.creatorMetric.update({
          where: {
            id: metric.id,
          },
          data: {
            verificationStatus: "PENDING",
            verifiedById: null,
            verifiedAt: null,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: "CREATOR_METRIC_VERIFICATION_REQUESTED",
          entity: "CreatorMetric",
          entityId: metric.id,
          metadata: {
            creatorId: creator.id,
            socialAccountId:
              metric.socialAccountId,
          },
        },
      });

      return res.json({
        metric: updated,
      });
    } catch (error) {
      console.error(
        "Request metric verification error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_METRIC_VERIFICATION_REQUEST_ERROR",
      });
    }
  }
);
export default router;