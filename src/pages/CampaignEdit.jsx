import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api";

function CampaignEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    objective: "",
    budget: "",
    category: "",
    platform: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
  });

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(`/api/campaigns/${id}`);
        const campaign = data.campaign;

        setForm({
          name: campaign.name || "",
          description: campaign.description || "",
          objective: campaign.objective || "",
          budget:
            campaign.budget !== null &&
            campaign.budget !== undefined
              ? String(campaign.budget)
              : "",
          category: campaign.category || "",
          platform: campaign.platform || "",
          startDate: formatDateForInput(campaign.startDate),
          endDate: formatDateForInput(campaign.endDate),
          status: campaign.status || "DRAFT",
        });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const data = await apiFetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          objective: form.objective,
          budget: form.budget.replace(",", "."),
          category: form.category,
          platform: form.platform,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          status: form.status,
        }),
      });

      navigate(`/platform/campaigns/${data.campaign.id}`);
    } catch (error) {
      console.error(error);

      if (error.status === 400) {
        setError(
          "Revisa los datos introducidos. El nombre y el presupuesto deben ser válidos."
        );
      } else if (error.status === 404) {
        setError("La campaña no existe o no tienes acceso a ella.");
      } else {
        setError("No se ha podido guardar la campaña.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <div className="rounded-2xl border border-black/10 p-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">
            Cargando campaña...
          </p>
        </div>
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <button
          type="button"
          onClick={() => navigate("/platform/campaigns")}
          className="mb-8 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
        >
          ← Volver a campañas
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-10">
        <button
          type="button"
          onClick={() => navigate(`/platform/campaigns/${id}`)}
          className="mb-6 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
        >
          ← Volver a la campaña
        </button>

        <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
          Campañas
        </p>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
          Editar campaña
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
          Modifica la información principal de la campaña y guarda los
          cambios.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-black/10 p-7 md:p-10">
          <SectionTitle
            number="01"
            title="Información"
            description="Datos principales de la campaña."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Input
              label="Nombre de campaña"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                Estado
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-3 w-full appearance-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
              >
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activa</option>
                <option value="PAUSED">Pausada</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                Descripción
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">
          <SectionTitle
            number="02"
            title="Objetivos"
            description="Define qué quieres conseguir."
          />

          <div className="mt-10">
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Objetivo principal
            </label>

            <select
              name="objective"
              value={form.objective}
              onChange={handleChange}
              className="mt-3 w-full appearance-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
            >
              <option value="">Selecciona un objetivo</option>
              <option value="awareness">Notoriedad de marca</option>
              <option value="reach">Alcance</option>
              <option value="engagement">Engagement</option>
              <option value="traffic">Tráfico</option>
              <option value="sales">Ventas / conversiones</option>
              <option value="content">Generación de contenido</option>
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">
          <SectionTitle
            number="03"
            title="Presupuesto"
            description="Define cuánto quieres invertir."
          />

          <div className="mt-10">
            <Input
              label="Presupuesto total"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              placeholder="5000"
              required
            />
          </div>

          <div className="mt-6 rounded-xl bg-black/[0.03] p-5">
            <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
              Modelo ST.MARIA
            </p>

            <p className="mt-2 text-sm leading-relaxed text-black/50">
              Este presupuesto representa el presupuesto total de la campaña.
              Los honorarios de ST.MARIA y los pagos individuales a creadores
              se gestionarán por separado.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">
          <SectionTitle
            number="04"
            title="Creadores"
            description="Define el contexto para la selección de creadores."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Input
              label="Categoría"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Ej. Tecnología"
            />

            <div>
              <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                Plataforma
              </label>

              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className="mt-3 w-full appearance-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
              >
                <option value="">Selecciona una plataforma</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="Instagram + TikTok">
                  Instagram + TikTok
                </option>
                <option value="Varias plataformas">
                  Varias plataformas
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">
          <SectionTitle
            number="05"
            title="Calendario"
            description="Define cuándo se ejecutará la campaña."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Input
              label="Fecha de inicio"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
            />

            <Input
              label="Fecha de finalización"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
            />
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col justify-between gap-5 border-t border-black/10 pt-8 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate(`/platform/campaigns/${id}`)}
            className="text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-black px-8 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ number, title, description }) {
  return (
    <div className="flex gap-5">
      <span className="text-[10px] tracking-[0.16em] text-black/35">
        {number}
      </span>

      <div>
        <h2 className="text-2xl font-medium tracking-[-0.04em]">
          {title}
        </h2>

        <p className="mt-2 text-sm text-black/45">
          {description}
        </p>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
      />
    </div>
  );
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default CampaignEdit;