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

export async function registerBrand(params: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const email = normalizeEmail(params.email);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await argon2.hash(params.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: params.name.trim(),
      role: "BRAND",
      brand: {
        create: {
          companyName: params.companyName.trim(),
        },
      },
    },
    include: {
      brand: true,
    },
  });

  return user;
}

export async function registerCreator(params: {
  name: string;
  email: string;
  password: string;
  username: string;
}) {
  const email = normalizeEmail(params.email);
  const username = params.username.trim().toLowerCase();

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
      name: params.name.trim(),
      role: "CREATOR",
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
          brand: true,
          creator: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

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

export async function logout(rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}