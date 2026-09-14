
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api";

function CreatorDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [creator, setCreator] = useState(null);

  const [campaigns, setCampaigns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [campaignLoading, setCampaignLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [creatorData, campaignsData] =
          await Promise.all([
            apiFetch(`/api/creators/${id}`),
            apiFetch("/api/campaigns"),
          ]);

        setCreator(creatorData.creator);
        setCampaigns(campaignsData.campaigns || []);
      } catch (error) {
        console.error(error);

        if (error.status === 404) {
          setError(
            "El creador no existe o no tienes acceso a él."
          );
        } else {
          setError(
            "No se ha podido cargar el perfil."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAddToCampaign = async () => {
    if (!selectedCampaign) {
      setError("Selecciona una campaña.");
      return;
    }

    try {
      setCampaignLoading(true);
      setError("");
      setSuccess("");

      await apiFetch(
        `/api/creators/${id}/campaigns/${selectedCampaign}`,
        {
          method: "POST",
          body: JSON.stringify({
            fee: fee.trim() || undefined,
          }),
        }
      );

      setSuccess(
        "Creador añadido correctamente a la campaña."
      );

      setFee("");
      setSelectedCampaign("");
    } catch (error) {
      console.error(error);

      if (
        error.status === 409 &&
        error.data?.error ===
          "CREATOR_ALREADY_IN_CAMPAIGN"
      ) {
        setError(
          "Este creador ya está asociado a esa campaña."
        );
      } else {
        setError(
          "No se ha podido añadir el creador a la campaña."
        );
      }
    } finally {
      setCampaignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 p-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
          Cargando perfil...
        </p>
      </div>
    );
  }

  if (error && !creator) {
    return (
      <div className="mx-auto max-w-[1000px]">

        <button
          onClick={() => navigate("/platform/creators")}
          className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
        >
          ← Volver a creadores
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-7 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">

      {/* BACK */}

      <button
        onClick={() => navigate("/platform/creators")}
        className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
      >
        ← Volver a creadores
      </button>


      {/* PROFILE HEADER */}

      <section className="rounded-2xl border border-black/10 p-7 md:p-10">

        <div className="flex flex-col justify-between gap-8 md:flex-row">

          <div className="flex items-start gap-5">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-lg font-medium text-white">
              {getInitials(creator.username)}
            </div>

            <div>

              <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                Creador
              </p>

              <h1 className="mt-2 text-4xl font-medium tracking-[-0.05em]">
                @{creator.username}
              </h1>

              <p className="mt-2 text-sm text-black/45">
                {creator.user?.name}
              </p>

              <p className="mt-2 text-xs text-black/40">
                {creator.location || "Ubicación no especificada"}
              </p>

            </div>

          </div>


          {/* MATCH */}

          <div className="rounded-2xl bg-black p-6 text-white md:min-w-[220px]">

            <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
              ST.MARIA Match
            </p>

            <p className="mt-3 text-4xl font-medium tracking-[-0.06em]">
              94%
            </p>

            <p className="mt-2 text-xs text-white/40">
              Coincidencia estimada
            </p>

          </div>

        </div>


        {/* BIO */}

        <p className="mt-10 max-w-3xl text-base leading-relaxed text-black/50">
          {creator.bio || "Este creador todavía no ha añadido una descripción."}
        </p>


        {/* STATS */}

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 md:grid-cols-4">

          <Stat
            label="Seguidores"
            value={formatFollowers(creator.followers)}
          />

          <Stat
            label="Engagement"
            value={`${creator.engagementRate}%`}
          />

          <Stat
            label="Plataformas"
            value={creator.platforms?.length || 0}
          />

          <Stat
            label="Categorías"
            value={creator.categories?.length || 0}
          />

        </div>

      </section>


      {/* CONTENT */}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">

        {/* PLATFORMS + CATEGORIES */}

        <section className="rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Perfil
          </p>

          <h2 className="mt-2 text-2xl font-medium">
            Características
          </h2>


          <div className="mt-8">

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              Plataformas
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {creator.platforms?.map((platform) => (

                <span
                  key={platform}
                  className="rounded-full border border-black/10 px-4 py-2 text-[9px] uppercase tracking-[0.12em]"
                >
                  {platform}
                </span>

              ))}

            </div>

          </div>


          <div className="mt-8">

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              Categorías
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {creator.categories?.map((category) => (

                <span
                  key={category}
                  className="rounded-full bg-black/5 px-4 py-2 text-[9px] uppercase tracking-[0.12em]"
                >
                  {category}
                </span>

              ))}

            </div>

          </div>

        </section>


        {/* ADD TO CAMPAIGN */}

        <section className="rounded-2xl bg-black p-7 text-white">

          <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
            Colaboración
          </p>

          <h2 className="mt-2 text-2xl font-medium">
            Añadir a campaña
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Selecciona una de tus campañas para comenzar una colaboración
            con este creador.
          </p>


          <div className="mt-8">

            <label className="text-[9px] uppercase tracking-[0.14em] text-white/40">
              Campaña
            </label>

            <select
              value={selectedCampaign}
              onChange={(event) =>
                setSelectedCampaign(event.target.value)
              }
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-sm text-white outline-none"
            >

              <option
                value=""
                className="text-black"
              >
                Selecciona una campaña
              </option>

              {campaigns.map((campaign) => (

                <option
                  key={campaign.id}
                  value={campaign.id}
                  className="text-black"
                >
                  {campaign.name}
                </option>

              ))}

            </select>

          </div>


          <div className="mt-5">

            <label className="text-[9px] uppercase tracking-[0.14em] text-white/40">
              Fee del creador
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(event) =>
                setFee(event.target.value)
              }
              placeholder="Ej. 750"
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-sm text-white outline-none placeholder:text-white/25"
            />

          </div>


          {error && (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          )}


          {success && (
            <div className="mt-5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white/75">
              {success}
            </div>
          )}


          <button
            type="button"
            onClick={handleAddToCampaign}
            disabled={campaignLoading}
            className="mt-6 w-full rounded-full bg-white px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {campaignLoading
              ? "Añadiendo..."
              : "Añadir a campaña"}
          </button>

        </section>

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


function formatFollowers(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(value);
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

export default CreatorDetail;

