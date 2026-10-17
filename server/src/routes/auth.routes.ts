import { Router } from "express";

import {
  login,
  logout,
  registerBrand,
  registerCreator,
} from "../services/auth.service.js";
import argon2 from "argon2";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import { sendBrandRequestNotification,  sendCreatorRequestNotification, } from "../services/mail.service.js";
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
      lastName,
      email,
      country,
      industry, // NUEVO
      companyName,
      website,
      phone,
      employeeCount,
      services,
      needs,
      discoverySource,
    } = req.body ?? {};

    // Campos obligatorios
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof companyName !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }
const allowedIndustries = [
  "Moda y accesorios",
  "Belleza y cosmética",
  "Alimentación y bebidas",
  "Tecnología y electrónica",
  "Salud y bienestar",
  "Viajes y turismo",
  "Hogar y decoración",
  "Deporte y fitness",
  "Automoción",
  "Entretenimiento y ocio",
  "Educación y formación",
  "Finanzas y seguros",
  "Inmobiliaria",
  "Otros",
];

if (
  typeof industry !== "string" ||
  !allowedIndustries.includes(industry)
) {
  return res.status(400).json({
    error: "INVALID_INDUSTRY",
    message: "Selecciona un sector de actividad válido.",
  });
}
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        error: "INVALID_EMAIL",
      });
    }

    const optionalFields = {
      lastName,
      country,
      website,
      phone,
      employeeCount,
      services,
      needs,
      discoverySource,
    };

    if (
      Object.values(optionalFields).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          typeof value !== "string"
      )
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const existingRequest =
      await prisma.brandRegistrationRequest.findFirst({
        where: {
          email: normalizedEmail,
          status: "PENDING",
        },
        select: { id: true },
      });

    if (existingRequest) {
      return res.status(409).json({
        error: "REQUEST_ALREADY_PENDING",
      });
    }

    const request =
      await prisma.brandRegistrationRequest.create({
        data: {
          name: name.trim(),
          lastName: lastName?.trim() || null,
          email: normalizedEmail,
          country: country?.trim() || null,
          companyName: companyName.trim(),
          website: website?.trim() || null,
          phone: phone?.trim() || null,
          industry,
          employeeCount: employeeCount?.trim() || null,
          services: services?.trim() || null,
          needs: needs?.trim() || null,
          discoverySource: discoverySource?.trim() || null,
          status: "PENDING",
        },
      });

try {
  await sendBrandRequestNotification(request);
} catch (mailError) {
  console.error(
    "Brand request notification failed:",
    request.id,
    mailError
  );
}

    return res.status(201).json({
      message: "BRAND_REQUEST_SUBMITTED",
      requestId: request.id,
    });
  } catch (error) {
    console.error("Brand registration request error:", error);

    return res.status(500).json({
      error: "BRAND_REQUEST_ERROR",
    });
  }
});

/*
 * ==========================================
 * REGISTER CREATOR
 * ==========================================
 */

router.post("/register/creator", async (req, res) => {
  try {
    const {
      name,
      lastName,
      username,
      email,
      country,
      invitationCode,
      instagram,
      tiktok,
      youtube,
      privacyAccepted,
    } = req.body ?? {};

    // Validación de campos obligatorios
    if (
      typeof name !== "string" ||
      typeof lastName !== "string" ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof country !== "string" ||
      !name.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !country.trim()
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        error: "INVALID_EMAIL",
      });
    }

    if (
      normalizedUsername.length < 3 ||
      normalizedUsername.length > 30 ||
      !/^[a-z0-9._]+$/.test(normalizedUsername)
    ) {
      return res.status(400).json({
        error: "INVALID_USERNAME",
      });
    }

    // Comprobar tipos de campos opcionales
    const optionalFields = {
      invitationCode,
      instagram,
      tiktok,
      youtube,
    };

    if (
      Object.values(optionalFields).some(
        (value) =>
          value !== undefined &&
          value !== null &&
          typeof value !== "string"
      )
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    const normalizedInstagram = instagram?.trim() || null;
    const normalizedTiktok = tiktok?.trim() || null;
    const normalizedYoutube = youtube?.trim() || null;

    if (
      !normalizedInstagram &&
      !normalizedTiktok &&
      !normalizedYoutube
    ) {
      return res.status(400).json({
        error: "SOCIAL_PROFILE_REQUIRED",
      });
    }

    if (privacyAccepted !== true) {
      return res.status(400).json({
        error: "PRIVACY_REQUIRED",
      });
    }

    // Comprobar si ya existe un usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    // Comprobar si el username ya está ocupado
    const existingCreator = await prisma.creator.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    });

    if (existingCreator) {
      return res.status(409).json({
        error: "USERNAME_ALREADY_EXISTS",
      });
    }

    // Evitar solicitudes pendientes duplicadas
    const existingRequest =
      await prisma.creatorRegistrationRequest.findFirst({
        where: {
          status: "PENDING",
          OR: [
            { email: normalizedEmail },
            { username: normalizedUsername },
          ],
        },
        select: {
          email: true,
          username: true,
        },
      });

    if (existingRequest) {
      return res.status(409).json({
        error:
          existingRequest.email === normalizedEmail
            ? "REQUEST_ALREADY_PENDING"
            : "USERNAME_REQUEST_ALREADY_PENDING",
      });
    }

    // Crear exclusivamente la solicitud
    const request =
      await prisma.creatorRegistrationRequest.create({
        data: {
          name: name.trim(),
          lastName: lastName.trim(),
          username: normalizedUsername,
          email: normalizedEmail,
          country: country.trim(),
          invitationCode: invitationCode?.trim() || null,
          instagram: normalizedInstagram,
          tiktok: normalizedTiktok,
          youtube: normalizedYoutube,
          privacyAccepted: true,
          privacyAcceptedAt: new Date(),
          status: "PENDING",
        },
      });
      
try {
  await sendCreatorRequestNotification(request);
} catch (mailError) {
  console.error(
    "Creator request notification failed:",
    request.id,
    mailError
  );
}


    return res.status(201).json({
      message: "CREATOR_REQUEST_SUBMITTED",
      requestId: request.id,
    });
  } catch (error) {
    console.error("Creator registration request error:", error);

    return res.status(500).json({
      error: "CREATOR_REQUEST_ERROR",
    });
  }
});

/*
 * ==========================================
 * ACTIVATE ACCOUNT
 * ==========================================
 */

router.post("/activate-account", async (req, res) => {
  try {
    const { token, password } = req.body ?? {};

    if (
      typeof token !== "string" ||
      typeof password !== "string" ||
      !token ||
      !password
    ) {
      return res.status(400).json({
        error: "INVALID_INPUT",
      });
    }

    // Validación básica de contraseña
    if (
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 1024
    ) {
      return res.status(400).json({
        error: "INVALID_PASSWORD",
        message:
          "La contraseña debe tener al menos 12 caracteres.",
      });
    }

    // Los tokens generados son 32 bytes en base64url.
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return res.status(400).json({
        error: "INVALID_ACTIVATION_TOKEN",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const passwordHash = await argon2.hash(password);

    const result = await prisma.$transaction(async (tx) => {
      // Consumir el token de forma atómica.
      // Si otra petición lo ha utilizado, count será 0.
      const consumed = await tx.accountActivationToken.updateMany({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
          user: {
            status: "INVITED",
            role: "CREATOR",
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (consumed.count !== 1) {
        return false;
      }

      const activation = await tx.accountActivationToken.findUniqueOrThrow({
        where: { tokenHash },
        select: { userId: true },
      });

      const activated = await tx.user.updateMany({
        where: {
          id: activation.userId,
          role: "CREATOR",
          status: "INVITED",
        },
        data: {
          passwordHash,
          status: "ACTIVE",
        },
      });

      if (activated.count !== 1) {
        throw new Error("ACTIVATION_CONFLICT");
      }

      return true;
    });

    if (!result) {
      return res.status(400).json({
        error: "INVALID_OR_EXPIRED_TOKEN",
        message:
          "El enlace de activación no es válido o ha caducado.",
      });
    }

    return res.status(200).json({
      message: "ACCOUNT_ACTIVATED",
    });
  } catch (error) {
    console.error("Account activation error:", error);

    return res.status(500).json({
      error: "ACCOUNT_ACTIVATION_ERROR",
    });
  }
});


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
        avatarUrl: user.avatarUrl ?? null,

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


/*
 * ==========================================
 * UPDATE MY PROFILE
 * ==========================================
 */

router.patch(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const { name } = req.body ?? {};

      if (typeof name !== "string") {
        return res.status(400).json({
          error: "INVALID_NAME",
          message: "Introduce un nombre válido.",
        });
      }

      const normalizedName = name.trim();

      if (
        normalizedName.length < 2 ||
        normalizedName.length > 100
      ) {
        return res.status(400).json({
          error: "INVALID_NAME",
          message:
            "El nombre debe tener entre 2 y 100 caracteres.",
        });
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: normalizedName,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      });

      return res.status(200).json({
        message: "PROFILE_UPDATED",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);

      return res.status(500).json({
        error: "PROFILE_UPDATE_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * CHANGE PASSWORD
 * ==========================================
 */

router.post(
  "/change-password",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const { currentPassword, newPassword } = req.body ?? {};

      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string"
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      if (
        newPassword.length < 12 ||
        Buffer.byteLength(newPassword, "utf8") > 1024
      ) {
        return res.status(400).json({
          error: "INVALID_PASSWORD",
          message:
            "La nueva contraseña debe tener al menos 12 caracteres.",
        });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          passwordHash: true,
          status: true,
        },
      });

      if (!dbUser || dbUser.status !== "ACTIVE") {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const isValid = await argon2.verify(
        dbUser.passwordHash,
        currentPassword
      );

      if (!isValid) {
        return res.status(400).json({
          error: "INVALID_CURRENT_PASSWORD",
          message: "La contraseña actual no es correcta.",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          error: "PASSWORD_UNCHANGED",
          message:
            "La nueva contraseña debe ser diferente de la actual.",
        });
      }

      const newPasswordHash = await argon2.hash(newPassword);

      // Actualizar contraseña e invalidar sesiones
      // en una única transacción.
      await prisma.$transaction(async (tx) => {
        const updated = await tx.user.updateMany({
          where: {
            id: dbUser.id,
            passwordHash: dbUser.passwordHash,
            status: "ACTIVE",
          },
          data: {
            passwordHash: newPasswordHash,
          },
        });

        if (updated.count !== 1) {
          throw new Error("PASSWORD_UPDATE_CONFLICT");
        }

        await tx.session.deleteMany({
          where: {
            userId: dbUser.id,
          },
        });
      });

      res.clearCookie("stmaria-session", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
      });

      return res.status(200).json({
        message: "PASSWORD_CHANGED",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PASSWORD_UPDATE_CONFLICT"
      ) {
        return res.status(409).json({
          error: "PASSWORD_UPDATE_CONFLICT",
          message:
            "La contraseña ha cambiado durante la operación. Vuelve a intentarlo.",
        });
      }

      console.error("Change password error:", error);

      return res.status(500).json({
        error: "PASSWORD_CHANGE_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * GET MY SETTINGS
 * ==========================================
 */

router.get(
  "/settings",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const settings = await prisma.userSettings.upsert({
        where: {
          userId: user.id,
        },
        update: {},
        create: {
          userId: user.id,
        },
      });

      return res.status(200).json({
        settings: {
          theme: settings.theme,
          emailNotifications: settings.emailNotifications,
          campaignNotifications: settings.campaignNotifications,
        },
      });
    } catch (error) {
      console.error("Get settings error:", error);

      return res.status(500).json({
        error: "GET_SETTINGS_ERROR",
      });
    }
  }
);

/*
 * ==========================================
 * UPDATE MY SETTINGS
 * ==========================================
 */

router.patch(
  "/settings",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const body = req.body;

      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      const {
        theme,
        emailNotifications,
        campaignNotifications,
      } = body;

      const allowedFields = [
        "theme",
        "emailNotifications",
        "campaignNotifications",
      ];

      if (
        Object.keys(body).length === 0 ||
        Object.keys(body).some(
          (key) => !allowedFields.includes(key)
        )
      ) {
        return res.status(400).json({
          error: "INVALID_INPUT",
        });
      }

      if (
        theme !== undefined &&
        !["LIGHT", "DARK", "SYSTEM"].includes(theme)
      ) {
        return res.status(400).json({
          error: "INVALID_THEME",
        });
      }

      if (
        emailNotifications !== undefined &&
        typeof emailNotifications !== "boolean"
      ) {
        return res.status(400).json({
          error: "INVALID_EMAIL_NOTIFICATIONS",
        });
      }

      if (
        campaignNotifications !== undefined &&
        typeof campaignNotifications !== "boolean"
      ) {
        return res.status(400).json({
          error: "INVALID_CAMPAIGN_NOTIFICATIONS",
        });
      }

      const settings = await prisma.userSettings.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          ...(theme !== undefined && { theme }),
          ...(emailNotifications !== undefined && {
            emailNotifications,
          }),
          ...(campaignNotifications !== undefined && {
            campaignNotifications,
          }),
        },
        update: {
          ...(theme !== undefined && { theme }),
          ...(emailNotifications !== undefined && {
            emailNotifications,
          }),
          ...(campaignNotifications !== undefined && {
            campaignNotifications,
          }),
        },
      });

      return res.status(200).json({
        message: "SETTINGS_UPDATED",
        settings: {
          theme: settings.theme,
          emailNotifications: settings.emailNotifications,
          campaignNotifications: settings.campaignNotifications,
        },
      });
    } catch (error) {
      console.error("Update settings error:", error);

      return res.status(500).json({
        error: "UPDATE_SETTINGS_ERROR",
      });
    }
  }
);


export default router;