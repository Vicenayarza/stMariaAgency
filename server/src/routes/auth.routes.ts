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

router.post("/register/brand", async (req, res) => {
  try {
    console.log("BODY RECIBIDO:", req.body);

    const {
      name,
      email,
      password,
      companyName,
    } = req.body;


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

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        brand: user.brand,
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

    console.error(error);

    return res.status(500).json({
      error: "REGISTER_ERROR",
    });
  }
});

router.post("/register/creator", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      username,
    } = req.body;

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

    if (password.length < 8) {
      return res.status(400).json({
        error: "PASSWORD_TOO_SHORT",
      });
    }

    const user = await registerCreator({
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
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    if (
      error instanceof Error &&
      error.message === "USERNAME_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: "USERNAME_ALREADY_EXISTS",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "REGISTER_ERROR",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

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
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "LOGIN_ERROR",
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.["tmaria-session"];

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
    console.error(error);

    return res.status(500).json({
      error: "LOGOUT_ERROR",
    });
  }
});

router.get(
  "/me",
  requireAuth,
  (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        brand: user.brand,
        creator: user.creator,
      },
    });
  }
);

export default router;