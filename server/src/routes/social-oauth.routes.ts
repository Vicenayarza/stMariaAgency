
import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router } from "express";

import {
  exchangeInstagramCode,
} from "../services/instagram-oauth.service.js";

import {
  calculateInstagramEngagement,
} from "../services/instagram.service.js";

import {
  createCalculatorResult,
  consumeCalculatorResult,
} from "../services/social-calculator-session.service.js";

const router = Router();

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_insights",
];

function getInstagramConfig() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return { appId, appSecret, redirectUri };
}

function safeStateEquals(
  received: unknown,
  expected: unknown
): boolean {
  if (
    typeof received !== "string" ||
    typeof expected !== "string"
  ) {
    return false;
  }

  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}

/**
 * GET /api/social/instagram/status
 */
router.get("/instagram/status", (_req, res) => {
  return res.json({
    platform: "INSTAGRAM",
    configured: Boolean(getInstagramConfig()),
    enabled: Boolean(getInstagramConfig()),
  });
});

/**
 * GET /api/social/instagram/connect
 *
 * Inicia la autorización OAuth.
 */
router.get("/instagram/connect", (_req, res) => {
  const config = getInstagramConfig();

  if (!config) {
    return res.status(503).json({
      error: "INSTAGRAM_NOT_CONFIGURED",
    });
  }

  const state = randomBytes(32).toString("hex");

  res.cookie("instagram_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/api/social/instagram",
  });

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state,
  });

  return res.redirect(
    `https://www.instagram.com/oauth/authorize?${params.toString()}`
  );
});

/**
 * GET /api/social/instagram/callback
 *
 * Recibe la autorización de Instagram.
 */
router.get("/instagram/callback", async (req, res) => {
  const receivedState = req.query.state;
  const expectedState =
    req.cookies?.instagram_oauth_state;

  res.clearCookie("instagram_oauth_state", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/social/instagram",
  });

  if (!safeStateEquals(receivedState, expectedState)) {
    return res.redirect(
      `${FRONTEND_URL}/calculator?instagram=invalid_state`
    );
  }

  if (req.query.error) {
    return res.redirect(
      `${FRONTEND_URL}/calculator?instagram=cancelled`
    );
  }

  if (typeof req.query.code !== "string") {
    return res.redirect(
      `${FRONTEND_URL}/calculator?instagram=missing_code`
    );
  }

  try {
    const tokenResponse =
      await exchangeInstagramCode(req.query.code);

    const result = await calculateInstagramEngagement(
      tokenResponse.access_token
    );

    const resultId = createCalculatorResult(result);

    const url = new URL("/calculator", FRONTEND_URL);

    url.searchParams.set("instagram", "success");
    url.searchParams.set("result", resultId);

    return res.redirect(url.toString());
  } catch (error) {
    console.error(
      "Instagram OAuth error:",
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR"
    );

    return res.redirect(
      `${FRONTEND_URL}/calculator?instagram=error`
    );
  }
});

/**
 * GET /api/social/instagram/result/:id
 *
 * Devuelve el resultado calculado.
 */
router.get("/instagram/result/:id", (req, res) => {
  const id = req.params.id;

  if (typeof id !== "string") {
    return res.status(400).json({
      error: "INVALID_RESULT_ID",
    });
  }

  const result = consumeCalculatorResult(id);

  if (!result) {
    return res.status(404).json({
      error: "RESULT_NOT_FOUND_OR_EXPIRED",
    });
  }

  res.setHeader("Cache-Control", "no-store");

  return res.json({ result });
});

export default router;
