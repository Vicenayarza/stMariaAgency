import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { api } from "../lib/api";

function AdminNewBrand() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    website: "",

    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await api.post(
        "/api/admin/brands",
        {
          companyName:
            form.companyName,

          industry:
            form.industry,

          website:
            form.website,

          contactName:
            form.contactName,

          contactEmail:
            form.contactEmail,

          contactPhone:
            form.contactPhone,
        }
      );

      /*
       * Una vez creado, vamos directamente
       * a la ficha del cliente.
       */
      navigate(
        `/admin/brands/${data.brand.id}`
      );
    } catch (err) {
      console.error(err);

      if (
        err?.data?.error ===
        "COMPANY_NAME_REQUIRED"
      ) {
        setError(
          "El nombre de la empresa es obligatorio."
        );
      } else {
        setError(
          err?.data?.message ||
            err?.message ||
            "No se ha podido crear el cliente."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/brands"
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a clientes
      </Link>

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Administración
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          Nuevo cliente
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-black/45">
          Añade una nueva empresa para
          gestionar sus campañas desde la
          agencia.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6"
      >
        {/* EMPRESA */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Empresa
            </p>

            <h2 className="mt-2 text-lg font-medium">
              Información del cliente
            </h2>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                Nombre de la empresa *
              </label>

              <input
                type="text"
                required
                value={form.companyName}
                onChange={(event) =>
                  updateField(
                    "companyName",
                    event.target.value
                  )
                }
                placeholder="Nombre de la empresa"
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                Sector
              </label>

              <input
                type="text"
                value={form.industry}
                onChange={(event) =>
                  updateField(
                    "industry",
                    event.target.value
                  )
                }
                placeholder="Moda, tecnología..."
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                Web
              </label>

              <input
                type="url"
                value={form.website}
                onChange={(event) =>
                  updateField(
                    "website",
                    event.target.value
                  )
                }
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />
            </div>
          </div>
        </div>

        {/* CONTACTO */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Contacto
            </p>

            <h2 className="mt-2 text-lg font-medium">
              Contacto comercial
            </h2>

            <p className="mt-2 text-sm leading-6 text-black/40">
              Estos datos son internos. Añadir
              un contacto no le da acceso a la
              plataforma.
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                Nombre
              </label>

              <input
                type="text"
                value={form.contactName}
                onChange={(event) =>
                  updateField(
                    "contactName",
                    event.target.value
                  )
                }
                placeholder="Nombre del contacto"
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                Email
              </label>

              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  updateField(
                    "contactEmail",
                    event.target.value
                  )
                }
                placeholder="contacto@empresa.com"
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
                Teléfono
              </label>

              <input
                type="tel"
                value={form.contactPhone}
                onChange={(event) =>
                  updateField(
                    "contactPhone",
                    event.target.value
                  )
                }
                placeholder="+34 600 000 000"
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
              />
            </div>
          </div>
        </div>

        {/* ACCESO */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-6">
          <div className="flex gap-4">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black" />

            <div>
              <p className="text-sm font-medium">
                Gestionado por la agencia
              </p>

              <p className="mt-1 text-sm leading-6 text-black/40">
                El cliente se creará sin cuenta
                de acceso. Podrás darle acceso
                al portal posteriormente desde
                su ficha.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            to="/admin/brands"
            className="rounded-xl border border-black/10 px-5 py-3 text-[10px] uppercase tracking-[0.12em] transition hover:bg-black/5"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Creando..."
              : "Crear cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminNewBrand;