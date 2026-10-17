import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { api } from "../lib/api";



function formatCurrency(value) {

  return Number(value || 0).toLocaleString("es-ES", {

    style: "currency",

    currency: "EUR",

  });

}



function formatDate(value) {

  if (!value) return "—";



  return new Date(value).toLocaleDateString("es-ES", {

    day: "2-digit",

    month: "2-digit",

    year: "numeric",

  });

}



function getStatusLabel(status) {

  const labels = {

    DRAFT: "Borrador",

    ACTIVE: "Activa",

    PAUSED: "Pausada",

    COMPLETED: "Completada",

    CANCELLED: "Cancelada",
    ARCHIVED: "Archivada",
    DELETED: "Eliminada",

  };



  return labels[status] || status;

}



function getStatusClass(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-[#8A6340] text-white";
    case "COMPLETED":
      return "bg-[#EBDCC4] text-[#5A3E28]";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "ARCHIVED":
      return "bg-[#D8C3A5]/60 text-[#5A3E28]";
    case "DELETED":
      return "bg-red-100 text-red-800";
    case "PAUSED":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-[#F4EDE2] text-[#6F6052]";
  }
}

function AdminCampaigns() {

  const [campaigns, setCampaigns] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  useEffect(() => {

    loadCampaigns();

  }, []);



  async function loadCampaigns() {

    try {

      setLoading(true);

      setError("");



      const data = await api.get("/api/admin/campaigns");



      setCampaigns(data.campaigns || []);

    } catch (err) {

      console.error(err);



      setError(

        err?.data?.message ||

          err?.message ||

          "No se han podido cargar las campañas."

      );

    } finally {

      setLoading(false);

    }

  }



  const totalBudget = campaigns.reduce(

    (total, campaign) => total + Number(campaign.budget || 0),

    0

  );



  const activeCampaigns = campaigns.filter(

    (campaign) => campaign.status === "ACTIVE"

  ).length;



  return (

    <div>

      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">

        <div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A6340]">

            Administración

          </p>



          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-[#3E2B1B]">

            Campañas

          </h1>



          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6F6052]">

            Vista global de todas las campañas gestionadas por

            ST.MARY AGENCY.

          </p>

        </div>



        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white px-5 py-4">

            <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

              Campañas

            </p>



            <p className="mt-1 text-2xl font-medium">

              {loading ? "—" : campaigns.length}

            </p>

          </div>



          <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white px-5 py-4">

            <p className="text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">

              Presupuesto

            </p>



            <p className="mt-1 text-lg font-medium text-[#3E2B1B]">

              {loading ? "—" : formatCurrency(totalBudget)}

            </p>

          </div>

        </div>

      </div>



      {error && (

        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

          {error}

        </div>

      )}



      {!loading && campaigns.length > 0 && (

        <div className="mb-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">

            <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">

              Activas

            </p>



            <p className="mt-2 text-2xl font-medium text-[#3E2B1B]">

              {activeCampaigns}

            </p>

          </div>



          <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">

            <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">

              Presupuesto medio

            </p>



            <p className="mt-2 text-2xl font-medium text-[#3E2B1B]">

              {formatCurrency(

                campaigns.length

                  ? totalBudget / campaigns.length

                  : 0

              )}

            </p>

          </div>



          <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">

            <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">

              Clientes implicados

            </p>



            <p className="mt-2 text-2xl font-medium text-[#3E2B1B]">

              {

                new Set(

                  campaigns.map((campaign) => campaign.brand?.id).filter(Boolean)

                ).size

              }

            </p>

          </div>

        </div>

      )}



      <div className="overflow-hidden rounded-2xl border border-[#D8C3A5]/70 bg-white">

        <div className="border-b border-[#D8C3A5]/70 px-6 py-5">

          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8A6340]">

            Todas las campañas

          </p>

        </div>



        {loading ? (

          <div className="px-6 py-16 text-center">

            <p className="text-sm text-[#6F6052]">

              Cargando campañas...

            </p>

          </div>

        ) : campaigns.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <p className="text-sm font-medium text-[#3E2B1B]">

              Todavía no hay campañas.

            </p>



            <p className="mt-2 text-sm text-[#6F6052]">

              Las campañas creadas por los clientes aparecerán aquí.

            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>

                <tr className="border-b border-[#D8C3A5]/70 text-left">

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Campaña

                  </th>



                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Cliente

                  </th>



                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Presupuesto

                  </th>



                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Creadores

                  </th>



                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Estado

                  </th>



                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Creada

                  </th>



                  <th className="px-6 py-4 text-right text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">

                    Acción

                  </th>

                </tr>

              </thead>



              <tbody>

                {campaigns.map((campaign) => (

                  <tr

                    key={campaign.id}

                    className="border-b border-[#D8C3A5]/50 transition-colors hover:bg-[#F4EDE2]/45 last:border-b-0"

                  >

                    <td className="px-6 py-5">

                      <div>

                        <p className="text-sm font-medium text-[#3E2B1B]">

                          {campaign.name}

                        </p>



                        <p className="mt-1 text-xs text-[#8A6340]">

                          {campaign.category || "Sin categoría"}

                          {campaign.platform

                            ? ` · ${campaign.platform}`

                            : ""}

                        </p>

                      </div>

                    </td>



                    <td className="px-6 py-5">

                      <p className="text-sm text-[#3E2B1B]">

                        {campaign.brand?.companyName || "—"}

                      </p>



                      <p className="mt-1 text-xs text-[#8A6340]">

                        {campaign.brand?.user?.email || ""}

                      </p>

                    </td>



                    <td className="px-6 py-5">

                      <span className="text-sm font-medium text-[#3E2B1B]">

                        {formatCurrency(campaign.budget)}

                      </span>

                    </td>



                    <td className="px-6 py-5">

                      <span className="text-sm font-medium text-[#3E2B1B]">

                        {campaign._count?.creators ?? 0}

                      </span>

                    </td>



                    <td className="px-6 py-5">

                      <span

                        className={`inline-flex rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.1em] ${getStatusClass(

                          campaign.status

                        )}`}

                      >

                        {getStatusLabel(campaign.status)}

                      </span>

                    </td>



                    <td className="px-6 py-5">

                      <span className="text-sm text-[#6F6052]">

                        {formatDate(campaign.createdAt)}

                      </span>

                    </td>



                    <td className="px-6 py-5 text-right">

                      <Link

                        to={`/admin/campaigns/${campaign.id}`}

                        className="inline-flex rounded-xl border border-[#8A6340]/35 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8A6340] transition-colors hover:bg-[#8A6340] hover:text-white"

                      >

                        Ver campaña

                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  );

}



export default AdminCampaigns;