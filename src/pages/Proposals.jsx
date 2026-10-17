import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { api } from "../lib/api";

function Proposals() {
  const [campaigns, setCampaigns] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        "/api/campaigns/proposals"
      );

      setCampaigns(
        data.campaigns || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se han podido cargar las propuestas."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando propuestas...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Plataforma
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          Propuestas
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
          Revisa los perfiles propuestos por
          ST.MARY AGENCY organizados por campaña.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error &&
        campaigns.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium">
              Todavía no tienes propuestas.
            </p>

            <p className="mt-2 text-sm text-black/40">
              Las campañas con perfiles
              propuestos aparecerán aquí.
            </p>
          </div>
        )}

      <div className="grid gap-5 xl:grid-cols-2">
        {campaigns.map((campaign) => {
          const stats = {
            pending: campaign.stats?.pending ?? 0,
            approved: campaign.stats?.approved ?? 0,
            rejected: campaign.stats?.rejected ?? 0,
            available: campaign.stats?.available ?? 0,
          };
          const complete =
            campaign.targetCreatorCount != null &&
            stats.approved >= campaign.targetCreatorCount;
          return (
            <Link
              key={campaign.id}
              to={`/platform/proposals/${campaign.id}`}
              className="rounded-2xl border border-black/10 bg-white p-6 transition hover:border-black/25"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                    Campaña
                  </p>

                  <h2 className="mt-2 text-lg font-medium">
                    {campaign.name}
                  </h2>

                  <p className="mt-2 text-xs text-black/40">
                    {campaign.platform ||
                      campaign.platforms?.join(
                        " · "
                      ) ||
                      "Multiplataforma"}
                  </p>
                </div>

                {complete ? (
                  <span className="rounded-full bg-black px-3 py-1.5 text-[8px] uppercase tracking-[0.12em] text-white">
                    Selección completa
                  </span>
                ) : (
                  <span className="rounded-full bg-black/5 px-3 py-1.5 text-[8px] uppercase tracking-[0.12em] text-black/50">
                    {stats.pending}{" "}
                    pendientes
                  </span>
                )}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-black/5 pt-5">
                <Stat
                  label="Objetivo"
                  value={
                    campaign.targetCreatorCount ??
                    "—"
                  }
                />

                <Stat
                  label="Seleccionados"
                  value={
                    campaign.targetCreatorCount
                      ? `${stats.approved} / ${campaign.targetCreatorCount}`
                      : stats.approved
                  }
                />

                <Stat
                  label="Disponibles"
                  value={
                    stats.available ??
                    "—"
                  }
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-black/35">
                  {stats.rejected}{" "}
                  rechazados
                </p>

                <span className="text-[9px] uppercase tracking-[0.14em]">
                  Ver propuestas →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.12em] text-black/30">
        {label}
      </p>

      <p className="mt-1 text-lg font-medium">
        {value}
      </p>
    </div>
  );
}

export default Proposals;