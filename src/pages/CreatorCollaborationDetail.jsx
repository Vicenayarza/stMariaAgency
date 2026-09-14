import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

const statusLabels = {
  PENDING: "Pendiente de respuesta",
  CONTACTED: "Contactado",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  SELECTED: "Seleccionada",
  PRODUCT_SENT: "Producto enviado",
  CONTENT_PENDING: "Contenido pendiente",
  CONTENT_RECEIVED: "Contenido recibido",
  PUBLISHED: "Publicado",
  PAID: "Pagado",
};

const deliverableStatusLabels = {
  PENDING: "Pendiente",
  SUBMITTED: "Enviado",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function formatDate(date) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function CreatorCollaborationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [collaboration, setCollaboration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    async function loadCollaboration() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/creator-portal/collaborations/${id}`
        );

        setCollaboration(response.collaboration);
      } catch (err) {
        console.error(err);

        setError(
          "No hemos podido cargar esta colaboración."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCollaboration();
  }, [id]);

  async function handleResponse(response) {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const result = await api.patch(
        `/creator-portal/collaborations/${id}/response`,
        {
          response,
        }
      );

      setCollaboration((current) => ({
        ...current,
        ...result.collaboration,
      }));

      setActionSuccess(
        response === "ACCEPTED"
          ? "Has aceptado la colaboración."
          : "Has rechazado la colaboración."
      );
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "No hemos podido actualizar la colaboración."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeliverableUpdate(
    deliverableId,
    payload
  ) {
    try {
      setActionLoading(true);
      setActionError("");
      setActionSuccess("");

      const result = await api.patch(
        `/creator-portal/deliverables/${deliverableId}`,
        payload
      );

      setCollaboration((current) => ({
        ...current,
        deliverables: current.deliverables.map(
          (deliverable) =>
            deliverable.id === deliverableId
              ? result.deliverable
              : deliverable
        ),
      }));

      setActionSuccess(
        payload.status === "SUBMITTED"
          ? "Contenido enviado a revisión."
          : "Entregable actualizado."
      );
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "No hemos podido actualizar el entregable."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const deliverables =
    collaboration?.deliverables || [];

  const progress = useMemo(() => {
    if (!deliverables.length) return 0;

    const completed = deliverables.filter(
      (deliverable) =>
        deliverable.status === "APPROVED"
    ).length;

    return Math.round(
      (completed / deliverables.length) * 100
    );
  }, [deliverables]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <p className="text-sm text-black/40">
          Cargando colaboración...
        </p>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="mx-auto max-w-[1200px]">

        <button
          type="button"
          onClick={() => navigate("/creator/campaigns")}
          className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
        >
          ← Volver a campañas
        </button>

        <div className="mt-8 rounded-2xl border border-black/10 p-8">
          <p className="text-sm text-black/50">
            {error || "Colaboración no encontrada."}
          </p>
        </div>

      </div>
    );
  }

  const campaign = collaboration.campaign;

  const canRespond =
    collaboration.status === "PENDING" ||
    collaboration.status === "CONTACTED";

  const canSubmitContent =
    collaboration.status !== "REJECTED";

  return (
    <div className="mx-auto max-w-[1200px]">

      <button
        type="button"
        onClick={() => navigate("/creator/campaigns")}
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a campañas
      </button>

      <div className="mt-8">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
              Colaboración
            </p>

            <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-5xl">
              {campaign?.name || "Campaña"}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">

              {campaign?.platform && (
                <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/50">
                  {campaign.platform}
                </span>
              )}

              {campaign?.category && (
                <span className="rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/40">
                  {campaign.category}
                </span>
              )}

              <span className="rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/40">
                {statusLabels[collaboration.status] ||
                  collaboration.status}
              </span>

            </div>

          </div>

          <div className="rounded-2xl border border-black/10 px-6 py-5">

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              Remuneración
            </p>

            <p className="mt-1 text-3xl font-medium tracking-[-0.05em]">
              {formatCurrency(collaboration.fee)}
            </p>

          </div>

        </div>

      </div>

      {(actionError || actionSuccess) && (
        <div className="mt-8">

          {actionError && (
            <div className="rounded-2xl border border-black/10 p-5">
              <p className="text-sm text-black/60">
                {actionError}
              </p>
            </div>
          )}

          {actionSuccess && (
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5">
              <p className="text-sm text-black/60">
                {actionSuccess}
              </p>
            </div>
          )}

        </div>
      )}

      {canRespond && (
        <div className="mt-8 rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Tu respuesta
          </p>

          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
            ¿Quieres participar en esta campaña?
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
            Revisa las condiciones de la colaboración y
            confirma si quieres participar.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleResponse("ACCEPTED")}
              className="rounded-full bg-black px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading
                ? "Guardando..."
                : "Aceptar colaboración"}
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleResponse("REJECTED")}
              className="rounded-full border border-black/10 px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-black/50 transition hover:border-black/25 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Rechazar
            </button>

          </div>

        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

        <div className="rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Campaña
          </p>

          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
            Información
          </h2>

          {campaign?.description && (
            <p className="mt-4 text-sm leading-relaxed text-black/50">
              {campaign.description}
            </p>
          )}

          <div className="mt-8 grid gap-5 sm:grid-cols-2">

            <InfoItem
              label="Plataforma"
              value={campaign?.platform || "—"}
            />

            <InfoItem
              label="Categoría"
              value={campaign?.category || "—"}
            />

            <InfoItem
              label="Inicio"
              value={formatDate(campaign?.startDate)}
            />

            <InfoItem
              label="Finalización"
              value={formatDate(campaign?.endDate)}
            />

          </div>

        </div>

        <div className="rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Progreso
          </p>

          <p className="mt-3 text-4xl font-medium tracking-[-0.05em]">
            {progress}%
          </p>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-black/40">
            {deliverables.filter(
              (item) => item.status === "APPROVED"
            ).length}{" "}
            de {deliverables.length} entregables
            aprobados.
          </p>

        </div>

      </div>

      <div className="mt-8 rounded-2xl border border-black/10 p-7">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Trabajo
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
              Entregables
            </h2>

          </div>

          <p className="text-xs text-black/40">
            {deliverables.length} entregables
          </p>

        </div>

        {deliverables.length === 0 ? (
          <div className="mt-8 rounded-xl bg-black/[0.025] p-6">
            <p className="text-sm text-black/40">
              Todavía no hay entregables definidos para esta
              colaboración.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">

            {deliverables.map((deliverable, index) => (
              <DeliverableCard
                key={deliverable.id}
                deliverable={deliverable}
                index={index}
                disabled={
                  actionLoading ||
                  !canSubmitContent ||
                  deliverable.status === "APPROVED"
                }
                onSave={handleDeliverableUpdate}
              />
            ))}

          </div>
        )}

      </div>

      <div className="mt-8 rounded-2xl border border-black/10 p-7">

        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Condiciones económicas
        </p>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-3xl font-medium tracking-[-0.05em]">
              {formatCurrency(collaboration.fee)}
            </p>

            <p className="mt-2 text-xs text-black/40">
              Remuneración acordada para esta colaboración.
            </p>

          </div>

          <div className="text-left sm:text-right">

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              Estado del pago
            </p>

            <p className="mt-1 text-sm font-medium">
              {collaboration.paidAt
                ? "Pagado"
                : "Pendiente"}
            </p>

            {collaboration.paidAt && (
              <p className="mt-1 text-xs text-black/40">
                {formatDate(collaboration.paidAt)}
              </p>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

function DeliverableCard({
  deliverable,
  index,
  disabled,
  onSave,
}) {
  const [contentUrl, setContentUrl] = useState(
    deliverable.contentUrl || ""
  );

  const [notes, setNotes] = useState(
    deliverable.notes || ""
  );

  const canEdit =
    !disabled &&
    deliverable.status !== "APPROVED";

  const canSubmit =
    canEdit &&
    Boolean(contentUrl.trim());

  function handleSaveDraft() {
    onSave(deliverable.id, {
      contentUrl:
        contentUrl.trim() || null,
      notes:
        notes.trim() || null,
    });
  }

  function handleSubmit() {
    if (!canSubmit) return;

    onSave(deliverable.id, {
      contentUrl: contentUrl.trim(),
      notes: notes.trim() || null,
      status: "SUBMITTED",
    });
  }

  return (
    <div className="rounded-2xl border border-black/10 p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            Entregable {index + 1}
          </p>

          <h3 className="mt-2 text-lg font-medium">
            {deliverable.type || "Contenido"}
          </h3>

          {deliverable.description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/45">
              {deliverable.description}
            </p>
          )}

        </div>

        <span className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/45">
          {deliverableStatusLabels[
            deliverable.status
          ] || deliverable.status}
        </span>

      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">

        <InfoItem
          label="Plataforma"
          value={deliverable.platform || "—"}
        />

        <InfoItem
          label="Cantidad"
          value={String(deliverable.quantity || 1)}
        />

        <InfoItem
          label="Fecha límite"
          value={formatDate(deliverable.dueDate)}
        />

      </div>

      <div className="mt-6 border-t border-black/10 pt-6">

        <label className="block">

          <span className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            URL del contenido
          </span>

          <input
            type="url"
            value={contentUrl}
            onChange={(event) =>
              setContentUrl(event.target.value)
            }
            disabled={!canEdit}
            placeholder="https://..."
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition placeholder:text-black/25 focus:border-black/30 disabled:bg-black/[0.02] disabled:text-black/40"
          />

        </label>

        <label className="mt-4 block">

          <span className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            Notas
          </span>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            disabled={!canEdit}
            rows={3}
            placeholder="Añade información para ST.MARIA..."
            className="mt-2 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition placeholder:text-black/25 focus:border-black/30 disabled:bg-black/[0.02] disabled:text-black/40"
          />

        </label>

        {canEdit && (
          <div className="mt-4 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={disabled}
              className="rounded-full border border-black/10 px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-black/50 transition hover:border-black/25 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Guardar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || disabled}
              className="rounded-full bg-black px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Enviar a revisión
            </button>

          </div>
        )}

        {deliverable.status === "APPROVED" && (
          <p className="mt-4 text-xs text-black/40">
            Este contenido ha sido aprobado por ST.MARIA.
          </p>
        )}

        {deliverable.status === "IN_REVIEW" && (
          <p className="mt-4 text-xs text-black/40">
            El contenido está siendo revisado por ST.MARIA.
          </p>
        )}

        {deliverable.status === "REJECTED" && (
          <p className="mt-4 text-xs text-black/40">
            Este entregable necesita cambios antes de ser
            aprobado.
          </p>
        )}

      </div>

    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>

      <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>

      <p className="mt-1 text-sm text-black/65">
        {value}
      </p>

    </div>
  );
}

export default CreatorCollaborationDetail;