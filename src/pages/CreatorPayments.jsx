import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export default function CreatorPayments() {
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get("/creator-portal/payments");

      setPayments(data);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se ha podido cargar la información de pagos."
      );
    } finally {
      setLoading(false);
    }
  }

  const collaborations = payments?.payments || [];

  const stats = useMemo(() => {
    let totalEarned = 0;
    let paid = 0;
    let pending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    collaborations.forEach((item) => {
      const fee = Number(item.fee || 0);

      totalEarned += fee;

      if (item.paidAt) {
        paid += fee;
        paidCount += 1;
      } else {
        pending += fee;
        pendingCount += 1;
      }
    });

    return {
      totalEarned,
      paid,
      pending,
      paidCount,
      pendingCount,
    };
  }, [collaborations]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-2xl bg-gray-100" />
            <div className="h-32 rounded-2xl bg-gray-100" />
            <div className="h-32 rounded-2xl bg-gray-100" />
          </div>

          <div className="h-96 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mis pagos
          </h1>

          <p className="mt-2 text-gray-500">
            Consulta tus ingresos generados a través de ST.MARIA.
          </p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-3">
          <PaymentStat
            label="Ingresos totales"
            value={formatCurrency(stats.totalEarned)}
            description={`${collaborations.length} colaboraciones`}
          />

          <PaymentStat
            label="Pagado"
            value={formatCurrency(stats.paid)}
            description={`${stats.paidCount} pagos completados`}
          />

          <PaymentStat
            label="Pendiente"
            value={formatCurrency(stats.pending)}
            description={`${stats.pendingCount} pagos pendientes`}
          />
        </div>

        {/* AVISO */}
        {stats.pending > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                €
              </div>

              <div>
                <h2 className="font-semibold text-amber-900">
                  Tienes pagos pendientes
                </h2>

                <p className="mt-1 text-sm text-amber-800">
                  Actualmente tienes{" "}
                  <strong>
                    {formatCurrency(stats.pending)}
                  </strong>{" "}
                  pendientes de pago por parte de ST.MARIA.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Historial de pagos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Todas las colaboraciones que has realizado con
              ST.MARIA.
            </p>
          </div>

          {collaborations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                €
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Todavía no tienes pagos
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Cuando participes en campañas remuneradas,
                aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {collaborations.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                />
              ))}
            </div>
          )}
        </section>

        {/* INFORMACIÓN */}
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Información sobre los pagos
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Info
              title="Fee de colaboración"
              text="Es la cantidad acordada por tu participación en una campaña."
            />

            <Info
              title="Pendiente"
              text="La colaboración está remunerada, pero todavía no consta como pagada."
            />

            <Info
              title="Pagado"
              text="ST.MARIA ha registrado el pago de la colaboración."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PaymentStat({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function PaymentRow({ payment }) {
  const fee = Number(payment.fee || 0);
  const isPaid = Boolean(payment.paidAt);

  const campaign = payment.campaign || {};

  const campaignName =
    campaign.name || "Colaboración ST.MARIA";

  const platform =
    campaign.platform || "Plataforma no especificada";

  const category =
    campaign.category || "Campaña";

  return (
    <div className="p-6 transition hover:bg-gray-50">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* INFO CAMPAÑA */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {campaignName}
            </h3>

            <StatusBadge paid={isPaid} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>{platform}</span>

            <span>{category}</span>

            {campaign.endDate && (
              <span>
                Finalizada{" "}
                {formatDate(campaign.endDate)}
              </span>
            )}
          </div>
        </div>

        {/* IMPORTE */}
        <div className="flex items-center justify-between gap-8 lg:justify-end">
          <div className="text-left lg:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Importe
            </p>

            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(fee)}
            </p>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Estado
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${
                isPaid
                  ? "text-green-600"
                  : "text-amber-600"
              }`}
            >
              {isPaid ? "Pagado" : "Pendiente"}
            </p>

            {isPaid && payment.paidAt && (
              <p className="mt-1 text-xs text-gray-400">
                {formatDate(payment.paidAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ paid }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        paid
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}

function Info({ title, text }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {text}
      </p>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}