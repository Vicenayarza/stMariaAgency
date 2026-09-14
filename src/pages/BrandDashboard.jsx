import { Link } from "react-router-dom";

const stats = [
  {
    value: "3",
    label: "Campañas activas",
  },
  {
    value: "24",
    label: "Creadores",
  },
  {
    value: "1.24M",
    label: "Alcance",
  },
  {
    value: "7.8%",
    label: "Engagement",
  },
];

const campaigns = [
  {
    name: "Campaña verano 2026",
    client: "Amazon",
    creators: 4,
    budget: "5.000 €",
    progress: 65,
    status: "Activa",
  },
  {
    name: "Lanzamiento nueva colección",
    client: "Marca Demo",
    creators: 8,
    budget: "3.500 €",
    progress: 35,
    status: "En selección",
  },
];

function BrandDashboard() {

  return (
    <div className="mx-auto max-w-[1500px]">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

        <div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
            Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-6xl">
            Buenos días.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/50">
            Aquí tienes una visión general de tus campañas y colaboraciones.
          </p>

        </div>

        <Link
          to="/platform/campaigns/new"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.02]"
        >
          + Nueva campaña
        </Link>

      </div>


      {/* STATS */}

      <div className="mt-12 grid overflow-hidden rounded-2xl border border-black/10 md:grid-cols-4">

        {stats.map((stat) => (

          <div
            key={stat.label}
            className="border-b border-black/10 p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          >

            <div className="text-4xl font-medium tracking-[-0.06em]">
              {stat.value}
            </div>

            <div className="mt-2 text-[9px] uppercase tracking-[0.15em] text-black/40">
              {stat.label}
            </div>

          </div>

        ))}

      </div>


      {/* CAMPAIGNS */}

      <section className="mt-16">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Actividad
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
              Tus campañas
            </h2>

          </div>

          <Link
            to="/platform/campaigns"
            className="text-[9px] uppercase tracking-[0.14em] underline underline-offset-4"
          >
            Ver todas
          </Link>

        </div>


        <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">

          {campaigns.map((campaign) => (

            <Link
              key={campaign.name}
              to="/platform/campaigns/1"
              className="block border-b border-black/10 p-6 last:border-b-0 transition-colors hover:bg-black/[0.025]"
            >

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="font-medium">
                    {campaign.name}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    {campaign.client} · {campaign.creators} creadores
                  </p>

                </div>


                <div className="w-full md:max-w-sm">

                  <div className="mb-2 flex items-center justify-between">

                    <span className="text-[9px] uppercase tracking-[0.12em] text-black/35">
                      Progreso
                    </span>

                    <span className="text-[10px] text-black/40">
                      {campaign.progress}%
                    </span>

                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-black/10">

                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${campaign.progress}%`,
                      }}
                    />

                  </div>

                </div>


                <div className="text-right">

                  <p className="text-sm font-medium">
                    {campaign.budget}
                  </p>

                  <span className="mt-1 inline-block rounded-full border border-black/10 px-3 py-1 text-[8px] uppercase tracking-[0.12em]">
                    {campaign.status}
                  </span>

                </div>

              </div>

            </Link>

          ))}

        </div>

      </section>


      {/* QUICK ACTIONS */}

      <section className="mt-16">

        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Acciones
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">

          <Link
            to="/platform/campaigns/new"
            className="rounded-2xl border border-black/10 p-7 transition-all hover:border-black/30 hover:bg-black/[0.02]"
          >

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              01
            </p>

            <h3 className="mt-8 text-xl font-medium tracking-[-0.04em]">
              Crear campaña
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-black/45">
              Define objetivos, presupuesto, redes y necesidades de tu
              próxima campaña.
            </p>

          </Link>


          <Link
            to="/platform/creators"
            className="rounded-2xl border border-black/10 p-7 transition-all hover:border-black/30 hover:bg-black/[0.02]"
          >

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              02
            </p>

            <h3 className="mt-8 text-xl font-medium tracking-[-0.04em]">
              Buscar creadores
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-black/45">
              Encuentra perfiles que encajen con tu audiencia y objetivos.
            </p>

          </Link>


          <Link
            to="/platform/results"
            className="rounded-2xl border border-black/10 p-7 transition-all hover:border-black/30 hover:bg-black/[0.02]"
          >

            <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
              03
            </p>

            <h3 className="mt-8 text-xl font-medium tracking-[-0.04em]">
              Ver resultados
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-black/45">
              Analiza el rendimiento de tus campañas y colaboraciones.
            </p>

          </Link>

        </div>

      </section>

    </div>
  );
}

export default BrandDashboard;