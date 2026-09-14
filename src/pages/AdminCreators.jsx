import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function AdminCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCreators();
  }, []);

  async function loadCreators() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const data = await api.get(
        `/api/creators${query ? `?${query}` : ""}`
      );

      setCreators(data.creators || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar los creadores."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadCreators();
  }

  return (
    <div>
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Administración
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            Creadores
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
            Gestiona el talento registrado en ST.MARIA y consulta
            sus métricas y perfiles.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Total creadores
          </p>

          <p className="mt-1 text-2xl font-medium">
            {loading ? "—" : creators.length}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-col gap-3 md:flex-row"
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o username..."
          className="h-12 flex-1 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/30"
        />

        <button
          type="submit"
          className="h-12 rounded-xl bg-black px-6 text-[10px] uppercase tracking-[0.14em] text-white transition hover:bg-black/80"
        >
          Buscar
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
            Talento registrado
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-black/40">
              Cargando creadores...
            </p>
          </div>
        ) : creators.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">
              No se han encontrado creadores.
            </p>

            <p className="mt-2 text-sm text-black/40">
              Prueba con otro término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Creador
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Ubicación
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Seguidores
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Engagement
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Plataformas
                  </th>

                  <th className="px-6 py-4 text-right text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="border-b border-black/5 last:border-b-0"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-medium">
                          {creator.user?.name ||
                            creator.username}
                        </p>

                        <p className="mt-1 text-xs text-black/35">
                          @{creator.username}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm text-black/60">
                        {creator.location || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm font-medium">
                        {Number(
                          creator.followers || 0
                        ).toLocaleString("es-ES")}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm font-medium">
                        {Number(
                          creator.engagementRate || 0
                        ).toFixed(2)}
                        %
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {(creator.platforms || []).length === 0 ? (
                          <span className="text-sm text-black/35">
                            —
                          </span>
                        ) : (
                          creator.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/55"
                            >
                              {platform}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/admin/creators/${creator.id}`}
                        className="inline-flex rounded-xl border border-black/10 px-4 py-2 text-[10px] uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white"
                      >
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCreators;