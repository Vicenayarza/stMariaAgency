
import { Resend } from "resend";
import { buildEmailTemplate } from "./email-template.service.js";
import { prisma } from "../lib/prisma.js";

const apiKey = process.env.RESEND_API_KEY;

const resend = apiKey ? new Resend(apiKey) : null;

const from =
  process.env.MAIL_FROM ||
  "ST.MARY Agency <notificaciones@stmaryagency.com>";

const notificationEmail =
  process.env.BRAND_REQUEST_NOTIFY_EMAIL ||
  "info@stmaryagency.com";

type BrandRequestEmail = {
  id: string;
  name: string;
  lastName?: string | null;
  email: string;
  companyName: string;
  country?: string | null;
  website?: string | null;
  phone?: string | null;
  employeeCount?: string | null;
  services?: string | null;
  needs?: string | null;
  industry?: string | null;
  discoverySource?: string | null;
};

type CreatorRequestEmail = {
  id: string;
  name: string;
  lastName: string;
  username: string;
  email: string;
  country: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  invitationCode: string | null;
  createdAt: Date;
};


async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
}) {
  if (!resend) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }

  const { data, error } = await resend.emails.send(
    {
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(params.replyTo
        ? { replyTo: params.replyTo }
        : {}),
    },
    params.idempotencyKey
      ? { idempotencyKey: params.idempotencyKey }
      : undefined
  );

  if (error) {
    throw new Error(`RESEND_ERROR: ${error.message}`);
  }

  return data;
}


/**
 * Notifica a administración cuando una marca
 * solicita registrarse en ST.MARY Agency.
 */
export async function sendBrandRequestNotification(
  request: BrandRequestEmail
) {
  const email = buildEmailTemplate({
    title: "Nueva solicitud de marca",
    greeting: "Hola, equipo de ST.MARY Agency:",
    paragraphs: [
      "Se ha recibido una nueva solicitud de registro de marca.",
      "Revisa los datos de la empresa y gestiona su solicitud desde el panel de administración.",
    ],
    details: [
      { label: "ID de solicitud", value: request.id },
      {
        label: "Nombre",
        value: `${request.name} ${request.lastName || ""}`.trim(),
      },
      { label: "Correo electrónico", value: request.email },
      { label: "Empresa", value: request.companyName },
      { label: "Sector", value: request.industry },
      { label: "País", value: request.country },
      { label: "Web", value: request.website },
      { label: "Teléfono", value: request.phone },
      {
        label: "Número de empleados",
        value: request.employeeCount,
      },
      { label: "Servicios", value: request.services },
      { label: "Necesidades", value: request.needs },
      {
        label: "Cómo nos conoció",
        value: request.discoverySource,
      },
    ],
    button: {
      label: "Revisar solicitud",
      url: `${
        process.env.FRONTEND_URL ||
        "https://stmaryagency.com"
      }/admin/brand-requests`,
    },
    footerNote:
      "Este correo se ha generado automáticamente tras recibir una solicitud de marca.",
  });

  return sendEmail({
    to: notificationEmail,
    replyTo: request.email,
    subject: `ST.MARY Agency | Nueva solicitud de marca: ${request.companyName}`,
    ...email,
  });
}

/**
 * Notifica a administración cuando un creador
 * solicita registrarse.
 */
export async function sendCreatorRequestNotification(
  request: CreatorRequestEmail
) {
  const to =
    process.env.CREATOR_REQUEST_NOTIFY_EMAIL ||
    process.env.BRAND_REQUEST_NOTIFY_EMAIL ||
    "info@stmaryagency.com";

  const email = buildEmailTemplate({
    title: "Nueva solicitud de creador",
    greeting: "Hola, equipo de ST.MARY Agency:",
    paragraphs: [
      "Un nuevo creador ha solicitado formar parte de ST.MARY Agency.",
      "Puedes revisar su información y aprobar o rechazar su solicitud desde el panel de administración.",
    ],
    details: [
      { label: "ID de solicitud", value: request.id },
      { label: "Nombre", value: request.name },
      { label: "Apellidos", value: request.lastName },
      { label: "Usuario", value: request.username },
      { label: "Correo electrónico", value: request.email },
      { label: "País", value: request.country },
      { label: "Instagram", value: request.instagram },
      { label: "TikTok", value: request.tiktok },
      { label: "YouTube", value: request.youtube },
      {
        label: "Código de invitación",
        value: request.invitationCode,
      },
      {
        label: "Fecha",
        value: request.createdAt.toLocaleString("es-ES", {
          timeZone: "Europe/Madrid",
        }),
      },
    ],
    button: {
      label: "Revisar creador",
      url: `${
        process.env.FRONTEND_URL ||
        "https://stmaryagency.com"
      }/admin/creator-requests`,
    },
    footerNote:
      "Este correo se ha generado automáticamente tras recibir una solicitud de creador.",
  });

  return sendEmail({
    to,
    replyTo: request.email,
    subject: "ST.MARY Agency | Nueva solicitud de creador",
    ...email,
  });
}

/**
 * Envía el enlace de activación después de
 * aprobar la solicitud de un creador.
 */
export async function sendCreatorActivationEmail(params: {
  email: string;
  name: string;
  activationUrl: string;
}) {
  const { email: recipient, name, activationUrl } = params;

  const email = buildEmailTemplate({
    title: "¡Bienvenido a ST.MARY Agency!",
    greeting: `Hola, ${name}:`,
    paragraphs: [
      "¡Tenemos buenas noticias! Tu solicitud para formar parte de ST.MARY Agency ha sido aprobada.",
      "Ya puedes activar tu cuenta y establecer tu contraseña para acceder a nuestra plataforma.",
      "Estamos encantados de que formes parte de nuestra comunidad de creadores.",
    ],
    button: {
      label: "Activar mi cuenta",
      url: activationUrl,
    },
    footerNote:
      "Este enlace caduca en 24 horas y solo puede utilizarse una vez. Si no has solicitado esta cuenta, puedes ignorar este mensaje.",
  });

  // El enlace también debe aparecer en la versión
  // de texto plano para garantizar su accesibilidad.
  return sendEmail({
    to: recipient,
    subject:
      "ST.MARY Agency | Tu cuenta está lista para activarse",
    ...email,
  });
}


export type CampaignEmailSnapshot = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Envía exactamente el contenido recibido.
 *
 * No reconstruye la plantilla ni modifica
 * el destinatario o el asunto.
 */
export async function sendStoredNotificationEmail(
  snapshot: CampaignEmailSnapshot,
  idempotencyKey: string
) {
  if (!idempotencyKey.trim()) {
    throw new Error("MISSING_EMAIL_IDEMPOTENCY_KEY");
  }

  return sendEmail({
    to: snapshot.to,
    subject: snapshot.subject,
    html: snapshot.html,
    text: snapshot.text,
    idempotencyKey,
  });
}


/**
 * Prepara el contenido de un correo de campaña.
 *
 * No envía ningún correo.
 * Devuelve una copia del destinatario, asunto
 * y contenido que puede almacenarse en PostgreSQL.
 */
export async function buildCampaignNotificationEmail(
  params: {
    userId: string;
    title: string;
    message: string;
    link: string;
  }
): Promise<
  | {
      ready: true;
      snapshot: CampaignEmailSnapshot;
    }
  | {
      ready: false;
      reason:
        | "USER_NOT_ACTIVE"
        | "NOTIFICATIONS_DISABLED";
    }
> {
  const user = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    select: {
      email: true,
      name: true,
      status: true,
      settings: {
        select: {
          emailNotifications: true,
          campaignNotifications: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return {
      ready: false,
      reason: "USER_NOT_ACTIVE",
    };
  }

  if (
    user.settings?.emailNotifications === false ||
    user.settings?.campaignNotifications === false
  ) {
    return {
      ready: false,
      reason: "NOTIFICATIONS_DISABLED",
    };
  }

  const frontendUrl =
    process.env.FRONTEND_URL ||
    "https://stmaryagency.com";

  const baseUrl = new URL(frontendUrl);

  if (
    !params.link.startsWith("/") ||
    params.link.startsWith("//") ||
    params.link.includes("\\")
  ) {
    throw new Error("INVALID_NOTIFICATION_LINK");
  }

  const destination = new URL(
    params.link,
    baseUrl
  );

  if (destination.origin !== baseUrl.origin) {
    throw new Error("INVALID_NOTIFICATION_LINK");
  }

  const email = buildEmailTemplate({
    title: params.title,
    greeting: `Hola, ${user.name}:`,
    paragraphs: [params.message],
    button: {
      label: "Ver en ST.MARIA Agency",
      url: destination.toString(),
    },
    footerNote:
      "Puedes gestionar las notificaciones por correo desde los ajustes de tu cuenta.",
  });

  return {
    ready: true,
    snapshot: {
      to: user.email,
      subject: `ST.MARIA Agency | ${params.title}`,
      html: email.html,
      text: email.text,
    },
  };
}


/**
 * Envía una notificación de campaña por email,
 * respetando las preferencias del usuario.
 *
 * Los ajustes ausentes utilizan los valores
 * predeterminados: notificaciones activadas.
 */
export async function sendCampaignNotificationEmail(params: {
  userId: string;
  title: string;
  message: string;
  link: string;
  idempotencyKey?: string;
}) {
  const user = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    select: {
      email: true,
      name: true,
      status: true,
      settings: {
        select: {
          emailNotifications: true,
          campaignNotifications: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return { sent: false, reason: "USER_NOT_ACTIVE" };
  }

  if (
    user.settings?.emailNotifications === false ||
    user.settings?.campaignNotifications === false
  ) {
    return {
      sent: false,
      reason: "NOTIFICATIONS_DISABLED",
    };
  }

  const frontendUrl =
    process.env.FRONTEND_URL ||
    "https://stmaryagency.com";

  const baseUrl = new URL(frontendUrl);

  // Solo permitimos rutas internas de la plataforma.
  if (
    !params.link.startsWith("/") ||
    params.link.startsWith("//") ||
    params.link.includes("\\")
  ) {
    throw new Error("INVALID_NOTIFICATION_LINK");
  }

  const destination = new URL(params.link, baseUrl);

  if (destination.origin !== baseUrl.origin) {
    throw new Error("INVALID_NOTIFICATION_LINK");
  }

  const email = buildEmailTemplate({
    title: params.title,
    greeting: `Hola, ${user.name}:`,
    paragraphs: [params.message],
    button: {
      label: "Ver en ST.MARY Agency",
      url: destination.toString(),
    },
    footerNote:
      "Puedes gestionar las notificaciones por correo desde los ajustes de tu cuenta.",
  });

 const result = await sendEmail({
  to: user.email,
  subject: `ST.MARY Agency | ${params.title}`,
  ...email,
  idempotencyKey: params.idempotencyKey,
});

  return {
    sent: true,
    result,
  };
}
