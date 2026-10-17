import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { api } from "../lib/api";



function formatCurrency(value) {

  return new Intl.NumberFormat("es-ES", {

    style: "currency",

    currency: "EUR",

  }).format(Number(value || 0));

}



function StatCard({ label, value, description, href }) {

  const content = (

    <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-6 shadow-[0_8px_28px_rgba(90,62,40,0.05)] transition hover:border-[#8A6340]/60">

      <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

        {label}

      </p>



      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">

        {value}

      </p>



      {description && (

        <p className="mt-2 text-xs text-[#6F6052]">

          {description}

        </p>

      )}

    </div>

  );



  if (href) {

    return <Link to={href}>{content}</Link>;

  }



  return content;

}



function AdminDashboard() {

  const [overview, setOverview] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  async function loadOverview() {

    try {

      setLoading(true);

      setError("");



      const data = await api.get("/api/admin/overview");



      setOverview(data);

    } catch (err) {

      console.error(err);

      setError(

        err?.data?.message ||

          err?.message ||

          "No se ha podido cargar el resumen."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    loadOverview();

  }, []);



  const finance = useMemo(() => {

    if (!overview) {

      return {

        pendingCreatorFees: 0,

        estimatedMargin: 0,

        marginPercentage: 0,

      };

    }



    const totalBudget = Number(overview.totalCampaignBudget || 0);

    const committedFees = Number(overview.committedCreatorFees || 0);

    const paidFees = Number(overview.paidCreatorFees || 0);



    const pendingCreatorFees = Math.max(committedFees - paidFees, 0);

    const estimatedMargin = totalBudget - committedFees;



    const marginPercentage =

      totalBudget > 0

        ? (estimatedMargin / totalBudget) * 100

        : 0;



    return {

      pendingCreatorFees,

      estimatedMargin,

      marginPercentage,

    };

  }, [overview]);



  if (loading) {

    return (

      <div className="space-y-8">

        <div>

          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

          ST.MARY AGENCY 

          </p>



          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">

            Resumen

          </h1>

        </div>



        <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-8">

          <p className="text-sm text-[#6F6052]">

            Cargando información del backoffice...

          </p>

        </div>

      </div>

    );

  }



  if (error) {

    return (

      <div className="space-y-8">

        <div>

          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

            ST.MARY AGENCY 

          </p>



          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">

            Resumen

          </h1>

        </div>



        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <p className="text-sm font-medium text-red-900">

            No se ha podido cargar el resumen.

          </p>



          <p className="mt-2 text-sm text-red-700">

            {error}

          </p>



          <button

            onClick={loadOverview}

            className="mt-5 rounded-xl bg-[#8A6340] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white"

          >

            Reintentar

          </button>

        </div>

      </div>

    );

  }



  return (

    <div className="space-y-10 text-[#3E2B1B]">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

        <div>

          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

            ST.MARY AGENCY 

          </p>



          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">

            Resumen

          </h1>



          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6F6052]">

            Vista general de clientes, creadores, campañas y actividad

            operativa de ST.MARY AGENCY.

          </p>

        </div>



        <button

          onClick={loadOverview}

          className="w-fit rounded-xl border border-[#D8C3A5]/70 bg-white px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#6F6052] transition hover:border-[#8A6340]/60 hover:text-[#5A3E28]"

        >

          Actualizar datos

        </button>

      </div>



      {/* PRINCIPALES */}

      <section>

        <div className="mb-4">

          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

            Operativa

          </p>



          <h2 className="mt-1 text-lg font-medium">

            Actividad de ST.MARY AGENCY.

          </h2>

        </div>



        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard

            label="Clientes"

            value={overview.totalBrands}

            description="Marcas registradas"

            href="/admin/brands"

          />



          <StatCard

            label="Creadores"

            value={overview.totalCreators}

            description="Perfiles registrados"

            href="/admin/creators"

          />



          <StatCard

            label="Campañas"

            value={overview.totalCampaigns}

            description={`${overview.activeCampaigns} actualmente activas`}

            href="/admin/campaigns"

          />



          <StatCard

            label="Colaboraciones"

            value={overview.totalCollaborations}

            description="Relaciones campaña-creador"

            href="/admin/campaigns"

          />

        </div>

      </section>



      {/* FINANZAS */}

      <section>

        <div className="mb-4">

          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

            Financiero

          </p>



          <h2 className="mt-1 text-lg font-medium">

            Economía de campañas

          </h2>

        </div>



        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard

            label="Presupuesto gestionado"

            value={formatCurrency(overview.totalCampaignBudget)}

            description="Presupuesto total de campañas"

            href="/admin/finance"

          />



          <StatCard

            label="Fees comprometidos"

            value={formatCurrency(overview.committedCreatorFees)}

            description="Importe destinado a creadores"

            href="/admin/finance"

          />



          <StatCard

            label="Pagado a creadores"

            value={formatCurrency(overview.paidCreatorFees)}

            description="Colaboraciones ya pagadas"

            href="/admin/finance"

          />



          <StatCard

            label="Pendiente de pago"

            value={formatCurrency(finance.pendingCreatorFees)}

            description="Fees comprometidos todavía pendientes"

            href="/admin/finance"

          />

        </div>

      </section>



      {/* MARGEN */}

      <section>

        <div className="grid gap-4 lg:grid-cols-3">

          <div className="rounded-2xl bg-[#8A6340] p-7 text-white lg:col-span-2">

            <p className="text-[9px] uppercase tracking-[0.16em] text-[#EBDCC4]">

              Margen estimado

            </p>



            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-4xl font-semibold tracking-[-0.05em]">

                  {formatCurrency(finance.estimatedMargin)}

                </p>



                <p className="mt-2 text-sm text-[#F4EDE2]/85">

                  Presupuesto de campañas menos fees comprometidos de

                  creadores.

                </p>

              </div>



              <div className="sm:text-right">

                <p className="text-2xl font-medium">

                  {finance.marginPercentage.toFixed(1)}%

                </p>



                <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#EBDCC4]">

                  Margen bruto estimado

                </p>

              </div>

            </div>

          </div>



          <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-7">

            <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

              Verificación

            </p>



            <p className="mt-5 text-4xl font-semibold tracking-[-0.05em]">

              {overview.pendingMetrics}

            </p>



            <p className="mt-2 text-sm text-[#6F6052]">

              métricas pendientes de revisión.

            </p>



            <Link

              to="/admin/metric-verification"

              className="mt-6 inline-flex rounded-xl bg-[#8A6340] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-white"

            >

              Revisar métricas

            </Link>

          </div>

        </div>

      </section>



      {/* ACCESOS */}

      <section>

        <div className="mb-4">

          <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

            Accesos rápidos

          </p>



          <h2 className="mt-1 text-lg font-medium">

            Gestión

          </h2>

        </div>



        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

          <Link

            to="/admin/brands"

            className="group rounded-2xl border border-[#D8C3A5]/70 bg-white p-5 transition hover:border-[#8A6340]/60"

          >

            <p className="text-sm font-medium">Clientes</p>



            <p className="mt-2 text-xs leading-5 text-[#6F6052]">

              Gestiona las marcas y consulta su actividad.

            </p>



            <span className="mt-5 block text-[9px] uppercase tracking-[0.14em] text-[#8A6340] group-hover:text-[#5A3E28]">

              Ver clientes →

            </span>

          </Link>



          <Link

            to="/admin/creators"

            className="group rounded-2xl border border-[#D8C3A5]/70 bg-white p-5 transition hover:border-[#8A6340]/60"

          >

            <p className="text-sm font-medium">Creadores</p>



            <p className="mt-2 text-xs leading-5 text-[#6F6052]">

              Consulta perfiles, métricas y colaboraciones.

            </p>



            <span className="mt-5 block text-[9px] uppercase tracking-[0.14em] text-[#8A6340] group-hover:text-[#5A3E28]">

              Ver creadores →

            </span>

          </Link>



          <Link

            to="/admin/campaigns"

            className="group rounded-2xl border border-[#D8C3A5]/70 bg-white p-5 transition hover:border-[#8A6340]/60"

          >

            <p className="text-sm font-medium">Campañas</p>



            <p className="mt-2 text-xs leading-5 text-[#6F6052]">

              Controla campañas, presupuestos y colaboraciones.

            </p>



            <span className="mt-5 block text-[9px] uppercase tracking-[0.14em] text-[#8A6340] group-hover:text-[#5A3E28]">

              Ver campañas →

            </span>

          </Link>



          <Link

            to="/admin/finance"

            className="group rounded-2xl border border-[#D8C3A5]/70 bg-white p-5 transition hover:border-[#8A6340]/60"

          >

            <p className="text-sm font-medium">Finanzas</p>



            <p className="mt-2 text-xs leading-5 text-[#6F6052]">

              Consulta presupuestos, fees y margen estimado.

            </p>



            <span className="mt-5 block text-[9px] uppercase tracking-[0.14em] text-[#8A6340] group-hover:text-[#5A3E28]">

              Ver finanzas →

            </span>

          </Link>

        </div>

      </section>

    </div>

  );

}



export default AdminDashboard;