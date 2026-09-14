import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("es-ES").format(value);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatPlatform(platform) {
  const labels = {
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
    TWITTER: "Twitter",
    FACEBOOK: "Facebook",
    TWITCH: "Twitch",
    LINKEDIN: "LinkedIn",
    OTHER: "Otra",
  };

  return labels[platform] || platform;
}

function getScoreLabel(score) {
  if (score >= 90) {
    return "Excelente";
  }

  if (score >= 75) {
    return "Muy bueno";
  }

  if (score >= 60) {
    return "Bueno";
  }

  if (score >= 40) {
    return "Mejorable";
  }

  return "Bajo";
}

function getRiskLabel(level) {
  switch (level) {
    case "LOW":
      return "Bajo";
    case "MEDIUM":
      return "Medio";
    case "HIGH":
      return "Alto";
    default:
      return "Sin evaluar";
  }
}

function getRiskClasses(level) {
  switch (level) {
    case "LOW":
      return {
        badge:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "bg-emerald-100 text-emerald-700",
      };

    case "MEDIUM":
      return {
        badge:
          "bg-amber-50 text-amber-700 border-amber-200",
        icon: "bg-amber-100 text-amber-700",
      };

    case "HIGH":
      return {
        badge:
          "bg-red-50 text-red-700 border-red-200",
        icon: "bg-red-100 text-red-700",
      };

    default:
      return {
        badge:
          "bg-slate-50 text-slate-600 border-slate-200",
        icon: "bg-slate-100 text-slate-600",
      };
  }
}

function ScoreItem({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-4">
        <span className="text-sm text-slate-600">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-900">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value || 0)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function AudienceQualityCard({
  audienceQuality,
}) {
  if (!audienceQuality) {
    return null;
  }

  const breakdown =
    audienceQuality.breakdown || {};

  const score =
    audienceQuality.audienceQualityScore ?? 0;

  const items = [
    {
      label: "Engagement quality",
      value:
        breakdown.engagementQuality ?? 0,
    },
    {
      label: "View efficiency",
      value:
        breakdown.viewEfficiency ?? 0,
    },
    {
      label: "Reach efficiency",
      value:
        breakdown.reachEfficiency ?? 0,
    },
    {
      label: "Interaction quality",
      value:
        breakdown.interactionQuality ?? 0,
    },
    {
      label: "Consistency",
      value:
        breakdown.consistency ?? 0,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Audience Quality
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Calidad de audiencia
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Calidad y eficiencia de la audiencia
            utilizando métricas verificadas.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-4xl font-bold text-slate-900">
            {score}
          </div>

          <div className="text-xs text-slate-400">
            / 100
          </div>

          <div className="mt-1 text-xs font-medium text-slate-500">
            {getScoreLabel(score)}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {items.map((item) => (
          <ScoreItem
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        El Audience Quality Score estima la calidad
        y eficiencia de la audiencia a partir de
        métricas verificadas. No representa por sí
        solo una detección de fraude.
      </div>
    </section>
  );
}

function RiskPanel({ risk }) {
  if (!risk) {
    return null;
  }

  const classes = getRiskClasses(
    risk.level
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Risk Analysis
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Análisis de riesgo
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Señales automáticas que ayudan a detectar
            comportamientos que requieren revisión.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${classes.badge}`}
        >
          Riesgo {getRiskLabel(risk.level)}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Risk Score
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {risk.score ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            sobre 100
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Nivel
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {getRiskLabel(risk.level)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Señales detectadas
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {risk.flags?.length ?? 0}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Métricas verificadas
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {risk.verifiedMetricsCount ?? 0}
          </p>
        </div>
      </div>

      {risk.flags?.length > 0 ? (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Señales detectadas
          </h3>

          {risk.flags.map((flag, index) => {
            const flagClasses =
              getRiskClasses(flag.level);

            return (
              <div
                key={`${flag.type}-${index}`}
                className="flex gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${flagClasses.icon}`}
                >
                  !
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {flag.title}
                    </p>

                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${flagClasses.badge}`}
                    >
                      {getRiskLabel(
                        flag.level
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {flag.description}
                  </p>

                  {flag.value !== undefined &&
                  flag.value !== null ? (
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Valor detectado:{" "}
                      {typeof flag.value ===
                      "number"
                        ? flag.value.toFixed(2)
                        : flag.value}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            No se han detectado señales relevantes.
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            Las métricas verificadas analizadas no
            presentan actualmente indicadores de riesgo
            relevantes.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        Estas señales son indicadores automáticos y no
        implican por sí mismas fraude, manipulación de
        audiencia o incumplimiento. Las situaciones
        relevantes deben revisarse manualmente.
      </div>
    </section>
  );
}

function MetricChart({
  title,
  data,
  valueKey,
  formatter,
}) {
  const width = 700;
  const height = 240;
  const padding = 35;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-500">
          No hay suficientes métricas verificadas.
        </p>
      </div>
    );
  }

  const values = data.map(
    (item) => Number(item[valueKey]) || 0
  );

  const min = Math.min(...values);
  const max = Math.max(...values);

  const range =
    max - min === 0 ? 1 : max - min;

  const points = data.map((item, index) => {
    const x =
      padding +
      (index *
        (width - padding * 2)) /
        Math.max(data.length - 1, 1);

    const normalized =
      (Number(item[valueKey]) - min) /
      range;

    const y =
      height -
      padding -
      normalized *
        (height - padding * 2);

    return {
      x,
      y,
      value: Number(item[valueKey]) || 0,
    };
  });

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          Evolución de métricas verificadas
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-60 min-w-[600px] w-full"
        >
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="currentColor"
            className="text-slate-200"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="currentColor"
            className="text-slate-200"
          />

          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-900"
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="currentColor"
                className="text-slate-900"
              />

              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]"
              >
                {formatter
                  ? formatter(point.value)
                  : point.value}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function EngagementChart({ data }) {
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(
    ...data.map(
      (item) =>
        Number(item.engagementRate) || 0
    ),
    1
  );

  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Engagement histórico
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          Evolución del engagement verificado
        </p>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const value =
            Number(item.engagementRate) || 0;

          return (
            <div key={index}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {formatDate(
                    item.recordedAt
                  )}
                </span>

                <span className="text-xs font-semibold text-slate-900">
                  {value.toFixed(2)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{
                    width: `${Math.min(
                      100,
                      (value / maxValue) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminCreatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [creator, setCreator] =
    useState(null);

  const [trustScore, setTrustScore] =
    useState(null);

  const [audienceQuality, setAudienceQuality] =
    useState(null);

  const [riskAnalysis, setRiskAnalysis] =
    useState(null);

  const [metricsHistory, setMetricsHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCreator() {
      try {
        setLoading(true);
        setError("");

        const [
          creatorResponse,
          trustResponse,
          audienceQualityResponse,
          historyResponse,
          riskResponse,
        ] = await Promise.all([
          api.get(`/api/creators/${id}`),
          api.get(
            `/api/creators/${id}/trust-score`
          ),
          api.get(
            `/api/creators/${id}/audience-quality`
          ),
          api.get(
            `/api/creators/${id}/metrics-history`
          ),
          api.get(
            `/api/creators/${id}/risk-analysis`
          ),
        ]);

        if (cancelled) {
          return;
        }

        setCreator(creatorResponse);
        setTrustScore(trustResponse);
        setAudienceQuality(
          audienceQualityResponse
        );
        setMetricsHistory(
          Array.isArray(historyResponse)
            ? historyResponse
            : historyResponse?.metrics || []
        );
        setRiskAnalysis(riskResponse);
      } catch (err) {
        console.error(
          "Error loading creator:",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              "No se ha podido cargar el creador."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadCreator();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const metricsByPlatform =
    useMemo(() => {
      const grouped = {};

      for (const metric of metricsHistory) {
        const platform =
          metric.socialAccount?.platform ||
          metric.platform ||
          "OTHER";

        if (!grouped[platform]) {
          grouped[platform] = [];
        }

        grouped[platform].push(metric);
      }

      return grouped;
    }, [metricsHistory]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-lg bg-slate-200" />

          <div className="h-40 rounded-2xl bg-slate-200" />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-slate-200" />
            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/creators")
          }
          className="mb-6 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Volver a creadores
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            No se pudo cargar el creador
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return null;
  }

  const creatorData =
    creator.creator || creator;

  const trust =
    trustScore?.trustScore ?? 0;

  const breakdown =
    trustScore?.breakdown || {};

  const campaigns =
    creatorData.campaignLinks ||
    creator.campaignLinks ||
    [];

  const socialAccounts =
    creatorData.socialAccounts ||
    creator.socialAccounts ||
    [];

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div>
        <button
          type="button"
          onClick={() =>
            navigate("/admin/creators")
          }
          className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Volver a creadores
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
              {(
                creatorData.username ||
                creatorData.user?.name ||
                "?"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {creatorData.username ||
                    creatorData.user?.name ||
                    "Creador"}
                </h1>

                {creatorData.location ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {creatorData.location}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {creatorData.bio ||
                  "Sin descripción disponible"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {creatorData.categories?.map(
              (category) => (
                <span
                  key={category}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {category}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* TRUST SCORE + BASIC DATA */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Trust Score
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Fiabilidad del creador
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Score global basado en audiencia,
                rendimiento, campañas, entregas y
                riesgo.
              </p>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-5xl font-bold text-slate-900">
                {trust}
              </div>

              <div className="text-xs text-slate-400">
                / 100
              </div>

              <div className="mt-1 text-sm font-medium text-slate-500">
                {getScoreLabel(trust)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Base Trust Score
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {trustScore?.baseTrustScore ??
                  trust}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Risk Penalty
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                -
                {trustScore?.riskPenalty ??
                  0}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <ScoreItem
              label="Audience"
              value={
                breakdown.audienceScore ??
                0
              }
            />

            <ScoreItem
              label="Engagement"
              value={
                breakdown.engagementScore ??
                0
              }
            />

            <ScoreItem
              label="Evolution"
              value={
                breakdown.evolutionScore ??
                0
              }
            />

            <ScoreItem
              label="Campaigns"
              value={
                breakdown.campaignScore ??
                0
              }
            />

            <ScoreItem
              label="Deliveries"
              value={
                breakdown.deliveryScore ??
                0
              }
            />

            <ScoreItem
              label="Reliability"
              value={
                breakdown.reliabilityScore ??
                0
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Perfil
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Información del creador
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">
                Seguidores
              </span>

              <span className="font-semibold text-slate-900">
                {formatNumber(
                  creatorData.followers
                )}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">
                Engagement
              </span>

              <span className="font-semibold text-slate-900">
                {Number(
                  creatorData.engagementRate ||
                    0
                ).toFixed(2)}
                %
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">
                Plataformas
              </span>

              <span className="font-semibold text-slate-900">
                {socialAccounts.length}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-500">
                Colaboraciones
              </span>

              <span className="font-semibold text-slate-900">
                {campaigns.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Categorías
              </span>

              <span className="max-w-[60%] text-right font-semibold text-slate-900">
                {creatorData.categories
                  ?.join(", ") || "-"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* AUDIENCE QUALITY */}
      <AudienceQualityCard
        audienceQuality={audienceQuality}
      />

      {/* RISK */}
      <RiskPanel
        risk={{
          score:
            riskAnalysis?.riskScore ??
            trustScore?.risk?.score ??
            0,

          level:
            riskAnalysis?.riskLevel ??
            trustScore?.risk?.level ??
            "LOW",

          flags:
            riskAnalysis?.flags ??
            trustScore?.risk?.flags ??
            [],

          verifiedMetricsCount:
            riskAnalysis?.verifiedMetricsCount ??
            trustScore?.metrics?.verified ??
            0,

          analyzedSocialAccounts:
            riskAnalysis?.analyzedSocialAccounts ??
            socialAccounts.length,
        }}
      />

      {/* SOCIAL ACCOUNTS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Social Accounts
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Redes sociales
          </h2>
        </div>

        {socialAccounts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">
              El creador todavía no tiene redes
              sociales registradas.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {socialAccounts.map(
              (account) => {
                const latestMetric =
                  account.metrics?.[
                    account.metrics.length - 1
                  ];

                return (
                  <div
                    key={account.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPlatform(
                            account.platform
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          @{account.username}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          account.isConnected
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {account.isConnected
                          ? "Conectada"
                          : "Manual"}
                      </span>
                    </div>

                    {latestMetric ? (
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            Followers
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {formatNumber(
                              latestMetric.followers
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Engagement
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {Number(
                              latestMetric.engagementRate ||
                                0
                            ).toFixed(2)}
                            %
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Views
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {formatNumber(
                              latestMetric.views
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Reach
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {formatNumber(
                              latestMetric.reach
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Sin métricas verificadas.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* METRICS HISTORY */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Metrics History
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Evolución de métricas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Histórico de métricas verificadas por
            plataforma.
          </p>
        </div>

        {Object.keys(metricsByPlatform).length ===
        0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">
              No existen métricas verificadas
              suficientes para mostrar histórico.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {Object.entries(
              metricsByPlatform
            ).map(
              ([platform, metrics]) => (
                <div
                  key={platform}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {formatPlatform(
                        platform
                      )}
                    </h3>

                    <p className="text-xs text-slate-400">
                      {metrics.length} medición
                      {metrics.length === 1
                        ? ""
                        : "es"}{" "}
                      verificadas
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <MetricChart
                      title="Seguidores"
                      data={metrics}
                      valueKey="followers"
                      formatter={(
                        value
                      ) =>
                        formatNumber(value)
                      }
                    />

                    <EngagementChart
                      data={metrics}
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Fecha
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Followers
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Engagement
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Likes
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Comments
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Views
                          </th>

                          <th className="px-4 py-3 font-semibold text-slate-600">
                            Reach
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {metrics.map(
                          (metric, index) => (
                            <tr
                              key={`${metric.id}-${index}`}
                              className="border-t border-slate-100"
                            >
                              <td className="px-4 py-3 text-slate-600">
                                {formatDate(
                                  metric.recordedAt
                                )}
                              </td>

                              <td className="px-4 py-3 font-medium text-slate-900">
                                {formatNumber(
                                  metric.followers
                                )}
                              </td>

                              <td className="px-4 py-3 font-medium text-slate-900">
                                {Number(
                                  metric.engagementRate ||
                                    0
                                ).toFixed(2)}
                                %
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {formatNumber(
                                  metric.likes
                                )}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {formatNumber(
                                  metric.comments
                                )}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {formatNumber(
                                  metric.views
                                )}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {formatNumber(
                                  metric.reach
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {metrics.length < 2 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                      Se necesitan al menos dos
                      mediciones verificadas para
                      analizar correctamente la
                      evolución de esta plataforma.
                    </div>
                  ) : null}
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* COLLABORATIONS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Collaborations
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Colaboraciones
          </h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">
              Este creador todavía no tiene
              colaboraciones.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Campaña
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Estado
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Fee
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Contactado
                  </th>

                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Publicado
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map(
                  (collaboration) => (
                    <tr
                      key={
                        collaboration.id
                      }
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {collaboration.campaign
                          ?.name ||
                          collaboration.campaignName ||
                          "Campaña"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {collaboration.status ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {collaboration.fee !==
                        null &&
                        collaboration.fee !==
                          undefined
                          ? `${collaboration.fee} €`
                          : "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(
                          collaboration.contactedAt
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(
                          collaboration.publishedAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}