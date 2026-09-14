import { useEffect, useState } from "react";
import { api } from "../lib/api";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-ES");
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function MetricVerification() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingMetrics();
  }, []);

  async function loadPendingMetrics() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get("/api/social/metrics/pending");

      setMetrics(data.metrics || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar las métricas pendientes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(metricId) {
    try {
      setProcessingId(metricId);
      setError("");

      await api.patch(
        `/api/social/metrics/${metricId}/verify`,
        {}
      );

      setMetrics((current) =>
        current.filter((metric) => metric.id !== metricId)
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido verificar la métrica."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(metricId) {
    try {
      setProcessingId(metricId);
      setError("");

      await api.patch(
        `/api/social/metrics/${metricId}/reject`,
        {}
      );

      setMetrics((current) =>
        current.filter((metric) => metric.id !== metricId)
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido rechazar la métrica."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            Verificación de métricas
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
            Revisa las métricas declaradas por los creadores antes
            de utilizarlas como datos verificados dentro de
            ST.MARIA.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Pendientes
          </p>

          <p className="mt-1 text-2xl font-medium">
            {loading ? "—" : metrics.length}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
          <p className="text-sm text-black/40">
            Cargando métricas pendientes...
          </p>
        </div>
      ) : metrics.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
            <span className="text-lg">✓</span>
          </div>

          <p className="mt-5 text-sm font-medium">
            No hay métricas pendientes.
          </p>

          <p className="mt-2 text-sm text-black/40">
            Todas las solicitudes de verificación están al día.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white"
            >
              <div className="flex flex-col justify-between gap-5 border-b border-black/10 px-6 py-5 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-medium">
                    {metric.socialAccount?.creator?.user?.name ||
                      metric.socialAccount?.creator?.username ||
                      "Creador"}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    @{metric.socialAccount?.username || "—"}
                    {" · "}
                    {metric.socialAccount?.platform || "—"}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                    Solicitada
                  </p>

                  <p className="mt-1 text-xs text-black/50">
                    {formatDate(metric.recordedAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl bg-black/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                    Seguidores
                  </p>

                  <p className="mt-2 text-xl font-medium">
                    {formatNumber(metric.followers)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                    Engagement
                  </p>

                  <p className="mt-2 text-xl font-medium">
                    {formatPercentage(metric.engagementRate)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                    Likes
                  </p>

                  <p className="mt-2 text-xl font-medium">
                    {formatNumber(metric.likes)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                    Comentarios
                  </p>

                  <p className="mt-2 text-xl font-medium">
                    {formatNumber(metric.comments)}
                  </p>
                </div>

                <div className="rounded-xl bg-black/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                    Visualizaciones
                  </p>

                  <p className="mt-2 text-xl font-medium">
                    {formatNumber(metric.views)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 border-t border-black/10 px-6 py-5 md:flex-row md:items-center">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                    Fuente
                  </p>

                  <p className="mt-1 text-xs text-black/50">
                    {metric.source || "CREATOR"}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={processingId === metric.id}
                    onClick={() => handleReject(metric.id)}
                    className="rounded-xl border border-black/10 px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-black/55 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {processingId === metric.id
                      ? "Procesando..."
                      : "Rechazar"}
                  </button>

                  <button
                    type="button"
                    disabled={processingId === metric.id}
                    onClick={() => handleVerify(metric.id)}
                    className="rounded-xl bg-black px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {processingId === metric.id
                      ? "Procesando..."
                      : "Aprobar métricas"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MetricVerification;