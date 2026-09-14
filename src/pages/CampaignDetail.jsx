
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api";

const statusLabels = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  ACCEPTED: "Aceptado",
  SELECTED: "Seleccionado",
  PRODUCT_SENT: "Producto enviado",
  CONTENT_PENDING: "Contenido pendiente",
  CONTENT_RECEIVED: "Contenido recibido",
  PUBLISHED: "Publicado",
  PAID: "Pagado",
};

function CampaignDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");

  /*
   * CARGAR CAMPAÑA
   */
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(`/api/campaigns/${id}`);

        setCampaign(data.campaign);
      } catch (error) {
        console.error(error);

        if (error.status === 404) {
          setError("La campaña no existe o no tienes acceso a ella.");
        } else if (error.status === 401) {
          setError("Tu sesión ha caducado. Inicia sesión de nuevo.");
        } else {
          setError("No se ha podido cargar la campaña.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id]);

  /*
   * CARGAR RECOMENDACIONES
   */
  useEffect(() => {
    const loadMatches = async () => {
      if (!campaign) {
        return;
      }

      try {
        setMatchesLoading(true);
        setMatchesError("");

        const data = await apiFetch(
          `/api/campaigns/${id}/matches`
        );

        setMatches(data.matches || []);
      } catch (error) {
        console.error(error);

        setMatchesError(
          "No se han podido calcular las recomendaciones."
        );
      } finally {
        setMatchesLoading(false);
      }
    };

    loadMatches();
  }, [campaign, id]);

  /*
   * CÁLCULOS ECONÓMICOS
   */

  const creatorPayments = useMemo(() => {
    if (!campaign?.creators) {
      return 0;
    }

    return campaign.creators.reduce(
      (total, item) => total + Number(item.fee || 0),
      0
    );
  }, [campaign]);

  const campaignBudget = Number(campaign?.budget || 0);

  const remainingBudget =
    campaignBudget - creatorPayments;

  const budgetUsagePercentage =
    campaignBudget > 0
      ? Math.round(
          (creatorPayments / campaignBudget) * 100
        )
      : 0;

  const budgetBarPercentage =
    campaignBudget > 0
      ? Math.min(
          100,
          Math.max(0, budgetUsagePercentage)
        )
      : 0;

  const budgetExceeded = remainingBudget < 0;

  /*
   * LOADING
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px]">

        <div className="rounded-2xl border border-black/10 p-12 text-center">

          <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
            Cargando campaña...
          </p>

        </div>

      </div>
    );
  }

  /*
   * ERROR
   */

  if (error) {
    return (
      <div className="mx-auto max-w-[1000px]">

        <button
          type="button"
          onClick={() => navigate("/platform/campaigns")}
          className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
        >
          ← Volver a campañas
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">

          <p className="text-sm text-red-600">
            {error}
          </p>

        </div>

      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1500px]">

      {/* =========================================================
          VOLVER
      ========================================================= */}

      <button
        type="button"
        onClick={() => navigate("/platform/campaigns")}
        className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
      >
        ← Volver a campañas
      </button>


      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

        <div>

          <div className="flex items-center gap-3">

            <span className="rounded-full bg-black px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-white">
              {campaign.status}
            </span>

            <span className="text-[10px] text-black/35">
              Campaña
            </span>

          </div>

          <h1 className="mt-5 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
            {campaign.name}
          </h1>

          <p className="mt-3 text-sm text-black/45">
            {campaign.brand?.companyName || "Tu empresa"}
          </p>

        </div>


        <div className="flex gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(`/platform/campaigns/${campaign.id}/edit`)
            }
            className="rounded-full border border-black/10 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:border-black/30"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/platform/campaigns/${campaign.id}/creators`
              )
            }
            className="rounded-full bg-black px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-white"
          >
            Gestionar campaña
          </button>

        </div>

      </div>


      {/* =========================================================
          STATS
      ========================================================= */}

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 md:grid-cols-4">

        <Stat
          label="Presupuesto"
          value={formatMoney(campaign.budget)}
        />

        <Stat
          label="Creadores"
          value={campaign.creators?.length || 0}
        />

        <Stat
          label="Pagos a creadores"
          value={formatMoney(creatorPayments)}
        />

        <Stat
          label="Presupuesto disponible"
          value={formatMoney(remainingBudget)}
        />

      </div>


      {/* =========================================================
          RESUMEN + CREADORES
      ========================================================= */}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">

        {/* INFORMACIÓN */}

        <section className="rounded-2xl border border-black/10 p-7 lg:col-span-1">

          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            Información
          </p>

          <h2 className="mt-3 text-xl font-medium">
            Resumen
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-black/50">
            {campaign.description || "Sin descripción."}
          </p>

          <div className="mt-8 space-y-5">

            <Info
              label="Objetivo"
              value={campaign.objective || "No definido"}
            />

            <Info
              label="Categoría"
              value={campaign.category || "No definida"}
            />

            <Info
              label="Plataforma"
              value={campaign.platform || "No definida"}
            />

            <Info
              label="Inicio"
              value={formatDate(campaign.startDate)}
            />

            <Info
              label="Finalización"
              value={formatDate(campaign.endDate)}
            />

          </div>

        </section>


        {/* CREADORES */}

        <section className="rounded-2xl border border-black/10 lg:col-span-2">

          <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-7 sm:flex-row sm:items-center">

            <div>

              <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
                Colaboraciones
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Creadores
              </h2>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/platform/campaigns/${campaign.id}/creators`
                  )
                }
                className="rounded-full border border-black/10 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:border-black/30"
              >
                Ver todos
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/platform/campaigns/${campaign.id}/creators/add`
                  )
                }
                className="rounded-full bg-black px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-white"
              >
                + Añadir creador
              </button>

            </div>

          </div>


          {campaign.creators?.length > 0 ? (

            <div>

              {campaign.creators.map((item) => (

                <CreatorRow
                  key={item.id}
                  item={item}
                  campaignId={campaign.id}
                  onUpdated={(updated) => {

                    setCampaign((current) => {

                      if (!current) {
                        return current;
                      }

                      return {
                        ...current,
                        creators: current.creators.map(
                          (creator) =>
                            creator.id === updated.id
                              ? {
                                  ...creator,
                                  ...updated,
                                }
                              : creator
                        ),
                      };

                    });

                  }}
                />

              ))}

            </div>

          ) : (

            <div className="p-10 text-center">

              <p className="text-sm text-black/40">
                Todavía no hay creadores asociados a esta campaña.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/platform/campaigns/${campaign.id}/creators/add`
                  )
                }
                className="mt-5 rounded-full border border-black/15 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
              >
                Buscar creadores
              </button>

            </div>

          )}

        </section>

      </div>


      {/* =========================================================
          ST.MARIA INTELLIGENCE
      ========================================================= */}

      <section className="mt-8 rounded-2xl border border-black/10 p-7 md:p-10">

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              ST.MARIA Intelligence
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
              Creadores recomendados
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
              Perfiles que mejor encajan con las características de esta campaña.
            </p>

          </div>

          <span className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            {matches.length} recomendaciones
          </span>

        </div>


        {matchesLoading && (

          <div className="mt-8 rounded-xl border border-black/10 p-8 text-center">

            <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
              Analizando perfiles...
            </p>

          </div>

        )}


        {matchesError && (

          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            {matchesError}
          </div>

        )}


        {!matchesLoading &&
          !matchesError &&
          matches.length === 0 && (

            <div className="mt-8 rounded-xl border border-black/10 p-8 text-center">

              <p className="text-sm text-black/40">
                Todavía no hay perfiles recomendados para esta campaña.
              </p>

            </div>

          )}


        {!matchesLoading &&
          !matchesError &&
          matches.length > 0 && (

            <div className="mt-8 space-y-3">

              {matches.slice(0, 6).map((match) => (

                <div
                  key={match.creator.id}
                  className="rounded-xl border border-black/10 p-5"
                >

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[10px] text-white">
                        {getInitials(
                          match.creator.username
                        )}
                      </div>

                      <div>

                        <p className="font-medium">
                          @{match.creator.username}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {Number(
                            match.creator.followers || 0
                          ).toLocaleString("es-ES")}
                          {" "}seguidores ·{" "}
                          {match.creator.engagementRate || 0}
                          % engagement
                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-5">

                      <div className="text-right">

                        <p className="text-[8px] uppercase tracking-[0.12em] text-black/30">
                          Match
                        </p>

                        <p className="mt-1 text-2xl font-medium tracking-[-0.05em]">
                          {match.score}%
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/platform/creators/${match.creator.id}`
                          )
                        }
                        className="rounded-full border border-black/15 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
                      >
                        Ver perfil
                      </button>

                    </div>

                  </div>


                  <div className="mt-5 grid gap-2 md:grid-cols-4">

                    <MatchFactor
                      label="Categoría"
                      value={match.breakdown?.category || 0}
                    />

                    <MatchFactor
                      label="Plataforma"
                      value={match.breakdown?.platform || 0}
                    />

                    <MatchFactor
                      label="Engagement"
                      value={match.breakdown?.engagement || 0}
                    />

                    <MatchFactor
                      label="Audiencia"
                      value={match.breakdown?.audience || 0}
                    />

                  </div>

                </div>

              ))}

            </div>

          )}

      </section>


      {/* =========================================================
          FLUJO DE TRABAJO
      ========================================================= */}

      <section className="mt-8 rounded-2xl border border-black/10 p-7 md:p-10">

        <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
          Flujo de trabajo
        </p>

        <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
          Estado de la campaña
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-5">

          <WorkflowStep
            number="01"
            title="Selección"
            active={true}
          />

          <WorkflowStep
            number="02"
            title="Contacto"
            active={hasAnyStatus(
              campaign,
              [
                "CONTACTED",
                "ACCEPTED",
                "SELECTED",
              ]
            )}
          />

          <WorkflowStep
            number="03"
            title="Colaboración"
            active={hasAnyStatus(
              campaign,
              [
                "ACCEPTED",
                "SELECTED",
                "PRODUCT_SENT",
              ]
            )}
          />

          <WorkflowStep
            number="04"
            title="Contenido"
            active={hasAnyStatus(
              campaign,
              [
                "CONTENT_PENDING",
                "CONTENT_RECEIVED",
                "PUBLISHED",
                "PAID",
              ]
            )}
          />

          <WorkflowStep
            number="05"
            title="Resultados"
            active={campaign.status === "COMPLETED"}
          />

        </div>

      </section>


      {/* =========================================================
          PARTE ECONÓMICA
      ========================================================= */}

      <section className="mt-8 rounded-2xl bg-black p-7 text-white md:p-10">

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">
              Resumen económico
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
              Control del presupuesto
            </h2>

          </div>

          <div
            className={`rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.14em] ${
              budgetExceeded
                ? "bg-red-500/20 text-red-300"
                : "bg-white/10 text-white/50"
            }`}
          >
            {budgetExceeded
              ? `${budgetUsagePercentage}% · Sobre presupuesto`
              : `${budgetUsagePercentage}% utilizado`}
          </div>

        </div>


        <div className="mt-8 grid gap-8 md:grid-cols-3">

          <MoneyBlock
            label="Presupuesto cliente"
            value={formatMoney(campaignBudget)}
          />

          <MoneyBlock
            label="Coste de creadores"
            value={formatMoney(creatorPayments)}
          />

          <MoneyBlock
            label={
              budgetExceeded
                ? "Exceso de presupuesto"
                : "Disponible"
            }
            value={formatMoney(
              Math.abs(remainingBudget)
            )}
          />

        </div>


        {/* BARRA DE PRESUPUESTO */}

        <div className="mt-10">

          <div className="mb-3 flex items-center justify-between">

            <span className="text-[9px] uppercase tracking-[0.14em] text-white/35">
              Uso del presupuesto
            </span>

            <span className="text-xs text-white/60">
              {formatMoney(creatorPayments)}
              {" / "}
              {formatMoney(campaignBudget)}
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">

            <div
              className={`h-full rounded-full transition-all ${
                budgetExceeded
                  ? "bg-red-400"
                  : "bg-white"
              }`}
              style={{
                width: `${budgetBarPercentage}%`,
              }}
            />

          </div>

        </div>


        {budgetExceeded && (

          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4">

            <p className="text-xs leading-relaxed text-red-200">
              Los pagos previstos a creadores superan actualmente
              el presupuesto de la campaña en{" "}
              <strong>
                {formatMoney(
                  Math.abs(remainingBudget)
                )}
              </strong>
              . Revisa los fees antes de continuar asignando presupuesto.
            </p>

          </div>

        )}


        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/40">
          El importe disponible no representa automáticamente el beneficio
          de ST.MARIA. Para calcular el margen real habrá que descontar
          honorarios, producción, envíos, costes operativos, impuestos y
          cualquier otro gasto asociado a la campaña.
        </p>

      </section>

    </div>
  );
}


/* =========================================================
   COMPONENTES
========================================================= */

function Stat({ label, value }) {
  return (
    <div className="bg-[#f5f5f2] p-6">

      <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>

      <p className="mt-4 text-3xl font-medium tracking-[-0.05em]">
        {value}
      </p>

    </div>
  );
}


function Info({ label, value }) {
  return (
    <div>

      <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>

      <p className="mt-1 text-sm">
        {value}
      </p>

    </div>
  );
}


function CreatorRow({
  item,
  campaignId,
  onUpdated,
}) {
  const navigate = useNavigate();

  const [status, setStatus] = useState(
    item.status
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch(
        `/api/campaigns/${campaignId}/creators/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      setStatus(
        data.campaignCreator.status
      );

      onUpdated(
        data.campaignCreator
      );
    } catch (error) {
      console.error(error);

      setError(
        "No se ha podido actualizar el estado."
      );
    } finally {
      setLoading(false);
    }
  };

  const creator = item.creator;

  return (
    <div className="border-b border-black/10 p-6 last:border-b-0">

      <div className="flex flex-col gap-5">

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[10px] text-white">
              {getInitials(
                creator?.username || "Creador"
              )}
            </div>

            <div>

              <p className="font-medium">
                @{creator?.username || "Creador"}
              </p>

              <p className="mt-1 text-xs text-black/40">
                {creator?.followers
                  ? `${Number(
                      creator.followers
                    ).toLocaleString(
                      "es-ES"
                    )} seguidores`
                  : "Sin datos"}
              </p>

            </div>

          </div>


          <div className="grid grid-cols-2 gap-6 text-xs md:grid-cols-3">

            <div>

              <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                Engagement
              </p>

              <p className="mt-1">
                {creator?.engagementRate || 0}%
              </p>

            </div>


            <div>

              <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                Fee
              </p>

              <p className="mt-1">
                {formatMoney(item.fee)}
              </p>

            </div>


            <div>

              <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                Estado
              </p>

              <select
                value={status}
                disabled={loading}
                onChange={(event) =>
                  updateStatus(
                    event.target.value
                  )
                }
                className="mt-1 rounded-full border border-black/10 bg-[#f5f5f2] px-3 py-1 text-[9px] uppercase tracking-[0.1em] outline-none"
              >

                {Object.entries(
                  statusLabels
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </div>


        <div className="flex justify-end">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/platform/campaigns/${campaignId}/creators/${item.id}`
              )
            }
            className="rounded-full bg-black px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-white transition-transform hover:scale-105"
          >
            Gestionar colaboración
          </button>

        </div>


        {error && (

          <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>

        )}

      </div>

    </div>
  );
}


function WorkflowStep({
  number,
  title,
  active,
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        active
          ? "border-black bg-black text-white"
          : "border-black/10"
      }`}
    >

      <span
        className={`text-[9px] tracking-[0.16em] ${
          active
            ? "text-white/40"
            : "text-black/30"
        }`}
      >
        {number}
      </span>

      <p className="mt-5 text-sm font-medium">
        {title}
      </p>

    </div>
  );
}


function MoneyBlock({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-medium tracking-[-0.05em]">
        {value}
      </p>

    </div>
  );
}


function MatchFactor({
  label,
  value,
}) {
  const normalizedValue = Math.min(
    100,
    Math.max(0, Number(value || 0))
  );

  return (
    <div className="rounded-lg bg-black/[0.03] p-3">

      <div className="flex items-center justify-between">

        <span className="text-[8px] uppercase tracking-[0.12em] text-black/35">
          {label}
        </span>

        <span className="text-[9px] font-medium">
          {normalizedValue}%
        </span>

      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10">

        <div
          className="h-full rounded-full bg-black"
          style={{
            width: `${normalizedValue}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   UTILIDADES
========================================================= */

function formatMoney(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString(
    "es-ES",
    {
      style: "currency",
      currency: "EUR",
    }
  );
}


function formatDate(value) {
  if (!value) {
    return "No definida";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "No definida";
  }

  return date.toLocaleDateString(
    "es-ES"
  );
}


function getInitials(value) {
  return String(value || "")
    .split(/[\s_]+/)
    .filter(Boolean)
    .map(
      (part) => part[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


function hasAnyStatus(
  campaign,
  statuses
) {
  return campaign.creators?.some(
    (item) =>
      statuses.includes(
        item.status
      )
  );
}


export default CampaignDetail;

