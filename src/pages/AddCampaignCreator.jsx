import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api";

function AddCampaignCreator() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [creators, setCreators] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [platform, setPlatform] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fees, setFees] = useState({});

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
        } else {
          setError("No se ha podido cargar la campaña.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id]);

  useEffect(() => {
    const loadCreators = async () => {
      try {
        setLoadingCreators(true);

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (category.trim()) {
          params.set("category", category.trim());
        }

        if (platform.trim()) {
          params.set("platform", platform.trim());
        }

        const query = params.toString();

        const data = await apiFetch(
          `/api/creators${query ? `?${query}` : ""}`
        );

        setCreators(data.creators || []);
      } catch (error) {
        console.error(error);
        setError("No se han podido cargar los creadores.");
      } finally {
        setLoadingCreators(false);
      }
    };

    const timeout = setTimeout(loadCreators, 250);

    return () => clearTimeout(timeout);
  }, [search, category, platform]);

  const campaignCreatorIds = new Set(
    (campaign?.creators || []).map((item) => item.creatorId)
  );

  const handleFeeChange = (creatorId, value) => {
    setFees((previous) => ({
      ...previous,
      [creatorId]: value,
    }));
  };

  const handleAddCreator = async (creator) => {
    setAddingId(creator.id);
    setError("");
    setSuccess("");

    try {
      const fee = fees[creator.id] || "";

      const data = await apiFetch(
        `/api/creators/${creator.id}/campaigns/${id}`,
        {
          method: "POST",
          body: JSON.stringify({
            fee: fee ? fee.replace(",", ".") : undefined,
          }),
        }
      );

      console.log("Creator added:", data);

      setSuccess(
        `@${creator.username} se ha añadido correctamente a la campaña.`
      );

      setCampaign((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          creators: [
            ...(previous.creators || []),
            data.campaignCreator,
          ],
        };
      });
    } catch (error) {
      console.error(error);

      if (error.status === 409) {
        setError("Este creador ya forma parte de la campaña.");
      } else if (error.status === 400) {
        setError("El fee introducido no es válido.");
      } else if (error.status === 404) {
        setError("El creador o la campaña no existen.");
      } else {
        setError("No se ha podido añadir el creador.");
      }
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <div className="rounded-2xl border border-black/10 p-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
            Cargando campaña...
          </p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <button
          type="button"
          onClick={() =>
            navigate(`/platform/campaigns/${id}/creators`)
          }
          className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
        >
          ← Volver
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <button
        type="button"
        onClick={() =>
          navigate(`/platform/campaigns/${campaign.id}/creators`)
        }
        className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
      >
        ← Volver a creadores de campaña
      </button>

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Añadir creador
          </p>

          <h1 className="mt-4 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
            {campaign.name}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/45">
            Busca creadores disponibles y añádelos directamente a esta
            campaña. Puedes establecer su fee inicial antes de crear la
            colaboración.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 px-6 py-5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            Creadores en campaña
          </p>

          <p className="mt-2 text-3xl font-medium tracking-[-0.05em]">
            {campaign.creators?.length || 0}
          </p>
        </div>
      </div>

      {/* FILTROS */}

      <section className="mt-10 rounded-2xl border border-black/10 p-7 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Buscar creador
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o username..."
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />
          </div>

          <div className="lg:w-[220px]">
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Categoría
            </label>

            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ej. Tecnología"
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />
          </div>

          <div className="lg:w-[220px]">
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Plataforma
            </label>

            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="mt-3 w-full appearance-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
            >
              <option value="">Todas</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
        </div>
      </section>

      {/* MENSAJES */}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* LISTADO */}

      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10">
        <div className="flex items-center justify-between border-b border-black/10 p-7">
          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
              Descubrimiento
            </p>

            <h2 className="mt-2 text-xl font-medium">
              Creadores disponibles
            </h2>
          </div>

          <span className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            {creators.length} resultados
          </span>
        </div>

        {loadingCreators ? (
          <div className="p-12 text-center">
            <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">
              Buscando creadores...
            </p>
          </div>
        ) : creators.length === 0 ? (
          <div className="p-16 text-center">
            <h3 className="text-xl font-medium">
              No hemos encontrado creadores
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-black/45">
              Prueba con otra búsqueda o elimina alguno de los filtros.
            </p>
          </div>
        ) : (
          <div>
            {creators.map((creator) => {
              const alreadyAdded = campaignCreatorIds.has(creator.id);
              const fee = fees[creator.id] || "";

              return (
                <CreatorRow
                  key={creator.id}
                  creator={creator}
                  alreadyAdded={alreadyAdded}
                  fee={fee}
                  adding={addingId === creator.id}
                  onFeeChange={(value) =>
                    handleFeeChange(creator.id, value)
                  }
                  onAdd={() => handleAddCreator(creator)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CreatorRow({
  creator,
  alreadyAdded,
  fee,
  adding,
  onFeeChange,
  onAdd,
}) {
  return (
    <div className="border-b border-black/10 p-6 last:border-b-0">
      <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
            {getInitials(creator.username || "C")}
          </div>

          <div>
            <p className="font-medium">
              @{creator.username}
            </p>

            <p className="mt-1 text-xs text-black/40">
              {creator.name || "Creador ST.MARIA"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 xl:min-w-[700px] xl:grid-cols-5">
          <Metric
            label="Seguidores"
            value={formatNumber(creator.followers)}
          />

          <Metric
            label="Engagement"
            value={`${creator.engagementRate || 0}%`}
          />

          <Metric
            label="Categorías"
            value={
              creator.categories?.length
                ? creator.categories.slice(0, 2).join(", ")
                : "—"
            }
          />

          <div>
            <label className="text-[9px] uppercase tracking-[0.12em] text-black/30">
              Fee
            </label>

            <input
              type="text"
              inputMode="decimal"
              value={fee}
              onChange={(event) => onFeeChange(event.target.value)}
              placeholder="0,00 €"
              disabled={alreadyAdded || adding}
              className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-black/20 focus:border-black/30 disabled:bg-black/[0.03]"
            />
          </div>

          <div className="flex items-end">
            {alreadyAdded ? (
              <span className="inline-flex rounded-full bg-green-50 px-4 py-3 text-[8px] uppercase tracking-[0.12em] text-green-700">
                Ya añadido
              </span>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                disabled={adding}
                className="w-full rounded-full bg-black px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Añadiendo..." : "Añadir a campaña"}
              </button>
            )}
          </div>
        </div>
      </div>
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-ES");
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

export default AddCampaignCreator;