function CreatorRegisterFields({
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
          placeholder="Tu nombre"
          autoComplete="given-name"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <Field
          label="Apellidos"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder="Tus apellidos"
          autoComplete="family-name"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />
      </div>

      <div className="mt-5">
        <Field
          label="Nombre de usuario"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="vicenayarza"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />
      </div>

      <div className="mt-5">
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          autoComplete="email"
          required
          inputClass={inputClass}
          labelClass={labelClass}
        />
      </div>

      
<div className="mt-6">
  <p className={labelClass}>
    Redes sociales *
  </p>

  <p className="mt-2 text-xs leading-5 text-[#6F6052]">
    Introduce al menos una red social para que
    nuestro equipo pueda revisar tu perfil.
    Puedes escribir tu usuario o el enlace
    completo a tu cuenta.
  </p>

  <div className="mt-4 space-y-4">
    <Field
      label="Instagram"
      name="instagram"
      value={form.instagram || ""}
      onChange={handleChange}
      placeholder="tuusuariosin@"
      inputClass={inputClass}
      labelClass={labelClass}
    />

    <Field
      label="TikTok"
      name="tiktok"
      value={form.tiktok || ""}
      onChange={handleChange}
      placeholder="tuusuariosin@"
      inputClass={inputClass}
      labelClass={labelClass}
    />

    <Field
      label="YouTube"
      name="youtube"
      value={form.youtube || ""}
      onChange={handleChange}
      placeholder="Usuario o URL del canal"
      inputClass={inputClass}
      labelClass={labelClass}
    />
  </div>

  {![
    form.instagram,
    form.tiktok,
    form.youtube,
  ].some((value) => value?.trim()) && (
    <p className="mt-3 text-xs text-amber-700">
      Debes indicar al menos una red social.
    </p>
  )}
</div>


      <div className="mt-5">
        <Field
          label="Código de invitación"
          name="invitationCode"
          value={form.invitationCode}
          onChange={handleChange}
          placeholder="Opcional"
          inputClass={inputClass}
          labelClass={labelClass}
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="country"
          className={labelClass}
        >
          País
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

      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="privacyAccepted"
          checked={form.privacyAccepted}
          onChange={handleChange}
          required
          className="mt-1 accent-[#8A6340]"
        />

        <span className="text-xs leading-relaxed text-[#6F6052]">
          Acepto la política de privacidad y
          los términos y condiciones de
          ST.MARY AGENCY.
        </span>
      </label>
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
  minLength,
  autoComplete,
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
        minLength={minLength}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </div>
  );
}

export default CreatorRegisterFields;