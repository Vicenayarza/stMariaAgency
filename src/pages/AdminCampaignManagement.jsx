import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { api } from "../lib/api";

const CAMPAIGN_STATUSES = [
  {
    value: "DRAFT",
    label: "Borrador",
    description:
      "La campaña todavía está siendo preparada.",
  },
  {
    value: "ACTIVE",
    label: "Activa",
    description:
      "La campaña está actualmente en ejecución.",
  },
  {
    value: "COMPLETED",
    label: "Finalizada",
    description:
      "La campaña ha terminado.",
  },
];

const COLLABORATION_LABELS = {
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

function AdminCampaignManagement() {
  const { id } = useParams();

  const [campaign, setCampaign] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/api/admin/campaigns/${id}`
      );

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

  async function changeStatus(status) {
    if (!campaign) {
      return;
    }

    if (campaign.status === status) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");

      const data = await api.patch(
        `/api/admin/campaigns/${id}/status`,
        {
          status,
        }
      );

      setCampaign((current) => ({
        ...current,
        ...data.campaign,
      }));
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se ha podido cambiar el estado."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const totalCreators =
    campaign?.creators?.length || 0;

  const paidCreators = useMemo(
    () =>
      campaign?.creators?.filter(
        (item) =>
          item.status === "PAID"
      ).length || 0,
    [campaign]
  );

  const publishedCreators = useMemo(
    () =>
      campaign?.creators?.filter(
        (item) =>
          item.status ===
            "PUBLISHED" ||
          item.status === "PAID"
      ).length || 0,
    [campaign]
  );

  const totalCreatorFees = useMemo(
    () =>
      campaign?.creators?.reduce(
        (total, item) =>
          total +
          Number(item.fee || 0),
        0
      ) || 0,
    [campaign]
  );

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando gestión de campaña...
        </p>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div>
        <Link
          to="/admin/campaigns"
          className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
        >
          ← Volver a campañas
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const budget =
    Number(campaign.budget || 0);

  const remainingBudget =
    budget - totalCreatorFees;

  return (
    <div>
      {/* BACK */}

      <Link
        to={`/admin/campaigns/${campaign.id}`}
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a la campaña
      </Link>

      {/* HEADER */}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Gestión de campaña
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] md:text-5xl">
            {campaign.name}
          </h1>

          <p className="mt-3 text-sm text-black/45">
            {campaign.brand
              ?.companyName}
          </p>
        </div>

        <CampaignStatusBadge
          status={campaign.status}
        />
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATUS */}

      <section className="mt-10 rounded-2xl border border-black/10 bg-white p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Estado
        </p>

        <h2 className="mt-2 text-xl font-medium">
          Estado de la campaña
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/45">
          Controla el ciclo de vida
          operativo de la campaña.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {CAMPAIGN_STATUSES.map(
            (status) => {
              const active =
                campaign.status ===
                status.value;

              return (
                <button
                  key={status.value}
                  type="button"
                  disabled={
                    updatingStatus
                  }
                  onClick={() =>
                    changeStatus(
                      status.value
                    )
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white hover:border-black/30"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <p className="text-sm font-medium">
                    {status.label}
                  </p>

                  <p
                    className={`mt-2 text-xs leading-relaxed ${
                      active
                        ? "text-white/60"
                        : "text-black/40"
                    }`}
                  >
                    {
                      status.description
                    }
                  </p>

                  {active && (
                    <p className="mt-4 text-[9px] uppercase tracking-[0.14em] text-white/50">
                      Estado actual
                    </p>
                  )}
                </button>
              );
            }
          )}
        </div>

        {updatingStatus && (
          <p className="mt-4 text-xs text-black/40">
            Actualizando estado...
          </p>
        )}
      </section>

      {/* STATS */}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Presupuesto"
          value={formatCurrency(
            budget
          )}
        />

        <StatCard
          label="Fees creadores"
          value={formatCurrency(
            totalCreatorFees
          )}
        />

        <StatCard
          label="Presupuesto restante"
          value={formatCurrency(
            remainingBudget
          )}
        />

        <StatCard
          label="Creadores"
          value={String(
            totalCreators
          )}
        />
      </section>

      {/* CREATORS */}

      <section className="mt-6 rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-6 md:px-8">
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Creadores
          </p>

          <h2 className="mt-2 text-xl font-medium">
            Colaboraciones
          </h2>

          <p className="mt-2 text-sm text-black/45">
            {publishedCreators} publicados
            · {paidCreators} pagados ·{" "}
            {totalCreators} totales
          </p>
        </div>

        {totalCreators === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-black/40">
              Todavía no hay creadores
              asociados a esta campaña.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {campaign.creators.map(
              (collaboration) => {
                const creator =
                  collaboration.creator;

                const creatorName =
                  creator?.username ||
                  creator?.user?.name ||
                  "Creador";

                return (
                  <div
                    key={
                      collaboration.id
                    }
                    className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8"
                  >
                    <div>
                      <p className="font-medium">
                        {creatorName.startsWith(
                          "@"
                        )
                          ? creatorName
                          : `@${creatorName}`}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-black/40">
                        <span>
                          {COLLABORATION_LABELS[
                            collaboration
                              .status
                          ] ||
                            collaboration.status ||
                            "Pendiente"}
                        </span>

                        <span>·</span>

                        <span>
                          Fee:{" "}
                          {formatCurrency(
                            collaboration.fee
                          )}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/admin/campaigns/${campaign.id}/creators/${collaboration.id}`}
                      className="w-fit rounded-full border border-black/10 px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] transition hover:border-black hover:bg-black hover:text-white"
                    >
                      Gestionar →
                    </Link>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function CampaignStatusBadge({
  status,
}) {
  const labels = {
    DRAFT: "Borrador",
    ACTIVE: "Activa",
    COMPLETED: "Finalizada",
  };

  return (
    <span className="w-fit rounded-full border border-black/10 bg-black/5 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em]">
      {labels[status] || status}
    </span>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>

      <p className="mt-3 text-2xl font-medium tracking-[-0.03em]">
        {value}
      </p>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "es-ES",
    {
      style: "currency",
      currency: "EUR",
    }
  ).format(Number(value || 0));
}

export default AdminCampaignManagement;