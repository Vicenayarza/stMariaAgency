import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusLabels = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
  ARCHIVED: "Archivada",
};

function Campaigns() {
  const { membership, can } = useAuth();
  const canCreateCampaign =
    membership?.brand?.accessMode === "SELF_MANAGED" &&
    can("canCreateCampaigns");

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let cancelled = false;
    async function loadCampaigns() {
      try {
        setLoading(true);
        setError("");
        const data = await apiFetch("/api/campaigns");
        if (!cancelled) {
          setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCampaigns([]);
          setError("No se han podido cargar las campañas. Inténtalo de nuevo más tarde.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCampaigns();
    return () => { cancelled = true; };
  }, []);

  const filteredCampaigns = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-ES");
    return campaigns.filter((campaign) => {
      if (!(campaign.name ?? "").toLocaleLowerCase("es-ES").includes(term)) return false;
      if (filter === "ACTIVE") return campaign.status === "ACTIVE";
      if (filter === "COMPLETED") return campaign.status === "COMPLETED";
      return true;
    });
  }, [campaigns, search, filter]);

  const formatBudget = (budget) => {
    if (budget === null || budget === undefined || budget === "") return "Sin presupuesto";
    const amount = Number(budget);
    return Number.isFinite(amount)
      ? amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
      : "Sin presupuesto";
  };

  return (
    <div className="mx-auto max-w-[1500px] text-[#3E2B1B]">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#A07A55]">Gestión</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">Campañas</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6F6052]">
            {canCreateCampaign
              ? "Consulta y gestiona tus campañas, creadores y colaboraciones."
              : "Consulta el estado de tus campañas y sigue sus colaboraciones."}
          </p>
        </div>
        {canCreateCampaign && (
          <Link
            to="/platform/campaigns/new"
            className="inline-flex items-center justify-center rounded-full bg-[#8A6340] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#5A3E28]"
          >
            + Nueva campaña
          </Link>
        )}
      </div>

      <div className="mt-12 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar campañas..."
          aria-label="Buscar campañas"
          className="min-w-0 flex-1 rounded-xl border border-[#D8C3A5] bg-white px-5 py-4 text-sm outline-none placeholder:text-[#A07A55] focus:border-[#8A6340]"
        />
        {[
          ["ALL", "Todas"],
          ["ACTIVE", "Activas"],
          ["COMPLETED", "Finalizadas"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-xl border px-5 py-4 text-[10px] uppercase tracking-[0.14em] transition-colors ${
              filter === value
                ? "border-[#8A6340] bg-[#8A6340] text-white"
                : "border-[#D8C3A5] bg-white text-[#6F6052] hover:border-[#8A6340]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 rounded-2xl border border-[#D8C3A5] bg-white p-12 text-center text-sm text-[#6F6052]">
          Cargando campañas...
        </div>
      )}

      {!loading && !error && filteredCampaigns.length === 0 && (
        <div className="mt-8 rounded-2xl border border-[#D8C3A5] bg-white p-12 text-center">
          <p className="text-sm text-[#6F6052]">
            {campaigns.length === 0 ? "Todavía no tienes campañas." : "No hay campañas que coincidan con los filtros."}
          </p>
          {canCreateCampaign && campaigns.length === 0 && (
            <Link
              to="/platform/campaigns/new"
              className="mt-5 inline-flex rounded-full bg-[#8A6340] px-6 py-3 text-[9px] uppercase tracking-[0.14em] text-white hover:bg-[#5A3E28]"
            >
              Crear primera campaña
            </Link>
          )}
        </div>
      )}

      {!loading && !error && filteredCampaigns.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white">
          <div className="hidden grid-cols-12 border-b border-[#EBDCC4] px-6 py-4 text-[9px] uppercase tracking-[0.14em] text-[#A07A55] md:grid">
            <span className="col-span-4">Campaña</span>
            <span className="col-span-2">Creadores</span>
            <span className="col-span-2">Presupuesto</span>
            <span className="col-span-2">Estado</span>
            <span className="col-span-2">Creada</span>
          </div>
          {filteredCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/platform/campaigns/${campaign.id}`}
              className="grid gap-5 border-b border-[#EBDCC4] px-6 py-7 transition-colors last:border-b-0 hover:bg-[#F4EDE2]/60 md:grid-cols-12 md:items-center"
            >
              <div className="md:col-span-4">
                <p className="font-medium">{campaign.name}</p>
                <p className="mt-1 text-xs text-[#A07A55]">{campaign.category || "Sin categoría"}</p>
              </div>
              <div className="text-sm text-[#6F6052] md:col-span-2">
                {campaign._count?.creators ?? 0} creadores
              </div>
              <div className="text-sm font-medium md:col-span-2">{formatBudget(campaign.budget)}</div>
              <div className="md:col-span-2">
                <span className="inline-flex rounded-full border border-[#D8C3A5] bg-[#F4EDE2] px-3 py-1 text-[9px] uppercase tracking-[0.12em]">
                  {statusLabels[campaign.status] || campaign.status || "Sin estado"}
                </span>
              </div>
              <div className="text-xs text-[#6F6052] md:col-span-2">
                {campaign.createdAt && !Number.isNaN(new Date(campaign.createdAt).getTime())
                  ? new Date(campaign.createdAt).toLocaleDateString("es-ES")
                  : "—"}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-[#D8C3A5] bg-[#EBDCC4] p-7">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">ST.MARY AGENCY</p>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
          {canCreateCampaign ? "Tus campañas, en un solo lugar." : "Sigue la evolución de tus campañas."}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6052]">
          Consulta las colaboraciones y accede al detalle de cada campaña para conocer su estado.
        </p>
      </div>
    </div>
  );
}

export default Campaigns;
