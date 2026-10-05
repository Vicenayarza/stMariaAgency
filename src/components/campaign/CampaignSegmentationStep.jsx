const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
];

const FORMAT_OPTIONS = [
  "Reel",
  "Story",
  "Post",
  "TikTok",
  "YouTube",
];

const INTEREST_OPTIONS = [
  "Tecnología",
  "Lifestyle",
  "Moda",
  "Belleza",
  "Fitness",
  "Gaming",
  "Viajes",
  "Gastronomía",
  "Deporte",
  "Educación",
  "Entretenimiento",
  "Familia",
];

function CampaignSegmentationStep({
  form,
  setForm,
}) {
  function toggleArrayValue(field, value) {
    setForm((current) => {
      const values = current[field] || [];

      return {
        ...current,

        [field]: values.includes(value)
          ? values.filter(
              (currentValue) =>
                currentValue !== value
            )
          : [...values, value],
      };
    });
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Segmentación
        </p>

        <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
          ¿Qué creadores buscamos?
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">
          Define las características que
          utilizaremos para descubrir y
          recomendar los perfiles más
          adecuados para la campaña.
        </p>
      </div>

      {/* PLATAFORMAS */}

      <div className="mt-10">
        <FieldTitle
          title="Plataformas"
          description="Selecciona una o varias redes sociales."
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {PLATFORM_OPTIONS.map(
            (platform) => {
              const selected =
                form.platforms?.includes(
                  platform
                );

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    toggleArrayValue(
                      "platforms",
                      platform
                    )
                  }
                  className={`rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.12em] transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-black/10 text-black/55 hover:border-black/30"
                  }`}
                >
                  {platform}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* FORMATOS */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <FieldTitle
          title="Formatos"
          description="Qué tipo de contenido deberá poder crear el perfil."
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {FORMAT_OPTIONS.map(
            (format) => {
              const selected =
                form.formats?.includes(
                  format
                );

              return (
                <button
                  key={format}
                  type="button"
                  onClick={() =>
                    toggleArrayValue(
                      "formats",
                      format
                    )
                  }
                  className={`rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.12em] transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-black/10 text-black/55 hover:border-black/30"
                  }`}
                >
                  {format}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* CATEGORÍA */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <FieldTitle
          title="Categoría"
          description="Categoría principal de los creadores."
        />

        <input
          type="text"
          name="category"
          value={form.category || ""}
          onChange={handleChange}
          placeholder="Ej. Tecnología"
          className="mt-4 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30 md:max-w-md"
        />
      </div>

      {/* UBICACIÓN */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <FieldTitle
          title="Ubicación"
          description="Define dónde quieres encontrar a los creadores."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              País
            </label>

            <input
              type="text"
              name="country"
              value={form.country || ""}
              onChange={handleChange}
              placeholder="Ej. España"
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Provincia
            </label>

            <input
              type="text"
              name="province"
              value={
                form.province || ""
              }
              onChange={handleChange}
              placeholder="Ej. Madrid"
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />
          </div>
        </div>
      </div>

      {/* PERFIL */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <FieldTitle
          title="Perfil"
          description="Características demográficas deseadas."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Género
            </label>

            <select
              name="gender"
              value={
                form.gender || "ALL"
              }
              onChange={handleChange}
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none focus:border-black/30"
            >
              <option value="ALL">
                Todos
              </option>

              <option value="FEMALE">
                Mujer
              </option>

              <option value="MALE">
                Hombre
              </option>

              <option value="OTHER">
                Otro / indiferente
              </option>
            </select>
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Edad mínima
            </label>

            <input
              type="number"
              name="minAge"
              min="13"
              max="100"
              value={form.minAge || ""}
              onChange={handleChange}
              placeholder="18"
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />
          </div>

          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
              Edad máxima
            </label>

            <input
              type="number"
              name="maxAge"
              min="13"
              max="100"
              value={form.maxAge || ""}
              onChange={handleChange}
              placeholder="35"
              className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
            />
          </div>
        </div>
      </div>

      {/* INTERESES */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <FieldTitle
          title="Intereses"
          description="Selecciona los intereses relacionados con la campaña."
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {INTEREST_OPTIONS.map(
            (interest) => {
              const selected =
                form.interests?.includes(
                  interest
                );

              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() =>
                    toggleArrayValue(
                      "interests",
                      interest
                    )
                  }
                  className={`rounded-full border px-4 py-3 text-[9px] uppercase tracking-[0.1em] transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-black/10 text-black/50 hover:border-black/30"
                  }`}
                >
                  {interest}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* NÚMERO DE CREADORES */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <FieldTitle
          title="Número de creadores"
          description="Cantidad aproximada de perfiles que necesita la campaña."
        />

        <input
          type="number"
          name="creatorCount"
          min="1"
          value={
            form.creatorCount || ""
          }
          onChange={handleChange}
          placeholder="4"
          className="mt-4 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30 md:max-w-[220px]"
        />
      </div>
    </div>
  );
}

function FieldTitle({
  title,
  description,
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
        {title}
      </p>

      {description && (
        <p className="mt-1 text-xs text-black/40">
          {description}
        </p>
      )}
    </div>
  );
}

export default CampaignSegmentationStep;