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

const router = Router();

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

    if (
      user.role !== "BRAND" ||
      !user.brand
    ) {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    const campaigns =
      await getBrandCampaigns(
        user.brand.id
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
       * El equipo interno de ST.MARIA puede
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

        return res.json({
          matches,
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

      if (
        user.role === "BRAND" &&
        user.brand
      ) {
        const matches =
          await getCampaignMatches(
            req.params.id,
            user.brand.id
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

      if (
        user.role !== "BRAND" ||
        !user.brand
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaign =
        await getBrandCampaignById(
          user.brand.id,
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
 * POST /api/campaigns
 * ==========================================
 */

router.post(
  "/",
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

      const {
        name,
        description,
        budget,
        objective,
        category,
        platform,
        startDate,
        endDate,
      } = req.body ?? {};

      if (
        typeof name !== "string" ||
        typeof budget !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      if (!name.trim()) {
        return res.status(400).json({
          error:
            "CAMPAIGN_NAME_REQUIRED",
        });
      }

      if (
        !/^\d+(\.\d{1,2})?$/.test(
          budget.trim()
        )
      ) {
        return res.status(400).json({
          error: "INVALID_BUDGET",
        });
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          error:
            "INVALID_DESCRIPTION",
        });
      }

      const campaign =
        await createBrandCampaign({
          brandId: user.brand.id,
          name,
          description,
          budget,
          objective,
          category,
          platform,
          startDate,
          endDate,
        });

      /*
       * Audit log
       */

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CAMPAIGN_CREATED",
          entity: "Campaign",
          entityId: campaign.id,
          metadata: {
            name: campaign.name,
          },
        },
      });

      return res.status(201).json({
        campaign,
      });
    } catch (error) {
      console.error(
        "Create campaign error:",
        error
      );

      return res.status(500).json({
        error:
          "CREATE_CAMPAIGN_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * PATCH /api/campaigns/:id
 * ==========================================
 *
 * Actualiza los datos básicos de una campaña.
 */

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

      if (
        user.role !== "BRAND" ||
        !user.brand
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      const campaign =
        await prisma.campaign.findFirst({
          where: {
            id: req.params.id,
            brandId: user.brand.id,
          },
        });

      if (!campaign) {
        return res.status(404).json({
          error: "CAMPAIGN_NOT_FOUND",
        });
      }

      const {
        name,
        description,
        budget,
        objective,
        category,
        platform,
        startDate,
        endDate,
        status,
      } = req.body ?? {};

      if (
        name !== undefined &&
        (
          typeof name !== "string" ||
          !name.trim()
        )
      ) {
        return res.status(400).json({
          error:
            "CAMPAIGN_NAME_REQUIRED",
        });
      }

      let normalizedBudget:
        | string
        | undefined;

      if (budget !== undefined) {
        const budgetString =
          String(budget)
            .trim()
            .replace(",", ".");

        if (
          !/^\d+(\.\d{1,2})?$/.test(
            budgetString
          )
        ) {
          return res.status(400).json({
            error: "INVALID_BUDGET",
          });
        }

        normalizedBudget =
          budgetString;
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          error:
            "INVALID_DESCRIPTION",
        });
      }

      const updated =
        await prisma.campaign.update({
          where: {
            id: campaign.id,
          },
          data: {
            ...(name !== undefined
              ? {
                  name: name.trim(),
                }
              : {}),

            ...(description !== undefined
              ? {
                  description:
                    description === null
                      ? null
                      : description.trim() ||
                        null,
                }
              : {}),

            ...(normalizedBudget !==
            undefined
              ? {
                  budget:
                    normalizedBudget,
                }
              : {}),

            ...(objective !== undefined
              ? {
                  objective:
                    objective === null
                      ? null
                      : String(
                          objective
                        ).trim() || null,
                }
              : {}),

            ...(category !== undefined
              ? {
                  category:
                    category === null
                      ? null
                      : String(
                          category
                        ).trim() || null,
                }
              : {}),

            ...(platform !== undefined
              ? {
                  platform:
                    platform === null
                      ? null
                      : String(
                          platform
                        ).trim() || null,
                }
              : {}),

            ...(startDate !== undefined
              ? {
                  startDate:
                    startDate === null ||
                    startDate === ""
                      ? null
                      : new Date(
                          startDate
                        ),
                }
              : {}),

            ...(endDate !== undefined
              ? {
                  endDate:
                    endDate === null ||
                    endDate === ""
                      ? null
                      : new Date(
                          endDate
                        ),
                }
              : {}),

            ...(status !== undefined
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

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CAMPAIGN_UPDATED",
          entity: "Campaign",
          entityId: updated.id,
          metadata: {
            name: updated.name,
          },
        },
      });

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

      if (
        user.role !== "BRAND" ||
        !user.brand
      ) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
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
       * Buscamos la colaboración
       * asegurándonos de que:
       *
       * - pertenece a la campaña indicada
       * - la campaña pertenece a la
       *   marca autenticada
       */

      const collaboration =
        await prisma.campaignCreator.findFirst(
          {
            where: {
              id: req.params
                .campaignCreatorId,

              campaignId:
                req.params.campaignId,

              campaign: {
                brandId:
                  user.brand.id,
              },
            },
          }
        );

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
          normalizedStatus === "PAID"
            ? now
            : undefined,
      };

      /*
       * Actualizamos la colaboración.
       */

      const updated =
        await prisma.campaignCreator.update(
          {
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
          }
        );

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
          entityId: updated.id,

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