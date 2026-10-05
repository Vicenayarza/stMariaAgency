function BrandRegisterFields({
  form,
  handleChange,
}) {
  const inputClass =
    "mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-white/40 px-5 py-4 text-sm text-[#3E2B1B] outline-none transition-colors placeholder:text-[#6F6052]/40 focus:border-[#8A6340]";

  const labelClass =
    "text-[9px] uppercase tracking-[0.16em] text-[#6F6052]";

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nombre"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <Field
          label="Apellidos"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder="Apellidos"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <Field
          label="Email de empresa"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="nombre@empresa.com"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <Field
          label="URL web de tu empresa"
          name="website"
          type="url"
          value={form.website}
          onChange={handleChange}
          placeholder="https://..."
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <Field
          label="Nombre de la empresa"
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          placeholder="Empresa"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <Field
          label="Número de teléfono"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="+34..."
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <div>
          <label
            htmlFor="employeeCount"
            className={labelClass}
          >
            Número de empleados *
          </label>

          <select
            id="employeeCount"
            name="employeeCount"
            value={form.employeeCount}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">
              Selecciona una opción
            </option>
            <option value="1-10">
              1 - 10
            </option>
            <option value="11-50">
              11 - 50
            </option>
            <option value="51-200">
              51 - 200
            </option>
            <option value="201-500">
              201 - 500
            </option>
            <option value="500+">
              Más de 500
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="country"
            className={labelClass}
          >
            País *
          </label>

          <select
            id="country"
            name="country"
            value={form.country}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">
              Selecciona un país
            </option>
            <option value="España">
              España
            </option>
            <option value="Portugal">
              Portugal
            </option>
            <option value="Francia">
              Francia
            </option>
            <option value="Italia">
              Italia
            </option>
            <option value="Otro">
              Otro
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="services"
          className={labelClass}
        >
          Servicios de interés *
        </label>

        <select
          id="services"
          name="services"
          value={form.services}
          onChange={handleChange}
          required
          className={inputClass}
        >
          <option value="">
            Selecciona un servicio
          </option>

          <option value="INFLUENCER_MARKETING">
            Influencer Marketing
          </option>

          <option value="UGC">
            UGC
          </option>

          <option value="INFLUENCER_AND_UGC">
            Influencer Marketing + UGC
          </option>

          <option value="OTHER">
            Otros
          </option>
        </select>
      </div>

      <div className="mt-5">
        <label
          htmlFor="needs"
          className={labelClass}
        >
          Cuéntanos qué necesitas
        </label>

        <textarea
          id="needs"
          name="needs"
          value={form.needs}
          onChange={handleChange}
          rows={5}
          placeholder="Cuéntanos brevemente qué buscas para tu marca..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="discoverySource"
          className={labelClass}
        >
          ¿Cómo nos has conocido? *
        </label>

        <select
          id="discoverySource"
          name="discoverySource"
          value={form.discoverySource}
          onChange={handleChange}
          required
          className={inputClass}
        >
          <option value="">
            Selecciona una opción
          </option>

          <option value="GOOGLE">
            Google
          </option>

          <option value="SOCIAL_MEDIA">
            Redes sociales
          </option>

          <option value="RECOMMENDATION">
            Recomendación
          </option>

          <option value="EVENT">
            Evento
          </option>

          <option value="OTHER">
            Otros
          </option>
        </select>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[#6F6052]">
        Al enviar este formulario aceptas que
        ST.MARY AGENCY trate tus datos para
        responder a tu solicitud de información.
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  inputClass,
  labelClass,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className={labelClass}
      >
        {label}
        {required ? " *" : ""}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </div>
  );
}

export default BrandRegisterFields;