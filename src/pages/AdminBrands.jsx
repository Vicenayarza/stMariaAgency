import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get("/api/admin/brands");

      setBrands(data.brands || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar los clientes."
      );
    } finally {
      setLoading(false);
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
            Clientes
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
            Gestiona las marcas y empresas que trabajan con ST.MARIA.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Total clientes
          </p>

          <p className="mt-1 text-2xl font-medium">
            {loading ? "—" : brands.length}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
            Empresas registradas
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-black/40">
              Cargando clientes...
            </p>
          </div>
        ) : brands.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">
              Todavía no hay clientes.
            </p>

            <p className="mt-2 text-sm text-black/40">
              Cuando una marca se registre aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Empresa
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Contacto
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Sector
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Campañas
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-right text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-black/5 last:border-b-0"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-medium">
                          {brand.companyName}
                        </p>

                        {brand.website && (
                          <p className="mt-1 text-xs text-black/35">
                            {brand.website}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm">
                        {brand.user?.name || "—"}
                      </p>

                      <p className="mt-1 text-xs text-black/35">
                        {brand.user?.email || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm text-black/60">
                        {brand.industry || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm font-medium">
                        {brand._count?.campaigns ?? 0}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.12em] ${
                          brand.user?.status === "ACTIVE"
                            ? "bg-black text-white"
                            : "bg-black/5 text-black/45"
                        }`}
                      >
                        {brand.user?.status || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/admin/brands/${brand.id}`}
                        className="inline-flex rounded-xl border border-black/10 px-4 py-2 text-[10px] uppercase tracking-[0.12em] transition-colors hover:bg-black hover:text-white"
                      >
                        Ver cliente
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

export default AdminBrands;