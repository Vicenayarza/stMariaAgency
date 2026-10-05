function CampaignSummaryStep({
  form,
  brand,
}) {
  const contentItems =
    form.contentItems || [];

  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
        Paso 05
      </p>

      <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em]">
        Revisa la campaña
      </h2>

      <p className="mt-3 text-sm text-black/45">
        Comprueba la configuración antes
        de crearla.
      </p>

      {/* GENERAL */}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {brand && (
  <Summary
    label="Cliente"
    value={brand.companyName}
  />
)}

        <Summary
          label="Campaña"
          value={form.name || "—"}
        />

        <Summary
          label="Tipo"
          value={
            formatCampaignType(
              form.campaignType
            )
          }
        />

        <Summary
          label="Colaboración"
          value={
            form.collaborationType ||
            "—"
          }
        />

        <Summary
          label="Objetivo"
          value={
            form.objective || "—"
          }
        />

        <Summary
          label="Presupuesto"
          value={
            form.budget
              ? `${form.budget} €`
              : "—"
          }
        />

        <Summary
          label="Creadores"
          value={
            form.creatorCount || "—"
          }
        />

        <Summary
          label="Plataformas"
          value={
            form.platforms?.join(
              ", "
            ) || "—"
          }
        />

        <Summary
          label="Categoría"
          value={
            form.category || "—"
          }
        />

        <Summary
          label="Ubicación"
          value={
            [
              form.province,
              form.country,
            ]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />

        <Summary
          label="Edad"
          value={
            form.minAge ||
            form.maxAge
              ? `${
                  form.minAge || "—"
                } - ${
                  form.maxAge || "—"
                }`
              : "Sin filtro"
          }
        />

        <Summary
          label="Intereses"
          value={
            form.interests?.join(
              ", "
            ) || "—"
          }
        />
      </div>

      {/* CONTENIDO */}

      <div className="mt-8 border-t border-black/10 pt-8">
        <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
          Contenido solicitado
        </p>

        <h3 className="mt-2 text-lg font-medium">
          Entregables por creador
        </h3>

        {contentItems.length === 0 ? (
          <div className="mt-4 rounded-xl border border-black/10 p-5">
            <p className="text-sm text-black/40">
              No se han configurado
              contenidos específicos.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {contentItems.map(
              (item) => (
                <div
                  key={`${item.platform}-${item.contentType}`}
                  className="rounded-xl border border-black/10 p-5"
                >
                  <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
                    {item.platform}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">
                      {item.contentType}
                    </p>

                    <p className="text-sm font-medium">
                      × {item.quantity}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* FECHAS */}

      <div className="mt-8 border-t border-black/10 pt-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Summary
            label="Inicio campaña"
            value={formatDate(
              form.startDate
            )}
          />

          <Summary
            label="Fin campaña"
            value={formatDate(
              form.endDate
            )}
          />

          <Summary
            label="Inicio publicación"
            value={formatDate(
              form.publicationStart
            )}
          />

          <Summary
            label="Fecha límite publicación"
            value={formatDate(
              form.publicationDeadline
            )}
          />
        </div>
      </div>

      {/* BRIEF */}

      {form.requirements && (
        <div className="mt-8 rounded-xl border border-black/10 p-5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
            Brief
          </p>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-black/60">
            {form.requirements}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-black/[0.03] p-5">
        <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">
          Gestión
        </p>

       <p className="mt-2 text-sm leading-relaxed text-black/55">
  {brand
    ? `Esta campaña será creada por ST.MARY AGENCY para ${brand.companyName}.`
    : "Esta campaña será creada dentro de tu cuenta de marca."}
</p>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-black/10 p-5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return date.toLocaleDateString(
    "es-ES"
  );
}

function formatCampaignType(value) {
  const labels = {
    INFLUENCER_MARKETING:
      "Influencer Marketing",

    UGC:
      "UGC",

    INFLUENCER_AND_UGC:
      "Influencer + UGC",

    AMPLIFICATION:
      "Amplificación",
  };

  return labels[value] || value || "—";
}

export default CampaignSummaryStep;