import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";



const router = Router();
router.use(requireAuth);

/*
 * ==========================================
 * CONSTANTS
 * ==========================================
 */

const DELIVERABLE_STATUSES = [
  "PENDING",
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

type DeliverableStatusValue =
  (typeof DELIVERABLE_STATUSES)[number];

/*
 * ==========================================
 * HELPERS
 * ==========================================
 */

function isStaff(
  req: AuthenticatedRequest
) {
  return req.user?.role === "STAFF";
}

function normalizeStatus(
  value: unknown
): DeliverableStatusValue | null {
  if (!value) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .toUpperCase();

  if (
    DELIVERABLE_STATUSES.includes(
      normalized as DeliverableStatusValue
    )
  ) {
    return normalized as DeliverableStatusValue;
  }

  return null;
}

/*
 * Obtiene una colaboración para STAFF.
 *
 * STAFF puede gestionar cualquier
 * CampaignCreator de la plataforma.
 */
async function getStaffCollaboration(
  campaignCreatorId: string
) {
  return prisma.campaignCreator.findUnique({
    where: {
      id: campaignCreatorId,
    },

    include: {
      campaign: {
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
        include: {
          reviews: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

/*
 * ==========================================
 * GET /api/deliverables/collaboration/:campaignCreatorId
 * ==========================================
 *
 * Devuelve los entregables de una colaboración.
 *
 * De momento esta ruta pertenece al
 * backoffice de STAFF.
 */
router.get(
  "/collaboration/:campaignCreatorId",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!isStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const collaboration =
        await getStaffCollaboration(
          campaignCreatorId
        );

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
        deliverables:
          collaboration.deliverables,
      });
    } catch (error) {
      console.error(
        "Get collaboration deliverables error:",
        error
      );

      return res.status(500).json({
        error:
          "DELIVERABLES_FETCH_ERROR",
        message:
          "No se han podido cargar los entregables.",
      });
    }
  }
);

/*
 * ==========================================
 * POST /api/deliverables/collaboration/:campaignCreatorId
 * ==========================================
 *
 * STAFF crea un entregable para un creador
 * dentro de una campaña.
 */
router.post(
  "/collaboration/:campaignCreatorId",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!isStaff(request)) {
        return res.status(403).json({
          error: "STAFF_ACCESS_REQUIRED",
        });
      }

      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const collaboration =
        await prisma.campaignCreator.findUnique({
          where: {
            id: campaignCreatorId,
          },

          select: {
            id: true,

            campaign: {
              select: {
                id: true,
                name: true,
              },
            },

            creator: {
              select: {
                id: true,
                username: true,
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

      const {
        type,
        platform,
        quantity,
        description,
        dueDate,
        contentUrl,
        notes,
      } = req.body ?? {};

      /*
       * TYPE
       */

      if (
        !type ||
        typeof type !== "string" ||
        !type.trim()
      ) {
        return res.status(400).json({
          error:
            "DELIVERABLE_TYPE_REQUIRED",
          message:
            "Indica el tipo de entregable.",
        });
      }

      /*
       * QUANTITY
       */

      const parsedQuantity =
        quantity === undefined ||
        quantity === null ||
        quantity === ""
          ? 1
          : Number(quantity);

      if (
        !Number.isInteger(
          parsedQuantity
        ) ||
        parsedQuantity < 1
      ) {
        return res.status(400).json({
          error:
            "INVALID_DELIVERABLE_QUANTITY",
          message:
            "La cantidad debe ser un número entero mayor que cero.",
        });
      }

      /*
       * DUE DATE
       */

      let parsedDueDate:
        | Date
        | null = null;

      if (dueDate) {
        parsedDueDate =
          new Date(dueDate);

        if (
          Number.isNaN(
            parsedDueDate.getTime()
          )
        ) {
          return res.status(400).json({
            error:
              "INVALID_DELIVERABLE_DUE_DATE",
            message:
              "La fecha límite no es válida.",
          });
        }
      }

      /*
       * CREATE
       */

      const deliverable =
        await prisma.deliverable.create({
          data: {
            campaignCreatorId,

            type: type.trim(),

            platform:
              platform &&
              String(platform).trim()
                ? String(
                    platform
                  ).trim()
                : null,

            quantity:
              parsedQuantity,

            description:
              description &&
              String(description).trim()
                ? String(
                    description
                  ).trim()
                : null,

            dueDate:
              parsedDueDate,

            status: "PENDING",

            contentUrl:
              contentUrl &&
              String(contentUrl).trim()
                ? String(
                    contentUrl
                  ).trim()
                : null,

            notes:
              notes &&
              String(notes).trim()
                ? String(
                    notes
                  ).trim()
                : null,
          },

          include: {
            reviews: true,
          },
        });

      await prisma.auditLog.create({
        data: {
          userId:
            request.user.id,

          action:
            "DELIVERABLE_CREATED",

          entity:
            "Deliverable",

          entityId:
            deliverable.id,

          metadata: {
            campaignCreatorId,
            campaignId:
              collaboration.campaign.id,
            creatorId:
              collaboration.creator.id,
            type:
              deliverable.type,
          },
        },
      });

      return res.status(201).json({
        deliverable,
      });
    } catch (error) {
      console.error(
        "Create deliverable error:",
        error
      );

      return res.status(500).json({
        error:
          "DELIVERABLE_CREATION_ERROR",
        message:
          "No se ha podido crear el entregable.",
      });
    }
  }
);

/*
 * ==========================================
 * GET /api/deliverables/:id
 * ==========================================
 *
 * STAFF obtiene el detalle de un entregable.
 */
router.get(
  "/:id",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!isStaff(request)) {
        return res.status(403).json({
          error:
            "STAFF_ACCESS_REQUIRED",
        });
      }

      const deliverable =
        await prisma.deliverable.findUnique({
          where: {
            id: String(
              req.params.id
            ),
          },

          include: {
            campaignCreator: {
              include: {
                campaign: {
                  include: {
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
              },
            },

            reviews: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },

              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      if (!deliverable) {
        return res.status(404).json({
          error:
            "DELIVERABLE_NOT_FOUND",
        });
      }

      return res.json({
        deliverable,
      });
    } catch (error) {
      console.error(
        "Get deliverable error:",
        error
      );

      return res.status(500).json({
        error:
          "DELIVERABLE_FETCH_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * PATCH /api/deliverables/:id
 * ==========================================
 *
 * STAFF modifica y revisa un entregable.
 */
router.patch(
  "/:id",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!isStaff(request)) {
        return res.status(403).json({
          error:
            "STAFF_ACCESS_REQUIRED",
        });
      }

      const deliverableId =
        String(req.params.id);

      const existing =
        await prisma.deliverable.findUnique({
          where: {
            id: deliverableId,
          },

          include: {
            campaignCreator: {
              select: {
                id: true,
                creatorId: true,
                campaignId: true,
              },
            },
          },
        });

      if (!existing) {
        return res.status(404).json({
          error:
            "DELIVERABLE_NOT_FOUND",
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
      } = req.body ?? {};

      /*
       * ==========================================
       * STATUS
       * ==========================================
       */

      let normalizedStatus:
        | DeliverableStatusValue
        | undefined;

      if (status !== undefined) {
        const parsedStatus =
          normalizeStatus(status);

        if (!parsedStatus) {
          return res.status(400).json({
            error:
              "INVALID_DELIVERABLE_STATUS",
            message:
              "El estado del entregable no es válido.",
          });
        }

        normalizedStatus =
          parsedStatus;
      }

      /*
       * IMPORTANTE:
       *
       * Validamos feedback ANTES de modificar
       * el Deliverable.
       */
      if (
        normalizedStatus ===
          "REJECTED" &&
        (
          !feedback ||
          typeof feedback !==
            "string" ||
          !feedback.trim()
        )
      ) {
        return res.status(400).json({
          error:
            "FEEDBACK_REQUIRED",
          message:
            "Debes indicar qué cambios debe realizar el creador.",
        });
      }

      /*
       * ==========================================
       * QUANTITY
       * ==========================================
       */

      let parsedQuantity:
        | number
        | undefined;

      if (quantity !== undefined) {
        parsedQuantity =
          Number(quantity);

        if (
          !Number.isInteger(
            parsedQuantity
          ) ||
          parsedQuantity < 1
        ) {
          return res.status(400).json({
            error:
              "INVALID_DELIVERABLE_QUANTITY",
          });
        }
      }

      /*
       * ==========================================
       * DUE DATE
       * ==========================================
       */

      let parsedDueDate:
        | Date
        | null
        | undefined;

      if (dueDate !== undefined) {
        if (
          dueDate === null ||
          dueDate === ""
        ) {
          parsedDueDate = null;
        } else {
          parsedDueDate =
            new Date(dueDate);

          if (
            Number.isNaN(
              parsedDueDate.getTime()
            )
          ) {
            return res.status(400).json({
              error:
                "INVALID_DELIVERABLE_DUE_DATE",
            });
          }
        }
      }

      /*
       * ==========================================
       * UPDATE + REVIEW
       * ==========================================
       */

      const updated =
        await prisma.$transaction(
          async (tx) => {
            const data: any = {};

            if (type !== undefined) {
              if (
                typeof type !==
                  "string" ||
                !type.trim()
              ) {
                throw new Error(
                  "DELIVERABLE_TYPE_REQUIRED"
                );
              }

              data.type =
                type.trim();
            }

            if (
              platform !== undefined
            ) {
              data.platform =
                platform === null ||
                platform === ""
                  ? null
                  : String(
                      platform
                    ).trim() ||
                    null;
            }

            if (
              parsedQuantity !==
              undefined
            ) {
              data.quantity =
                parsedQuantity;
            }

            if (
              description !==
              undefined
            ) {
              data.description =
                description === null ||
                description === ""
                  ? null
                  : String(
                      description
                    ).trim() ||
                    null;
            }

            if (
              parsedDueDate !==
              undefined
            ) {
              data.dueDate =
                parsedDueDate;
            }

            if (
              contentUrl !==
              undefined
            ) {
              data.contentUrl =
                contentUrl === null ||
                contentUrl === ""
                  ? null
                  : String(
                      contentUrl
                    ).trim() ||
                    null;
            }

            if (
              notes !== undefined
            ) {
              data.notes =
                notes === null ||
                notes === ""
                  ? null
                  : String(
                      notes
                    ).trim() ||
                    null;
            }

            /*
             * STATUS TIMESTAMPS
             */

            if (
              normalizedStatus !==
              undefined
            ) {
              data.status =
                normalizedStatus;

              if (
                normalizedStatus ===
                "SUBMITTED"
              ) {
                data.submittedAt =
                  new Date();

                data.approvedAt =
                  null;
              }

              if (
                normalizedStatus ===
                "IN_REVIEW"
              ) {
                if (
                  !existing.submittedAt
                ) {
                  data.submittedAt =
                    new Date();
                }

                data.approvedAt =
                  null;
              }

              if (
                normalizedStatus ===
                "APPROVED"
              ) {
                data.approvedAt =
                  new Date();
              }

              if (
                normalizedStatus ===
                "REJECTED"
              ) {
                data.approvedAt =
                  null;

                data.revisionCount = {
                  increment: 1,
                };
              }

              if (
                normalizedStatus ===
                "PENDING"
              ) {
                data.approvedAt =
                  null;
              }
            }

            const deliverable =
              await tx.deliverable.update({
                where: {
                  id: deliverableId,
                },

                data,

                include: {
                  reviews: {
                    include: {
                      createdBy: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },

                    orderBy: {
                      createdAt:
                        "asc",
                    },
                  },
                },
              });

            /*
             * ======================================
             * REVIEW HISTORY
             * ======================================
             */

            if (
              normalizedStatus ===
              "REJECTED"
            ) {
              await tx.deliverableReview.create({
                data: {
                  deliverableId,

                  status:
                    "REJECTED",

                  feedback:
                    feedback.trim(),

                  createdById:
                    request.user!.id,
                },
              });
            }

            if (
              normalizedStatus ===
              "APPROVED"
            ) {
              await tx.deliverableReview.create({
                data: {
                  deliverableId,

                  status:
                    "APPROVED",

                  feedback:
                    typeof feedback ===
                      "string"
                      ? feedback.trim()
                      : "",

                  createdById:
                    request.user!.id,
                },
              });
            }

            if (
              normalizedStatus ===
              "IN_REVIEW"
            ) {
              await tx.deliverableReview.create({
                data: {
                  deliverableId,

                  status:
                    "IN_REVIEW",

                  feedback:
                    typeof feedback ===
                      "string"
                      ? feedback.trim()
                      : "",

                  createdById:
                    request.user!.id,
                },
              });
            }

            /*
             * AUDIT
             */

            await tx.auditLog.create({
              data: {
                userId:
                  request.user!.id,

                action:
                  "DELIVERABLE_UPDATED",

                entity:
                  "Deliverable",

                entityId:
                  deliverableId,

                metadata: {
                  campaignId:
                    existing
                      .campaignCreator
                      .campaignId,

                  creatorId:
                    existing
                      .campaignCreator
                      .creatorId,

                  previousStatus:
                    existing.status,

                  status:
                    normalizedStatus ??
                    existing.status,
                },
              },
            });

            /*
             * Recargamos para incluir
             * la review recién creada.
             */

            return tx.deliverable.findUnique({
              where: {
                id: deliverableId,
              },

              include: {
                reviews: {
                  include: {
                    createdBy: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },

                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },
              },
            });
          }
        );

      return res.json({
        deliverable: updated,
      });
    } catch (error) {
      console.error(
        "Update deliverable error:",
        error
      );

      if (
        error instanceof Error &&
        error.message ===
          "DELIVERABLE_TYPE_REQUIRED"
      ) {
        return res.status(400).json({
          error:
            "DELIVERABLE_TYPE_REQUIRED",
        });
      }

      return res.status(500).json({
        error:
          "DELIVERABLE_UPDATE_ERROR",
        message:
          "No se ha podido actualizar el entregable.",
      });
    }
  }
);

/*
 * ==========================================
 * DELETE /api/deliverables/:id
 * ==========================================
 *
 * STAFF elimina un entregable.
 */
router.delete(
  "/:id",
  async (req, res) => {
    try {
      const request =
        req as AuthenticatedRequest;

      if (!request.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (!isStaff(request)) {
        return res.status(403).json({
          error:
            "STAFF_ACCESS_REQUIRED",
        });
      }

      const deliverableId =
        String(req.params.id);

      const deliverable =
        await prisma.deliverable.findUnique({
          where: {
            id: deliverableId,
          },

          include: {
            campaignCreator: {
              select: {
                campaignId: true,
                creatorId: true,
              },
            },
          },
        });

      if (!deliverable) {
        return res.status(404).json({
          error:
            "DELIVERABLE_NOT_FOUND",
        });
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.deliverable.delete({
            where: {
              id: deliverableId,
            },
          });

          await tx.auditLog.create({
            data: {
              userId:
                request.user!.id,

              action:
                "DELIVERABLE_DELETED",

              entity:
                "Deliverable",

              entityId:
                deliverableId,

              metadata: {
                campaignId:
                  deliverable
                    .campaignCreator
                    .campaignId,

                creatorId:
                  deliverable
                    .campaignCreator
                    .creatorId,

                type:
                  deliverable.type,
              },
            },
          });
        }
      );

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "Delete deliverable error:",
        error
      );

      return res.status(500).json({
        error:
          "DELIVERABLE_DELETE_ERROR",
      });
    }
  }
);

export default router;