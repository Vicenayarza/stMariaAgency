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
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString();
      const data = await api.get(`/api/creators${query ? `?${query}` : ""}`);
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
    <div className="text-[#3E2B1B]">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8A6340]">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-[#3E2B1B]">
            Creadores
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6052]">
            Gestiona el talento registrado en ST.MARY AGENCY y consulta sus
            métricas y perfiles.
          </p>
        </div>

        <div className="rounded-2xl border border-[#D8C3A5] bg-white px-5 py-4 shadow-sm">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
            Creadores encontrados
          </p>
          <p className="mt-1 text-2xl font-medium text-[#3E2B1B]">
            {loading ? "—" : creators.length}
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o username..."
          aria-label="Buscar creadores"
          className="h-12 min-w-0 flex-1 rounded-xl border border-[#D8C3A5] bg-white px-4 text-sm text-[#3E2B1B] outline-none transition placeholder:text-[#6F6052]/70 focus:border-[#8A6340] focus:ring-2 focus:ring-[#8A6340]/15"
        />
        <button
          type="submit"
          className="h-12 rounded-xl bg-[#8A6340] px-6 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-[#5A3E28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A6340]"
        >
          Buscar
        </button>
      </form>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadCreators}
            className="mt-3 rounded-lg bg-[#8A6340] px-4 py-2 text-xs font-medium text-white hover:bg-[#5A3E28]"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white shadow-sm">
        <div className="border-b border-[#EBDCC4] px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
            Talento registrado
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center" aria-live="polite">
            <p className="text-sm text-[#6F6052]">Cargando creadores...</p>
          </div>
        ) : creators.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-[#3E2B1B]">
              No se han encontrado creadores.
            </p>
            <p className="mt-2 text-sm text-[#6F6052]">
              Prueba con otro término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#F4EDE2]/70">
                <tr className="border-b border-[#EBDCC4] text-left">
                  {[
                    "Creador",
                    "Ubicación",
                    "Seguidores",
                    "Engagement",
                    "Plataformas",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]"
                    >
                      {heading}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-4 text-right text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="border-b border-[#EBDCC4]/70 transition-colors last:border-b-0 hover:bg-[#F4EDE2]/50"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-[#3E2B1B]">
                        {creator.user?.name || creator.username || "Sin nombre"}
                      </p>
                      {creator.username && (
                        <p className="mt-1 text-xs text-[#8A6340]">
                          @{creator.username}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-[#6F6052]">
                        {creator.location || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-[#3E2B1B]">
                        {Number(creator.followers || 0).toLocaleString("es-ES")}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-[#3E2B1B]">
                        {Number(creator.engagementRate || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {(creator.platforms || []).length === 0 ? (
                          <span className="text-sm text-[#6F6052]">—</span>
                        ) : (
                          creator.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-full bg-[#EBDCC4] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-[#5A3E28]"
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
                        className="inline-flex whitespace-nowrap rounded-xl border border-[#8A6340] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#5A3E28] transition-colors hover:bg-[#8A6340] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A6340]"
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
