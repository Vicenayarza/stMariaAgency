import { prisma } from "../lib/prisma.js";

type WorkflowDeliverable = {
  status: string;
  publishedUrl: string | null;
  publishedAt: Date | null;
  publicationVerifiedAt: Date | null;
};

type WorkflowCollaboration = {
  status: string;
  campaign: {
    collaborationType: string;
  };
  deliverables: WorkflowDeliverable[];
};

export type WorkflowValidationResult =
  | { ok: true }
  | {
      ok: false;
      statusCode: number;
      error: string;
      message: string;
    };

function reject(
  error: string,
  message: string,
  statusCode = 409
): WorkflowValidationResult {
  return {
    ok: false,
    statusCode,
    error,
    message,
  };
}


export function validateCollaborationStatusChange(
  collaboration: WorkflowCollaboration,
  nextStatus: string,
  options: {
    isStaff?: boolean;
    allowAdministrativeCorrection?: boolean;
  } = {}
): WorkflowValidationResult {
  const currentStatus = collaboration.status;

  if (currentStatus === nextStatus) {
    return { ok: true };
  }

  const isAdministrativeCorrection =
    options.isStaff === true &&
    options.allowAdministrativeCorrection === true;

  // Correcciones excepcionales de Staff.
  // Deben solicitarse explícitamente desde una ruta protegida
  // y registrarse en auditLog.
  if (
  currentStatus === "PAID" &&
  !isAdministrativeCorrection
) {
  return reject(
    "COLLABORATION_ALREADY_PAID",
    "Una colaboración pagada requiere una corrección administrativa para cambiar de estado."
  );
}

if (
  currentStatus === "PUBLISHED" &&
  nextStatus !== "PAID" &&
  !isAdministrativeCorrection
) {
  return reject(
    "COLLABORATION_ALREADY_PUBLISHED",
    "Una colaboración publicada requiere una corrección administrativa para retroceder de estado."
  );
}

  if (nextStatus === "PUBLISHED") {
    const deliverables = collaboration.deliverables;

    if (deliverables.length === 0) {
      return reject(
        "NO_DELIVERABLES",
        "La colaboración necesita al menos un entregable."
      );
    }

    if (
      !deliverables.every(
        (deliverable) =>
          deliverable.status === "APPROVED"
      )
    ) {
      return reject(
        "DELIVERABLES_NOT_APPROVED",
        "Todos los entregables deben estar aprobados."
      );
    }

    if (
      !deliverables.every(
        (deliverable) =>
          Boolean(deliverable.publishedUrl) &&
          Boolean(deliverable.publishedAt) &&
          Boolean(deliverable.publicationVerifiedAt)
      )
    ) {
      return reject(
        "PUBLICATIONS_NOT_VERIFIED",
        "Todos los entregables deben estar publicados y verificados por Staff."
      );
    }
  }

  if (nextStatus === "PAID") {
    if (
      collaboration.campaign.collaborationType === "PRODUCT"
    ) {
      return reject(
        "PAYMENT_NOT_REQUIRED",
        "Esta colaboración es únicamente por producto y no requiere pago económico."
      );
    }

    if (
      currentStatus !== "PUBLISHED" &&
      !isAdministrativeCorrection
    ) {
      return reject(
        "COLLABORATION_NOT_PUBLISHED",
        "La colaboración debe estar publicada antes de registrar el pago."
      );
    }
  }

  return { ok: true };
}

export const collaborationWorkflowInclude = {
  campaign: {
    select: {
      collaborationType: true,
    },
  },
  deliverables: {
    select: {
      status: true,
      publishedUrl: true,
      publishedAt: true,
      publicationVerifiedAt: true,
    },
  },
}  as const;