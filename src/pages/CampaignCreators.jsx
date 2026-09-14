import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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

const statusClasses = {
  PENDING: "bg-black/5 text-black/50",
  CONTACTED: "bg-yellow-50 text-yellow-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  SELECTED: "bg-purple-50 text-purple-700",
  PRODUCT_SENT: "bg-orange-50 text-orange-700",
  CONTENT_PENDING: "bg-amber-50 text-amber-700",
  CONTENT_RECEIVED: "bg-cyan-50 text-cyan-700",
  PUBLISHED: "bg-green-50 text-green-700",
  PAID: "bg-emerald-50 text-emerald-700",
};

function CampaignCreators() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const creators = campaign?.creators || [];

  const creatorPayments = useMemo(() => {
    return creators.reduce(
      (total, item) => total + Number(item.fee || 0),
      0
    );
  }, [creators]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-2xl border border-black/10 p-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
            Cargando creadores...
          </p>
        </div>
      </div>
    );
  }

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

      {/* VOLVER */}

      <button
        type="button"
        onClick={() => navigate(`/platform/campaigns/${campaign.id}`)}
        className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
      >
        ← Volver a la campaña
      </button>


      {/* HEADER */}

      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

        <div>

          <div className="flex items-center gap-3">

            <span className="rounded-full bg-black px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-white">
              {campaign.status}
            </span>

            <span className="text-[10px] text-black/35">
              Creadores de campaña
            </span>

          </div>

          <h1 className="mt-5 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
            {campaign.name}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
            Gestiona los creadores asociados a esta campaña, sus colaboraciones,
            estados y honorarios.
          </p>

        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() => navigate(`/platform/campaigns/${campaign.id}`)}
            className="rounded-full border border-black/10 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:border-black/30"
          >
            Ver campaña
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/platform/campaigns/${campaign.id}/creators/add`)
            }
            className="rounded-full bg-black px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-white"
          >
            + Añadir creador
          </button>

        </div>

      </div>


      {/* STATS */}

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 md:grid-cols-4">

        <Stat
          label="Creadores"
          value={creators.length}
        />

        <Stat
          label="Presupuesto"
          value={formatMoney(campaign.budget)}
        />

        <Stat
          label="Pagos a creadores"
          value={formatMoney(creatorPayments)}
        />

        <Stat
          label="Disponible"
          value={formatMoney(
            Number(campaign.budget || 0) - creatorPayments
          )}
        />

      </div>


      {/* LISTADO */}

      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10">

        <div className="flex flex-col justify-between gap-4 border-b border-black/10 p-7 sm:flex-row sm:items-center">

          <div>

            <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
              Colaboraciones
            </p>

            <h2 className="mt-2 text-xl font-medium">
              Creadores seleccionados
            </h2>

          </div>

          <span className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            {creators.length}{" "}
            {creators.length === 1 ? "creador" : "creadores"}
          </span>

        </div>


        {creators.length > 0 ? (

          <div>

            {creators.map((item) => (
              <CampaignCreatorRow
                key={item.id}
                item={item}
                campaignId={campaign.id}
              />
            ))}

          </div>

        ) : (

          <div className="p-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              +
            </div>

            <h3 className="mt-6 text-xl font-medium">
              Todavía no hay creadores
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-black/45">
              Añade creadores a esta campaña para empezar a gestionar
              colaboraciones, contenidos y pagos.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(`/platform/campaigns/${campaign.id}/creators/add`)
              }>
                Buscar creadores
            </button>

          </div>

        )}

      </section>


      {/* INFORMACIÓN */}

      <section className="mt-8 grid gap-8 md:grid-cols-2">

        <div className="rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
            Campaña
          </p>

          <h2 className="mt-3 text-xl font-medium">
            Información
          </h2>

          <div className="mt-7 space-y-5">

            <Info
              label="Categoría"
              value={campaign.category || "No definida"}
            />

            <Info
              label="Plataforma"
              value={campaign.platform || "No definida"}
            />

            <Info
              label="Objetivo"
              value={campaign.objective || "No definido"}
            />

          </div>

        </div>


        <div className="rounded-2xl bg-black p-7 text-white">

          <p className="text-[9px] uppercase tracking-[0.15em] text-white/35">
            Gestión
          </p>

          <h2 className="mt-3 text-xl font-medium">
            Flujo de colaboración
          </h2>

          <div className="mt-7 space-y-3">

            <FlowItem
              number="01"
              text="Seleccionar creador"
            />

            <FlowItem
              number="02"
              text="Contactar y negociar"
            />

            <FlowItem
              number="03"
              text="Definir entregables"
            />

            <FlowItem
              number="04"
              text="Revisar contenido"
            />

            <FlowItem
              number="05"
              text="Publicar y pagar"
            />

          </div>

        </div>

      </section>

    </div>
  );
}


function CampaignCreatorRow({ item, campaignId }) {
  const creator = item.creator;

  const status = item.status || "PENDING";

  return (
    <div className="border-b border-black/10 p-6 last:border-b-0">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        {/* CREATOR */}

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-[10px] text-white">
            {getInitials(creator?.username || "Creador")}
          </div>

          <div>

            <p className="font-medium">
              @{creator?.username || "Creador"}
            </p>

            <p className="mt-1 text-xs text-black/40">
              {creator?.followers
                ? `${creator.followers.toLocaleString("es-ES")} seguidores`
                : "Sin datos de seguidores"}
            </p>

          </div>

        </div>


        {/* METRICS */}

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:min-w-[500px]">

          <Metric
            label="Engagement"
            value={`${creator?.engagementRate || 0}%`}
          />

          <Metric
            label="Fee"
            value={formatMoney(item.fee)}
          />

          <div>

            <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
              Estado
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-[8px] uppercase tracking-[0.1em] ${
                statusClasses[status] || statusClasses.PENDING
              }`}
            >
              {statusLabels[status] || status}
            </span>

          </div>

          <div className="flex items-end justify-start sm:justify-end">

            <Link
              to={`/platform/campaigns/${campaignId}/creators/${item.id}`}
              className="rounded-full bg-black px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-white transition-transform hover:scale-105"
            >
              Gestionar
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}


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


function Metric({ label, value }) {
  return (
    <div>

      <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
        {label}
      </p>

      <p className="mt-2 text-sm">
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


function FlowItem({ number, text }) {
  return (
    <div className="flex items-center gap-4 border-b border-white/10 pb-3 last:border-b-0">

      <span className="text-[8px] tracking-[0.15em] text-white/35">
        {number}
      </span>

      <span className="text-sm text-white/80">
        {text}
      </span>

    </div>
  );
}


function formatMoney(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}


function getInitials(value) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default CampaignCreators;