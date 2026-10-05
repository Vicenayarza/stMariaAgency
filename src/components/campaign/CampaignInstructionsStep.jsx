const CONTENT_OPTIONS = [
  {
    platform: "Instagram",
    contentType: "Reel",
    label: "Instagram Reel",
  },
  {
    platform: "Instagram",
    contentType: "Story",
    label: "Instagram Stories",
  },
  {
    platform: "Instagram",
    contentType: "Post",
    label: "Instagram Post",
  },
  {
    platform: "TikTok",
    contentType: "TikTok",
    label: "TikTok",
  },
  {
    platform: "YouTube",
    contentType: "YouTube",
    label: "YouTube",
  },
];

function CampaignInstructionsStep({
  form,
  setForm,
}) {
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function getQuantity(
    platform,
    contentType
  ) {
    const item =
      form.contentItems?.find(
        (current) =>
          current.platform === platform &&
          current.contentType ===
            contentType
      );

    return item?.quantity || 0;
  }

  function updateContentQuantity(
    platform,
    contentType,
    quantity
  ) {
    const parsedQuantity =
      Math.max(
        0,
        Number(quantity) || 0
      );

    setForm((current) => {
      const items =
        current.contentItems || [];

      const exists = items.some(
        (item) =>
          item.platform === platform &&
          item.contentType ===
            contentType
      );

      /*
       * Si ponemos 0 eliminamos el
       * entregable de la campaña.
       */
      if (parsedQuantity === 0) {
        return {
          ...current,

          contentItems: items.filter(
            (item) =>
              !(
                item.platform ===
                  platform &&
                item.contentType ===
                  contentType
              )
          ),
        };
      }

      if (exists) {
        return {
          ...current,

          contentItems: items.map(
            (item) =>
              item.platform ===
                  platform &&
              item.contentType ===
                  contentType
                ? {
                    ...item,
                    quantity:
                      parsedQuantity,
                  }
                : item
          ),
        };
      }

      return {
        ...current,

        contentItems: [
          ...items,
          {
            platform,
            contentType,
            quantity:
              parsedQuantity,
          },
        ],
      };
    });
  }

  /*
   * Solo mostramos contenidos de las
   * plataformas elegidas anteriormente.
   */
  const availableContent =
    CONTENT_OPTIONS.filter((item) =>
      form.platforms?.includes(
        item.platform
      )
    );

  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
        Paso 04
      </p>

      <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
        Contenido e instrucciones
      </h2>

      <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
        Define qué contenido deberá crear
        cada perfil y las instrucciones de
        la colaboración.
      </p>

      {/* CONTENIDO */}

      <div className="mt-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
          Contenido solicitado
        </p>

        <p className="mt-1 text-xs text-black/40">
          Indica cuántas piezas de cada
          formato deberá realizar cada
          creador seleccionado.
        </p>

        {availableContent.length ===
        0 ? (
          <div className="mt-5 rounded-xl border border-black/10 bg-black/[0.02] p-5">
            <p className="text-sm text-black/45">
              Selecciona primero alguna
              plataforma en Segmentación.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {availableContent.map(
              (item) => {
                const quantity =
                  getQuantity(
                    item.platform,
                    item.contentType
                  );

                return (
                  <div
                    key={`${item.platform}-${item.contentType}`}
                    className="flex items-center justify-between gap-5 rounded-xl border border-black/10 p-5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs text-black/35">
                        {item.platform}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] uppercase tracking-[0.12em] text-black/35">
                        Cantidad
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) =>
                          updateContentQuantity(
                            item.platform,
                            item.contentType,
                            e.target.value
                          )
                        }
                        className="w-20 rounded-xl border border-black/10 px-3 py-3 text-center text-sm outline-none focus:border-black/30"
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* VENTANA PUBLICACIÓN */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
          Publicación
        </p>

        <p className="mt-1 text-xs text-black/40">
          Define la ventana prevista para
          publicar el contenido.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <Field
            label="Inicio de publicación"
            name="publicationStart"
            type="date"
            value={
              form.publicationStart || ""
            }
            onChange={handleChange}
          />

          <Field
            label="Fecha límite"
            name="publicationDeadline"
            type="date"
            value={
              form.publicationDeadline ||
              ""
            }
            onChange={handleChange}
          />
        </div>
      </div>

      {/* BRIEF */}

      <div className="mt-10 border-t border-black/10 pt-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
          Brief
        </p>

        <div className="mt-6 space-y-7">
          <TextArea
            label="Requisitos y brief"
            name="requirements"
            value={
              form.requirements || ""
            }
            onChange={handleChange}
            placeholder="Explica qué debe comunicar el creador..."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Hashtags"
              name="hashtags"
              value={
                form.hashtags || ""
              }
              onChange={handleChange}
              placeholder="#stmaria #campaña"
            />

            <Field
              label="Menciones"
              name="mentions"
              value={
                form.mentions || ""
              }
              onChange={handleChange}
              placeholder="@marca"
            />

            <Field
              label="Enlaces"
              name="links"
              value={
                form.links || ""
              }
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <TextArea
            label="Contenido prohibido / restricciones"
            name="prohibitedContent"
            value={
              form.prohibitedContent ||
              ""
            }
            onChange={handleChange}
            placeholder="Competidores, mensajes que deben evitarse, restricciones..."
          />

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 p-5">
            <div>
              <p className="text-sm font-medium">
                Aprobación previa
              </p>

              <p className="mt-1 text-xs text-black/40">
                El contenido deberá
                aprobarse antes de
                publicarse.
              </p>
            </div>

            <input
              type="checkbox"
              checked={
                Boolean(
                  form.requiresApproval
                )
              }
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,

                    requiresApproval:
                      e.target.checked,
                  })
                )
              }
              className="h-4 w-4"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
        {label}
      </label>

      <input
        {...props}
        className="mt-3 w-full rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
      />
    </div>
  );
}

function TextArea({
  label,
  ...props
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-[0.15em] text-black/40">
        {label}
      </label>

      <textarea
        {...props}
        rows={5}
        className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-black/25 focus:border-black/30"
      />
    </div>
  );
}

export default CampaignInstructionsStep;