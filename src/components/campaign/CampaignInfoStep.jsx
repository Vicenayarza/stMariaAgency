function CampaignInfoStep({ form, setForm, brand }) {
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
        Paso 03
      </p>

      <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
        Información de campaña
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className={brand ? "" : "md:col-span-2"}>
  <Field
    label="Nombre de campaña"
    name="name"
    value={form.name}
    onChange={handleChange}
    placeholder="Ej. Lanzamiento verano 2026"
  />
</div>

        {brand && (
  <Field
    label="Cliente"
    value={brand.companyName}
    disabled
  />
)}

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

        <div>
          <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
            Objetivo
          </label>

          <select
            name="objective"
            value={form.objective}
            onChange={handleChange}
            className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none"
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

        <Field
          label="Presupuesto"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          placeholder="5000"
        />

        <Field
          label="Fecha de inicio"
          name="startDate"
          type="date"
          value={form.startDate}
          onChange={handleChange}
        />

        <Field
          label="Fecha de finalización"
          name="endDate"
          type="date"
          value={form.endDate}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30 disabled:bg-black/[0.03] disabled:text-black/40"
      />
    </div>
  );
}

export default CampaignInfoStep;