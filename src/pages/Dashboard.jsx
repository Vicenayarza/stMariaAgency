function Dashboard() {
  const campaigns = [
    {
      name: "Campaña de verano",
      brand: "ST.MARIA Demo",
      creators: 12,
      progress: 72,
      status: "Activa",
    },
    {
      name: "Lanzamiento producto",
      brand: "ST.MARIA Demo",
      creators: 8,
      progress: 48,
      status: "En curso",
    },
    {
      name: "Campaña social",
      brand: "ST.MARIA Demo",
      creators: 5,
      progress: 24,
      status: "Preparación",
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

        <div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
            Resumen
          </p>

          <h2 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
            Buenos días.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
            Aquí tienes una visión general de la actividad de tu cuenta.
          </p>

        </div>


        <button className="rounded-full bg-black px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.02]">
          + Nueva campaña
        </button>

      </div>


      {/* STATS */}

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 md:grid-cols-4">

        <Stat
          label="Campañas activas"
          value="8"
          change="+2 este mes"
        />

        <Stat
          label="Creadores"
          value="42"
          change="+12 este mes"
        />

        <Stat
          label="Inversión"
          value="24.500 €"
          change="+18% este mes"
        />

        <Stat
          label="Engagement"
          value="7,8%"
          change="+1,2% este mes"
        />

      </div>


      {/* CAMPAIGNS */}

      <section className="mt-12">

        <div className="mb-6 flex items-end justify-between">

          <div>

            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Actividad
            </p>

            <h3 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
              Campañas
            </h3>

          </div>

          <button className="text-[9px] uppercase tracking-[0.16em] text-black/40 hover:text-black">
            Ver todas →
          </button>

        </div>


        <div className="overflow-hidden rounded-2xl border border-black/10">

          <div className="hidden grid-cols-12 border-b border-black/10 px-6 py-4 text-[9px] uppercase tracking-[0.14em] text-black/35 md:grid">

            <span className="col-span-5">
              Campaña
            </span>

            <span className="col-span-2">
              Creadores
            </span>

            <span className="col-span-3">
              Progreso
            </span>

            <span className="col-span-2">
              Estado
            </span>

          </div>


          {campaigns.map((campaign) => (

            <div
              key={campaign.name}
              className="grid gap-4 border-b border-black/10 px-6 py-6 last:border-b-0 md:grid-cols-12 md:items-center"
            >

              <div className="md:col-span-5">

                <p className="font-medium">
                  {campaign.name}
                </p>

                <p className="mt-1 text-xs text-black/40">
                  {campaign.brand}
                </p>

              </div>


              <div className="text-sm text-black/60 md:col-span-2">

                {campaign.creators} creadores

              </div>


              <div className="md:col-span-3">

                <div className="flex items-center gap-3">

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10">

                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${campaign.progress}%`,
                      }}
                    />

                  </div>

                  <span className="text-[10px] text-black/40">
                    {campaign.progress}%
                  </span>

                </div>

              </div>


              <div className="md:col-span-2">

                <span className="inline-flex rounded-full border border-black/10 px-3 py-1 text-[9px] uppercase tracking-[0.12em]">
                  {campaign.status}
                </span>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* BOTTOM */}

      <div className="mt-12 grid gap-6 md:grid-cols-2">

        <div className="rounded-2xl border border-black/10 p-7">

          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Próximamente
          </p>

          <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
            Descubre creadores
          </h3>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-black/45">
            Encuentra perfiles que encajen con tu audiencia, sector,
            presupuesto y objetivos de campaña.
          </p>

          <button className="mt-7 rounded-full border border-black/15 px-5 py-3 text-[9px] uppercase tracking-[0.14em] hover:bg-black hover:text-white">
            Explorar creadores
          </button>

        </div>


        <div className="rounded-2xl bg-black p-7 text-white">

          <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
            ST.MARIA
          </p>

          <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
            Crea una nueva campaña.
          </h3>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
            Define tus objetivos y deja que ST.MARIA te ayude a encontrar
            los creadores adecuados.
          </p>

          <button className="mt-7 rounded-full bg-white px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-black hover:scale-[1.02]">
            Crear campaña
          </button>

        </div>

      </div>

    </div>
  );
}


function Stat({ label, value, change }) {
  return (
    <div className="bg-[#f5f5f2] p-6">

      <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
        {label}
      </p>

      <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-black/40">
        {change}
      </p>

    </div>
  );
}

export default Dashboard;