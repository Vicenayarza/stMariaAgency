const TYPES = [
  {
    value: "INFLUENCER_MARKETING",
    title: "Influencer Marketing",
    description:
      "Campaña con creadores seleccionados para promocionar una marca, producto o servicio.",
  },
  {
    value: "UGC",
    title: "UGC",
    description:
      "Creación de contenido para que la marca pueda utilizarlo en sus propios canales.",
  },
  {
    value: "INFLUENCER_AND_UGC",
    title: "Influencer + UGC",
    description:
      "Combina publicación por parte de los creadores y generación de contenido para la marca.",
  },
  {
    value: "AMPLIFICATION",
    title: "Amplificación",
    description:
      "Campaña orientada a amplificar contenido y aumentar su alcance mediante creadores.",
  },
];
function CampaignTypeStep({ form, setForm }) {
  function selectType(value) {
    setForm((current) => ({
      ...current,
      campaignType: value,
    }));
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
        Paso 01
      </p>

      <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
        Tipo de campaña
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
        Define qué tipo de activación va a gestionar ST.MARY AGENCY .
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {TYPES.map((type) => {
          const selected = form.campaignType === type.value;

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => selectType(type.value)}
              className={`rounded-2xl border p-6 text-left transition ${
                selected
                  ? "border-black bg-black text-white"
                  : "border-black/10 hover:border-black/30"
              }`}
            >
              <p className="text-base font-medium">{type.title}</p>

              <p
                className={`mt-3 text-sm leading-relaxed ${
                  selected ? "text-white/55" : "text-black/45"
                }`}
              >
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
          Tipo de colaboración
        </label>

        <select
          value={form.collaborationType}
          onChange={(e) =>
            setForm((current) => ({
              ...current,
              collaborationType: e.target.value,
            }))
          }
          className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none md:max-w-md"
        >
          <option value="PAID">
  Pago
</option>

<option value="PRODUCT">
  Producto
</option>

<option value="PAID_AND_PRODUCT">
  Pago + producto
</option>
        </select>
      </div>
    </div>
  );
}

export default CampaignTypeStep;