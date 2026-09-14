import { Router } from "express";

import { prisma } from "../lib/prisma.js";

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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
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
 * GET /api/admin/campaigns
 *
 * Todas las campañas de ST.MARIA.
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
            user: {
              select: {
                name: true,
                email: true,
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
            user: {
              select: {
                name: true,
                email: true,
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

export default router;