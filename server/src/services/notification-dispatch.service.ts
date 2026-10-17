
import { prisma } from "../lib/prisma.js";

import {
  createNotification,
} from "./notification.service.js";

import {
  buildCampaignNotificationEmail,
  sendCampaignNotificationEmail,
  sendStoredNotificationEmail,
} from "./mail.service.js";

type InternalNotificationInput =
  Parameters<typeof createNotification>[0];

type DispatchNotificationInput = {
  notification: InternalNotificationInput;
  sendEmail?: boolean;

  // Clave estable y única de un evento de negocio.
  // Opcional para mantener las rutas actuales.
  eventKey?: string;
};

type ChannelStatus =
  | "sent"
  | "skipped"
  | "failed";

type DeliveryResult = {
  internal: ChannelStatus;
  email: ChannelStatus;
  duplicate: boolean;
};

export async function dispatchNotification(
  params: DispatchNotificationInput
): Promise<DeliveryResult> {
  const result: DeliveryResult = {
    internal: "skipped",
    email: "skipped",
    duplicate: false,
  };

  const {
    notification,
    sendEmail = false,
    eventKey,
  } = params;

  let deliveryId: string | null = null;

  // 1. Registrar el evento, si tiene clave única.
  if (eventKey) {
    try {
      const delivery =
        await prisma.notificationDelivery.create({
          data: {
            eventKey,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link ?? null,
            internalStatus: "PENDING",
            emailStatus: sendEmail
              ? "PENDING"
              : "SKIPPED",
          },
        });

      deliveryId = delivery.id;
    } catch (error) {
      // Solo consideramos duplicado el error
      // de restricción única de Prisma.
      const isUniqueConflict =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002";

      if (!isUniqueConflict) {
        throw error;
      }

      const existing =
        await prisma.notificationDelivery.findUnique({
          where: { eventKey },
          select: { id: true },
        });

      if (!existing) {
        throw error;
      }

      return {
        internal: "skipped",
        email: "skipped",
        duplicate: true,
      };
    }
  }

  // 2. Crear notificación interna.
  try {
    await createNotification(notification);

    result.internal = "sent";

    if (deliveryId) {
      await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { internalStatus: "SENT" },
      });
    }
  } catch (error) {
    result.internal = "failed";

    console.error(
      "Internal notification error:",
      error
    );

    if (deliveryId) {
      try {
        await prisma.notificationDelivery.update({
          where: { id: deliveryId },
          data: {
            internalStatus: "FAILED",
            lastError: String(error),
          },
        });
      } catch (trackingError) {
        console.error(
          "Notification tracking error:",
          trackingError
        );
      }
    }
  }

  // 3. Enviar correo si está solicitado.
 
  // 3. Preparar, guardar y enviar el correo.
  if (sendEmail) {
    try {
      // Para eventos con eventKey, guardar el contenido
      // antes de enviarlo.
      if (deliveryId) {
        const prepared =
          await buildCampaignNotificationEmail({
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            link: notification.link ?? "/",
          });

        if (!prepared.ready) {
          result.email = "skipped";

          await prisma.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
              emailStatus: "SKIPPED",
              processedAt: new Date(),
            },
          });
        } else {
          const snapshot = prepared.snapshot;

          // Guardar una copia exacta del mensaje.
          await prisma.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
              emailTo: snapshot.to,
              emailSubject: snapshot.subject,
              emailHtml: snapshot.html,
              emailText: snapshot.text,
            },
          });

          
          // Enviar exactamente el correo guardado.
          
          // Reservar el correo antes de enviarlo.
          // Solo un proceso puede pasar de
          // PENDING a PROCESSING.
          const claimed =
            await prisma.notificationDelivery.updateMany({
              where: {
                id: deliveryId,
                emailStatus: "PENDING",
                emailAttempts: 0,
              },
              data: {
                emailStatus: "PROCESSING",
                emailAttempts: {
                  increment: 1,
                },
              },
            });

          if (claimed.count !== 1) {
            // Otro proceso ya ha reservado el correo.
            result.email = "skipped";
          } else {
            // Enviar el contenido original guardado.
           let resendAccepted = false;

// Primero intentamos enviar el correo.
try {
  await sendStoredNotificationEmail(
    snapshot,
    `notification-email:${eventKey}`
  );

  resendAccepted = true;
  result.email = "sent";
} catch (sendError) {
  // El resultado del envío puede ser incierto.
  // No debemos reintentarlo automáticamente.
  await prisma.notificationDelivery.updateMany({
    where: {
      id: deliveryId,
      emailStatus: "PROCESSING",
    },
    data: {
      emailStatus: "UNKNOWN",
      lastError: String(sendError),
      processedAt: new Date(),
    },
  });

  result.email = "failed";

  console.error(
    "Resend notification error:",
    sendError
  );
}

// Solo actualizar SENT si Resend ha confirmado
// que aceptó la solicitud.
if (resendAccepted) {
  try {
    const updated =
      await prisma.notificationDelivery.updateMany({
        where: {
          id: deliveryId,
          emailStatus: "PROCESSING",
        },
        data: {
          emailStatus: "SENT",
          lastError: null,
          processedAt: new Date(),
        },
      });

    if (updated.count !== 1) {
      console.error(
        "Email tracking state mismatch:",
        deliveryId
      );
    }
  } catch (trackingError) {
    // No reenviar: Resend ya aceptó el correo.
    console.error(
      "Email sent but database update failed:",
      deliveryId,
      trackingError
    );
  }
}
          }

        }
      } else {
        // Compatibilidad con rutas sin eventKey.
        const emailResult =
          await sendCampaignNotificationEmail({
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            link: notification.link ?? "/",
          });

        result.email = emailResult.sent
          ? "sent"
          : "skipped";
      }
    } catch (error) {
      result.email = "failed";

      console.error(
        "Email notification error:",
        error
      );

      if (deliveryId) {
        try {
          
          const pendingFailure =
  await prisma.notificationDelivery.updateMany({
    where: {
      id: deliveryId,
      emailStatus: "PENDING",
      emailAttempts: 0,
    },
    data: {
      emailStatus: "PREPARATION_FAILED",
      lastError: String(error),
      processedAt: new Date(),
    },
  });

if (pendingFailure.count === 0) {
  // El correo ya había comenzado a procesarse.
  // Su resultado puede ser incierto.
  await prisma.notificationDelivery.updateMany({
    where: {
      id: deliveryId,
      emailStatus: "PROCESSING",
    },
    data: {
      emailStatus: "UNKNOWN",
      lastError: String(error),
      processedAt: new Date(),
    },
  });
}

        } catch (trackingError) {
          console.error(
            "Email tracking error:",
            trackingError
          );
        }
      }
    }
  }


  return result;
}
