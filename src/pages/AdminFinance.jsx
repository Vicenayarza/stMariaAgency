import { useEffect, useMemo, useState } from "react";
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
  };

  return labels[status] || status;
}

function AdminFinance() {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFinance();
  }, []);

  async function loadFinance() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get("/api/admin/finance");

      setFinance(data.finance);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar los datos financieros."
      );
    } finally {
      setLoading(false);
    }
  }

  const campaignData = useMemo(() => {
    if (!finance?.campaigns) return [];

    return finance.campaigns.map((campaign) => {
      const campaignCollaborations =
        finance.collaborations?.filter(
          (collaboration) =>
            collaboration.campaignId === campaign.id
        ) || [];

      const totalFees = campaignCollaborations.reduce(
        (total, collaboration) =>
          total + Number(collaboration.fee || 0),
        0
      );

      const paidFees = campaignCollaborations
        .filter(
          (collaboration) =>
            collaboration.status === "PAID"
        )
        .reduce(
          (total, collaboration) =>
            total + Number(collaboration.fee || 0),
          0
        );

      return {
        ...campaign,
        totalFees,
        paidFees,
        pendingFees: totalFees - paidFees,
        margin: Number(campaign.budget || 0) - totalFees,
      };
    });
  }, [finance]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[#6F6052]">
          Cargando información financiera...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A6340]">
          Administración
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          Finanzas
        </h1>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A6340]">
          Administración
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          Finanzas
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6F6052]">
          Control operativo de presupuestos, fees de creadores y
          margen estimado de las campañas gestionadas por
          ST.MARY AGENCY.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">
            Presupuesto gestionado
          </p>

          <p className="mt-3 text-2xl font-medium text-[#3E2B1B]">
            {formatCurrency(finance?.totalCampaignBudget)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">
            Fees de creadores
          </p>

          <p className="mt-3 text-2xl font-medium text-[#3E2B1B]">
            {formatCurrency(finance?.totalCreatorFees)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">
            Pagado
          </p>

          <p className="mt-3 text-2xl font-medium text-[#3E2B1B]">
            {formatCurrency(finance?.paidCreatorFees)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D8C3A5]/70 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">
            Pendiente
          </p>

          <p className="mt-3 text-2xl font-medium text-[#3E2B1B]">
            {formatCurrency(finance?.pendingCreatorFees)}
          </p>
        </div>

       <div className="rounded-2xl border border-[#D8C3A5]/70 bg-[#5A3E28] p-5 text-white">

          <p className="text-[9px] uppercase tracking-[0.15em] text-[#EBDCC4]">

            Margen bruto estimado
          </p>

          <p className="mt-3 text-2xl font-medium text-[#3E2B1B]">
            {formatCurrency(finance?.estimatedGrossMargin)}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#D8C3A5]/70 bg-white">

        <div className="flex flex-col justify-between gap-3 border-b border-[#D8C3A5]/70 px-6 py-5 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8A6340]">
              Rentabilidad por campaña
            </p>

            <p className="mt-1 text-xs text-[#8A6340]">
              Vista operativa. No representa todavía contabilidad
              fiscal.
            </p>
          </div>

          <span className="rounded-full bg-[#EBDCC4] px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-[#6F6052]">
            {campaignData.length} campañas
          </span>
        </div>

        {campaignData.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-[#6F6052]">
              Todavía no hay campañas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-[#F4EDE2]/70">
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
                    Fees
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">
                    Pagado
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">
                    Pendiente
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">
                    Margen
                  </th>

                  <th className="px-6 py-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340]">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaignData.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-[#D8C3A5]/50 transition-colors hover:bg-[#F4EDE2]/45 last:border-b-0"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-medium">
                        {campaign.name}
                      </p>

                      <p className="mt-1 text-xs text-[#8A6340]">
                        {getStatusLabel(campaign.status)} ·{" "}
                        {formatDate(campaign.createdAt)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm text-[#6F6052]">
                        {campaign.brand?.companyName || "—"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span className="text-sm">
                        {formatCurrency(campaign.budget)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span className="text-sm">
                        {formatCurrency(campaign.totalFees)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span className="text-sm">
                        {formatCurrency(campaign.paidFees)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span className="text-sm">
                        {formatCurrency(campaign.pendingFees)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-medium">
                        {formatCurrency(campaign.margin)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/admin/campaigns/${campaign.id}`}
                       className="inline-flex rounded-xl border border-[#D8C3A5]/70 px-4 py-2 text-[10px] uppercase tracking-[0.12em] text-[#5A3E28] transition-colors hover:border-[#8A6340] hover:bg-[#8A6340] hover:text-white"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

     <div className="mt-6 rounded-2xl border border-[#D8C3A5]/70 bg-[#EBDCC4]/40 px-6 py-5">

        <p className="text-[9px] uppercase tracking-[0.15em] text-[#8A6340]">
          Importante
        </p>

        <p className="mt-2 max-w-4xl text-xs leading-6 text-[#6F6052]">
          Estos datos representan el control financiero operativo
          interno de ST.MARY AGENCY . El sistema de facturación, cobros de
          clientes, pagos a creadores, Stripe, impuestos y
          conciliación bancaria se incorporarán posteriormente.
        </p>
      </div>
    </div>
  );
}

export default AdminFinance;