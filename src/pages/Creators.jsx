
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../lib/api";

function Creators() {
  const navigate = useNavigate();

  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    platform: "",
    location: "",
    minFollowers: "",
    minEngagement: "",
  });

  const loadCreators = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filters.search) {
        params.set("search", filters.search);
      }

      if (filters.category) {
        params.set("category", filters.category);
      }

      if (filters.platform) {
        params.set("platform", filters.platform);
      }

      if (filters.location) {
        params.set("location", filters.location);
      }

      if (filters.minFollowers) {
        params.set(
          "minFollowers",
          filters.minFollowers
        );
      }

      if (filters.minEngagement) {
        params.set(
          "minEngagement",
          filters.minEngagement
        );
      }

      const query =
        params.toString()
          ? `?${params.toString()}`
          : "";

      const data = await apiFetch(
        `/api/creators${query}`
      );

      setCreators(data.creators || []);
    } catch (error) {
      console.error(error);

      setError(
        "No se han podido cargar los creadores."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    loadCreators();
  };

  return (
    <div className="mx-auto max-w-[1500px]">

      {/* HEADER */}

      <div>

        <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
          Descubrimiento
        </p>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
          Creadores
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/50">
          Encuentra perfiles que encajen con tu audiencia, categoría,
          plataforma y objetivos de campaña.
        </p>

      </div>


      {/* FILTERS */}

      <form
        onSubmit={handleSearch}
        className="mt-10 rounded-2xl border border-black/10 p-6 md:p-8"
      >

        <div className="grid gap-4 md:grid-cols-3">

          <input
            value={filters.search}
            onChange={(event) =>
              setFilters({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Buscar creador..."
            className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/30"
          />

          <select
            value={filters.category}
            onChange={(event) =>
              setFilters({
                ...filters,
                category: event.target.value,
              })
            }
            className="rounded-xl border border-black/10 bg-[#f5f5f2] px-4 py-3 text-sm outline-none"
          >

            <option value="">
              Todas las categorías
            </option>

            <option value="Tecnología">
              Tecnología
            </option>

            <option value="Gaming">
              Gaming
            </option>

            <option value="Moda">
              Moda
            </option>

            <option value="Belleza">
              Belleza
            </option>

            <option value="Lifestyle">
              Lifestyle
            </option>

            <option value="Fitness">
              Fitness
            </option>

            <option value="Deporte">
              Deporte
            </option>

            <option value="Viajes">
              Viajes
            </option>

          </select>


          <select
            value={filters.platform}
            onChange={(event) =>
              setFilters({
                ...filters,
                platform: event.target.value,
              })
            }
            className="rounded-xl border border-black/10 bg-[#f5f5f2] px-4 py-3 text-sm outline-none"
          >

            <option value="">
              Todas las plataformas
            </option>

            <option value="Instagram">
              Instagram
            </option>

            <option value="TikTok">
              TikTok
            </option>

            <option value="YouTube">
              YouTube
            </option>

            <option value="Twitch">
              Twitch
            </option>

          </select>


          <input
            value={filters.location}
            onChange={(event) =>
              setFilters({
                ...filters,
                location: event.target.value,
              })
            }
            placeholder="Ubicación"
            className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/30"
          />

          <input
            type="number"
            min="0"
            value={filters.minFollowers}
            onChange={(event) =>
              setFilters({
                ...filters,
                minFollowers: event.target.value,
              })
            }
            placeholder="Seguidores mínimos"
            className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/30"
          />

          <input
            type="number"
            min="0"
            step="0.1"
            value={filters.minEngagement}
            onChange={(event) =>
              setFilters({
                ...filters,
                minEngagement: event.target.value,
              })
            }
            placeholder="Engagement mínimo %"
            className="rounded-xl border border-black/10 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/30"
          />

        </div>


        <button
          type="submit"
          className="mt-5 rounded-full bg-black px-7 py-4 text-[10px] uppercase tracking-[0.16em] text-white"
        >
          Buscar creadores
        </button>

      </form>


      {/* ERROR */}

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* LOADING */}

      {loading && (
        <div className="mt-8 rounded-2xl border border-black/10 p-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
            Buscando creadores...
          </p>
        </div>
      )}


      {/* RESULTS */}

      {!loading && !error && (
        <div className="mt-8">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                Resultados
              </p>

              <p className="mt-2 text-sm text-black/50">
                {creators.length} perfiles encontrados
              </p>

            </div>

          </div>


          {creators.length === 0 ? (

            <div className="rounded-2xl border border-black/10 p-12 text-center">

              <p className="text-sm text-black/40">
                No hemos encontrado creadores con esos filtros.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {creators.map((creator) => (

                <div
                  key={creator.id}
                  className="rounded-2xl border border-black/10 p-6 transition-all hover:border-black/25"
                >

                  {/* CREATOR HEADER */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
                        {getInitials(
                          creator.username
                        )}
                      </div>

                      <div>

                        <p className="font-medium">
                          @{creator.username}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {creator.user?.name || "Creador"}
                        </p>

                      </div>

                    </div>

                    <span className="rounded-full bg-black/5 px-3 py-1 text-[9px] uppercase tracking-[0.12em]">
                      {creator.engagementRate}%
                    </span>

                  </div>


                  {/* BIO */}

                  <p className="mt-6 min-h-[42px] text-sm leading-relaxed text-black/45">
                    {creator.bio || "Sin descripción."}
                  </p>


                  {/* STATS */}

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    <MiniStat
                      label="Seguidores"
                      value={formatFollowers(
                        creator.followers
                      )}
                    />

                    <MiniStat
                      label="Engagement"
                      value={`${creator.engagementRate}%`}
                    />

                  </div>


                  {/* CATEGORIES */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    {creator.categories?.slice(0, 3).map(
                      (category) => (
                        <span
                          key={category}
                          className="rounded-full border border-black/10 px-3 py-1 text-[8px] uppercase tracking-[0.12em]"
                        >
                          {category}
                        </span>
                      )
                    )}

                  </div>


                  {/* ACTION */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/platform/creators/${creator.id}`
                      )
                    }
                    className="mt-6 w-full rounded-full border border-black/15 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white"
                  >
                    Ver perfil
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>
      )}

    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-4">

      <p className="text-[8px] uppercase tracking-[0.12em] text-black/35">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium">
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

export default Creators;

