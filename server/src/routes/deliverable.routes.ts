import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

const validStatuses = [
  "PENDING",
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
];

async function getBrandCollaboration(
  req: AuthenticatedRequest,
  campaignCreatorId: string
) {
  if (!req.user || req.user.role !== "BRAND") {
    return null;
  }

  return prisma.campaignCreator.findFirst({
    where: {
      id: campaignCreatorId,
      campaign: {
        brand: {
          userId: req.user.id,
        },
      },
    },
    include: {
      campaign: true,
      creator: {
        include: {
          user: true,
        },
      },
    },
  });
}

/**
 * GET /api/deliverables/collaboration/:campaignCreatorId
 */
router.get(
  "/collaboration/:campaignCreatorId",
  async (req: AuthenticatedRequest, res) => {
    try {
      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const collaboration =
        await getBrandCollaboration(
          req,
          campaignCreatorId
        );

      if (!collaboration) {
        return res.status(404).json({
          error: "COLLABORATION_NOT_FOUND",
        });
      }

      const deliverables =
        await prisma.deliverable.findMany({
          where: {
            campaignCreatorId,
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
                    email: true,
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
        "Error fetching deliverables:",
        error
      );

      return res.status(500).json({
        error: "DELIVERABLES_FETCH_ERROR",
      });
    }
  }
);

/**
 * POST /api/deliverables/collaboration/:campaignCreatorId
 */
router.post(
  "/collaboration/:campaignCreatorId",
  async (req: AuthenticatedRequest, res) => {
    try {
      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const collaboration =
        await getBrandCollaboration(
          req,
          campaignCreatorId
        );

      if (!collaboration) {
        return res.status(404).json({
          error: "COLLABORATION_NOT_FOUND",
        });
      }

      const {
        type,
        platform,
        quantity,
        description,
        dueDate,
      } = req.body;

      if (!type || typeof type !== "string") {
        return res.status(400).json({
          error: "TYPE_REQUIRED",
        });
      }

      const parsedQuantity = Number(quantity || 1);

      if (
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 1
      ) {
        return res.status(400).json({
          error: "INVALID_QUANTITY",
        });
      }

      let parsedDueDate: Date | undefined;

      if (dueDate) {
        parsedDueDate = new Date(dueDate);

        if (Number.isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            error: "INVALID_DUE_DATE",
          });
        }
      }

      const deliverable =
        await prisma.deliverable.create({
          data: {
            campaignCreatorId,
            type: type.trim(),
            platform:
              typeof platform === "string" &&
              platform.trim()
                ? platform.trim()
                : null,
            quantity: parsedQuantity,
            description:
              typeof description === "string" &&
              description.trim()
                ? description.trim()
                : null,
            dueDate: parsedDueDate,
          },
          include: {
            reviews: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: "DELIVERABLE_CREATED",
          entity: "Deliverable",
          entityId: deliverable.id,
          metadata: {
            campaignCreatorId,
            type: deliverable.type,
          },
        },
      });

      return res.status(201).json({
        deliverable,
      });
    } catch (error) {
      console.error(
        "Error creating deliverable:",
        error
      );

      return res.status(500).json({
        error: "DELIVERABLE_CREATE_ERROR",
      });
    }
  }
);

/**
 * PATCH /api/deliverables/:id
 *
 * Uso principal por parte de BRAND.
 */
router.patch(
  "/:id",
  async (req: AuthenticatedRequest, res) => {
    try {
      const id = String(req.params.id);

      if (!req.user || req.user.role !== "BRAND") {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const existing =
        await prisma.deliverable.findFirst({
          where: {
            id,
            campaignCreator: {
              campaign: {
                brand: {
                  userId: req.user.id,
                },
              },
            },
          },
          include: {
            campaignCreator: {
              include: {
                campaign: true,
                creator: true,
              },
            },
          },
        });

      if (!existing) {
        return res.status(404).json({
          error: "DELIVERABLE_NOT_FOUND",
        });
      }

      const {
        type,
        platform,
        quantity,
        description,
        dueDate,
        status,
        contentUrl,
        notes,
        feedback,
      } = req.body;

      if (
        status !== undefined &&
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          error: "INVALID_STATUS",
        });
      }

      if (
        quantity !== undefined &&
        (!Number.isInteger(Number(quantity)) ||
          Number(quantity) < 1)
      ) {
        return res.status(400).json({
          error: "INVALID_QUANTITY",
        });
      }

      let parsedDueDate:
        | Date
        | null
        | undefined = undefined;

      if (dueDate !== undefined) {
        if (!dueDate) {
          parsedDueDate = null;
        } else {
          const date = new Date(dueDate);

          if (Number.isNaN(date.getTime())) {
            return res.status(400).json({
              error: "INVALID_DUE_DATE",
            });
          }

          parsedDueDate = date;
        }
      }

      const nextStatus =
        status !== undefined
          ? status
          : existing.status;

      const updateData: any = {
        type:
          type !== undefined
            ? String(type).trim()
            : undefined,

        platform:
          platform !== undefined
            ? platform
              ? String(platform).trim()
              : null
            : undefined,

        quantity:
          quantity !== undefined
            ? Number(quantity)
            : undefined,

        description:
          description !== undefined
            ? description
              ? String(description).trim()
              : null
            : undefined,

        dueDate: parsedDueDate,

        contentUrl:
          contentUrl !== undefined
            ? contentUrl
              ? String(contentUrl).trim()
              : null
            : undefined,

        notes:
          notes !== undefined
            ? notes
              ? String(notes).trim()
              : null
            : undefined,

        status: nextStatus,
      };

      if (nextStatus === "APPROVED") {
        updateData.approvedAt =
          existing.approvedAt || new Date();
      }

      if (
        nextStatus !== "APPROVED" &&
        status !== undefined
      ) {
        updateData.approvedAt = null;
      }

      if (nextStatus === "SUBMITTED") {
        updateData.submittedAt =
          existing.submittedAt || new Date();
      }

      const deliverable =
        await prisma.deliverable.update({
          where: {
            id,
          },
          data: updateData,
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
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

      /*
       * Si la marca solicita cambios,
       * creamos una revisión.
       */
      if (nextStatus === "REJECTED") {
        const cleanFeedback =
          typeof feedback === "string"
            ? feedback.trim()
            : "";

        if (!cleanFeedback) {
          return res.status(400).json({
            error: "FEEDBACK_REQUIRED",
            message:
              "Debes indicar qué cambios debe realizar el creador.",
          });
        }

        await prisma.deliverableReview.create({
          data: {
            deliverableId: id,
            status: "REJECTED",
            feedback: cleanFeedback,
            createdById: req.user.id,
          },
        });

        await prisma.deliverable.update({
          where: {
            id,
          },
          data: {
            revisionCount: {
              increment: 1,
            },
          },
        });
      }

      if (nextStatus === "IN_REVIEW") {
        const cleanFeedback =
          typeof feedback === "string"
            ? feedback.trim()
            : "";

        if (cleanFeedback) {
          await prisma.deliverableReview.create({
            data: {
              deliverableId: id,
              status: "IN_REVIEW",
              feedback: cleanFeedback,
              createdById: req.user.id,
            },
          });
        }
      }

      if (nextStatus === "APPROVED") {
        await prisma.deliverableReview.create({
          data: {
            deliverableId: id,
            status: "APPROVED",
            feedback:
              typeof feedback === "string" &&
              feedback.trim()
                ? feedback.trim()
                : "Entregable aprobado.",
            createdById: req.user.id,
          },
        });
      }

      const finalDeliverable =
        await prisma.deliverable.findUnique({
          where: {
            id,
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
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "DELIVERABLE_UPDATED",
          entity: "Deliverable",
          entityId: id,
          metadata: {
            status: nextStatus,
          },
        },
      });

      return res.json({
        deliverable: finalDeliverable,
      });
    } catch (error) {
      console.error(
        "Error updating deliverable:",
        error
      );

      return res.status(500).json({
        error: "DELIVERABLE_UPDATE_ERROR",
      });
    }
  }
);

export default router;