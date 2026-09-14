import type { NextFunction, Request, Response } from "express";

import { getUserFromSession } from "../services/auth.service.js";

export interface AuthenticatedRequest extends Request {
  user?: Awaited<
    ReturnType<typeof getUserFromSession>
  >;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.["stmaria-session"];

    if (!token) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    const user = await getUserFromSession(token);

    if (!user) {
      return res.status(401).json({
        error: "INVALID_SESSION",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      error: "AUTHENTICATION_ERROR",
    });
  }
}