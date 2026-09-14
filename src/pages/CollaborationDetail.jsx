import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../lib/api";

const collaborationStatuses = [
  "PENDING",
  "CONTACTED",
  "ACCEPTED",
  "SELECTED",
  "PRODUCT_SENT",
  "CONTENT_PENDING",
  "CONTENT_RECEIVED",
  "PUBLISHED",
  "PAID",
];

const statusLabels = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  ACCEPTED: "Aceptado",
  SELECTED: "Seleccionado",
  PRODUCT_SENT: "Producto enviado",
  CONTENT_PENDING: "Contenido pendiente",
  CONTENT_RECEIVED: "Contenido recibido",
  PUBLISHED: "Publicado",
  PAID: "Pagado",
};

const deliverableStatusLabels = {
  PENDING: "Pendiente",
  SUBMITTED: "Enviado",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

function formatDate(date) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function getStatusClass(status) {
  switch (status) {
    case "CONTACTED":
    case "ACCEPTED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "SELECTED":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "PRODUCT_SENT":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "CONTENT_PENDING":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "CONTENT_RECEIVED":
      return "bg-green-50 text-green-700 border-green-200";

    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PAID":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getDeliverableStatusClass(status) {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700 border-green-200";

    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "IN_REVIEW":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "PAID":
      return "€";

    case "PUBLISHED":
      return "✓";

    case "CONTENT_RECEIVED":
      return "●";

    case "CONTENT_PENDING":
      return "◷";

    case "PRODUCT_SENT":
      return "→";

    case "SELECTED":
      return "★";

    case "ACCEPTED":
      return "✓";

    case "CONTACTED":
      return "→";

    default:
      return "○";
  }
}

function getStatusIndex(status) {
  const index = collaborationStatuses.indexOf(status);

  return index >= 0 ? index : 0;
}

export default function CollaborationDetail() {
  const { campaignId, campaignCreatorId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [collaboration, setCollaboration] = useState(null);
  const [deliverables, setDeliverables] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);

  const [newDeliverable, setNewDeliverable] = useState({
    type: "",
    platform: "",
    quantity: 1,
    description: "",
    dueDate: "",
  });

  const [savingDeliverable, setSavingDeliverable] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [editingFee, setEditingFee] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  const [reviewingDeliverable, setReviewingDeliverable] =
  useState(null);

  const [reviewFeedback, setReviewFeedback] =
  useState("");

  const [savingReview, setSavingReview] =
  useState(false);

  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [savingDeliverableEdit, setSavingDeliverableEdit] =
    useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [campaignResponse, deliverablesResponse] =
          await Promise.all([
            apiFetch(`/api/campaigns/${campaignId}`),
            apiFetch(
              `/api/deliverables/collaboration/${campaignCreatorId}`
            ),
          ]);

        const campaignData = campaignResponse.campaign;

        const foundCollaboration =
          campaignData.creators?.find(
            (item) => item.id === campaignCreatorId
          );

        if (!foundCollaboration) {
          throw new Error(
            "No se ha encontrado esta colaboración."
          );
        }

        setCampaign(campaignData);
        setCollaboration(foundCollaboration);

        setFeeValue(
          foundCollaboration.fee !== null &&
            foundCollaboration.fee !== undefined
            ? String(foundCollaboration.fee)
            : ""
        );

        setDeliverables(
          deliverablesResponse.deliverables || []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No se ha podido cargar la colaboración."
        );
      } finally {
        setLoading(false);
      }
    }

    if (campaignId && campaignCreatorId) {
      loadData();
    }
  }, [campaignId, campaignCreatorId]);

  const creator = collaboration?.creator;

  const totalDeliverables = deliverables.length;

  const approvedDeliverables = useMemo(
    () =>
      deliverables.filter(
        (item) => item.status === "APPROVED"
      ).length,
    [deliverables]
  );

  const submittedDeliverables = useMemo(
    () =>
      deliverables.filter(
        (item) =>
          item.status === "SUBMITTED" ||
          item.status === "IN_REVIEW"
      ).length,
    [deliverables]
  );

  const rejectedDeliverables = useMemo(
    () =>
      deliverables.filter(
        (item) => item.status === "REJECTED"
      ).length,
    [deliverables]
  );

  const progressPercentage =
    totalDeliverables > 0
      ? Math.round(
          (approvedDeliverables / totalDeliverables) * 100
        )
      : 0;

  const currentStatusIndex = getStatusIndex(
    collaboration?.status
  );

  const creatorPayments = Number(
    collaboration?.fee || 0
  );

  const campaignBudget = Number(
    campaign?.budget || 0
  );

  const remainingBudget =
    campaignBudget - creatorPayments;

  async function updateCollaborationStatus(status) {
    try {
      setUpdatingStatus(true);
      setError("");

      const response = await apiFetch(
        `/api/campaigns/${campaignId}/creators/${campaignCreatorId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
          }),
        }
      );

      setCollaboration((current) => ({
        ...current,
        ...response.campaignCreator,
        creator:
          response.campaignCreator?.creator ||
          current?.creator,
      }));
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se ha podido actualizar el estado."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function saveFee() {
    try {
      setSavingFee(true);
      setError("");

      const normalizedFee = feeValue
        .replace(",", ".")
        .trim();

      if (
        normalizedFee &&
        !/^\d+(\.\d{1,2})?$/.test(normalizedFee)
      ) {
        throw new Error(
          "Introduce un fee válido, por ejemplo 150 o 150,50."
        );
      }

      const response = await apiFetch(
        `/api/campaigns/${campaignId}/creators/${campaignCreatorId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            fee: normalizedFee || null,
          }),
        }
      );

      setCollaboration((current) => ({
        ...current,
        ...response.campaignCreator,
        creator:
          response.campaignCreator?.creator ||
          current?.creator,
      }));

      setFeeValue(
        response.campaignCreator?.fee !== null &&
          response.campaignCreator?.fee !== undefined
          ? String(response.campaignCreator.fee)
          : ""
      );

      setEditingFee(false);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se ha podido actualizar el fee."
      );
    } finally {
      setSavingFee(false);
    }
  }

  async function createDeliverable(event) {
    event.preventDefault();

    try {
      setSavingDeliverable(true);
      setError("");

      const response = await apiFetch(
        `/api/deliverables/collaboration/${campaignCreatorId}`,
        {
          method: "POST",
          body: JSON.stringify({
            type: newDeliverable.type,
            platform: newDeliverable.platform,
            quantity: Number(newDeliverable.quantity),
            description:
              newDeliverable.description || undefined,
            dueDate:
              newDeliverable.dueDate || undefined,
          }),
        }
      );

      setDeliverables((current) => [
        ...current,
        response.deliverable,
      ]);

      setNewDeliverable({
        type: "",
        platform: "",
        quantity: 1,
        description: "",
        dueDate: "",
      });

      setShowAddForm(false);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se ha podido crear el entregable."
      );
    } finally {
      setSavingDeliverable(false);
    }
  }

  async function updateDeliverableStatus(
    deliverableId,
    status
  ) {
    try {
      setError("");

      const response = await apiFetch(
        `/api/deliverables/${deliverableId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
          }),
        }
      );

      setDeliverables((current) =>
        current.map((item) =>
          item.id === deliverableId
            ? response.deliverable
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se ha podido actualizar el entregable."
      );
    }
  }

  function startEditingDeliverable(deliverable) {
    setEditingDeliverable({
      id: deliverable.id,
      contentUrl: deliverable.contentUrl || "",
      notes: deliverable.notes || "",
    });
  }

  async function saveDeliverableEdit() {
    if (!editingDeliverable) return;

    try {
      setSavingDeliverableEdit(true);
      setError("");

      const response = await apiFetch(
        `/api/deliverables/${editingDeliverable.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentUrl:
              editingDeliverable.contentUrl.trim() ||
              undefined,
            notes:
              editingDeliverable.notes.trim() ||
              undefined,
          }),
        }
      );

      setDeliverables((current) =>
        current.map((item) =>
          item.id === response.deliverable.id
            ? response.deliverable
            : item
        )
      );

      setEditingDeliverable(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No se ha podido guardar la información."
      );
    } finally {
      setSavingDeliverableEdit(false);
    }
  }
  async function submitDeliverableReview(status) {
  if (!reviewingDeliverable) return;

  try {
    setSavingReview(true);
    setError("");

    if (
      status === "REJECTED" &&
      !reviewFeedback.trim()
    ) {
      throw new Error(
        "Indica qué cambios debe realizar el creador."
      );
    }

    const response = await apiFetch(
      `/api/deliverables/${reviewingDeliverable.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          feedback:
            reviewFeedback.trim() || undefined,
        }),
      }
    );

    setDeliverables((current) =>
      current.map((item) =>
        item.id === response.deliverable.id
          ? response.deliverable
          : item
      )
    );

    setReviewingDeliverable(null);
    setReviewFeedback("");
  } catch (err) {
    console.error(err);

    setError(
      err.message ||
        "No se ha podido revisar el entregable."
    );
  } finally {
    setSavingReview(false);
  }
}


  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">
          Cargando colaboración...
        </p>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-gray-500 hover:text-black"
        >
          ← Volver
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-8">
        <Link
          to={`/platform/campaigns/${campaignId}`}
          className="text-sm text-gray-500 transition hover:text-black"
        >
          ← Volver a la campaña
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Gestión de colaboración
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              {creator?.username ||
                creator?.user?.name ||
                "Creador"}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {campaign?.name}
              {creator?.platforms?.length > 0 &&
                ` · ${creator.platforms.join(" · ")}`}
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusClass(
              collaboration?.status
            )}`}
          >
            {statusLabels[collaboration?.status] ||
              collaboration?.status}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* WORKFLOW VISUAL */}

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Workflow
            </p>

            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              Seguimiento de la colaboración
            </h2>
          </div>

          {updatingStatus && (
            <span className="text-xs text-gray-400">
              Guardando estado...
            </span>
          )}
        </div>

        <div className="mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-[900px] items-start">
            {collaborationStatuses.map(
              (status, index) => {
                const completed =
                  index < currentStatusIndex;

                const current =
                  index === currentStatusIndex;

                return (
                  <div
                    key={status}
                    className="flex flex-1 items-start"
                  >
                    <div className="flex flex-1 flex-col items-center">
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() =>
                          updateCollaborationStatus(
                            status
                          )
                        }
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          current
                            ? "border-black bg-black text-white"
                            : completed
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-400 hover:border-gray-400 hover:text-gray-700"
                        }`}
                      >
                        {completed
                          ? "✓"
                          : getStatusIcon(status)}
                      </button>

                      <p
                        className={`mt-3 max-w-[100px] text-center text-xs leading-4 ${
                          current
                            ? "font-semibold text-gray-900"
                            : completed
                            ? "font-medium text-gray-700"
                            : "text-gray-400"
                        }`}
                      >
                        {statusLabels[status]}
                      </p>
                    </div>

                    {index <
                      collaborationStatuses.length -
                        1 && (
                      <div
                        className={`mt-5 h-px flex-1 ${
                          index <
                          currentStatusIndex
                            ? "bg-black"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-400">
              Estado actual
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {statusLabels[
                collaboration?.status
              ] || "Pendiente"}
            </p>
          </div>

          <select
            value={
              collaboration?.status || "PENDING"
            }
            onChange={(event) =>
              updateCollaborationStatus(
                event.target.value
              )
            }
            disabled={updatingStatus}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-400"
          >
            {collaborationStatuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* CREATOR */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Creador
                </p>

                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  @{creator?.username || "creador"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {creator?.bio ||
                    "Sin descripción disponible."}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-400">
                  Fee del creador
                </p>

                {!editingFee ? (
                  <>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {formatCurrency(
                        collaboration?.fee
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setFeeValue(
                          collaboration?.fee !==
                            null &&
                            collaboration?.fee !==
                              undefined
                            ? String(
                                collaboration.fee
                              )
                            : ""
                        );

                        setEditingFee(true);
                      }}
                      className="mt-2 text-xs font-medium text-gray-500 hover:text-black"
                    >
                      Editar fee
                    </button>
                  </>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={feeValue}
                      onChange={(event) =>
                        setFeeValue(
                          event.target.value
                        )
                      }
                      placeholder="150"
                      className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />

                    <button
                      type="button"
                      onClick={saveFee}
                      disabled={savingFee}
                      className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {savingFee
                        ? "..."
                        : "Guardar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingFee(false)
                      }
                      className="text-xs text-gray-500 hover:text-black"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">
                  Seguidores
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {Number(
                    creator?.followers || 0
                  ).toLocaleString("es-ES")}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">
                  Engagement
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {creator?.engagementRate || 0}%
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-400">
                  Ubicación
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {creator?.location || "—"}
                </p>
              </div>
            </div>

            {creator?.categories?.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-gray-400">
                  Categorías
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {creator.categories.map(
                    (category) => (
                      <span
                        key={category}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {category}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {creator?.platforms?.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-gray-400">
                  Plataformas
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {creator.platforms.map(
                    (platform) => (
                      <span
                        key={platform}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {platform}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* DATES */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Historial
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Seguimiento de fechas
              </h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Contactado
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.contactedAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Aceptado
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.acceptedAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Seleccionado
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.selectedAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Producto enviado
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.productSentAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Contenido recibido
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.contentReceivedAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Publicado
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.publishedAt
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400">
                  Pagado
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    collaboration?.paidAt
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* DELIVERABLES */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Contenido
                </p>

                <h2 className="mt-2 text-xl font-semibold text-gray-900">
                  Entregables
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {approvedDeliverables} de{" "}
                  {totalDeliverables} aprobados
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddForm(
                    (current) => !current
                  )
                }
                className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                + Añadir entregable
              </button>
            </div>

            {/* STATS */}

            {totalDeliverables > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {totalDeliverables}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    En revisión
                  </p>

                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {submittedDeliverables}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">
                    Rechazados
                  </p>

                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {rejectedDeliverables}
                  </p>
                </div>
              </div>
            )}

            {/* PROGRESS */}

            {totalDeliverables > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Progreso de contenido
                  </span>

                  <span className="font-medium text-gray-900">
                    {progressPercentage}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>

                {submittedDeliverables > 0 && (
                  <p className="mt-2 text-xs text-gray-400">
                    {submittedDeliverables} entregable(s)
                    pendiente(s) de revisión.
                  </p>
                )}
              </div>
            )}

            {/* ADD FORM */}

            {showAddForm && (
              <form
                onSubmit={createDeliverable}
                className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-900">
                    Nuevo entregable
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Define exactamente qué contenido
                    debe entregar el creador.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tipo
                    </label>

                    <select
                      value={newDeliverable.type}
                      onChange={(event) =>
                        setNewDeliverable(
                          (current) => ({
                            ...current,
                            type: event.target.value,
                          })
                        )
                      }
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">
                        Seleccionar
                      </option>

                      <option value="Reel">
                        Reel
                      </option>

                      <option value="Story">
                        Story
                      </option>

                      <option value="Post">
                        Post
                      </option>

                      <option value="TikTok">
                        TikTok
                      </option>

                      <option value="YouTube">
                        YouTube
                      </option>

                      <option value="Short">
                        Short
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Plataforma
                    </label>

                    <select
                      value={
                        newDeliverable.platform
                      }
                      onChange={(event) =>
                        setNewDeliverable(
                          (current) => ({
                            ...current,
                            platform:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">
                        Seleccionar
                      </option>

                      <option value="Instagram">
                        Instagram
                      </option>

                      <option value="TikTok">
                        TikTok
                      </option>

                      <option value="YouTube">
                        YouTube
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Cantidad
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        newDeliverable.quantity
                      }
                      onChange={(event) =>
                        setNewDeliverable(
                          (current) => ({
                            ...current,
                            quantity:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Fecha límite
                    </label>

                    <input
                      type="date"
                      value={
                        newDeliverable.dueDate
                      }
                      onChange={(event) =>
                        setNewDeliverable(
                          (current) => ({
                            ...current,
                            dueDate:
                              event.target.value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Descripción
                  </label>

                  <textarea
                    value={
                      newDeliverable.description
                    }
                    onChange={(event) =>
                      setNewDeliverable(
                        (current) => ({
                          ...current,
                          description:
                            event.target.value,
                        })
                      )
                    }
                    rows={3}
                    placeholder="Describe qué debe entregar el creador..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddForm(false)
                    }
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={savingDeliverable}
                    className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingDeliverable
                      ? "Guardando..."
                      : "Crear entregable"}
                  </button>
                </div>
              </form>
            )}

            {/* DELIVERABLE LIST */}

            <div className="mt-6 space-y-3">
              {deliverables.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Todavía no hay entregables
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Añade el contenido que debe
                    crear este creador.
                  </p>
                </div>
              ) : (
                deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {deliverable.quantity}x{" "}
                            {deliverable.type}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getDeliverableStatusClass(
                              deliverable.status
                            )}`}
                          >
                            {deliverableStatusLabels[
                              deliverable.status
                            ] ||
                              deliverable.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {deliverable.platform ||
                            "Sin plataforma"}
                        </p>

                        {deliverable.description && (
                          <p className="mt-3 text-sm leading-6 text-gray-600">
                            {deliverable.description}
                          </p>
                        )}

                        {deliverable.contentUrl && (
                          <a
                            href={
                              deliverable.contentUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex max-w-full items-center gap-2 truncate text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Ver contenido →
                          </a>
                        )}

                        {deliverable.notes && (
                          <div className="mt-3 rounded-xl bg-gray-50 p-3">
                            <p className="text-xs font-medium text-gray-400">
                              Notas
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              {deliverable.notes}
                            </p>
                          </div>
                        )}

                        {editingDeliverable?.id ===
                        deliverable.id ? (
                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                              <label className="mb-2 block text-xs font-medium text-gray-600">
                                URL del contenido
                              </label>

                              <input
                                type="url"
                                value={
                                  editingDeliverable.contentUrl
                                }
                                onChange={(event) =>
                                  setEditingDeliverable(
                                    (current) => ({
                                      ...current,
                                      contentUrl:
                                        event.target
                                          .value,
                                    })
                                  )
                                }
                                placeholder="https://..."
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                            </div>

                            <div className="mt-3">
                              <label className="mb-2 block text-xs font-medium text-gray-600">
                                Notas
                              </label>

                              <textarea
                                value={
                                  editingDeliverable.notes
                                }
                                onChange={(event) =>
                                  setEditingDeliverable(
                                    (current) => ({
                                      ...current,
                                      notes:
                                        event.target
                                          .value,
                                    })
                                  )
                                }
                                rows={3}
                                placeholder="Notas internas sobre el contenido..."
                                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                            </div>

                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingDeliverable(
                                    null
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium"
                              >
                                Cancelar
                              </button>

                              <button
                                type="button"
                                onClick={
                                  saveDeliverableEdit
                                }
                                disabled={
                                  savingDeliverableEdit
                                }
                                className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                              >
                                {savingDeliverableEdit
                                  ? "Guardando..."
                                  : "Guardar"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              startEditingDeliverable(
                                deliverable
                              )
                            }
                            className="mt-4 text-xs font-medium text-gray-500 hover:text-black"
                          >
                            Editar contenido / notas
                          </button>
                        )}
                      </div>

                      <div className="w-full lg:w-52">
                        <p className="text-xs text-gray-400">
                          Fecha límite
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {formatDate(
                            deliverable.dueDate
                          )}
                        </p>

                        <select
                          value={deliverable.status}
                          onChange={(event) => {
                         const nextStatus = event.target.value;

                          if (
                            nextStatus === "REJECTED" ||
                            nextStatus === "APPROVED"
                          ) {
                            setReviewingDeliverable(deliverable);
                            setReviewFeedback("");
                            return;
                          }

                          updateDeliverableStatus(
                            deliverable.id,
                            nextStatus
                            );
                          }}
                          className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
                        >
                          {Object.entries(
                          deliverableStatusLabels
                            ).map(([value, label]) => (
                          <option
                          key={value}
                          value={value}
                          >
                          {label}
                          </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}

        <aside className="h-fit space-y-6">
          {/* COLLABORATION SUMMARY */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Resumen
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-gray-400">
                  Campaña
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {campaign?.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Creador
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  @{creator?.username || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Fee del creador
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(
                    collaboration?.fee
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Estado
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                    collaboration?.status
                  )}`}
                >
                  {statusLabels[
                    collaboration?.status
                  ] ||
                    collaboration?.status ||
                    "Pendiente"}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Entregables
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {approvedDeliverables} /{" "}
                  {totalDeliverables} aprobados
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Progreso
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {progressPercentage}%
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-400">
                  Pago al creador
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {collaboration?.status ===
                  "PAID"
                    ? "Pagado"
                    : "Pendiente"}
                </p>

                {collaboration?.paidAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(
                      collaboration.paidAt
                    )}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* CAMPAIGN ECONOMICS */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Economía
            </p>

            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              Impacto en la campaña
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Presupuesto
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(campaignBudget)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Este creador
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(creatorPayments)}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    Disponible
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      remainingBudget < 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatCurrency(
                      remainingBudget
                    )}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-gray-400">
              El importe disponible es presupuesto
              restante de la campaña. No representa
              beneficio neto de ST.MARIA.
            </p>
          </section>

          {/* QUICK ACTION */}

          <section className="rounded-2xl border border-gray-200 bg-gray-900 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Acción rápida
            </p>

            <h2 className="mt-2 text-lg font-semibold">
              Actualizar colaboración
            </h2>

            <p className="mt-2 text-sm leading-5 text-gray-400">
              Cambia el estado de la colaboración
              conforme avance la campaña.
            </p>

            <select
              value={
                collaboration?.status || "PENDING"
              }
              onChange={(event) =>
                updateCollaborationStatus(
                  event.target.value
                )
              }
              disabled={updatingStatus}
              className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none"
            >
              {collaborationStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusLabels[status]}
                  </option>
                )
              )}
            </select>
          </section>
        </aside>
      </div>
      {reviewingDeliverable && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Revisión de contenido
          </p>

          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            {reviewingDeliverable.quantity}x{" "}
            {reviewingDeliverable.type}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {reviewingDeliverable.platform ||
              "Sin plataforma"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setReviewingDeliverable(null);
            setReviewFeedback("");
          }}
          className="text-gray-400 hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Feedback para el creador
        </label>

        <textarea
          value={reviewFeedback}
          onChange={(event) =>
            setReviewFeedback(event.target.value)
          }
          rows={5}
          placeholder="Indica qué está bien y qué cambios necesita el contenido..."
          className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
        />

        <p className="mt-2 text-xs text-gray-400">
          Este comentario quedará registrado en el
          historial de revisiones.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setReviewingDeliverable(null);
            setReviewFeedback("");
          }}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium"
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={savingReview}
          onClick={() =>
            submitDeliverableReview("REJECTED")
          }
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-50"
        >
          {savingReview
            ? "Guardando..."
            : "Solicitar cambios"}
        </button>

        <button
          type="button"
          disabled={savingReview}
          onClick={() =>
            submitDeliverableReview("APPROVED")
          }
          className="rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Aprobar contenido
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}