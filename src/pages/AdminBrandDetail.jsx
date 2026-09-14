import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

function AdminBrandDetail() {
  const { id } = useParams();

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBrand();
  }, [id]);

  async function loadBrand() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(`/api/admin/brands/${id}`);

      setBrand(data.brand);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido cargar el cliente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando cliente...
        </p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div>
        <Link
          to="/admin/brands"
          className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
        >
          ← Volver a clientes
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error || "Cliente no encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/brands"
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a clientes
      </Link>

      <div className="mt-6 mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Cliente
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            {brand.companyName}
          </h1>

          <p className="mt-3 text-sm text-black/45">
            Información y actividad de la cuenta.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.12em] ${
            brand.user?.status === "ACTIVE"
              ? "bg-black text-white"
              : "bg-black/5 text-black/45"
          }`}
        >
          {brand.user?.status || "—"}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Empresa
          </p>

          <p className="mt-4 text-lg font-medium">
            {brand.companyName}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Sector
              </p>

              <p className="mt-1 text-sm">
                {brand.industry || "No especificado"}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Web
              </p>

              <p className="mt-1 text-sm break-all">
                {brand.website || "No especificada"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Contacto
          </p>

          <p className="mt-4 text-lg font-medium">
            {brand.user?.name || "Sin nombre"}
          </p>

          <div className="mt-6">
            <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
              Email
            </p>

            <p className="mt-1 break-all text-sm">
              {brand.user?.email || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Actividad
          </p>

          <p className="mt-4 text-3xl font-medium">
            {brand.campaigns?.length || 0}
          </p>

          <p className="mt-1 text-sm text-black/40">
            campañas creadas
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
            Campañas del cliente
          </p>
        </div>

        {!brand.campaigns?.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-black/40">
              Este cliente todavía no tiene campañas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {brand.campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center"
              >
                <div>
                  <p className="text-sm font-medium">
                    {campaign.name}
                  </p>

                  <p className="mt-1 text-xs text-black/35">
                    {campaign.category || "Sin categoría"}
                    {campaign.platform
                      ? ` · ${campaign.platform}`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                      Presupuesto
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {Number(campaign.budget).toLocaleString(
                        "es-ES",
                        {
                          style: "currency",
                          currency: "EUR",
                        }
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                      Creadores
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {campaign._count?.creators ?? 0}
                    </p>
                  </div>

                  <span className="rounded-full bg-black/5 px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBrandDetail;