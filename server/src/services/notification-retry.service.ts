
import { prisma } from "../lib/prisma.js";
import { sendCampaignNotificationEmail } from "./mail.service.js";
import {
  sendStoredNotificationEmail,
} from "./mail.service.js";


export async function recoverStuckNotificationEmails() {
  const recoveryThreshold = new Date(
    Date.now() - 15 * 60 * 1000
  );

  // Buscar correos que quedaron bloqueados
  // mientras estaban siendo procesados.
  const result =
    await prisma.notificationDelivery.updateMany({
      where: {
        emailStatus: "PROCESSING",
        updatedAt: {
          lt: recoveryThreshold,
        },
      },
      data: {
        // No sabemos si Resend llegó a aceptar
        // el correo antes de interrumpirse el proceso.
        emailStatus: "UNKNOWN",
        lastError:
          "El envío se interrumpió. " +
          "Es necesario comprobar su resultado " +
          "antes de volver a enviarlo.",
      },
    });

  return result.count;
}



export async function retryFailedNotificationEmails(
  limit = 20
) {
  const safeLimit = Math.max(1, Math.min(limit, 100));

  // Buscar únicamente correos fallidos.
  
const pendingDeliveries =
  await prisma.notificationDelivery.findMany({
    where: {
      OR: [
       
        {
          // Solo recuperar correos pendientes
          // que todavía no se han intentado enviar.
          emailStatus: "PENDING",
          emailAttempts: 0,

          // Exigir que el correo esté guardado.
          emailTo: { not: null },
          emailSubject: { not: null },
          emailHtml: { not: null },
          emailText: { not: null },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: safeLimit,
  });

  const results = {
    total: pendingDeliveries.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const delivery of pendingDeliveries) {
    // Reservar el evento para evitar que dos
    // procesos lo reintenten simultáneamente.
    const claimed =
      await prisma.notificationDelivery.updateMany({
       where: {
  id: delivery.id,
  emailStatus: delivery.emailStatus,
  emailAttempts: delivery.emailAttempts,
},
        data: {
          emailStatus: "PROCESSING",
          emailAttempts: {
            increment: 1,
          },
        },
      });

    if (claimed.count !== 1) {
      continue;
    }
try {
  // Comprobar que tenemos el correo original guardado.
  if (
    !delivery.emailTo ||
    !delivery.emailSubject ||
    !delivery.emailHtml ||
    !delivery.emailText
  ) {
    throw new Error("EMAIL_SNAPSHOT_MISSING");
  }

  // Comprobar que el usuario sigue permitiendo correos.
  const user = await prisma.user.findUnique({
    where: {
      id: delivery.userId,
    },
    select: {
      status: true,
      settings: {
        select: {
          emailNotifications: true,
          campaignNotifications: true,
        },
      },
    },
  });

  const emailAllowed =
    user?.status === "ACTIVE" &&
    user.settings?.emailNotifications !== false &&
    user.settings?.campaignNotifications !== false;

  if (!emailAllowed) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        emailStatus: "SKIPPED",
        lastError: null,
        processedAt: new Date(),
      },
    });

    results.skipped++;
    continue;
  }

  // Reenviar exactamente el correo almacenado.
 
  // Enviar el contenido original guardado.
  // Si Resend falla, el resultado puede ser incierto.
  let resendAccepted = false;

  try {
    await sendStoredNotificationEmail(
      {
        to: delivery.emailTo,
        subject: delivery.emailSubject,
        html: delivery.emailHtml,
        text: delivery.emailText,
      },
      `notification-email:${delivery.eventKey}`
    );

    resendAccepted = true;
    results.sent++;
  } catch (sendError) {
    console.error(
      "Notification retry Resend error:",
      delivery.eventKey,
      sendError
    );

    results.failed++;

    // No sabemos si el proveedor aceptó el correo.
    // No se debe reintentar automáticamente.
    try {
      await prisma.notificationDelivery.updateMany({
        where: {
          id: delivery.id,
          emailStatus: "PROCESSING",
        },
        data: {
          emailStatus: "UNKNOWN",
          lastError: String(sendError),
          processedAt: new Date(),
        },
      });
    } catch (trackingError) {
      console.error(
        "Could not record uncertain email result:",
        delivery.id,
        trackingError
      );
    }
  }

  if (resendAccepted) {
    try {
      const updated =
        await prisma.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
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
          "Notification retry state mismatch:",
          delivery.id
        );
      }
    } catch (trackingError) {
      // Resend ya aceptó el correo.
      // No debemos volver a enviarlo.
      console.error(
        "Email accepted but tracking failed:",
        delivery.id,
        trackingError
      );
    }
  }

} catch (error) {
  console.error(
    "Notification email retry failed:",
    delivery.eventKey,
    error
  );

  await prisma.notificationDelivery.updateMany({
    where: {
      id: delivery.id,
    },
    data: {
      emailStatus: "UNKNOWN",
      lastError: String(error),
      processedAt: new Date(),
    },
  });

  results.failed++;
}
  }

  return results;
}
