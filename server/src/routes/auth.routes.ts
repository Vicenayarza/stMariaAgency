import { Router } from "express";

import {
  login,
  logout,
  registerBrand,
  registerCreator,
} from "../services/auth.service.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

const isProduction =
  process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/*
 * ==========================================
 * REGISTER BRAND
 * ==========================================
 *
 * Registro autogestionado.
 *
 * registerBrand() crea:
 *
 * User
 *   -> BrandMember
 *       -> Brand
 *
 * El Brand se crea como SELF_MANAGED.
 */
router.post("/register/brand", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      companyName,
    } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof companyName !== "string"
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    if (
      !name.trim() ||
      !email.trim() ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "PASSWORD_TOO_SHORT",
      });
    }

    const user = await registerBrand({
      name,
      email,
      password,
      companyName,
    });

    const membership =
      user.brandMemberships?.[0] ?? null;

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,

        brandMemberships:
          user.brandMemberships,

        brand: membership?.brand ?? null,

        brandMembership:
          membership
            ? {
                id: membership.id,
                role: membership.role,

                canViewCampaigns:
                  membership.canViewCampaigns,

                canCreateCampaigns:
                  membership.canCreateCampaigns,

                canEditCampaigns:
                  membership.canEditCampaigns,

                canViewProposals:
                  membership.canViewProposals,

                canApproveCreators:
                  membership.canApproveCreators,

                canViewDeliverables:
                  membership.canViewDeliverables,

                canApproveContent:
                  membership.canApproveContent,

                canViewResults:
                  membership.canViewResults,

                canExportReports:
                  membership.canExportReports,

                canDiscoverCreators:
                  membership.canDiscoverCreators,

                canContactCreators:
                  membership.canContactCreators,

                canSelectCreators:
                  membership.canSelectCreators,
              }
            : null,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    if (
      error instanceof Error &&
      [
        "NAME_REQUIRED",
        "EMAIL_REQUIRED",
        "PASSWORD_REQUIRED",
        "COMPANY_NAME_REQUIRED",
      ].includes(error.message)
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    console.error(
      "Register brand error:",
      error
    );

    return res.status(500).json({
      error: "REGISTER_ERROR",
    });
  }
});

/*
 * ==========================================
 * REGISTER CREATOR
 * ==========================================
 */
router.post(
  "/register/creator",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        username,
      } = req.body ?? {};

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof username !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      if (
        !name.trim() ||
        !email.trim() ||
        !username.trim()
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "PASSWORD_TOO_SHORT",
        });
      }

      const user =
        await registerCreator({
          name,
          email,
          password,
          username,
        });

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          creator: user.creator,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "EMAIL_ALREADY_EXISTS"
      ) {
        return res.status(409).json({
          error: "EMAIL_ALREADY_EXISTS",
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "USERNAME_ALREADY_EXISTS"
      ) {
        return res.status(409).json({
          error: "USERNAME_ALREADY_EXISTS",
        });
      }

      if (
        error instanceof Error &&
        [
          "NAME_REQUIRED",
          "EMAIL_REQUIRED",
          "PASSWORD_REQUIRED",
          "USERNAME_REQUIRED",
        ].includes(error.message)
      ) {
        return res.status(400).json({
          error: error.message,
        });
      }

      console.error(
        "Register creator error:",
        error
      );

      return res.status(500).json({
        error: "REGISTER_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * LOGIN
 * ==========================================
 */
router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    const result = await login({
      email,
      password,
    });

    res.cookie(
      "stmaria-session",
      result.sessionToken,
      cookieOptions
    );

    return res.json({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      error: "LOGIN_ERROR",
    });
  }
});

/*
 * ==========================================
 * LOGOUT
 * ==========================================
 */
router.post("/logout", async (req, res) => {
  try {
    /*
     * IMPORTANTE:
     *
     * Antes ponía:
     * tmaria-session
     *
     * pero la cookie correcta es:
     * stmaria-session
     */
    const token =
      req.cookies?.["stmaria-session"];

    if (token) {
      await logout(token);
    }

    res.clearCookie(
      "stmaria-session",
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
      }
    );

    return res.status(204).send();
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return res.status(500).json({
      error: "LOGOUT_ERROR",
    });
  }
});

/*
 * ==========================================
 * CURRENT USER
 * ==========================================
 *
 * Este endpoint es especialmente importante
 * para el frontend.
 *
 * Para BRAND devolvemos también:
 *
 * - brand
 * - brandMembership
 * - brandMemberships
 *
 * De esta manera podemos adaptar el frontend
 * progresivamente sin romperlo de golpe.
 */
router.get(
  "/me",
  requireAuth,
  (
    req: AuthenticatedRequest,
    res
  ) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    /*
     * BRAND puede pertenecer en el futuro
     * a más de una empresa.
     *
     * Para el MVP utilizamos la primera
     * membresía como empresa activa.
     */
    const membership =
      user.role === "BRAND"
        ? user.brandMemberships?.[0] ??
          null
        : null;

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,

        /*
         * Compatibilidad con el frontend actual.
         *
         * Aunque Prisma ya no tiene User.brand,
         * seguimos enviando "brand" en la API.
         */
        brand:
          membership?.brand ?? null,

        brandMembership:
          membership
            ? {
                id: membership.id,
                role: membership.role,

                canViewCampaigns:
                  membership.canViewCampaigns,

                canCreateCampaigns:
                  membership.canCreateCampaigns,

                canEditCampaigns:
                  membership.canEditCampaigns,

                canViewProposals:
                  membership.canViewProposals,

                canApproveCreators:
                  membership.canApproveCreators,

                canViewDeliverables:
                  membership.canViewDeliverables,

                canApproveContent:
                  membership.canApproveContent,

                canViewResults:
                  membership.canViewResults,

                canExportReports:
                  membership.canExportReports,

                canDiscoverCreators:
                  membership.canDiscoverCreators,

                canContactCreators:
                  membership.canContactCreators,

                canSelectCreators:
                  membership.canSelectCreators,
              }
            : null,

        brandMemberships:
          user.role === "BRAND"
            ? user.brandMemberships
            : [],

        creator:
          user.creator ?? null,

        staff:
          user.staff ?? null,
      },
    });
  }
);

export default router;