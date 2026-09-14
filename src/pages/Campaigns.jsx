import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "../lib/api";

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch("/api/campaigns");

        setCampaigns(data.campaigns);
      } catch (error) {
        console.error(error);

        setError(
          "No se han podido cargar las campañas."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name
          .toLowerCase()
          .includes(search.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (filter === "ACTIVE") {
        return campaign.status !== "COMPLETED";
      }

      if (filter === "COMPLETED") {
        return campaign.status === "COMPLETED";
      }

      return true;
    });
  }, [campaigns, search, filter]);

  return (
    <div className="mx-auto max-w-[1500px]">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

        <div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
            Gestión
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
            Campañas
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
            Gestiona tus campañas de influencer marketing, creadores,
            presupuestos y colaboraciones.
          </p>

        </div>

        <Link
          to="/platform/campaigns/new"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.02]"
        >
          + Nueva campaña
        </Link>

      </div>


      {/* FILTERS */}

      <div className="mt-12 flex flex-col gap-3 md:flex-row">

        <div className="flex-1">

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar campañas..."
            className="w-full rounded-xl border border-black/10 bg-transparent px-5 py-4 text-sm outline-none transition-colors placeholder:text-black/30 focus:border-black/30"
          />

        </div>

        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-xl border px-5 py-4 text-[10px] uppercase tracking-[0.14em] ${
            filter === "ALL"
              ? "border-black bg-black text-white"
              : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"
          }`}
        >
          Todas
        </button>

        <button
          onClick={() => setFilter("ACTIVE")}
          className={`rounded-xl border px-5 py-4 text-[10px] uppercase tracking-[0.14em] ${
            filter === "ACTIVE"
              ? "border-black bg-black text-white"
              : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"
          }`}
        >
          Activas
        </button>

        <button
          onClick={() => setFilter("COMPLETED")}
          className={`rounded-xl border px-5 py-4 text-[10px] uppercase tracking-[0.14em] ${
            filter === "COMPLETED"
              ? "border-black bg-black text-white"
              : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"
          }`}
        >
          Finalizadas
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* LOADING */}

      {loading && (

        <div className="mt-8 rounded-2xl border border-black/10 p-12 text-center">

          <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
            Cargando campañas...
          </p>

        </div>

      )}


      {/* EMPTY */}

      {!loading &&
        !error &&
        filteredCampaigns.length === 0 && (

          <div className="mt-8 rounded-2xl border border-black/10 p-12 text-center">

            <p className="text-sm text-black/40">
              No hay campañas que mostrar.
            </p>

            <Link
              to="/platform/campaigns/new"
              className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-[9px] uppercase tracking-[0.14em] text-white"
            >
              Crear primera campaña
            </Link>

          </div>

        )}


      {/* CAMPAIGNS */}

      {!loading &&
        filteredCampaigns.length > 0 && (

          <div className="mt-8 overflow-hidden rounded-2xl border border-black/10">

            <div className="hidden grid-cols-12 border-b border-black/10 px-6 py-4 text-[9px] uppercase tracking-[0.14em] text-black/35 md:grid">

              <div className="col-span-4">
                Campaña
              </div>

              <div className="col-span-2">
                Creadores
              </div>

              <div className="col-span-2">
                Presupuesto
              </div>

              <div className="col-span-2">
                Estado
              </div>

              <div className="col-span-2">
                Creada
              </div>

            </div>


            {filteredCampaigns.map((campaign) => (

              <Link
                key={campaign.id}
                to={`/platform/campaigns/${campaign.id}`}
                className="grid gap-5 border-b border-black/10 px-6 py-7 transition-colors last:border-b-0 hover:bg-black/[0.025] md:grid-cols-12 md:items-center"
              >

                <div className="md:col-span-4">

                  <p className="font-medium">
                    {campaign.name}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    {campaign.category || "Sin categoría"}
                  </p>

                </div>


                <div className="text-sm text-black/60 md:col-span-2">

                  {campaign._count?.creators || 0}

                  <span className="ml-1 text-black/30">
                    creadores
                  </span>

                </div>


                <div className="text-sm font-medium md:col-span-2">

                  {Number(campaign.budget).toLocaleString(
                    "es-ES",
                    {
                      style: "currency",
                      currency: "EUR",
                    }
                  )}

                </div>


                <div className="md:col-span-2">

                  <span className="inline-flex rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em]">
                    {campaign.status}
                  </span>

                </div>


                <div className="text-xs text-black/40 md:col-span-2">

                  {new Date(
                    campaign.createdAt
                  ).toLocaleDateString("es-ES")}

                </div>

              </Link>

            ))}

          </div>

        )}


      {/* INFO */}

      <div className="mt-10 rounded-2xl bg-black p-7 text-white">

        <div className="max-w-2xl">

          <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
            ST.MARIA
          </p>

          <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
            Gestiona campañas de principio a fin.
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Desde la búsqueda de creadores hasta los contratos, entregables,
            pagos y resultados de campaña.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Campaigns;