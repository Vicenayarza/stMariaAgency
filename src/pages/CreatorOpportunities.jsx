import { useEffect, useState } from "react";
import { api } from "../lib/api";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "A consultar";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) return "A consultar";

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function CreatorOpportunities() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState({
    id: null,
    type: null,
  });
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOpportunities() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        "/api/creator-portal/campaign-opportunities"
      );

      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar las oportunidades."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  function removeCampaign(campaignId) {
    setCampaigns((current) =>
      current.filter(
        (item) => item.id !== campaignId
      )
    );

    setExpandedId((current) =>
      current === campaignId ? null : current
    );
  }

  async function handleApply(campaign) {
    try {
      setAction({
        id: campaign.id,
        type: "apply",
      });
      setError("");
      setSuccess("");

      await api.post(
        `/api/creator-portal/campaigns/${campaign.id}/apply`,
        {}
      );

      removeCampaign(campaign.id);

      setSuccess(
        `Tu candidatura para "${campaign.name}" se ha enviado correctamente.`
      );
    } catch (err) {
      console.error(err);

      if (
        [
          "ALREADY_APPLIED",
          "CREATOR_ALREADY_IN_CAMPAIGN",
          "CAMPAIGN_FULL",
          "OPPORTUNITY_DISMISSED",
          "CAMPAIGN_NOT_AVAILABLE",
        ].includes(err?.data?.error)
      ) {
        removeCampaign(campaign.id);
      }

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido enviar la candidatura."
      );
    } finally {
      setAction({
        id: null,
        type: null,
      });
    }
  }

  async function handleDecline(campaign) {
    try {
      setAction({
        id: campaign.id,
        type: "decline",
      });
      setError("");
      setSuccess("");

      await api.post(
        `/api/creator-portal/campaigns/${campaign.id}/decline`,
        {}
      );

      removeCampaign(campaign.id);

      setSuccess(
        `"${campaign.name}" se ha quitado de tus oportunidades.`
      );
    } catch (err) {
      console.error(err);

      if (
        [
          "ALREADY_APPLIED",
          "CREATOR_ALREADY_IN_CAMPAIGN",
          "CAMPAIGN_NOT_AVAILABLE",
        ].includes(err?.data?.error)
      ) {
        removeCampaign(campaign.id);
      }

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido descartar la oportunidad."
      );
    } finally {
      setAction({
        id: null,
        type: null,
      });
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Buscando campañas para ti...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Creator
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          Oportunidades
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
          Descubre campañas compatibles con tu perfil,
          consulta sus condiciones y decide si quieres
          participar.
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {campaigns.length === 0 && (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium">
            No tienes nuevas oportunidades.
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/40">
            Cuando haya campañas compatibles con tu
            perfil y con plazas abiertas aparecerán aquí.
          </p>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {campaigns.map((campaign) => {
            const busy =
              action.id === campaign.id;
            const applying =
              busy && action.type === "apply";
            const declining =
              busy && action.type === "decline";
            const expanded =
              expandedId === campaign.id;

            const platforms = unique([
              ...(campaign.platforms || []),
              campaign.platform,
              ...(campaign.instructions || []).map(
                (instruction) =>
                  instruction.platform
              ),
            ]);

            return (
              <article
                key={campaign.id}
                className="flex flex-col rounded-2xl border border-black/10 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                      {campaign.brand
                        ?.companyName || "Marca"}
                    </p>

                    <h2 className="mt-3 text-xl font-medium tracking-[-0.03em]">
                      {campaign.name}
                    </h2>
                  </div>

                  {campaign.creatorFee !== null &&
                    campaign.creatorFee !==
                      undefined && (
                      <div className="shrink-0 rounded-full bg-black px-4 py-2 text-xs font-medium text-white">
                        {formatMoney(
                          campaign.creatorFee
                        )}
                      </div>
                    )}
                </div>

                {campaign.description && (
                  <p
                    className={`mt-4 text-sm leading-6 text-black/45 ${
                      expanded
                        ? ""
                        : "line-clamp-3"
                    }`}
                  >
                    {campaign.description}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-black/10 pt-5">
                  <Info
                    label="Remuneración"
                    value={formatMoney(
                      campaign.creatorFee
                    )}
                  />

                  <Info
                    label="Plataformas"
                    value={
                      platforms.length > 0
                        ? platforms.join(" · ")
                        : "—"
                    }
                  />

                  <Info
                    label="Publicación"
                    value={
                      campaign.publicationStart ||
                      campaign.publicationDeadline
                        ? `${formatDate(
                            campaign.publicationStart
                          )} — ${formatDate(
                            campaign.publicationDeadline
                          )}`
                        : `${formatDate(
                            campaign.startDate
                          )} — ${formatDate(
                            campaign.endDate
                          )}`
                    }
                  />

                  <Info
                    label="Categoría"
                    value={
                      campaign.category || "—"
                    }
                  />
                </div>

                {(campaign.instructions || [])
                  .length > 0 && (
                  <div className="mt-6">
                    <p className="text-[8px] uppercase tracking-[0.14em] text-black/30">
                      Contenido solicitado
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {campaign.instructions.map(
                        (instruction) => (
                          <span
                            key={instruction.id}
                            className="rounded-full bg-[#f5f5f2] px-3 py-2 text-[10px] text-black/65"
                          >
                            {instruction.quantity ||
                              1}{" "}
                            {instruction.contentType ||
                              instruction.title ||
                              "contenido"}
                            {instruction.platform
                              ? ` · ${instruction.platform}`
                              : ""}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {expanded && (
                  <CampaignDetails
                    campaign={campaign}
                  />
                )}

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((current) =>
                      current === campaign.id
                        ? null
                        : campaign.id
                    )
                  }
                  className="mt-6 self-start text-[9px] uppercase tracking-[0.14em] text-black/50 underline underline-offset-4 transition hover:text-black"
                >
                  {expanded
                    ? "Ocultar detalles"
                    : "Ver detalles"}
                </button>

                <div className="mt-auto grid grid-cols-2 gap-3 pt-7">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleDecline(campaign)
                    }
                    className="rounded-full border border-black/15 bg-white px-5 py-3.5 text-[9px] uppercase tracking-[0.14em] text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {declining
                      ? "Quitando..."
                      : "No me interesa"}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleApply(campaign)
                    }
                    className="rounded-full bg-black px-5 py-3.5 text-[9px] uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {applying
                      ? "Enviando..."
                      : "Me interesa"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.14em] text-black/30">
        {label}
      </p>

      <p className="mt-1 text-sm">
        {value || "—"}
      </p>
    </div>
  );
}

function CampaignDetails({ campaign }) {
  const instructions =
    campaign.instructions || [];

  return (
    <div className="mt-6 rounded-2xl bg-[#f5f5f2] p-5">
      <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
        Detalles de la campaña
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Info
          label="Objetivo"
          value={campaign.objective || "—"}
        />

        <Info
          label="Fechas de campaña"
          value={`${formatDate(
            campaign.startDate
          )} — ${formatDate(
            campaign.endDate
          )}`}
        />

        {campaign.availableCreatorSlots !==
          null &&
          campaign.availableCreatorSlots !==
            undefined && (
            <Info
              label="Plazas disponibles"
              value={String(
                campaign.availableCreatorSlots
              )}
            />
          )}
      </div>

      {instructions.length > 0 && (
        <div className="mt-6 border-t border-black/10 pt-5">
          <p className="text-[8px] uppercase tracking-[0.14em] text-black/30">
            Requisitos de contenido
          </p>

          <div className="mt-3 space-y-3">
            {instructions.map(
              (instruction) => (
                <div
                  key={instruction.id}
                  className="rounded-xl bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {instruction.title ||
                        instruction.contentType ||
                        "Contenido"}
                    </p>

                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">
                      {instruction.quantity ||
                        1}{" "}
                      ud.
                    </span>

                    {instruction.platform && (
                      <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">
                        {
                          instruction.platform
                        }
                      </span>
                    )}
                  </div>

                  {instruction.description && (
                    <p className="mt-3 text-sm leading-6 text-black/50">
                      {
                        instruction.description
                      }
                    </p>
                  )}

                  {(instruction.publicationDate ||
                    instruction.deadline) && (
                    <p className="mt-3 text-xs text-black/40">
                      {instruction.publicationDate
                        ? `Publicación: ${formatDate(
                            instruction.publicationDate
                          )}`
                        : ""}
                      {instruction.publicationDate &&
                      instruction.deadline
                        ? " · "
                        : ""}
                      {instruction.deadline
                        ? `Límite: ${formatDate(
                            instruction.deadline
                          )}`
                        : ""}
                    </p>
                  )}

                  {(instruction.hashtags ||
                    []).length > 0 && (
                    <p className="mt-3 text-xs text-black/45">
                      Hashtags:{" "}
                      {instruction.hashtags.join(
                        " "
                      )}
                    </p>
                  )}

                  {(instruction.mentions ||
                    []).length > 0 && (
                    <p className="mt-2 text-xs text-black/45">
                      Menciones:{" "}
                      {instruction.mentions.join(
                        " "
                      )}
                    </p>
                  )}

                  {instruction.forbiddenContent && (
                    <div className="mt-3 rounded-lg border border-black/10 px-3 py-2">
                      <p className="text-[8px] uppercase tracking-[0.12em] text-black/35">
                        Restricciones
                      </p>

                      <p className="mt-1 text-xs leading-5 text-black/55">
                        {
                          instruction.forbiddenContent
                        }
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorOpportunities;
