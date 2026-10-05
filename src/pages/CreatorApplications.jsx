import { useEffect, useState } from "react";
import { api } from "../lib/api";

const STATUS_CONFIG = {
  APPLIED: {
    label: "En revisión",
    description:
      "ST.MARY AGENCY está revisando tu candidatura.",
  },

  SHORTLISTED: {
    label: "Preseleccionado",
    description:
      "Tu perfil ha sido preseleccionado para esta campaña.",
  },

  NOT_SELECTED: {
    label: "No seleccionado",
    description:
      "Tu perfil no ha sido seleccionado para esta campaña.",
  },

  SELECTED: {
    label: "Seleccionado",
    description:
      "Has sido seleccionado para participar en esta campaña.",
  },

  WITHDRAWN: {
    label: "Retirada",
    description:
      "Has retirado tu candidatura.",
  },
};

function CreatorApplications() {
  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        "/api/creator-portal/campaign-applications"
      );

      setApplications(
        data.applications || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se han podido cargar tus candidaturas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando candidaturas...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Creator
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          Mis candidaturas
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/45">
          Consulta las campañas en las que has
          mostrado interés y el estado de cada
          candidatura.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EMPTY */}

      {!error &&
        applications.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium">
              Todavía no tienes candidaturas.
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/40">
              Cuando muestres interés en una
              campaña aparecerá aquí.
            </p>
          </div>
        )}

      {/* APPLICATIONS */}

      {applications.length > 0 && (
        <div className="space-y-5">
          {applications.map(
            (application) => {
              const campaign =
                application.campaign;

              const status =
                STATUS_CONFIG[
                  application.status
                ] || {
                  label:
                    application.status,
                  description: "",
                };

              return (
                <div
                  key={application.id}
                  className="rounded-2xl border border-black/10 bg-white p-6"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

                    {/* CAMPAIGN */}

                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                        {campaign?.brand
                          ?.companyName ||
                          "Marca"}
                      </p>

                      <h2 className="mt-2 text-lg font-medium tracking-[-0.03em]">
                        {campaign?.name ||
                          "Campaña"}
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/40">

                        {campaign?.platform && (
                          <span>
                            {
                              campaign.platform
                            }
                          </span>
                        )}

                        {application.appliedAt && (
                          <span>
                            Enviada el{" "}
                            {new Date(
                              application.appliedAt
                            ).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        )}

                      </div>
                    </div>

                    {/* STATUS */}

                    <div className="lg:max-w-xs lg:text-right">
                      <span className="inline-flex rounded-full bg-black px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-white">
                        {status.label}
                      </span>

                      {status.description && (
                        <p className="mt-3 text-xs leading-5 text-black/40">
                          {
                            status.description
                          }
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

export default CreatorApplications;