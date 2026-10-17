import argon2 from "argon2";
import crypto from "node:crypto";

import { prisma } from "../lib/prisma.js";

const SESSION_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Registro de una empresa desde la plataforma.
 *
 * Al registrarse directamente:
 * - Se crea el User.
 * - Se crea el Brand.
 * - Se crea BrandMember.
 * - El usuario será OWNER.
 * - La empresa tendrá SELF_MANAGED.
 *
 * Los clientes creados directamente por ST.MARY AGENCY desde Admin
 * NO utilizarán esta función, ya que podrán existir sin User.
 */
export async function registerBrand(params: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const email = normalizeEmail(params.email);
  const name = params.name.trim();
  const companyName = params.companyName.trim();

  if (!name) {
    throw new Error("NAME_REQUIRED");
  }

  if (!email) {
    throw new Error("EMAIL_REQUIRED");
  }

  if (!params.password) {
    throw new Error("PASSWORD_REQUIRED");
  }

  if (!companyName) {
    throw new Error("COMPANY_NAME_REQUIRED");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await argon2.hash(params.password);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear usuario
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "BRAND",
        status: "ACTIVE",
      },
    });

    // 2. Crear empresa
    const brand = await tx.brand.create({
      data: {
        companyName,
        accessMode: "SELF_MANAGED",
      },
    });

    // 3. Vincular usuario y empresa
    const membership = await tx.brandMember.create({
      data: {
        userId: user.id,
        brandId: brand.id,

        role: "OWNER",

        canViewCampaigns: true,
        canCreateCampaigns: true,
        canEditCampaigns: true,

        canViewProposals: true,
        canApproveCreators: true,

        canViewDeliverables: true,
        canApproveContent: true,

        canViewResults: true,
        canExportReports: true,

        canDiscoverCreators: true,
        canContactCreators: true,
        canSelectCreators: true,
      },
    });

    return {
      ...user,

      brandMemberships: [
        {
          ...membership,
          brand,
        },
      ],
    };
  });

  return result;
}

/**
 * Registro de creador.
 */
export async function registerCreator(params: {
  name: string;
  email: string;
  password: string;
  username: string;
}) {
  const email = normalizeEmail(params.email);
  const username = params.username.trim().toLowerCase();
  const name = params.name.trim();

  if (!name) {
    throw new Error("NAME_REQUIRED");
  }

  if (!email) {
    throw new Error("EMAIL_REQUIRED");
  }

  if (!params.password) {
    throw new Error("PASSWORD_REQUIRED");
  }

  if (!username) {
    throw new Error("USERNAME_REQUIRED");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const existingCreator = await prisma.creator.findUnique({
    where: { username },
  });

  if (existingCreator) {
    throw new Error("USERNAME_ALREADY_EXISTS");
  }

  const passwordHash = await argon2.hash(params.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "CREATOR",
      status: "ACTIVE",

      creator: {
        create: {
          username,
        },
      },
    },

    include: {
      creator: true,
    },
  });

  return user;
}

/**
 * Login.
 *
 * Aquí no necesitamos cargar BrandMember todavía.
 * La sesión guarda únicamente el userId.
 */
export async function login(params: {
  email: string;
  password: string;
}) {
  const email = normalizeEmail(params.email);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    params.password
  );

  if (!passwordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const rawToken = createSessionToken();
  const tokenHash = hashSessionToken(rawToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + SESSION_DAYS
  );

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    user,
    sessionToken: rawToken,
  };
}

/**
 * Recupera el usuario asociado a una sesión.
 *
 * Para usuarios BRAND carga:
 *
 * User
 *   -> BrandMember
 *       -> Brand
 *
 * También carga Creator y Staff para mantener
 * compatibilidad con los otros roles.
 */
export async function getUserFromSession(
  rawToken: string
) {
  const tokenHash = hashSessionToken(rawToken);

 
const session = await prisma.session.findUnique({
  where: {
    tokenHash,
  },

  include: {
    user: {
      include: {
        brandMemberships: {
          include: {
            brand: true,
          },
        },
        creator: true,
        staff: true,
      },
    },
  },
});


  if (!session) {
  return null;
}

if (session.user.status !== "ACTIVE") {
  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
    },
  });

  return null;
}

  // Eliminar automáticamente sesiones caducadas
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session.user;
}

/**
 * Cerrar sesión.
 */
export async function logout(rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}