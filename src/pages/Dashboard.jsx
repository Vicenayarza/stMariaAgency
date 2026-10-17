import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const statusLabels = {
  DRAFT: "Borrador", ACTIVE: "Activa", COMPLETED: "Finalizada",
  CANCELLED: "Cancelada", ARCHIVED: "Archivada", DELETED: "Eliminada",
};

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#5A3E28]/10 bg-white p-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#6F6052]">{label}</p>
      <p className="mt-4 text-3xl font-medium tracking-tight text-[#3E2B1B]">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, membership, can } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canView = can("canViewCampaigns");
  const canCreate = membership?.brand?.accessMode === "SELF_MANAGED" && can("canCreateCampaigns");
  const canViewProposals = can("canViewProposals");
  const brandName = membership?.brand?.companyName || user?.name || "tu marca";

  useEffect(() => {
    let active = true;
    if (!canView) {
      setCampaigns([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiFetch("/api/campaigns")
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data?.campaigns)) throw new Error("INVALID_CAMPAIGNS_RESPONSE");
        setCampaigns(data.campaigns);
      })
      .catch((err) => {
        console.error("Error cargando campañas:", err);
        if (active) {
          setCampaigns([]);
          setError("No hemos podido cargar las campañas. Vuelve a intentarlo más tarde.");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canView]);

  const summary = useMemo(() => {
    const visible = campaigns.filter((c) => c.status !== "DELETED");
    const withBudget = visible.filter((c) => c.budget !== null && c.budget !== undefined && c.budget !== "" && Number.isFinite(Number(c.budget)));
    return {
      total: visible.length,
      active: visible.filter((c) => c.status === "ACTIVE").length,
      completed: visible.filter((c) => c.status === "COMPLETED").length,
      budget: withBudget.length ? money.format(withBudget.reduce((sum, c) => sum + Number(c.budget), 0)) : "Sin datos",
      latest: [...visible].sort((a, b) => {
        const ad = Date.parse(a.createdAt || "") || 0;
        const bd = Date.parse(b.createdAt || "") || 0;
        return bd - ad;
      }).slice(0, 5),
    };
  }, [campaigns]);

  return (
    <div className="mx-auto max-w-[1500px] text-[#3E2B1B]">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#A07A55]">Panel de marca</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight md:text-5xl">Bienvenido a ST.MARY</h1>
          <p className="mt-3 text-sm text-[#6F6052]">Consulta la actividad de {brandName}.</p>
        </div>
        {canCreate && (
          <Link to="/platform/campaigns/new" className="inline-flex justify-center rounded-full bg-[#8A6340] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.14em] text-white hover:bg-[#5A3E28]">
            + Nueva campaña
          </Link>
        )}
      </div>

      {!canView ? (
        <div className="mt-10 rounded-2xl border border-[#5A3E28]/10 bg-white p-8 text-sm text-[#6F6052]">
          Tu cuenta no tiene habilitada la consulta de campañas.
        </div>
      ) : loading ? (
        <div className="mt-10 rounded-2xl border border-[#5A3E28]/10 bg-white p-8 text-sm text-[#6F6052]">Cargando datos de campañas…</div>
      ) : error ? (
        <div role="alert" className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Campañas totales" value={summary.total} />
            <Stat label="Campañas activas" value={summary.active} />
            <Stat label="Campañas finalizadas" value={summary.completed} />
            <Stat label="Presupuesto registrado" value={summary.budget} />
          </div>
          <section className="mt-12">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#A07A55]">Actividad</p>
                <h2 className="mt-2 text-2xl font-medium">Últimas campañas</h2>
              </div>
              <Link to="/platform/campaigns" className="text-xs font-medium text-[#8A6340] hover:underline">Ver todas →</Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#5A3E28]/10 bg-white">
              {summary.latest.length === 0 ? (
                <div className="p-8 text-sm text-[#6F6052]">
                  Todavía no hay campañas registradas.
                  {canCreate && <Link className="ml-2 font-medium text-[#8A6340] underline" to="/platform/campaigns/new">Crear campaña</Link>}
                </div>
              ) : summary.latest.map((campaign) => (
                <Link key={campaign.id} to={`/platform/campaigns/${campaign.id}`} className="flex flex-col gap-2 border-b border-[#5A3E28]/10 px-6 py-5 transition-colors last:border-0 hover:bg-[#F4EDE2]/60 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{campaign.name || "Campaña sin nombre"}</p>
                    <p className="mt-1 text-xs text-[#6F6052]">{campaign.category || "Sin categoría"}</p>
                  </div>
                  <span className="w-fit rounded-full bg-[#EBDCC4] px-3 py-1 text-[10px] uppercase tracking-wider text-[#5A3E28]">{statusLabels[campaign.status] || campaign.status || "Sin estado"}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {canViewProposals && (
        <div className="mt-8 rounded-2xl border border-[#5A3E28]/10 bg-white p-7">
          <h2 className="text-xl font-medium">Propuestas de creadores</h2>
          <p className="mt-2 text-sm text-[#6F6052]">Consulta las propuestas disponibles para tus campañas.</p>
          <Link to="/platform/proposals" className="mt-5 inline-flex rounded-full border border-[#8A6340] px-5 py-3 text-[10px] uppercase tracking-wider text-[#8A6340] hover:bg-[#F4EDE2]">Ver propuestas →</Link>
        </div>
      )}
    </div>
  );
}
