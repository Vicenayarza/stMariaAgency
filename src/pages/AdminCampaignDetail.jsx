import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusLabel(status) {
  const labels = {
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

  return labels[status] || status;
}

function getCampaignStatusLabel(status) {
  const labels = {
    DRAFT: "Borrador",
    ACTIVE: "Activa",
    PAUSED: "Pausada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };

  return labels[status] || status;
}

function getRiskLabel(level) {
  const labels = {
    LOW: "Bajo",
    MEDIUM: "Medio",
    HIGH: "Alto",
  };

  return labels[level] || level || "—";
}

function getRiskClasses(level) {
  if (level === "LOW") {
    return "bg-black/5 text-black/55";
  }

  if (level === "MEDIUM") {
    return "bg-black/10 text-black/65";
  }

  if (level === "HIGH") {
    return "bg-black text-white";
  }

  return "bg-black/5 text-black/45";
}

function getRankingLabel(index) {
  if (index === 0) return "01";
  if (index === 1) return "02";
  if (index === 2) return "03";

  return String(index + 1).padStart(2, "0");
}

function AdminCampaignDetail() {
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(`/api/admin/campaigns/${id}`);

      setCampaign(data.campaign);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido cargar la campaña."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMatches();
  }, [id]);

  async function loadMatches() {
    try {
      setMatchesLoading(true);
      setMatchesError("");

      const data = await api.get(
        `/api/campaigns/${id}/matches`
      );

      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);

      setMatchesError(
        err?.data?.message ||
          err?.message ||
          "No se han podido calcular los creadores recomendados."
      );
    } finally {
      setMatchesLoading(false);
    }
  }

  const totalCreatorFees = useMemo(() => {
    if (!campaign?.creators) return 0;

    return campaign.creators.reduce(
      (total, collaboration) =>
        total + Number(collaboration.fee || 0),
      0
    );
  }, [campaign]);

  const paidCreatorFees = useMemo(() => {
    if (!campaign?.creators) return 0;

    return campaign.creators
      .filter(
        (collaboration) =>
          collaboration.status === "PAID"
      )
      .reduce(
        (total, collaboration) =>
          total + Number(collaboration.fee || 0),
        0
      );
  }, [campaign]);

  const estimatedMargin =
    Number(campaign?.budget || 0) -
    totalCreatorFees;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando campaña...
        </p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div>
        <Link
          to="/admin/campaigns"
          className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
        >
          ← Volver a campañas
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error || "Campaña no encontrada."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/campaigns"
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a campañas
      </Link>

      <div className="mt-6 mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Campaña
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            {campaign.name}
          </h1>

          <p className="mt-2 text-sm text-black/45">
            {campaign.brand?.companyName || "Cliente"}
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-black px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-white">
          {getCampaignStatusLabel(campaign.status)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            Presupuesto
          </p>

          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(campaign.budget)}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            Fees creadores
          </p>

          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(totalCreatorFees)}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            Pagado
          </p>

          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(paidCreatorFees)}
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            Margen bruto estimado
          </p>

          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(estimatedMargin)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="rounded-2xl border border-black/10 bg-white p-6 lg:col-span-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
            Información
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Cliente
              </p>

              <p className="mt-1 text-sm font-medium">
                {campaign.brand?.companyName || "—"}
              </p>

              <p className="mt-1 text-xs text-black/40">
                {campaign.brand?.user?.email || ""}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Categoría
              </p>

              <p className="mt-1 text-sm">
                {campaign.category || "No especificada"}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Plataforma
              </p>

              <p className="mt-1 text-sm">
                {campaign.platform || "No especificada"}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Objetivo
              </p>

              <p className="mt-1 text-sm leading-6 text-black/60">
                {campaign.objective || "No especificado"}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Fechas
              </p>

              <p className="mt-1 text-sm">
                {formatDate(campaign.startDate)} →{" "}
                {formatDate(campaign.endDate)}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Creada
              </p>

              <p className="mt-1 text-sm">
                {formatDate(campaign.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white lg:col-span-2">
          <div className="border-b border-black/10 px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
              Creadores de la campaña
            </p>
          </div>

          {!campaign.creators?.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-black/40">
                Todavía no hay creadores asociados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {campaign.creators.map(
                (collaboration) => (
                  <div
                    key={collaboration.id}
                    className="px-6 py-6"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                      <div>
                        <p className="text-sm font-medium">
                          {collaboration.creator?.user
                            ?.name ||
                            collaboration.creator
                              ?.username ||
                            "Creador"}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          @
                          {collaboration.creator
                            ?.username || "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                            Fee
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {formatCurrency(
                              collaboration.fee
                            )}
                          </p>
                        </div>

                        <span className="rounded-full bg-black/5 px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">
                          {getStatusLabel(
                            collaboration.status
                          )}
                        </span>
                      </div>
                    </div>

                    {collaboration.deliverables
                      ?.length > 0 && (
                      <div className="mt-5 rounded-xl bg-black/[0.025] p-4">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                          Entregables
                        </p>

                        <div className="mt-3 space-y-2">
                          {collaboration.deliverables.map(
                            (deliverable) => (
                              <div
                                key={deliverable.id}
                                className="flex items-center justify-between gap-4"
                              >
                                <div>
                                  <p className="text-xs font-medium">
                                    {
                                      deliverable.type
                                    }
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-black/35">
                                    {deliverable.platform ||
                                      "Plataforma no especificada"}
                                  </p>
                                </div>

                                <span className="text-[9px] uppercase tracking-[0.1em] text-black/40">
                                  {
                                    deliverable.status
                                  }
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* ==========================================
          MATCHING ENGINE
          ========================================== */}

      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
                Matching Engine
              </p>

              <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">
                Creadores recomendados
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-black/40">
                Ranking automático basado en el encaje con la
                campaña, calidad de audiencia, Trust Score,
                engagement y señales de riesgo.
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                Criterios
              </p>

              <p className="mt-1 text-[10px] text-black/45">
                Campaign Fit · Audience · Trust · Risk
              </p>
            </div>
          </div>
        </div>

        {matchesLoading ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-black/40">
              Analizando creadores...
            </p>

            <p className="mt-2 text-xs text-black/25">
              Calculando compatibilidad, audiencia,
              confianza y riesgo.
            </p>
          </div>
        ) : matchesError ? (
          <div className="px-6 py-10">
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-xs font-medium text-red-700">
                No se ha podido calcular el matching.
              </p>

              <p className="mt-1 text-xs text-red-600/80">
                {matchesError}
              </p>
            </div>
          </div>
        ) : !matches.length ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-black/40">
              No hay creadores disponibles para esta campaña.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {matches.map((match, index) => {
              const creator = match.creator;

              return (
                <div
                  key={creator.id}
                  className="px-6 py-6 transition-colors hover:bg-black/[0.015]"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    {/* CREATOR */}

                    <div className="flex min-w-0 items-start gap-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium tracking-[0.08em] text-white">
                        {getRankingLabel(index)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium">
                            {creator.user?.name ||
                              creator.username ||
                              "Creador"}
                          </p>

                          <span className="text-xs text-black/35">
                            @{creator.username}
                          </span>
                        </div>

                        {creator.bio && (
                          <p className="mt-2 max-w-xl text-xs leading-5 text-black/45">
                            {creator.bio}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">
                            {creator.followers.toLocaleString(
                              "es-ES"
                            )}{" "}
                            seguidores
                          </span>

                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">
                            {creator.engagementRate}%
                            engagement
                          </span>

                          {creator.location && (
                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">
                              {creator.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SCORE */}

                    <div className="flex shrink-0 items-center gap-5">
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                          Match Score
                        </p>

                        <p className="mt-1 text-3xl font-medium tracking-[-0.05em]">
                          {match.score}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] ${getRiskClasses(
                          match.risk?.level
                        )}`}
                      >
                        Riesgo{" "}
                        {getRiskLabel(
                          match.risk?.level
                        )}
                      </span>
                    </div>
                  </div>

                  {/* BREAKDOWN */}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Campaign Fit
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown?.campaignFit ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Audience Quality
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown
                          ?.audienceQuality ?? 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Trust Score
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown?.trustScore ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Categoría
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown?.category ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Plataforma
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown?.platform ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Engagement
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown?.engagement ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/[0.025] p-3">
                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">
                        Riesgo
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        {match.breakdown?.risk ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {campaign.description && (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
            Descripción
          </p>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-black/60">
            {campaign.description}
          </p>
        </section>
      )}
    </div>
  );
}

export default AdminCampaignDetail;