
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AdminBrandRequests() {
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
        "/api/admin/brand-requests"
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

  async function handleAction(id, action) {
    const message =
      action === "approve"
        ? "¿Quieres aprobar esta solicitud y crear el cliente sin acceso al portal?"
        : "¿Quieres rechazar esta solicitud?";

    if (!window.confirm(message)) return;

    try {
      setActionId(id);
      setError("");

      await api.post(
        `/api/admin/brand-requests/${id}/${action}`,
        action === "reject"
          ? { reviewNotes: reviewNotes[id] || "" }
          : {}
      );

      await loadRequests();
    } catch (err) {
      console.error(err);
      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se ha podido procesar la solicitud."
      );
    } finally {
      setActionId(null);
    }
  }

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
          Solicitudes de marcas
        </h1>

        <p className="mt-3 text-sm text-[#6F6052]">
          Revisa las empresas que solicitan trabajar
          con ST.MARIA Agency.
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
                      {request.companyName}
                    </p>

                    <p className="mt-1 text-sm text-[#6F6052]">
                      {request.name} {request.lastName || ""}
                      {" · "}
                      {request.email}
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
                        label="Nombre"
                        value={`${request.name} ${
                          request.lastName || ""
                        }`}
                      />
                      <Detail
                        label="Email"
                        value={request.email}
                      />
                      <Detail
                        label="Empresa"
                        value={request.companyName}
                      />
                      <Detail
  label="Sector de actividad"
  value={request.industry}
/>
                      <Detail
                        label="País"
                        value={request.country}
                      />
                      <Detail
                        label="Web"
                        value={request.website}
                      />
                      <Detail
                        label="Teléfono"
                        value={request.phone}
                      />
                      <Detail
                        label="Empleados"
                        value={request.employeeCount}
                      />
                      <Detail
                        label="Servicios"
                        value={request.services}
                      />
                      <Detail
                        label="Cómo nos conoció"
                        value={request.discoverySource}
                      />
                    </div>

                    <div className="mt-6">
                      <Detail
                        label="Necesidades"
                        value={request.needs}
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

                    {request.status === "APPROVED" &&
                      request.brandId && (
                        <Link
                          to={`/admin/brands/${request.brandId}`}
                          className="mt-6 inline-block rounded-xl bg-[#8A6340] px-5 py-3 text-xs font-semibold text-white"
                        >
                          Ver cliente creado →
                        </Link>
                      )}

                    {request.status === "PENDING" && (
                      <div className="mt-8 border-t border-[#EBDCC4] pt-6">
                        <label className="block text-xs font-medium">
                          Notas internas de revisión
                        </label>

                        <textarea
                          value={reviewNotes[request.id] || ""}
                          onChange={(event) =>
                            setReviewNotes((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Motivo del rechazo u observaciones..."
                          className="mt-3 w-full rounded-xl border border-[#D8C3A5] bg-white p-4 text-sm outline-none"
                        />

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={processing || actionId !== null}
                            onClick={() =>
                              handleAction(
                                request.id,
                                "approve"
                              )
                            }
                            className="rounded-xl bg-[#8A6340] px-5 py-3 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {processing
                              ? "Procesando..."
                              : "Aprobar y crear cliente"}
                          </button>

                          <button
                            type="button"
                            disabled={processing || actionId !== null}
                            onClick={() =>
                              handleAction(
                                request.id,
                                "reject"
                              )
                            }
                            className="rounded-xl border border-red-200 bg-white px-5 py-3 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            Rechazar solicitud
                          </button>
                        </div>
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
