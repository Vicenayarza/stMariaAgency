import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const statusLabels = {
  PENDING: "Pendiente",
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
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function CreatorCampaigns() {
  const navigate = useNavigate();

  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    async function loadCollaborations() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/creator-portal/collaborations"
        );

        setCollaborations(response.collaborations || []);
      } catch (err) {
        console.error(err);

        setError(
          "No hemos podido cargar tus colaboraciones."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCollaborations();
  }, []);

  const filteredCollaborations = useMemo(() => {
    if (filter === "ALL") {
      return collaborations;
    }

    if (filter === "ACTIVE") {
      return collaborations.filter(
        (collaboration) =>
          !["REJECTED", "PAID"].includes(
            collaboration.status
          )
      );
    }

    if (filter === "PENDING") {
      return collaborations.filter(
        (collaboration) =>
          collaboration.status === "PENDING"
      );
    }

    if (filter === "COMPLETED") {
      return collaborations.filter(
        (collaboration) =>
          ["PUBLISHED", "PAID"].includes(
            collaboration.status
          )
      );
    }

    return collaborations;
  }, [collaborations, filter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <p className="text-sm text-black/40">
          Cargando tus campañas...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px]">

      <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
        Oportunidades
      </p>

      <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
        Campañas
      </h1>

      <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
        Consulta tus colaboraciones, entregables, fechas y
        remuneración.
      </p>

      {error && (
        <div className="mt-8 rounded-2xl border border-black/10 p-6">
          <p className="text-sm text-black/50">
            {error}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-2">

        <FilterButton
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        >
          Todas
        </FilterButton>

        <FilterButton
          active={filter === "ACTIVE"}
          onClick={() => setFilter("ACTIVE")}
        >
          Activas
        </FilterButton>

        <FilterButton
          active={filter === "PENDING"}
          onClick={() => setFilter("PENDING")}
        >
          Pendientes
        </FilterButton>

        <FilterButton
          active={filter === "COMPLETED"}
          onClick={() => setFilter("COMPLETED")}
        >
          Finalizadas
        </FilterButton>

      </div>

      <div className="mt-6">

        {filteredCollaborations.length === 0 ? (
          <div className="rounded-2xl border border-black/10 p-10 text-center">

            <p className="text-sm text-black/40">
              {collaborations.length === 0
                ? "Todavía no tienes colaboraciones."
                : "No hay colaboraciones con este filtro."}
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {filteredCollaborations.map(
              (collaboration) => (
                <CampaignCard
                  key={collaboration.id}
                  collaboration={collaboration}
                  onClick={() =>
                    navigate(
                      `/creator/campaigns/${collaboration.id}`
                    )
                  }
                />
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

function CampaignCard({
  collaboration,
  onClick,
}) {
  const campaign = collaboration.campaign;
  const deliverables =
    collaboration.deliverables || [];

  const pendingDeliverables =
    deliverables.filter(
      (deliverable) =>
        !["APPROVED", "REJECTED"].includes(
          deliverable.status
        )
    ).length;

  const totalDeliverables = deliverables.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-black/10 p-6 text-left transition hover:border-black/25 hover:bg-black/[0.015]"
    >

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/50">
              {campaign?.platform || "Campaña"}
            </span>

            {campaign?.category && (
              <span className="rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/40">
                {campaign.category}
              </span>
            )}

          </div>

          <h2 className="mt-4 text-xl font-medium tracking-[-0.03em]">
            {campaign?.name || "Campaña sin nombre"}
          </h2>

          {campaign?.description && (
            <p className="mt-2 max-w-2xl line-clamp-2 text-sm leading-relaxed text-black/45">
              {campaign.description}
            </p>
          )}

        </div>

        <div className="flex shrink-0 flex-col gap-4 lg:min-w-[300px]">

          <div className="flex items-center justify-between gap-6">

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
                Remuneración
              </p>

              <p className="mt-1 text-lg font-medium">
                {formatCurrency(collaboration.fee)}
              </p>
            </div>

            <StatusBadge
              status={collaboration.status}
            />

          </div>

          <div className="flex items-center justify-between border-t border-black/10 pt-4">

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
                Entregables
              </p>

              <p className="mt-1 text-xs text-black/55">
                {pendingDeliverables} pendientes
                {totalDeliverables > 0
                  ? ` · ${totalDeliverables} total`
                  : ""}
              </p>
            </div>

            <div className="text-right">

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
                Finalización
              </p>

              <p className="mt-1 text-xs text-black/55">
                {formatDate(campaign?.endDate)}
              </p>

            </div>

          </div>

        </div>

      </div>

      <div className="mt-5 flex items-center justify-end border-t border-black/10 pt-4">

        <span className="text-[10px] uppercase tracking-[0.14em] text-black/40 transition group-hover:text-black">
          Ver colaboración →
        </span>

      </div>

    </button>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-black/45">
      {statusLabels[status] || status}
    </span>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.12em] transition ${
        active
          ? "bg-black text-white"
          : "border border-black/10 text-black/45 hover:border-black/25 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

export default CreatorCampaigns;