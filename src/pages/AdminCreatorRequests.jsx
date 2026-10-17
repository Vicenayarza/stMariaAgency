
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const STATUS_LABELS = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-green-50 text-green-800",
  REJECTED: "bg-red-50 text-red-700",
};

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A6340]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-[#3E2B1B]">
        {value || "—"}
      </p>
    </div>
  );
}

function SocialProfile({ platform, value }) {
  if (!value) {
    return <Detail label={platform} value="No indicado" />;
  }

  const raw = value.trim();
  const isUrl = /^https?:\/\//i.test(raw);
  const host = {
    Instagram: "www.instagram.com",
    TikTok: "www.tiktok.com",
    YouTube: "www.youtube.com",
  }[platform];

  let url = null;

  if (isUrl) {
    try {
      const parsed = new URL(raw);
      const hostname = parsed.hostname.toLowerCase();

      const allowedHosts = {
        Instagram: ["instagram.com", "www.instagram.com"],
        TikTok: ["tiktok.com", "www.tiktok.com"],
        YouTube: [
          "youtube.com",
          "www.youtube.com",
          "youtu.be",
          "www.youtu.be",
        ],
      }[platform];

      if (
        parsed.protocol === "https:" &&
        allowedHosts.includes(hostname)
      ) {
        url = parsed.href;
      }
    } catch {
      url = null;
    }
  } else {
    const username = raw.replace(/^@/, "");

    if (/^[a-zA-Z0-9._-]+$/.test(username)) {
      url =
        platform === "YouTube"
          ? `https://${host}/@${username}`
          : platform === "TikTok"
            ? `https://${host}/@${username}`
            : `https://${host}/${username}`;
    }
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8A6340]">
        {platform}
      </p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all text-sm text-[#8A6340] underline"
        >
          {value} ↗
        </a>
      ) : (
        <p className="mt-1 break-all text-sm text-[#3E2B1B]">
          {value}
        </p>
      )}
    </div>
  );
}

export default function AdminCreatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("PENDING");
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        "/api/admin/creator-requests"
      );

      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar las solicitudes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(id) {
    if (!window.confirm("¿Quieres rechazar esta solicitud?")) {
      return;
    }

    try {
      setActionId(id);
      setError("");

      await api.post(
        `/api/admin/creator-requests/${id}/reject`,
        {
          reviewNotes: reviewNotes[id] || "",
        }
      );

      await loadRequests();
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se ha podido rechazar la solicitud."
      );
    } finally {
      setActionId(null);
    }
  }
  const handleApprove = async (requestId) => {
  const confirmed = window.confirm(
    "¿Quieres aprobar esta solicitud? Se creará la cuenta del creador y se intentará enviar un correo de activación."
  );

  if (!confirmed) return;

  try {
    setLoading(true);
    setError("");

    const response = await api.post(
      `/api/admin/creator-requests/${requestId}/approve`
    );

    const message = response.data?.message;

    if (message === "CREATOR_APPROVED_EMAIL_PENDING") {
      window.alert(
        "El creador ha sido aprobado, pero el correo de activación está pendiente de envío."
      );
    } else {
      window.alert(
        "Solicitud aprobada correctamente. Se ha enviado el correo de activación."
      );
    }

    // Recargar las solicitudes
    await loadRequests();
  } catch (err) {
    const code = err?.response?.data?.error;

    const messages = {
      REQUEST_ALREADY_REVIEWED:
        "Esta solicitud ya ha sido revisada.",
      REQUEST_NOT_FOUND:
        "No se ha encontrado la solicitud.",
      EMAIL_ALREADY_EXISTS:
        "Ya existe un usuario con ese correo electrónico.",
      USERNAME_ALREADY_EXISTS:
        "Ese nombre de usuario ya está registrado.",
      FORBIDDEN:
        "No tienes permisos para aprobar solicitudes.",
    };

    setError(
      messages[code] ||
        "No se ha podido aprobar la solicitud."
    );
  } finally {
    setLoading(false);
  }
};
const handleResendActivation = async (requestId) => {
  const confirmed = window.confirm(
    "¿Quieres enviar un nuevo enlace de activación? El enlace anterior dejará de funcionar."
  );

  if (!confirmed) return;

  try {
    setLoading(true);
    setError("");

    await api.post(
      `/api/admin/creator-requests/${requestId}/resend-activation`
    );

    window.alert(
      "Se ha enviado un nuevo correo de activación."
    );
  } catch (err) {
    const code = err?.response?.data?.error;

    const messages = {
      ACCOUNT_NOT_PENDING_ACTIVATION:
        "Esta cuenta ya está activada o no está disponible.",
      REQUEST_NOT_APPROVED:
        "La solicitud todavía no está aprobada.",
      ACTIVATION_EMAIL_FAILED:
        "No se ha podido enviar el correo. Puedes volver a intentarlo.",
      FORBIDDEN:
        "No tienes permisos para realizar esta acción.",
    };

    setError(
      messages[code] ||
        "No se ha podido reenviar la invitación."
    );
  } finally {
    setLoading(false);
  }
};

  const filteredRequests = requests.filter(
    (request) =>
      filter === "ALL" || request.status === filter
  );

  const pendingCount = requests.filter(
    (request) => request.status === "PENDING"
  ).length;

  return (
    <div className="space-y-8 text-[#3E2B1B]">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A6340]">
          Administración
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Solicitudes de creadores
        </h1>

        <p className="mt-3 text-sm text-[#6F6052]">
          Revisa los creadores que quieren formar parte
          de ST.MARY Agency.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[
          ["PENDING", `Pendientes (${pendingCount})`],
          ["APPROVED", "Aprobadas"],
          ["REJECTED", "Rechazadas"],
          ["ALL", "Todas"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-xl px-4 py-2.5 text-xs transition ${
              filter === value
                ? "bg-[#8A6340] text-white"
                : "border border-[#D8C3A5] bg-white text-[#5A3E28]"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="ml-auto rounded-xl border border-[#D8C3A5] px-4 py-2.5 text-xs disabled:opacity-50"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm">
          Cargando solicitudes...
        </p>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-[#D8C3A5] bg-white p-12 text-center text-sm text-[#6F6052]">
          No hay solicitudes en esta categoría.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const expanded = expandedId === request.id;
            const processing = actionId === request.id;

            return (
              <div
                key={request.id}
                className="overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white"
              >
                <div className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
                  <div>
                    <p className="text-lg font-semibold">
                      {request.name} {request.lastName}
                    </p>

                    <p className="mt-1 text-sm text-[#6F6052]">
                      @{request.username} · {request.email}
                    </p>

                    <p className="mt-2 text-xs text-[#8A6340]">
                      {new Date(
                        request.createdAt
                      ).toLocaleString("es-ES")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        STATUS_STYLES[request.status] || ""
                      }`}
                    >
                      {STATUS_LABELS[request.status] ||
                        request.status}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(
                          expanded ? null : request.id
                        )
                      }
                      className="rounded-xl border border-[#D8C3A5] px-4 py-2 text-xs"
                    >
                      {expanded
                        ? "Ocultar detalles"
                        : "Ver detalles"}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-[#EBDCC4] bg-[#FAF7F2] p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <Detail
                        label="Nombre completo"
                        value={`${request.name} ${request.lastName}`}
                      />

                      <Detail
                        label="Usuario"
                        value={`@${request.username}`}
                      />

                      <Detail
                        label="Email"
                        value={request.email}
                      />

                      <Detail
                        label="País"
                        value={request.country}
                      />

                      <Detail
                        label="Código de invitación"
                        value={request.invitationCode}
                      />

                      <Detail
                        label="Privacidad aceptada"
                        value={
                          request.privacyAccepted
                            ? "Sí"
                            : "No"
                        }
                      />

                      <SocialProfile
                        platform="Instagram"
                        value={request.instagram}
                      />

                      <SocialProfile
                        platform="TikTok"
                        value={request.tiktok}
                      />

                      <SocialProfile
                        platform="YouTube"
                        value={request.youtube}
                      />
                    </div>

                    {request.reviewNotes && (
                      <div className="mt-6">
                        <Detail
                          label="Notas de revisión"
                          value={request.reviewNotes}
                        />
                      </div>
                    )}

                    {request.status === "PENDING" && (
                      <div className="mt-8 border-t border-[#EBDCC4] pt-6">
                        <label
                          htmlFor={`notes-${request.id}`}
                          className="block text-xs font-medium"
                        >
                          Notas internas de revisión
                        </label>

                        <textarea
                          id={`notes-${request.id}`}
                          value={reviewNotes[request.id] || ""}
                          onChange={(event) =>
                            setReviewNotes((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          maxLength={2000}
                          rows={3}
                          placeholder="Motivo del rechazo u observaciones..."
                          className="mt-3 w-full rounded-xl border border-[#D8C3A5] bg-white p-4 text-sm outline-none"
                        />

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={
                              processing || actionId !== null
                            }
                            onClick={() =>
                              handleReject(request.id)
                            }
                            className="rounded-xl border border-red-200 bg-white px-5 py-3 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            {processing
                              ? "Procesando..."
                              : "Rechazar solicitud"}
                          </button>
                        </div>
                        {request.status === "PENDING" && (
  <button
    type="button"
    onClick={() => handleApprove(request.id)}
    disabled={loading}
    className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
  >
    Aprobar solicitud
  </button>
)}
{request.status === "APPROVED" && request.creatorId && (
  <button
    type="button"
    onClick={() => handleResendActivation(request.id)}
    disabled={loading}
    className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
  >
    Reenviar invitación
  </button>
)}

                        <p className="mt-4 text-xs text-[#6F6052]">
                          La aprobación estará disponible
                          cuando configuremos la activación
                          segura de cuentas.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
