import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

/**
 * Comprueba que el usuario autenticado es CREATOR
 * y devuelve su perfil Creator.
 */
async function getAuthenticatedCreator(req: AuthenticatedRequest) {
  if (!req.user) {
    return null;
  }

  if (req.user.role !== "CREATOR") {
    return null;
  }

  const creator = await prisma.creator.findUnique({
    where: {
      userId: req.user.id,
    },
    include: {
      user: true,
    },
  });

  return creator;
}

/**
 * GET /api/creator-portal/dashboard
 *
 * Datos resumidos para el dashboard del creador.
 */
router.get(
  "/dashboard",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const collaborations =
        await prisma.campaignCreator.findMany({
          where: {
            creatorId: creator.id,
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                description: true,
                platform: true,
                category: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
            deliverables: {
              select: {
                id: true,
                type: true,
                platform: true,
                quantity: true,
                description: true,
                dueDate: true,
                status: true,
                contentUrl: true,
                submittedAt: true,
                approvedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      const activeStatuses = [
        "PENDING",
        "CONTACTED",
        "ACCEPTED",
        "SELECTED",
        "PRODUCT_SENT",
        "CONTENT_PENDING",
        "CONTENT_RECEIVED",
      ];

      const activeCampaigns = collaborations.filter((item) =>
        activeStatuses.includes(item.status)
      ).length;

      const pendingDeliverables =
        collaborations.reduce((total, collaboration) => {
          return (
            total +
            collaboration.deliverables.filter(
              (deliverable) =>
                deliverable.status !== "APPROVED"
            ).length
          );
        }, 0);

      const totalEarned = collaborations.reduce(
        (total, collaboration) => {
          if (collaboration.paidAt && collaboration.fee) {
            return total + Number(collaboration.fee);
          }

          return total;
        },
        0
      );

      const pendingPayments = collaborations.reduce(
        (total, collaboration) => {
          if (!collaboration.paidAt && collaboration.fee) {
            return total + Number(collaboration.fee);
          }

          return total;
        },
        0
      );

      return res.json({
        creator: {
          id: creator.id,
          username: creator.username,
          name: creator.user.name,
        },
        stats: {
          activeCampaigns,
          collaborations: collaborations.length,
          pendingDeliverables,
          totalEarned,
          pendingPayments,
        },
      });
    } catch (error) {
      console.error(
        "Creator dashboard error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_DASHBOARD_ERROR",
      });
    }
  }
);

/**
 * GET /api/creator-portal/collaborations
 *
 * Devuelve únicamente las colaboraciones del creador
 * autenticado.
 */
router.get(
  "/collaborations",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const collaborations =
        await prisma.campaignCreator.findMany({
          where: {
            creatorId: creator.id,
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                description: true,
                platform: true,
                category: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
            deliverables: {
              select: {
                id: true,
                type: true,
                platform: true,
                quantity: true,
                description: true,
                dueDate: true,
                status: true,
                contentUrl: true,
                submittedAt: true,
                approvedAt: true,
              },
              orderBy: {
                dueDate: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      return res.json({
        collaborations,
      });
    } catch (error) {
      console.error(
        "Creator collaborations error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_COLLABORATIONS_ERROR",
      });
    }
  }
);

/**
 * GET /api/creator-portal/collaborations/:id
 *
 * Detalle de una colaboración.
 * El creador solamente puede consultar las suyas.
 */
router.get(
  "/collaborations/:id",
  async (req: AuthenticatedRequest, res) => {
    try {
      const id = String(req.params.id);
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const collaboration =
        await prisma.campaignCreator.findFirst({
          where: {
            id,
            creatorId: creator.id,
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                description: true,
                platform: true,
                category: true,
                status: true,
                objective: true,
                startDate: true,
                endDate: true,
              },
            },
            creator: {
              select: {
                id: true,
                username: true,
                bio: true,
                location: true,
                followers: true,
                engagementRate: true,
                categories: true,
                platforms: true,
              },
            },
            deliverables: {
              orderBy: {
                dueDate: "asc",
              },
            },
          },
        });

      if (!collaboration) {
        return res.status(404).json({
          error: "COLLABORATION_NOT_FOUND",
        });
      }

      return res.json({
        collaboration,
      });
    } catch (error) {
      console.error(
        "Creator collaboration detail error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_COLLABORATION_ERROR",
      });
    }
  }
);

/**
 * PATCH /api/creator-portal/collaborations/:id/response
 *
 * El creador puede aceptar o rechazar una colaboración.
 *
 * IMPORTANTE:
 * Nunca permite modificar el fee.
 */
router.patch(
  "/collaborations/:id/response",
  async (req: AuthenticatedRequest, res) => {
    try {
      const id = String(req.params.id);
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const collaboration =
        await prisma.campaignCreator.findFirst({
          where: {
            id,
            creatorId: creator.id,
          },
        });

      if (!collaboration) {
        return res.status(404).json({
          error: "COLLABORATION_NOT_FOUND",
        });
      }

      const { response } = req.body;

      if (
        response !== "ACCEPTED" &&
        response !== "REJECTED"
      ) {
        return res.status(400).json({
          error: "INVALID_RESPONSE",
          message:
            "La respuesta debe ser ACCEPTED o REJECTED.",
        });
      }

      const updated =
        await prisma.campaignCreator.update({
          where: {
            id: collaboration.id,
          },
          data: {
            status: response,
            acceptedAt:
              response === "ACCEPTED"
                ? new Date()
                : null,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action:
            response === "ACCEPTED"
              ? "COLLABORATION_ACCEPTED"
              : "COLLABORATION_REJECTED",
          entity: "CampaignCreator",
          entityId: collaboration.id,
          metadata: {
            creatorId: creator.id,
          },
        },
      });

      return res.json({
        collaboration: updated,
      });
    } catch (error) {
      console.error(
        "Creator collaboration response error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_RESPONSE_ERROR",
      });
    }
  }
);

/**
 * GET /api/creator-portal/collaborations/:id/deliverables
 */
router.get(
  "/collaborations/:id/deliverables",
  async (req: AuthenticatedRequest, res) => {
    try {
        const id = String(req.params.id);
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const collaboration =
        await prisma.campaignCreator.findFirst({
          where: {
            id,
            creatorId: creator.id,
          },
        });

      if (!collaboration) {
        return res.status(404).json({
          error: "COLLABORATION_NOT_FOUND",
        });
      }

     const deliverables =
  await prisma.deliverable.findMany({
    where: {
      campaignCreatorId: id,
    },
    include: {
      reviews: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

      return res.json({
        deliverables,
      });
    } catch (error) {
      console.error(
        "Creator deliverables error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_DELIVERABLES_ERROR",
      });
    }
  }
);

/**
 * PATCH /api/creator-portal/deliverables/:id
 *
 * El creador puede:
 * - subir/enviar URL de contenido
 * - añadir notas
 * - enviar el entregable a revisión
 *
 * El creador NO puede:
 * - aprobar
 * - rechazar
 * - marcar como pagado
 * - modificar fechas
 * - modificar cantidad
 */

router.patch(
  "/deliverables/:id",
  async (req: AuthenticatedRequest, res) => {
    try {
      const id = String(req.params.id);

      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const deliverable =
        await prisma.deliverable.findFirst({
          where: {
            id,
            campaignCreator: {
              creatorId: creator.id,
            },
          },
          include: {
            campaignCreator: {
              include: {
                campaign: true,
              },
            },
            reviews: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

      if (!deliverable) {
        return res.status(404).json({
          error: "DELIVERABLE_NOT_FOUND",
        });
      }

      const {
        contentUrl,
        notes,
        status,
      } = req.body;

      const data: {
        contentUrl?: string | null;
        notes?: string | null;
        status?: "SUBMITTED";
        submittedAt?: Date;
      } = {};

      /*
       * CONTENT URL
       */
      if (contentUrl !== undefined) {
        if (
          contentUrl !== null &&
          typeof contentUrl !== "string"
        ) {
          return res.status(400).json({
            error: "INVALID_CONTENT_URL",
          });
        }

        data.contentUrl =
          contentUrl === null
            ? null
            : contentUrl.trim() || null;
      }

      /*
       * NOTES
       */
      if (notes !== undefined) {
        if (
          notes !== null &&
          typeof notes !== "string"
        ) {
          return res.status(400).json({
            error: "INVALID_NOTES",
          });
        }

        data.notes =
          notes === null
            ? null
            : notes.trim() || null;
      }

      /*
       * STATUS
       *
       * El creador solamente puede enviar
       * el contenido para revisión.
       */
      if (status !== undefined) {
        if (status !== "SUBMITTED") {
          return res.status(403).json({
            error: "INVALID_CREATOR_STATUS",
            message:
              "El creador solamente puede enviar el contenido a revisión.",
          });
        }

        data.status = "SUBMITTED";
        data.submittedAt = new Date();
      }

      /*
       * Evitamos PATCH vacíos.
       */
      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error: "NO_CHANGES",
        });
      }

      /*
       * Si el entregable estaba rechazado y el creador
       * vuelve a enviarlo, vuelve a SUBMITTED.
       *
       * No eliminamos ninguna revisión anterior.
       */
      if (
        deliverable.status === "REJECTED" &&
        status === "SUBMITTED"
      ) {
        data.status = "SUBMITTED";
        data.submittedAt = new Date();
      }

      const updated =
        await prisma.deliverable.update({
          where: {
            id: deliverable.id,
          },
          data,
          include: {
            reviews: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

      /*
       * Audit log
       */
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: "CREATOR_DELIVERABLE_UPDATED",
          entity: "Deliverable",
          entityId: deliverable.id,
          metadata: {
            campaignCreatorId:
              deliverable.campaignCreatorId,
            previousStatus:
              deliverable.status,
            newStatus:
              updated.status,
          },
        },
      });

      return res.json({
        deliverable: updated,
      });
    } catch (error) {
      console.error(
        "Creator deliverable update error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_DELIVERABLE_UPDATE_ERROR",
      });
    }
  }
);


/**
 * GET /api/creator-portal/payments
 *
 * Historial económico del creador.
 *
 * No procesa pagos.
 * Stripe se incorporará posteriormente.
 */
router.get(
  "/payments",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const collaborations =
        await prisma.campaignCreator.findMany({
          where: {
            creatorId: creator.id,
          },
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
                platform: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      const payments = collaborations.map(
        (collaboration) => ({
          id: collaboration.id,
          campaignId: collaboration.campaignId,
          campaignName:
            collaboration.campaign.name,
          platform:
            collaboration.campaign.platform,
          fee: collaboration.fee
            ? Number(collaboration.fee)
            : 0,
          status: collaboration.paidAt
            ? "PAID"
            : "PENDING",
          paidAt: collaboration.paidAt,
          collaborationStatus:
            collaboration.status,
        })
      );

      const totalEarned = payments
        .filter((payment) => payment.status === "PAID")
        .reduce(
          (total, payment) =>
            total + payment.fee,
          0
        );

      const pendingAmount = payments
        .filter(
          (payment) => payment.status === "PENDING"
        )
        .reduce(
          (total, payment) =>
            total + payment.fee,
          0
        );

      return res.json({
        payments,
        summary: {
          totalEarned,
          pendingAmount,
          totalCollaborations: payments.length,
          paidCollaborations: payments.filter(
            (payment) =>
              payment.status === "PAID"
          ).length,
          pendingCollaborations: payments.filter(
            (payment) =>
              payment.status === "PENDING"
          ).length,
        },
      });
    } catch (error) {
      console.error(
        "Creator payments error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_PAYMENTS_ERROR",
      });
    }
  }
);

/**
 * GET /api/creator-portal/profile
 */
router.get(
  "/profile",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      return res.json({
        creator: {
          id: creator.id,
          username: creator.username,
          name: creator.user.name,
          email: creator.user.email,
          bio: creator.bio,
          location: creator.location,
          followers: creator.followers,
          engagementRate:
            creator.engagementRate,
          categories: creator.categories,
          platforms: creator.platforms,
        },
      });
    } catch (error) {
      console.error(
        "Creator profile error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_PROFILE_ERROR",
      });
    }
  }
);

/**
 * PATCH /api/creator-portal/profile
 *
 * Campos que el creador puede editar.
 *
 * Followers y engagementRate NO se pueden modificar
 * desde este endpoint.
 */
router.patch(
  "/profile",
  async (req: AuthenticatedRequest, res) => {
    try {
      const creator = await getAuthenticatedCreator(req);

      if (!creator) {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const {
        username,
        bio,
        location,
        categories,
        platforms,
        name,
      } = req.body;

      if (
        username !== undefined &&
        (typeof username !== "string" ||
          username.trim().length < 2)
      ) {
        return res.status(400).json({
          error: "INVALID_USERNAME",
        });
      }

      if (
        bio !== undefined &&
        bio !== null &&
        typeof bio !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_BIO",
        });
      }

      if (
        location !== undefined &&
        location !== null &&
        typeof location !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_LOCATION",
        });
      }

      if (
        categories !== undefined &&
        (!Array.isArray(categories) ||
          categories.some(
            (item) => typeof item !== "string"
          ))
      ) {
        return res.status(400).json({
          error: "INVALID_CATEGORIES",
        });
      }

      if (
        platforms !== undefined &&
        (!Array.isArray(platforms) ||
          platforms.some(
            (item) => typeof item !== "string"
          ))
      ) {
        return res.status(400).json({
          error: "INVALID_PLATFORMS",
        });
      }

      const normalizedUsername =
        username !== undefined
          ? username.trim()
          : undefined;

      if (
        normalizedUsername &&
        normalizedUsername !== creator.username
      ) {
        const existing =
          await prisma.creator.findUnique({
            where: {
              username: normalizedUsername,
            },
          });

        if (existing) {
          return res.status(409).json({
            error: "USERNAME_ALREADY_EXISTS",
          });
        }
      }

      const updatedCreator =
        await prisma.creator.update({
          where: {
            id: creator.id,
          },
          data: {
            ...(normalizedUsername !== undefined && {
              username: normalizedUsername,
            }),
            ...(bio !== undefined && {
              bio,
            }),
            ...(location !== undefined && {
              location,
            }),
            ...(categories !== undefined && {
              categories,
            }),
            ...(platforms !== undefined && {
              platforms,
            }),
          },
        });

      if (
        name !== undefined &&
        typeof name === "string" &&
        name.trim().length >= 2
      ) {
        await prisma.user.update({
          where: {
            id: req.user!.id,
          },
          data: {
            name: name.trim(),
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: "CREATOR_PROFILE_UPDATED",
          entity: "Creator",
          entityId: creator.id,
        },
      });

      const finalCreator =
        await prisma.creator.findUnique({
          where: {
            id: creator.id,
          },
          include: {
            user: true,
          },
        });

      return res.json({
        creator: {
          id: finalCreator!.id,
          username: finalCreator!.username,
          name: finalCreator!.user.name,
          email: finalCreator!.user.email,
          bio: finalCreator!.bio,
          location: finalCreator!.location,
          followers: finalCreator!.followers,
          engagementRate:
            finalCreator!.engagementRate,
          categories: finalCreator!.categories,
          platforms: finalCreator!.platforms,
        },
      });
    } catch (error) {
      console.error(
        "Creator profile update error:",
        error
      );

      return res.status(500).json({
        error: "CREATOR_PROFILE_UPDATE_ERROR",
      });
    }
  }
);

export default router;