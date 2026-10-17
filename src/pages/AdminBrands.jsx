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
    <div className="space-y-8 text-[#3E2B1B]">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8A6340]">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            Clientes
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6052]">
            Gestiona las marcas y empresas que trabajan con ST.MARY AGENCY.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/brands/new"
            className="inline-flex items-center justify-center rounded-xl bg-[#8A6340] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5A3E28]"
          >
            + Nuevo cliente
          </Link>

          <div className="min-w-[145px] rounded-2xl border border-[#D8C3A5] bg-white px-5 py-4">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
              Total clientes
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#3E2B1B]">
              {loading ? "—" : brands.length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadBrands}
            className="mt-3 rounded-xl bg-[#8A6340] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#5A3E28]"
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white">
        <div className="border-b border-[#EBDCC4] px-6 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
            Empresas
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-[#6F6052]">Cargando clientes...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">Todavía no hay clientes.</p>
            <p className="mt-2 text-sm text-[#6F6052]">
              Los clientes gestionados y registrados aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#F4EDE2]/70">
                <tr className="border-b border-[#EBDCC4] text-left">
                  {["Empresa", "Contacto", "Sector", "Campañas", "Gestión", "Acceso"].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8A6340]"
                    >
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="px-6 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8A6340]">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {brands.map((brand) => {
                  const primaryMember = brand.members?.[0] ?? null;
                  const contact = primaryMember?.user ?? null;
                  const hasAccess = (brand.members?.length ?? 0) > 0;

                  return (
                    <tr
                      key={brand.id}
                      className="border-b border-[#EBDCC4]/80 transition-colors last:border-b-0 hover:bg-[#F4EDE2]/50"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-[#3E2B1B]">
                          {brand.companyName}
                        </p>
                        {brand.website && (
                          <p className="mt-1 max-w-[220px] truncate text-xs text-[#6F6052]" title={brand.website}>
                            {brand.website}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {contact ? (
                          <>
                            <p className="text-sm text-[#3E2B1B]">{contact.name}</p>
                            <p className="mt-1 text-xs text-[#6F6052]">{contact.email}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-[#5A3E28]">Gestionado por ST.MARY AGENCY</p>
                            <p className="mt-1 text-xs text-[#8A6340]">Sin usuario asociado</p>
                          </>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm text-[#6F6052]">{brand.industry || "—"}</span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-sm font-semibold text-[#3E2B1B]">
                          {brand._count?.campaigns ?? 0}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full bg-[#EBDCC4] px-3 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-[#5A3E28]">
                          {getAccessLabel(brand.accessMode)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-medium uppercase tracking-[0.12em] ${
                          hasAccess
                            ? "bg-[#8A6340] text-white"
                            : "bg-[#F4EDE2] text-[#6F6052]"
                        }`}>
                          {hasAccess ? "Con acceso" : "Sin acceso"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          to={`/admin/brands/${brand.id}`}
                          className="inline-flex rounded-xl border border-[#D8C3A5] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5A3E28] transition-colors hover:border-[#8A6340] hover:bg-[#8A6340] hover:text-white"
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
      </section>
    </div>
  );
}

export default AdminBrands;
