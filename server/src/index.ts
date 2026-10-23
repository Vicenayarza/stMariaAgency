import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import creatorRoutes from "./routes/creator.routes.js";
import deliverableRoutes from "./routes/deliverable.routes.js";
import creatorPortalRoutes from "./routes/creator-portal.routes.js";
import socialRoutes from "./routes/social.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import {
  startNotificationWorker,
} from "./workers/notification.worker.js";

const app = express();

const PORT = Number(process.env.PORT || 4000);
const allowedOrigins = [
  "https://stmaryagency.com",
  "https://www.stmaryagency.com",
];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
// IMPORTANTE: procesar JSON antes de las rutas
app.use(express.json());

app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      ok: true,
      service: "st-maria-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return res.status(500).json({
      ok: false,
      service: "st-maria-api",
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/creators", creatorRoutes);
app.use("/api/deliverables", deliverableRoutes);
app.use("/api/creator-portal", creatorPortalRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);

app.listen(PORT, () => {
  console.log(
    `ST.MARY AGENCY API running on http://localhost:${PORT}`
  );
  // Activar el worker solo cuando esté habilitado
  if (process.env.NOTIFICATION_WORKER_ENABLED === "true") {
    startNotificationWorker();
  }
});
