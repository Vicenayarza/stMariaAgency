import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import {
  createNotification,
  notifyStaff,
} from "../services/notification.service.js";
import { sendCampaignNotificationEmail } from "../services/mail.service.js";
import { dispatchNotification } from "../services/notification-dispatch.service.js";



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
function getLatestReviewId(
  reviews: Array<{
    id: string;
    status: string;
  }>,
  status: string
): string | null {
  const matchingReviews = reviews.filter(
    (review) => review.status === status
  );

  return matchingReviews.length > 0
    ? matchingReviews[matchingReviews.length - 1].id
    : null;
}

function isStaff(
  req: AuthenticatedRequest
) {
  return req.user?.role === "STAFF";
}

async function isCampaignDeleted(campaignId: string): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });

  return !campaign || campaign.status === "DELETED";
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
 * GET /api/deliverables/brand/collaboration/:campaignCreatorId
 *
 * Consulta de entregables para la marca propietaria.
 * Solo lectura.
 */
router.get(
  "/brand/collaboration/:campaignCreatorId",
  async (req, res) => {
    try {
      const request = req as AuthenticatedRequest;
      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "BRAND") {
        return res.status(403).json({
          error: "BRAND_ACCESS_REQUIRED",
        });
      }

      const membership = user.brandMemberships?.[0];

      if (!membership) {
        return res.status(403).json({
          error: "BRAND_MEMBERSHIP_REQUIRED",
        });
      }

      if (
  !membership.canViewCampaigns ||
  !membership.canViewDeliverables
) {
        return res.status(403).json({
          error: "BRAND_PERMISSION_DENIED",
        });
      }

      const campaignCreatorId = String(
        req.params.campaignCreatorId
      );

      const collaboration =
        await prisma.campaignCreator.findFirst({
          where: {
            id: campaignCreatorId,
            campaign: {
              brandId: membership.brandId,
              status: {
                not: "DELETED",
              },
            },
          },

          select: {
            id: true,
            campaignId: true,
            creatorId: true,
            status: true,

            campaign: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },

            creator: {
              select: {
                id: true,
                username: true,
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
    publishedAt: true,
    publishedUrl: true,
    publicationVerifiedAt: true,
  },
  orderBy: {
    createdAt: "asc",
  },
},
          },
        });

      if (!collaboration) {
        return res.status(404).json({
          error: "CAMPAIGN_CREATOR_NOT_FOUND",
          message:
            "La colaboración no existe o no tienes acceso.",
        });
      }

      return res.json({
        collaboration,
        deliverables: collaboration.deliverables,
      });
    } catch (error) {
      console.error(
        "Get brand collaboration deliverables error:",
        error
      );

      return res.status(500).json({
        error: "DELIVERABLES_FETCH_ERROR",
        message:
          "No se han podido cargar los entregables.",
      });
    }
  }
);
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
    user: {
      select: {
        id: true,
      },
    },
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
      if (await isCampaignDeleted(collaboration.campaign.id)) {
  return res.status(409).json({
    error: "CAMPAIGN_DELETED",
    message: "No puedes crear entregables en una campaña eliminada.",
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

      // ==========================================
      // NOTIFICAR NUEVO ENTREGABLE
      // ==========================================

      const creatorUserId =
        collaboration.creator.user.id;

      const notificationTitle =
        "Nuevo contenido asignado";

      const notificationMessage =
        `Se te ha asignado un nuevo entregable ` +
        `(${deliverable.type}) para la campaña ` +
        `${collaboration.campaign.name}. ` +
        `Accede a la plataforma para consultar los detalles.`;

      const notificationLink =
        `/creator/campaigns/${collaboration.id}`;

      // Notificación interna + correo electrónico.
      // Los errores se gestionan dentro del servicio.
      
      const deliveryResult = await dispatchNotification({
        eventKey: `deliverable:${deliverable.id}:created`,

        notification: {
          userId: creatorUserId,
          type: "DELIVERABLE",
          title: notificationTitle,
          message: notificationMessage,
          link: notificationLink,
        },

        sendEmail: true,
      });

      console.log(
        "Deliverable notification result:",
        {
          deliverableId: deliverable.id,
          internal: deliveryResult.internal,
          email: deliveryResult.email,
        }
      );


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
 * PATCH /api/deliverables/:id/brand-review
 *
 * Una marca autogestionada puede aprobar
 * o solicitar cambios en un entregable.
 */
router.patch("/:id/brand-review", async (req, res) => {
  try {
    const request = req as AuthenticatedRequest;
    const user = request.user;

    if (!user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    if (user.role !== "BRAND") {
      return res.status(403).json({
        error: "BRAND_ACCESS_REQUIRED",
      });
    }

    const deliverableId = String(req.params.id);
    const { status, feedback } = req.body ?? {};

    if (status !== "APPROVED" && status !== "REJECTED") {
      return res.status(400).json({
        error: "INVALID_REVIEW_STATUS",
        message: "Solo puedes aprobar o rechazar contenido.",
      });
    }

    if (
      status === "REJECTED" &&
      (typeof feedback !== "string" || !feedback.trim())
    ) {
      return res.status(400).json({
        error: "FEEDBACK_REQUIRED",
        message: "Indica qué cambios debe realizar el creador.",
      });
    }

    if (
      feedback !== undefined &&
      typeof feedback !== "string"
    ) {
      return res.status(400).json({
        error: "INVALID_FEEDBACK",
      });
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      select: {
        id: true,
        type: true,
        status: true,
        publishedAt: true,
        campaignCreator: {
          select: {
            id: true,
            campaignId: true,
            campaign: {
              select: {
                id: true,
                name: true,
                brandId: true,
                status: true,
                brand: {
                  select: {
                    accessMode: true,
                  },
                },
              },
            },
            creator: {
              select: {
                userId: true,
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

    const campaign = deliverable.campaignCreator.campaign;

    // Consultamos los permisos actuales en la base de datos.
    // No confiamos únicamente en la información de la sesión.
    const membership = await prisma.brandMember.findFirst({
      where: {
        userId: user.id,
        brandId: campaign.brandId,
      },
      select: {
        canApproveContent: true,
        canViewDeliverables: true,
      },
    });

    if (
      !membership?.canApproveContent ||
      !membership.canViewDeliverables ||
      campaign.brand.accessMode !== "SELF_MANAGED"
    ) {
      return res.status(403).json({
        error: "BRAND_REVIEW_PERMISSION_DENIED",
      });
    }

    if (campaign.status === "DELETED") {
      return res.status(409).json({
        error: "CAMPAIGN_DELETED",
      });
    }

    if (
      !["SUBMITTED", "IN_REVIEW"].includes(deliverable.status) ||
      deliverable.publishedAt
    ) {
      return res.status(409).json({
        error: "DELIVERABLE_NOT_REVIEWABLE",
        message:
          "Este entregable no está pendiente de revisión.",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Revalidamos el estado para evitar dos revisiones
      // simultáneas sobre el mismo entregable.
      const result = await tx.deliverable.updateMany({
        where: {
          id: deliverableId,
          status: {
            in: ["SUBMITTED", "IN_REVIEW"],
          },
          publishedAt: null,
          campaignCreator: {
            campaign: {
              brandId: campaign.brandId,
              status: { not: "DELETED" },
            },
          },
        },
        data: {
          status,
          approvedAt: status === "APPROVED" ? new Date() : null,
          ...(status === "REJECTED"
            ? { revisionCount: { increment: 1 } }
            : {}),
        },
      });

      if (result.count !== 1) {
        throw new Error("BRAND_REVIEW_CONFLICT");
      }

      await tx.deliverableReview.create({
        data: {
          deliverableId,
          status,
          feedback:
            typeof feedback === "string"
              ? feedback.trim()
              : "",
          createdById: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELIVERABLE_REVIEWED_BY_BRAND",
          entity: "Deliverable",
          entityId: deliverableId,
          metadata: {
            campaignId: campaign.id,
            brandId: campaign.brandId,
            campaignCreatorId: deliverable.campaignCreator.id,
            previousStatus: deliverable.status,
            status,
          },
        },
      });

      return tx.deliverable.findUniqueOrThrow({
        where: { id: deliverableId },
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
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });
    
    const reviewId = getLatestReviewId(
      updated.reviews,
      status
    );

    if (!reviewId) {
      console.error(
        "Brand review notification skipped: review ID missing",
        { deliverableId, status }
      );
    }


    // Notificación interna y correo tras confirmar la revisión.
    const approved = status === "APPROVED";

    const deliveryResult = await dispatchNotification({
      notification: {
        userId: deliverable.campaignCreator.creator.userId,
        type: "REVIEW",
        title: approved
          ? "Contenido aprobado"
          : "Cambios solicitados",
        message: approved
          ? `La marca ha aprobado tu ${deliverable.type} ` +
            `de la campaña ${campaign.name}.`
          : `La marca ha solicitado cambios en tu ` +
            `${deliverable.type} de la campaña ${campaign.name}. ` +
            `Accede a la plataforma para consultar las indicaciones.`,
        link: `/creator/campaigns/${deliverable.campaignCreator.id}`,
      },
      sendEmail: true,
      eventKey: `deliverable:${deliverableId}:brand-review:${reviewId}`,
    });

    console.log("Brand review notification:", {
      deliverableId,
      internal: deliveryResult.internal,
      email: deliveryResult.email,
    });

    return res.json({ deliverable: updated });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "BRAND_REVIEW_CONFLICT"
    ) {
      return res.status(409).json({
        error: "BRAND_REVIEW_CONFLICT",
        message:
          "El entregable ha cambiado. Actualiza la página.",
      });
    }

    console.error("Brand review error:", error);

    return res.status(500).json({
      error: "BRAND_REVIEW_ERROR",
      message: "No se ha podido revisar el contenido.",
    });
  }
});



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

              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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

      if (await isCampaignDeleted(existing.campaignCreator.campaignId)) {
  return res.status(409).json({
    error: "CAMPAIGN_DELETED",
    message: "No puedes modificar entregables de una campaña eliminada.",
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
        /*
 * ==========================================
 * NOTIFICATIONS
 * ==========================================
 */

const staffReviewId =
  updated &&
  (normalizedStatus === "APPROVED" ||
    normalizedStatus === "REJECTED")
    ? getLatestReviewId(
        updated.reviews,
        normalizedStatus
      )
    : null;
const creatorUserId =
  existing.campaignCreator.creator.user.id;

const campaignName =
  existing.campaignCreator.campaign.name;

const collaborationId =
  existing.campaignCreator.id;

if (
  normalizedStatus === "APPROVED" &&
  existing.status !== "APPROVED" &&
  staffReviewId
) {
  const deliveryResult = await dispatchNotification({
    eventKey: `deliverable:${existing.id}:staff-review:${staffReviewId}`,

    notification: {
      userId: creatorUserId,
      type: "REVIEW",
      title: "Contenido aprobado",
      message:
        `Tu ${existing.type} de la campaña ` +
        `${campaignName} ha sido aprobado.`,
      link: `/creator/campaigns/${collaborationId}`,
    },

    sendEmail: true,
  });

  console.log("Staff approval notification:", deliveryResult);
}
if (
  normalizedStatus === "REJECTED" &&
  existing.status !== "REJECTED" &&
  staffReviewId
) {
  const deliveryResult = await dispatchNotification({
    eventKey: `deliverable:${existing.id}:staff-review:${staffReviewId}`,

    notification: {
      userId: creatorUserId,
      type: "REVIEW",
      title: "Cambios solicitados",
      message:
        `ST.MARY Agency ha solicitado cambios ` +
        `en tu ${existing.type} de la campaña ` +
        `${campaignName}. Consulta las indicaciones ` +
        `en la plataforma.`,
      link: `/creator/campaigns/${collaborationId}`,
    },

    sendEmail: true,
  });

  console.log("Staff rejection notification:", deliveryResult);
}
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
if (await isCampaignDeleted(deliverable.campaignCreator.campaignId)) {
  return res.status(409).json({
    error: "CAMPAIGN_DELETED",
    message: "No puedes eliminar entregables de una campaña eliminada.",
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

/*
 * ==========================================
 * PATCH /api/deliverables/:id/publish
 * ==========================================
 *
 * El creador registra el enlace público
 * de un contenido previamente aprobado.
 */

router.patch(
  "/:id/publish",
  async (req, res) => {
    try {
      const request = req as AuthenticatedRequest;
      const user = request.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      if (user.role !== "CREATOR") {
        return res.status(403).json({
          error: "CREATOR_ACCESS_REQUIRED",
        });
      }

      const deliverableId = String(req.params.id);
      const { publishedUrl } = req.body ?? {};

      if (
        typeof publishedUrl !== "string" ||
        !publishedUrl.trim()
      ) {
        return res.status(400).json({
          error: "PUBLISHED_URL_REQUIRED",
          message:
            "Debes indicar el enlace de la publicación.",
        });
      }

      let url: URL;

      try {
        url = new URL(publishedUrl.trim());
      } catch {
        return res.status(400).json({
          error: "INVALID_PUBLISHED_URL",
          message:
            "Introduce una URL válida.",
        });
      }

      if (
        !["https:", "http:"].includes(url.protocol)
      ) {
        return res.status(400).json({
          error: "INVALID_PUBLISHED_URL",
        });
      }

      const deliverable =
        await prisma.deliverable.findFirst({
          where: {
  id: deliverableId,
  campaignCreator: {
    creator: {
      userId: user.id,
    },
    campaign: {
      status: {
        not: "DELETED",
      },
    },
  },
},
          include: {
            campaignCreator: {
              select: {
                id: true,
                campaignId: true,
                status: true,
              },
            },
          },
        });

      if (!deliverable) {
        return res.status(404).json({
          error: "DELIVERABLE_NOT_FOUND",
        });
      }

      if (deliverable.status !== "APPROVED") {
        return res.status(409).json({
          error: "DELIVERABLE_NOT_APPROVED",
          message:
            "El contenido debe estar aprobado antes de registrar su publicación.",
        });
      }

      if (deliverable.publishedAt) {
        return res.status(409).json({
          error: "ALREADY_PUBLISHED",
          message:
            "Este entregable ya tiene una publicación registrada.",
        });
      }

      const updated = await prisma.$transaction(
        async (tx) => {
          const updateResult =
            await tx.deliverable.updateMany({
              where: {
                id: deliverableId,
                status: "APPROVED",
                publishedAt: null,
                campaignCreator: {
  campaign: {
    status: {
      not: "DELETED",
    },
  },
},
              },
              data: {
                publishedUrl: url.toString(),
                publishedAt: new Date(),
              },
            });

          if (updateResult.count !== 1) {
            throw new Error(
              "DELIVERABLE_PUBLICATION_CONFLICT"
            );
          }

          const published =
            await tx.deliverable.findUniqueOrThrow({
              where: {
                id: deliverableId,
              },
            });

          await tx.auditLog.create({
            data: {
              userId: user.id,
              action:
                "DELIVERABLE_PUBLICATION_REGISTERED",
              entity: "Deliverable",
              entityId: deliverableId,
              metadata: {
                campaignId:
                  deliverable.campaignCreator.campaignId,
                campaignCreatorId:
                  deliverable.campaignCreator.id,
                publishedUrl: published.publishedUrl,
              },
            },
          });

          return published;
        }
      );

      try {
        await notifyStaff({
          type: "DELIVERABLE",
          title: "Nueva publicación registrada",
          message:
            "Un creador ha registrado el enlace de una publicación. Revisa que el contenido esté publicado correctamente.",
          link: `/admin/campaigns/${deliverable.campaignCreator.campaignId}/manage`,
        });
      } catch (notificationError) {
        console.error(
          "Publication notification error:",
          notificationError
        );
      }

      return res.json({
        deliverable: updated,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "DELIVERABLE_PUBLICATION_CONFLICT"
      ) {
        return res.status(409).json({
          error: "DELIVERABLE_PUBLICATION_CONFLICT",
          message:
            "El entregable ha cambiado de estado o ya tiene una publicación registrada.",
        });
      }

      console.error(
        "Register publication error:",
        error
      );

      return res.status(500).json({
        error: "REGISTER_PUBLICATION_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * PATCH /api/deliverables/:id/verify-publication
 * ==========================================
 *
 * STAFF verifica una publicación registrada.
 */

router.patch(
  "/:id/verify-publication",
  async (req, res) => {
    try {
      const request = req as AuthenticatedRequest;

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

      const deliverableId = String(req.params.id);

      const existing = await prisma.deliverable.findUnique({
        where: { id: deliverableId },
        include: {
          campaignCreator: {
            select: {
              id: true,
              campaignId: true,
              creatorId: true,
            },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({
          error: "DELIVERABLE_NOT_FOUND",
        });
      }
if (await isCampaignDeleted(existing.campaignCreator.campaignId)) {
  return res.status(409).json({
    error: "CAMPAIGN_DELETED",
    message: "No puedes verificar publicaciones de una campaña eliminada.",
  });
}
      if (
        existing.status !== "APPROVED" ||
        !existing.publishedUrl ||
        !existing.publishedAt
      ) {
        return res.status(409).json({
          error: "PUBLICATION_NOT_READY",
          message:
            "El entregable debe estar aprobado y tener una publicación registrada.",
        });
      }

      if (existing.publicationVerifiedAt) {
        return res.json({
          deliverable: existing,
          unchanged: true,
        });
      }

      const updated = await prisma.$transaction(
        async (tx) => {
          const result = await tx.deliverable.updateMany({
            where: {
              id: deliverableId,
              status: "APPROVED",
              publishedAt: { not: null },
              publishedUrl: { not: null },
              publicationVerifiedAt: null,
              campaignCreator: {
  campaign: {
    status: {
      not: "DELETED",
    },
  },
},
            },
            data: {
              publicationVerifiedAt: new Date(),
            },
          });

          if (result.count !== 1) {
            throw new Error("PUBLICATION_VERIFICATION_CONFLICT");
          }

          const deliverable =
            await tx.deliverable.findUniqueOrThrow({
              where: { id: deliverableId },
            });

          await tx.auditLog.create({
            data: {
              userId: request.user!.id,
              action: "DELIVERABLE_PUBLICATION_VERIFIED",
              entity: "Deliverable",
              entityId: deliverableId,
              metadata: {
                campaignId: existing.campaignCreator.campaignId,
                campaignCreatorId: existing.campaignCreator.id,
                publishedUrl: deliverable.publishedUrl,
              },
            },
          });

          return deliverable;
        }
      );

      return res.json({
        deliverable: updated,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PUBLICATION_VERIFICATION_CONFLICT"
      ) {
        return res.status(409).json({
          error: "PUBLICATION_VERIFICATION_CONFLICT",
          message:
            "El entregable ha cambiado. Actualiza la página e inténtalo de nuevo.",
        });
      }

      console.error("Verify publication error:", error);

      return res.status(500).json({
        error: "PUBLICATION_VERIFICATION_ERROR",
      });
    }
  }
);

export default router;