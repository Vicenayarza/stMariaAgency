import { useEffect, useState } from "react";
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

function CreatorDashboard() {
  const [data, setData] = useState(null);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [dashboardResponse, collaborationsResponse] =
          await Promise.all([
            api.get("/creator-portal/dashboard"),
            api.get("/creator-portal/collaborations"),
          ]);

        setData(dashboardResponse);
        setCollaborations(
          collaborationsResponse.collaborations || []
        );
      } catch (err) {
        console.error(err);
        setError(
          "No hemos podido cargar la información de tu cuenta."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const upcomingDeliverables = collaborations
    .flatMap((collaboration) =>
      (collaboration.deliverables || []).map((deliverable) => ({
        ...deliverable,
        campaignName: collaboration.campaign?.name,
        collaborationId: collaboration.id,
      }))
    )
    .filter(
      (deliverable) =>
        deliverable.status !== "APPROVED" &&
        deliverable.status !== "REJECTED"
    )
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return (
        new Date(a.dueDate).getTime() -
        new Date(b.dueDate).getTime()
      );
    })
    .slice(0, 5);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <p className="text-sm text-black/40">
          Cargando tu dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-2xl border border-black/10 p-7">
          <p className="text-sm text-black/50">{error}</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="mx-auto max-w-[1500px]">

      <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
        Creator Platform
      </p>

      <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
        Hola{data?.creator?.name ? `, ${data.creator.name}` : ""}.
      </h1>

      <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
        Gestiona tus campañas, colaboraciones, entregables y
        pagos desde un único lugar.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-4">

        <StatCard
          value={stats.activeCampaigns || 0}
          label="Campañas activas"
        />

        <StatCard
          value={stats.collaborations || 0}
          label="Colaboraciones"
        />

        <StatCard
          value={stats.pendingDeliverables || 0}
          label="Entregables pendientes"
        />

        <StatCard
          value={formatCurrency(stats.totalEarned)}
          label="Ingresos cobrados"
        />

      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">

        <div className="rounded-2xl border border-black/10 p-7">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                Próximos entregables
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
                Lo que tienes pendiente
              </h2>
            </div>

            <span className="text-xs text-black/35">
              {upcomingDeliverables.length}
            </span>

          </div>

          {upcomingDeliverables.length === 0 ? (
            <div className="mt-8 rounded-xl bg-black/[0.025] p-6">
              <p className="text-sm text-black/40">
                No tienes entregables pendientes.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-black/10">

              {upcomingDeliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0"
                >

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium">
                      {deliverable.type || "Contenido"}
                    </p>

                    <p className="mt-1 truncate text-xs text-black/40">
                      {deliverable.campaignName}
                    </p>

                  </div>

                  <div className="shrink-0 text-right">

                    <p className="text-xs font-medium">
                      {deliverable.dueDate
                        ? formatDate(deliverable.dueDate)
                        : "Sin fecha"}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-black/35">
                      {statusLabels[deliverable.status] ||
                        deliverable.status}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        <div className="rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Finanzas
          </p>

          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
            Tus ingresos
          </h2>

          <div className="mt-8">

            <p className="text-3xl font-medium tracking-[-0.05em]">
              {formatCurrency(stats.totalEarned)}
            </p>

            <p className="mt-2 text-xs text-black/40">
              Total cobrado
            </p>

          </div>

          <div className="mt-8 border-t border-black/10 pt-6">

            <p className="text-xl font-medium tracking-[-0.04em]">
              {formatCurrency(stats.pendingPayments)}
            </p>

            <p className="mt-2 text-xs text-black/40">
              Pendiente de cobro
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-black/10 p-6">

      <p className="text-3xl font-medium tracking-[-0.05em]">
        {value}
      </p>

      <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-black/40">
        {label}
      </p>

    </div>
  );
}

export default CreatorDashboard;