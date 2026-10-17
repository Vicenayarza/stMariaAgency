import { Router } from "express";

import { prisma } from "../lib/prisma.js";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);


/**
 * GET /api/notifications
 *
 * Devuelve las notificaciones del usuario
 * autenticado.
 */
router.get(
  "/",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const notifications =
        await prisma.notification.findMany({
          where: {
            userId: req.user.id,
            dismissedAt: null,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 50,
        });

      const unreadCount =
        await prisma.notification.count({
          where: {
            userId: req.user.id,
            read: false,
             dismissedAt: null,
          },
        });

      return res.json({
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error(
        "Notifications error:",
        error
      );

      return res.status(500).json({
        error:
          "NOTIFICATIONS_FETCH_ERROR",
      });
    }
  }
);


/**
 * PATCH /api/notifications/:id/read
 */
router.patch(
  "/:id/read",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const notification =
        await prisma.notification.findFirst({
          where: {
            id: String(req.params.id),
            userId: req.user.id,
          },
        });

      if (!notification) {
        return res.status(404).json({
          error:
            "NOTIFICATION_NOT_FOUND",
        });
      }

      const updatedNotification =
        await prisma.notification.update({
          where: {
            id: notification.id,
          },

          data: {
            read: true,
          },
        });

      return res.json({
        notification:
          updatedNotification,
      });
    } catch (error) {
      console.error(
        "Notification read error:",
        error
      );

      return res.status(500).json({
        error:
          "NOTIFICATION_UPDATE_ERROR",
      });
    }
  }
);


/**
 * PATCH /api/notifications/read-all
 */
router.patch(
  "/read-all",
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      await prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          read: false,
        },

        data: {
          read: true,
        },
      });

      return res.json({
        success: true,
        unreadCount: 0,
      });
    } catch (error) {
      console.error(
        "Notifications read-all error:",
        error
      );

      return res.status(500).json({
        error:
          "NOTIFICATIONS_UPDATE_ERROR",
      });
    }
  }
);

router.patch(
  "/:id/dismiss",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "UNAUTHENTICATED",
        });
      }

      const notificationId = String(req.params.id);

      const notification =
        await prisma.notification.findFirst({
          where: {
            id: notificationId,
            userId: user.id,
            dismissedAt: null,
          },
        });

      if (!notification) {
        return res.status(404).json({
          error: "NOTIFICATION_NOT_FOUND",
        });
      }

      const updated =
        await prisma.notification.update({
          where: {
            id: notification.id,
          },
          data: {
            read: true,
            dismissedAt: new Date(),
          },
        });

      return res.json({
        success: true,
        notification: updated,
      });
    } catch (error) {
      console.error(
        "Dismiss notification error:",
        error
      );

      return res.status(500).json({
        error: "DISMISS_NOTIFICATION_ERROR",
      });
    }
  }
);

export default router;