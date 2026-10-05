import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function getAccessLabel(accessMode) {
  switch (accessMode) {
    case "SELF_MANAGED":
      return "Autogestionado";

    case "PORTAL":
      return "Portal";

    case "MANAGED":
    default:
      return "Gestionado";
  }
}

function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        "/api/admin/brands"
      );

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
            Gestiona las marcas y empresas que
            trabajan con ST.MARY AGENCY .
          </p>
        </div>

        <div className="flex items-center gap-3">
  <Link
    to="/admin/brands/new"
    className="rounded-full bg-black px-5 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black/80"
  >
    + Nuevo cliente
  </Link>

  <div className="rounded-2xl border border-black/10 bg-white px-5 py-4">
    <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
      Total clientes
    </p>

    <p className="mt-1 text-2xl font-medium">
      {loading ? "—" : brands.length}
    </p>
  </div>
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
            Empresas
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
              Los clientes gestionados y
              registrados aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
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
                    Gestión
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Acceso
                  </th>

                  <th className="px-6 py-4 text-right text-[9px] font-medium uppercase tracking-[0.14em] text-black/35">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {brands.map((brand) => {
                  const primaryMember =
                    brand.members?.[0] ??
                    null;

                  const contact =
                    primaryMember?.user ??
                    null;

                  const hasAccess =
                    (brand.members?.length ??
                      0) > 0;

                  return (
                    <tr
                      key={brand.id}
                      className="border-b border-black/5 last:border-b-0"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium">
                          {brand.companyName}
                        </p>

                        {brand.website && (
                          <p className="mt-1 text-xs text-black/35">
                            {brand.website}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {contact ? (
                          <>
                            <p className="text-sm">
                              {contact.name}
                            </p>

                            <p className="mt-1 text-xs text-black/35">
                              {contact.email}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-black/50">
                              Gestionado por
                              ST.MARY AGENCY 
                            </p>

                            <p className="mt-1 text-xs text-black/30">
                              Sin usuario
                              asociado
                            </p>
                          </>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm text-black/60">
                          {brand.industry ||
                            "—"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-medium">
                          {brand._count
                            ?.campaigns ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-black/5 px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">
                          {getAccessLabel(
                            brand.accessMode
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.12em] ${
                            hasAccess
                              ? "bg-black text-white"
                              : "bg-black/5 text-black/45"
                          }`}
                        >
                          {hasAccess
                            ? "Con acceso"
                            : "Sin acceso"}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBrands;