import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

function NewCampaign() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    company: "",
    description: "",
    objective: "",
    budget: "",
    collaborationType: "Pago",
    socialNetwork: "Instagram",
    category: "",
    creators: "4",
    startDate: "",
    endDate: "",
    deliverables: [],
    requirements: "",
  });
  const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDeliverable = (value) => {
    setForm((prev) => ({
      ...prev,
      deliverables: prev.deliverables.includes(value)
        ? prev.deliverables.filter((item) => item !== value)
        : [...prev.deliverables, value],
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setLoading(true);

  try {
    const data = await apiFetch("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        budget: form.budget.replace(",", "."),
        objective: form.objective,
        category: form.category,
        platform: form.socialNetwork,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }),
    });

    navigate(`/platform/campaigns/${data.campaign.id}`);
  } catch (error) {
    console.error(error);

    setError(
      "No se ha podido crear la campaña."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="mx-auto max-w-[1100px]">

      {/* HEADER */}

      <div className="mb-10">

        <button
          onClick={() => navigate("/platform/campaigns")}
          className="mb-6 text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
        >
          ← Volver a campañas
        </button>

        <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
          Campañas
        </p>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
          Nueva campaña
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
          Define los objetivos de tu campaña y las características de los
          creadores que necesitas.
        </p>

      </div>


      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 01 — INFORMACIÓN */}

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">

          <SectionTitle
            number="01"
            title="Información"
            description="Cuéntanos qué campaña quieres realizar."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">

            <Input
              label="Nombre de campaña"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Campaña verano 2026"
              required
            />

            <Input
              label="Marca / empresa"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Ej. Amazon"
              required
            />

            <div className="md:col-span-2">

              <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                Descripción
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe brevemente la campaña..."
                className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
              />

            </div>

          </div>

        </section>


        {/* 02 — OBJETIVOS */}

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">

          <SectionTitle
            number="02"
            title="Objetivos"
            description="¿Qué quieres conseguir con esta campaña?"
          />

          <div className="mt-10">

            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Objetivo principal
            </label>

            <select
              name="objective"
              value={form.objective}
              onChange={handleChange}
              required
              className="mt-3 w-full appearance-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
            >
              <option value="">
                Selecciona un objetivo
              </option>

              <option value="awareness">
                Notoriedad de marca
              </option>

              <option value="reach">
                Alcance
              </option>

              <option value="engagement">
                Engagement
              </option>

              <option value="traffic">
                Tráfico
              </option>

              <option value="sales">
                Ventas / conversiones
              </option>

              <option value="content">
                Generación de contenido
              </option>

            </select>

          </div>

        </section>


        {/* 03 — PRESUPUESTO */}

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">

          <SectionTitle
            number="03"
            title="Presupuesto"
            description="Define cuánto quieres invertir en la campaña."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">

            <Input
              label="Presupuesto total"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              placeholder="5.000 €"
              required
            />

            <div>

              <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                Tipo de colaboración
              </label>

              <select
                name="collaborationType"
                value={form.collaborationType}
                onChange={handleChange}
                className="mt-3 w-full appearance-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
              >

                <option value="Pago">
                  Pago
                </option>

                <option value="Producto">
                  Producto
                </option>

                <option value="Pago + producto">
                  Pago + producto
                </option>

              </select>

            </div>

          </div>

          <div className="mt-6 rounded-xl bg-black/[0.03] p-5">

            <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
              Importante
            </p>

            <p className="mt-2 text-sm leading-relaxed text-black/50">
              El presupuesto de campaña será independiente de los honorarios
              de ST.MARIA y de los pagos individuales a los creadores.
            </p>

          </div>

        </section>


        {/* 04 — CREADORES */}

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">

          <SectionTitle
            number="04"
            title="Creadores"
            description="Define el perfil de los influencers que necesitas."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">

            <div>

              <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                Red social
              </label>

              <select
                name="socialNetwork"
                value={form.socialNetwork}
                onChange={handleChange}
                className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
              >

                <option>Instagram</option>
                <option>TikTok</option>
                <option>YouTube</option>
                <option>Instagram + TikTok</option>
                <option>Varias plataformas</option>

              </select>

            </div>


            <Input
              label="Categoría"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Ej. Tecnología"
            />


            <Input
              label="Número de creadores"
              name="creators"
              type="number"
              min="1"
              value={form.creators}
              onChange={handleChange}
            />

          </div>

        </section>


        {/* 05 — CONTENIDO */}

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">

          <SectionTitle
            number="05"
            title="Contenido"
            description="Define qué contenido deberán crear los influencers."
          />

          <div className="mt-10">

            <p className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Entregables
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">

              {[
                "Reel",
                "Story",
                "Post",
                "TikTok",
              ].map((item) => (

                <label
                  key={item}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors ${
                    form.deliverables.includes(item)
                      ? "border-black bg-black text-white"
                      : "border-black/10 hover:border-black/30"
                  }`}
                >

                  <input
                    type="checkbox"
                    checked={form.deliverables.includes(item)}
                    onChange={() => toggleDeliverable(item)}
                    className="sr-only"
                  />

                  <span>
                    {item}
                  </span>

                </label>

              ))}

            </div>

          </div>


          <div className="mt-8">

            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Requisitos para los creadores
            </label>

            <textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={5}
              placeholder="Ej. Mostrar el producto en un entorno natural, mencionar la marca, incluir enlace..."
              className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />

          </div>

        </section>


        {/* 06 — FECHAS */}

        <section className="rounded-2xl border border-black/10 p-7 md:p-10">

          <SectionTitle
            number="06"
            title="Calendario"
            description="Define cuándo quieres ejecutar la campaña."
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
        {/* SUBMIT */}

      <div className="border-t border-black/10 pt-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => navigate("/platform/campaigns")}
            className="text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-8 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear campaña →"}
          </button>

         </div>

      </div>

      </form>
      
    </div>
    
  );
  
}


/* COMPONENTES */

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
  min,
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
        min={min}
        className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
      />

    </div>
  );
}

export default NewCampaign;