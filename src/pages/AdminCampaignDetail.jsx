import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

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

    PENDING: "Pendiente",

    PROPOSED: "Propuesto al cliente",

    APPROVED: "Aprobado por cliente",

    REJECTED: "Rechazado por cliente",

    CONTACTED: "Contactado",

    ACCEPTED: "Aceptado",

    SELECTED: "Seleccionado",

    PRODUCT_SENT: "Producto enviado",

    CONTENT_PENDING: "Contenido pendiente",

    CONTENT_RECEIVED: "Contenido recibido",

    PUBLISHED: "Publicado",

    PAID: "Pagado",

  };



  return labels[status] || status;

}



function getCampaignStatusLabel(status) {

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



function getRiskLabel(level) {

  const labels = {

    LOW: "Bajo",

    MEDIUM: "Medio",

    HIGH: "Alto",

  };



  return labels[level] || level || "—";

}



function getRiskClasses(level) {

  if (level === "LOW") {

    return "bg-black/5 text-black/55";

  }



  if (level === "MEDIUM") {

    return "bg-black/10 text-black/65";

  }



  if (level === "HIGH") {

    return "bg-black text-white";

  }



  return "bg-black/5 text-black/45";

}



function getRankingLabel(index) {

  if (index === 0) return "01";

  if (index === 1) return "02";

  if (index === 2) return "03";



  return String(index + 1).padStart(2, "0");

}



function AdminCampaignDetail() {

  const { id } = useParams();



  const [campaign, setCampaign] = useState(null);

  const [

  contactingMatchId,

  setContactingMatchId,

] = useState(null);

const [

  invitingMatchId,

  setInvitingMatchId,

] = useState(null);

  const [proposingMatchId, setProposingMatchId] = useState(null);

  const [proposals, setProposals] = useState([]);

  const [matches, setMatches] = useState([]);

  const [matchesLoading, setMatchesLoading] = useState(true);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationActionId, setApplicationActionId] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  

  const [matchesError, setMatchesError] = useState("");

  const [discoveredCreators, setDiscoveredCreators] = useState([]);

  const [discoveryLoading, setDiscoveryLoading] = useState(false);

  const [discoveryError, setDiscoveryError] = useState("");

  const [discoveryExecuted, setDiscoveryExecuted] = useState(false);

  const [discoveryProvider, setDiscoveryProvider] = useState(null);

  const [selectedCreator, setSelectedCreator] = useState(null);

  const [creatorFee, setCreatorFee] = useState("");

  const [selectionError, setSelectionError] = useState("");

  const [selectionLoading, setSelectionLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [verifyingDeliverableId, setVerifyingDeliverableId] =
  useState(null);
const [archivingCampaign, setArchivingCampaign] = useState(false);
const [changingCampaignStatus, setChangingCampaignStatus] = useState(false);
const [deletingCampaign, setDeletingCampaign] = useState(false);
const [campaignActionError, setCampaignActionError] = useState("");
const [publicationError, setPublicationError] =
  useState("");

  const [updatingCollaborationId, setUpdatingCollaborationId] =

  useState(null);



  useEffect(() => {

    loadCampaign();

  }, [id]);



  
async function loadCampaign(silent = false) {
  try {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    const data = await api.get(
      `/api/admin/campaigns/${id}`
    );

    setCampaign(data.campaign);
  } catch (err) {
    console.error("Error cargando campaña:", err);

    setError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido cargar la campaña."
    );
  } finally {
    if (!silent) {
      setLoading(false);
    }
  }
}




  useEffect(() => {

    loadMatches();
    loadApplications();

  }, [id]);



  async function loadMatches() {

    try {

      setMatchesLoading(true);

      setMatchesError("");



      const data = await api.get(

        `/api/campaigns/${id}/matches`

      );



      setMatches(data.matches || []);
      setProposals(data.proposals || []);

    } catch (err) {

      console.error(err);



      setMatchesError(

        err?.data?.message ||

          err?.message ||

          "No se han podido calcular los creadores recomendados."

      );

    } finally {

      setMatchesLoading(false);

    }

  }

async function loadApplications() {
  try {
    setApplicationsLoading(true);

    const data = await api.get(
      `/api/campaigns/${id}/applications`
    );

    setApplications(data.applications || []);
  } catch (err) {
    console.error(
      "Error loading campaign applications:",
      err
    );

    setError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se han podido cargar las candidaturas."
    );
  } finally {
    setApplicationsLoading(false);
  }
}

async function shortlistApplication(applicationId) {
  try {
    setApplicationActionId(applicationId);
    setError("");

    await api.patch(
      `/api/campaigns/${id}/applications/${applicationId}/shortlist`,
      {}
    );

    await loadApplications();
  } catch (err) {
    console.error("Error shortlisting application:", err);
    setError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido preseleccionar al creador."
    );
  } finally {
    setApplicationActionId(null);
  }
}

async function rejectApplication(applicationId) {
  try {
    setApplicationActionId(applicationId);
    setError("");

    await api.patch(
      `/api/campaigns/${id}/applications/${applicationId}/reject`,
      {}
    );

    await loadApplications();
  } catch (err) {
    console.error("Error rejecting application:", err);
    setError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido descartar la candidatura."
    );
  } finally {
    setApplicationActionId(null);
  }
}

async function advanceApplication(applicationId) {
  try {
    setApplicationActionId(applicationId);
    setError("");
    setApplicationMessage("");

    const data = await api.post(
      `/api/campaigns/${id}/applications/${applicationId}/advance`,
      {}
    );

    if (data.mode === "CLIENT_APPROVAL") {
      setApplicationMessage(
        "La candidatura se ha enviado al cliente y está pendiente de su aprobación."
      );
    }

    if (data.mode === "STAFF_SELECTION") {
      setApplicationMessage(
        "El creador ha sido seleccionado para la campaña."
      );
    }

    await Promise.all([
      loadApplications(),
      loadCampaign(),
      loadMatches(),
    ]);
  } catch (err) {
    console.error(
      "Error advancing application:",
      err
    );

    setError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido continuar con la selección."
    );
  } finally {
    setApplicationActionId(null);
  }
}

async function discoverExternalCreators() {

  try {

    setDiscoveryLoading(true);

    setDiscoveryError("");



    const data = await api.get(

      `/api/campaigns/${id}/discover-creators`

    );



    setDiscoveredCreators(data.creators || []);

    setDiscoveryProvider(data.provider || null);

    setDiscoveryExecuted(true);

    await loadMatches();

  } catch (err) {

    console.error(err);



    setDiscoveryError(

      err?.data?.message ||

        err?.data?.error ||

        err?.message ||

        "No se han podido buscar creadores externos."

    );



    setDiscoveryExecuted(true);

  } finally {

    setDiscoveryLoading(false);

  }

}

async function proposeCreator(matchId) {

  try {

    setProposingMatchId(matchId);

    setError("");



    const data = await api.post(

      `/api/campaigns/${id}/matches/${matchId}/propose`,

      {}

    );



    if (data.alreadyProposed) {

      console.log("Este creador ya estaba propuesto.");

    }



    await loadMatches();

  } catch (err) {

    console.error(

      "Error proponiendo creador:",

      err

    );



    setError(

      err?.data?.message ||

        err?.data?.error ||

        err?.message ||

        "No se ha podido proponer el creador al cliente."

    );

  } finally {

    setProposingMatchId(null);

  }

}

function getProposalForMatch(match) {
  if (!match) return null;

  const creatorId = match.creatorId || match.creator?.id || null;
  const externalCreatorId =
    match.externalCreatorId || match.externalCreator?.id || null;

  return (
    proposals.find((proposal) => {
      if (creatorId && proposal.creatorId === creatorId) {
        return true;
      }

      if (
        externalCreatorId &&
        proposal.externalCreatorId === externalCreatorId
      ) {
        return true;
      }

      return false;
    }) || null
  );
}

async function contactExternalCreator(

  match

) {

  if (!match?.matchId) {

    return;

  }



  try {

    setContactingMatchId(

      match.matchId

    );



    setMatchesError("");



    await api.post(

      `/api/campaigns/${id}/matches/${match.matchId}/contact`,

      {}

    );



    /*

     \* Actualizamos React sin necesidad

     \* de recalcular el matching.

     */

    setMatches((currentMatches) =>

      currentMatches.map(

        (currentMatch) => {

          if (

            currentMatch.matchId !==

            match.matchId

          ) {

            return currentMatch;

          }



          return {

            ...currentMatch,



            externalCreator: {

              ...currentMatch.externalCreator,

              isContacted: true,

            },

          };

        }

      )

    );

  } catch (err) {

    console.error(err);



    setMatchesError(

      err?.data?.message ||

        err?.data?.error ||

        err?.message ||

        "No se ha podido registrar el contacto con el creador."

    );

  } finally {

    setContactingMatchId(null);

  }

}

async function inviteExternalCreator(

  match

) {

  if (!match?.matchId) {

    return;

  }



  try {

    setInvitingMatchId(

      match.matchId

    );



    setMatchesError("");



    await api.post(

      `/api/campaigns/${id}/matches/${match.matchId}/invite`,

      {}

    );



    setMatches((currentMatches) =>

      currentMatches.map(

        (currentMatch) => {

          if (

            currentMatch.matchId !==

            match.matchId

          ) {

            return currentMatch;

          }



          return {

            ...currentMatch,



            externalCreator: {

              ...currentMatch.externalCreator,



              isContacted: true,

              isInvited: true,

            },

          };

        }

      )

    );

  } catch (err) {

    console.error(err);



    setMatchesError(

      err?.data?.message ||

        err?.data?.error ||

        err?.message ||

        "No se ha podido invitar al creador."

    );

  } finally {

    setInvitingMatchId(null);

  }

}



function openSelectCreator(match) {

  setSelectedCreator(match);

  setCreatorFee("");

  setSelectionError("");

}



function closeSelectCreator() {

  if (selectionLoading) return;



  setSelectedCreator(null);

  setCreatorFee("");

  setSelectionError("");

}



async function updateMatchStatus(

  matchId,

  status

) {

  if (!matchId) {

    return;

  }



  try {

    setMatchesError("");



    await api.patch(

      `/api/campaigns/${id}/matches/${matchId}`,

      {

        status,

      }

    );



    /*

     \* Actualización local.

     \*

     \* No necesitamos recalcular todo

     \* el Matching Engine únicamente

     \* por cambiar un estado.

     */

    setMatches((currentMatches) =>

      currentMatches.map((match) =>

        match.matchId === matchId

          ? {

              ...match,

              matchStatus:

                status,

            }

          : match

      )

    );

  } catch (err) {

    console.error(err);



    setMatchesError(

      err?.data?.message ||

        err?.data?.error ||

        err?.message ||

        "No se ha podido actualizar la shortlist."

    );

  }

}



async function confirmCreatorSelection() {

  if (!selectedCreator?.creator?.id) {

    return;

  }



  const normalizedFee = creatorFee

    .trim()

    .replace(",", ".");



  if (

    !normalizedFee ||

    !/^\d+(\.\d{1,2})?$/.test(normalizedFee)

  ) {

    setSelectionError(

      "Introduce un fee válido. Ejemplo: 150 o 150.50."

    );

    return;

  }



  try {

    setSelectionLoading(true);

    setSelectionError("");



    await api.post(

      `/api/campaigns/${id}/select-creator/${selectedCreator.creator.id}`,

      {

        fee: normalizedFee,

      }

    );



    await loadCampaign();



    setSelectedCreator(null);

    setCreatorFee("");

  } catch (err) {

    console.error(err);



    setSelectionError(

      err?.data?.message ||

        err?.data?.error ||

        err?.message ||

        "No se ha podido seleccionar el creador."

    );

  } finally {

    setSelectionLoading(false);

  }

}


async function updateCollaborationStatus(
  collaborationId,
  status,
  options = {}
) {
  const {
    administrativeCorrection = false,
    correctionReason = "",
  } = options;

  try {
    setUpdatingCollaborationId(collaborationId);
    setError("");

    await api.patch(
      `/api/admin/campaigns/${id}/creators/${collaborationId}/status`,
      {
        status,
        ...(administrativeCorrection
          ? {
              administrativeCorrection: true,
              correctionReason,
            }
          : {}),
      }
    );

   await loadCampaign(true);
  } catch (err) {
    console.error(
      "Error actualizando colaboración:",
      err
    );

    setError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido actualizar la colaboración."
    );
  } finally {
    setUpdatingCollaborationId(null);
  }
}



async function verifyPublication(deliverableId) {
  try {
    setVerifyingDeliverableId(deliverableId);
    setPublicationError("");

    await api.patch(
      `/api/deliverables/${deliverableId}/verify-publication`,
      {}
    );

   await loadCampaign(true);
  } catch (err) {
    console.error("Error verificando publicación:", err);

    setPublicationError(
      err?.data?.message ||
        err?.message ||
        "No se ha podido verificar la publicación."
    );
  } finally {
    setVerifyingDeliverableId(null);
  }
}


const campaignActionBusy =
  archivingCampaign || deletingCampaign || changingCampaignStatus;

async function changeCampaignStatus(nextStatus) {
  if (!campaign || campaignActionBusy) return;

  const actionLabels = {
    ACTIVE: "activar",
    COMPLETED: "finalizar",
    CANCELLED: "cancelar",
  };
  const action = actionLabels[nextStatus];
  if (!action) return;

  const confirmed = window.confirm(
    `¿Quieres ${action} la campaña "${campaign.name}"?` +
      (nextStatus === "CANCELLED"
        ? "\n\nSe conservarán las colaboraciones, entregables y obligaciones económicas."
        : "")
  );
  if (!confirmed) return;

  try {
    setChangingCampaignStatus(true);
    setCampaignActionError("");
    await api.patch(`/api/admin/campaigns/${id}/status`, {
      status: nextStatus,
    });
    await loadCampaign(true);
  } catch (err) {
    setCampaignActionError(
      err?.response?.data?.message ||
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido cambiar el estado de la campaña."
    );
  } finally {
    setChangingCampaignStatus(false);
  }
}

async function archiveCampaign() {
  if (!campaign || campaignActionBusy) return;

  const confirmed = window.confirm(
    `¿Quieres archivar "${campaign.name}"?\n\n` +
      "La campaña se retirará de las campañas operativas y conservará su historial."
  );
  if (!confirmed) return;

  try {
    setArchivingCampaign(true);
    setCampaignActionError("");
    await api.patch(`/api/admin/campaigns/${id}/archive`, {});
    await loadCampaign(true);
  } catch (err) {
    setCampaignActionError(
      err?.response?.data?.message ||
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido archivar la campaña."
    );
  } finally {
    setArchivingCampaign(false);
  }
}

async function deleteCampaign() {
  if (!campaign || campaignActionBusy || campaign.status === "DELETED") return;

  const reason = window.prompt(
    `Motivo para eliminar la campaña "${campaign.name}" (5-1000 caracteres):`
  );
  if (reason === null) return;

  const deletionReason = reason.trim();
  if (deletionReason.length < 5 || deletionReason.length > 1000) {
    setCampaignActionError(
      "Indica un motivo de eliminación de entre 5 y 1000 caracteres."
    );
    return;
  }

  const collaborationsCount = campaign.creators?.length || 0;
  const deliverablesCount = (campaign.creators || []).reduce(
    (total, creator) => total + (creator.deliverables?.length || 0),
    0
  );

  const confirmed = window.confirm(
    `¿Retirar "${campaign.name}" de las campañas operativas?\n\n` +
      `Estado actual: ${getCampaignStatusLabel(campaign.status)}\n` +
      `Colaboraciones visibles: ${collaborationsCount}\n` +
      `Entregables visibles: ${deliverablesCount}\n\n` +
      "La eliminación es lógica: se conserva el historial y los compromisos económicos. " +
      "Esta acción no cancela pagos ni acuerdos pendientes.\n\n" +
      `Motivo: ${deletionReason}`
  );
  if (!confirmed) return;

  try {
    setDeletingCampaign(true);
    setCampaignActionError("");
    await api.delete(`/api/admin/campaigns/${id}`, {
      confirmation: "DELETE_CAMPAIGN",
      reason: deletionReason,
    });
    window.location.assign("/admin/campaigns");
  } catch (err) {
    setCampaignActionError(
      err?.response?.data?.message ||
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se ha podido eliminar la campaña."
    );
  } finally {
    setDeletingCampaign(false);
  }
}


  const totalCreatorFees = useMemo(() => {

    if (!campaign?.creators) return 0;



    return campaign.creators.reduce(

      (total, collaboration) =>

        total + Number(collaboration.fee || 0),

      0

    );

  }, [campaign]);



  const paidCreatorFees = useMemo(() => {

    if (!campaign?.creators) return 0;



    return campaign.creators

      .filter(

        (collaboration) =>

          collaboration.status === "PAID"

      )

      .reduce(

        (total, collaboration) =>

          total + Number(collaboration.fee || 0),

        0

      );

  }, [campaign]);



  const estimatedMargin =

    Number(campaign?.budget || 0) -

    totalCreatorFees;

  const selectedCreatorIds = useMemo(() => {

  return new Set(

    (campaign?.creators || [])

      .filter((collaboration) =>

        [

          "SELECTED",

          "PRODUCT_SENT",

          "CONTENT_PENDING",

          "CONTENT_RECEIVED",

          "PUBLISHED",

          "PAID",

        ].includes(collaboration.status)

      )

      .map(

        (collaboration) =>

          collaboration.creator?.id

      )

      .filter(Boolean)

  );

}, [campaign]);



  const pendingApplications = useMemo(
    () =>
      applications.filter(
        (application) => application.status === "APPLIED"
      ),
    [applications]
  );

  const shortlistedApplications = useMemo(
    () =>
      applications.filter(
        (application) => application.status === "SHORTLISTED"
      ),
    [applications]
  );

  const targetCreatorCount =
    campaign?.targetCreatorCount ?? null;

  const selectedCreatorCount =
    campaign?.creators?.length ?? 0;

  const availableCreatorSlots =
    targetCreatorCount == null
      ? null
      : Math.max(
          targetCreatorCount - selectedCreatorCount,
          0
        );

  if (loading) {

    return (

      <div className="py-20 text-center">

        <p className="text-sm text-black/40">

          Cargando campaña...

        </p>

      </div>

    );

  }



  if (!campaign) {

    return (

      <div>

        <Link

          to="/admin/campaigns"

          className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"

        >

          ← Volver a campañas

        </Link>



        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">

          {error || "Campaña no encontrada."}

        </div>

      </div>

    );

  }



  return (

  <>
  

    <div>

      <Link

        to="/admin/campaigns"

        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"

      >

        ← Volver a campañas

      </Link>



      <div className="mt-6 mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">

        <div>

          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">

            Campaña

          </p>



          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">

            {campaign.name}

          </h1>



          <p className="mt-2 text-sm text-black/45">

            {campaign.brand?.companyName || "Cliente"}

          </p>

        </div>


        
        <div className="flex flex-col items-start gap-3 md:items-end">
          <span className="inline-flex rounded-full bg-black px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-white">
            {getCampaignStatusLabel(campaign.status)}
          </span>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {["DRAFT", "ACTIVE"].includes(campaign.status) && (
              <Link
                to={`/admin/campaigns/${campaign.id}/edit`}
                className="rounded-full border border-black/10 px-4 py-2.5 text-[10px] font-medium transition hover:border-black"
              >
                Editar campaña
              </Link>
            )}
            {!["ARCHIVED", "DELETED"].includes(campaign.status) && (
              <Link
                to={`/admin/campaigns/${campaign.id}/manage`}
                className="rounded-full bg-black px-4 py-2.5 text-[10px] font-medium text-white transition hover:bg-black/80"
              >
                Gestionar campaña →
              </Link>
            )}
            {campaign.status === "DRAFT" && (
              <button type="button" onClick={() => changeCampaignStatus("ACTIVE")}
                disabled={campaignActionBusy}
                className="rounded-full border border-emerald-600/30 px-4 py-2.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                {changingCampaignStatus ? "Actualizando..." : "Activar"}
              </button>
            )}
            {campaign.status === "ACTIVE" && (
              <>
                <button type="button" onClick={() => changeCampaignStatus("COMPLETED")}
                  disabled={campaignActionBusy}
                  className="rounded-full border border-emerald-600/30 px-4 py-2.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                  {changingCampaignStatus ? "Actualizando..." : "Finalizar"}
                </button>
                <button type="button" onClick={() => changeCampaignStatus("CANCELLED")}
                  disabled={campaignActionBusy}
                  className="rounded-full border border-amber-600/30 px-4 py-2.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                  {changingCampaignStatus ? "Actualizando..." : "Cancelar"}
                </button>
              </>
            )}
            {campaign.status === "DRAFT" && (
              <button type="button" onClick={() => changeCampaignStatus("CANCELLED")}
                disabled={campaignActionBusy}
                className="rounded-full border border-amber-600/30 px-4 py-2.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                Cancelar
              </button>
            )}
            {!["ARCHIVED", "DELETED"].includes(campaign.status) && (
              <button type="button" onClick={archiveCampaign}
                disabled={campaignActionBusy}
                className="rounded-full border border-amber-600/30 px-4 py-2.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                {archivingCampaign ? "Archivando..." : "Archivar"}
              </button>
            )}
            {campaign.status !== "DELETED" && (
              <button type="button" onClick={deleteCampaign}
                disabled={campaignActionBusy}
                className="rounded-full border border-red-600/30 px-4 py-2.5 text-[10px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                {deletingCampaign ? "Eliminando..." : "Eliminar"}
              </button>
            )}
          </div>
          {campaignActionError && (
            <p role="alert" className="max-w-xl text-sm text-red-600">
              {campaignActionError}
            </p>
          )}
        </div>
      </div>

{error && (
  <div
    role="alert"
    className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
  >
    {error}
  </div>
)}

      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-2xl border border-black/10 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">

            Presupuesto

          </p>



          <p className="mt-2 text-2xl font-medium">

            {formatCurrency(campaign.budget)}

          </p>

        </div>



        <div className="rounded-2xl border border-black/10 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">

            Fees creadores

          </p>



          <p className="mt-2 text-2xl font-medium">

            {formatCurrency(totalCreatorFees)}

          </p>

        </div>



        <div className="rounded-2xl border border-black/10 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">

            Pagado

          </p>



          <p className="mt-2 text-2xl font-medium">

            {formatCurrency(paidCreatorFees)}

          </p>

        </div>



        <div className="rounded-2xl border border-black/10 bg-white p-5">

          <p className="text-[9px] uppercase tracking-[0.15em] text-black/35">

            Margen bruto estimado

          </p>



          <p className="mt-2 text-2xl font-medium">

            {formatCurrency(estimatedMargin)}

          </p>

        </div>

      </div>



      <div className="mt-8 grid gap-8 lg:grid-cols-3">

        <section className="rounded-2xl border border-black/10 bg-white p-6 lg:col-span-1">

          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">

            Información

          </p>



          <div className="mt-6 space-y-5">

            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">

                Cliente

              </p>



              <p className="mt-1 text-sm font-medium">

                {campaign.brand?.companyName || "—"}

              </p>



              <p className="mt-1 text-xs text-black/40">

                {campaign.brand?.user?.email || ""}

              </p>

            </div>



            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">

                Categoría

              </p>



              <p className="mt-1 text-sm">

                {campaign.category || "No especificada"}

              </p>

            </div>



            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">

                Plataforma

              </p>



              <p className="mt-1 text-sm">

                {campaign.platform || "No especificada"}

              </p>

            </div>



            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">

                Objetivo

              </p>



              <p className="mt-1 text-sm leading-6 text-black/60">

                {campaign.objective || "No especificado"}

              </p>

            </div>



            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">

                Fechas

              </p>



              <p className="mt-1 text-sm">

                {formatDate(campaign.startDate)} →{" "}

                {formatDate(campaign.endDate)}

              </p>

            </div>



            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">

                Creada

              </p>



              <p className="mt-1 text-sm">

                {formatDate(campaign.createdAt)}

              </p>

            </div>

          </div>

        </section>



        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white lg:col-span-2">

          <div className="flex flex-col gap-3 border-b border-black/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
                Creadores de la campaña
              </p>

              <p className="mt-2 text-xs text-black/40">
                Colaboradores seleccionados definitivamente para esta campaña.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black px-4 py-2 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                {selectedCreatorCount}
                {targetCreatorCount != null
                  ? ` / ${targetCreatorCount}`
                  : ""}
                {" "}seleccionados
              </span>

              {availableCreatorSlots != null && (
                <span className="rounded-full border border-black/10 px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-black/45">
                  {availableCreatorSlots} plazas libres
                </span>
              )}
            </div>

          </div>



          {!campaign.creators?.length ? (

            <div className="px-6 py-12 text-center">

              <p className="text-sm text-black/40">

                Todavía no hay creadores asociados.

              </p>

            </div>

          ) : (

            <div className="divide-y divide-black/5">

 {campaign.creators.map((collaboration) => {
  const deliverables = collaboration.deliverables || [];

  const allPublicationsVerified =
    deliverables.length > 0 &&
    deliverables.every(
      (deliverable) =>
        deliverable.status === "APPROVED" &&
        Boolean(deliverable.publishedUrl) &&
        Boolean(deliverable.publishedAt) &&
        Boolean(deliverable.publicationVerifiedAt)
    );

  const canMarkPublished = allPublicationsVerified;

  const canMarkPaid =
    collaboration.status === "PUBLISHED" &&
    ["PAID", "PAID_AND_PRODUCT"].includes(
      campaign.collaborationType
    );

  return (
    <div
      key={collaboration.id}

      className="px-6 py-6"

    >

      <div className="flex flex-col gap-5">

        {/* Información principal */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>

            <p className="text-sm font-medium">

              {collaboration.creator?.user?.name ||

                collaboration.creator?.username ||

                "Creador"}

            </p>



            <p className="mt-1 text-xs text-black/40">

              @{collaboration.creator?.username || "—"}

            </p>

          </div>



          <div className="flex flex-wrap items-center gap-4">

            <div className="text-right">

              <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">

                Fee

              </p>



              <p className="mt-1 text-sm font-medium">

                {formatCurrency(collaboration.fee)}

              </p>

            </div>



            <span className="rounded-full bg-black/5 px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">

              {getStatusLabel(collaboration.status)}

            </span>

          </div>

        </div>

        

        {/* Estado de colaboración */}

<div className="rounded-xl bg-black/[0.025] p-4">
  <label className="mb-2 block text-[9px] uppercase tracking-[0.12em] text-black/30">
    Estado de colaboración
  </label>

  <select
    value={collaboration.status}
    onChange={(event) =>
      updateCollaborationStatus(
        collaboration.id,
        event.target.value
      )
    }
    disabled={
      updatingCollaborationId === collaboration.id
    }
    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-black/30 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <option value="PENDING">Pendiente</option>

    {["PROPOSED", "APPROVED", "REJECTED"].includes(
      collaboration.status
    ) && (
      <option value={collaboration.status} disabled>
        {getStatusLabel(collaboration.status)} (estado anterior)
      </option>
    )}

    <option value="CONTACTED">Contactado</option>
    <option value="ACCEPTED">Aceptado</option>
    <option value="SELECTED">Seleccionado</option>

    <option value="PRODUCT_SENT">
      Producto enviado
    </option>

    <option value="CONTENT_PENDING">
      Contenido pendiente
    </option>

    <option value="CONTENT_RECEIVED">
      Contenido recibido
    </option>

    <option
      value="PUBLISHED"
      disabled={
        !canMarkPublished &&
        collaboration.status !== "PUBLISHED"
      }
    >
      Publicado
    </option>

    <option
      value="PAID"
      disabled={
        !canMarkPaid &&
        collaboration.status !== "PAID"
      }
    >
      Pagado
    </option>
  </select>

  {updatingCollaborationId === collaboration.id && (
    <p className="mt-2 text-xs text-black/40">
      Actualizando estado...
    </p>
  )}
</div>
</div>




      {/* Entregables */}

      {collaboration.deliverables?.length > 0 && (
          <div className="mt-5 rounded-xl bg-black/[0.025] p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
              Entregables y publicaciones
            </p>

            <div className="mt-4 space-y-3">
              {collaboration.deliverables.map((deliverable) => {
                const isApproved =
                  deliverable.status === "APPROVED";

                const hasPublication =
                  Boolean(deliverable.publishedUrl) &&
                  Boolean(deliverable.publishedAt);

                const isVerified =
                  Boolean(deliverable.publicationVerifiedAt);

                const canVerify =
                  isApproved &&
                  hasPublication &&
                  !isVerified;

                const verifying =
                  verifyingDeliverableId === deliverable.id;

                return (
                  <div
                    key={deliverable.id}
                    className="rounded-xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {deliverable.type}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {deliverable.platform ||
                            "Plataforma no especificada"}
                        </p>
                      </div>

                      <span className="rounded-full bg-black/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] text-black/55">
                        {deliverable.status}
                      </span>
                    </div>

                    {hasPublication ? (
                      <div className="mt-4 border-t border-black/10 pt-4">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-black/35">
                          Publicación registrada
                        </p>

                        <a
                          href={deliverable.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block break-all text-xs text-black/70 underline underline-offset-4"
                        >
                          {deliverable.publishedUrl}
                        </a>

                        <p className="mt-2 text-xs text-black/40">
                          Registrada:{" "}
                          {formatDate(deliverable.publishedAt)}
                        </p>

                        {isVerified ? (
                          <div className="mt-4">
                            <span className="inline-flex rounded-full bg-black px-3 py-2 text-[9px] uppercase tracking-[0.1em] text-white">
                              Publicación verificada
                            </span>

                            <p className="mt-2 text-xs text-black/40">
                              Verificada el{" "}
                              {formatDate(
                                deliverable.publicationVerifiedAt
                              )}
                            </p>
                          </div>
                        ) : canVerify ? (
                          <button
                            type="button"
                            onClick={() =>
                              verifyPublication(deliverable.id)
                            }
                            disabled={verifying}
                            className="mt-4 rounded-full bg-black px-5 py-2.5 text-[9px] uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {verifying
                              ? "Verificando..."
                              : "Verificar publicación"}
                          </button>
                        ) : (
                          <p className="mt-3 text-xs text-black/40">
                            El contenido debe estar aprobado
                            para verificar la publicación.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-black/40">
                        Todavía no se ha registrado
                        ninguna publicación.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {publicationError && (
              <p className="mt-4 text-xs text-red-600">
                {publicationError}
              </p>
            )}
          </div>
        )}

    </div>

  );
})}

</div>

          )}

        </section>

      </div>

      {/* ==========================================

    CREATOR DISCOVERY

    ========================================== */}



<section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">

  <div className="border-b border-black/10 px-6 py-6">

    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

      <div>

        <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">

          Creator Discovery

        </p>



        <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">

          Descubrir creadores externos

        </h2>



        <p className="mt-2 max-w-2xl text-xs leading-5 text-black/40">

          Busca influencers fuera de ST.MARY AGENCY utilizando la

          segmentación y los criterios definidos para esta campaña.

        </p>

      </div>



      <button

        type="button"

        onClick={discoverExternalCreators}

        disabled={discoveryLoading}

        className="w-fit rounded-full bg-black px-5 py-2.5 text-[9px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"

      >

        {discoveryLoading

          ? "Buscando..."

          : discoveryExecuted

            ? "Buscar de nuevo"

            : "Buscar creadores externos"}

      </button>

    </div>

  </div>



  {discoveryError ? (

    <div className="px-6 py-6">

      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">

        <p className="text-xs font-medium text-red-700">

          No se ha podido completar el Discovery.

        </p>



        <p className="mt-1 text-xs text-red-600/80">

          {discoveryError}

        </p>

      </div>

    </div>

  ) : discoveryLoading ? (

    <div className="px-6 py-14 text-center">

      <p className="text-sm text-black/40">

        Buscando creadores externos...

      </p>



      <p className="mt-2 text-xs text-black/25">

        Aplicando los criterios de segmentación de la campaña.

      </p>

    </div>

  ) : discoveryExecuted &&

    !discoveredCreators.length ? (

    <div className="px-6 py-14 text-center">

      <p className="text-sm text-black/40">

        No se han encontrado creadores externos compatibles.

      </p>



      <p className="mt-2 text-xs text-black/25">

        Prueba modificando la segmentación de la campaña.

      </p>

    </div>

  ) : discoveredCreators.length > 0 ? (

    <>

      <div className="border-b border-black/5 bg-black/[0.015] px-6 py-3">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <p className="text-[10px] text-black/40">

            {discoveredCreators.length}{" "}

            {discoveredCreators.length === 1

              ? "creador encontrado"

              : "creadores encontrados"}

          </p>



          {discoveryProvider && (

            <p className="text-[9px] uppercase tracking-[0.1em] text-black/30">

              Provider: {discoveryProvider.name}

            </p>

          )}

        </div>

      </div>



      <div className="divide-y divide-black/5">

        {discoveredCreators.map((creator) => (

          <div

            key={creator.id}

            className="px-6 py-6 transition-colors hover:bg-black/[0.015]"

          >

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-3">

                  <p className="text-sm font-medium">

                    {creator.displayName ||

                      creator.username ||

                      "Creador"}

                  </p>



                  {creator.username && (

                    <span className="text-xs text-black/35">

                      @{creator.username}

                    </span>

                  )}



                  <span className="rounded-full bg-black px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.1em] text-white">

                    Externo

                  </span>

                </div>



                {creator.bio && (

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45">

                    {creator.bio}

                  </p>

                )}



                <div className="mt-3 flex flex-wrap gap-2">

                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">

                    {Number(

                      creator.followers || 0

                    ).toLocaleString("es-ES")}{" "}

                    seguidores

                  </span>



                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">

                    {creator.engagementRate || 0}% engagement

                  </span>



                  {creator.location && (

                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">

                      {creator.location}

                    </span>

                  )}

                </div>



                {creator.categories?.length > 0 && (

                  <div className="mt-3 flex flex-wrap gap-2">

                    {creator.categories.map(

                      (category) => (

                        <span

                          key={category}

                          className="rounded-full border border-black/10 px-2.5 py-1 text-[9px] text-black/45"

                        >

                          {category}

                        </span>

                      )

                    )}

                  </div>

                )}

              </div>



              <div className="flex shrink-0 flex-wrap items-center gap-3">

                {creator.profiles?.map(

                  (profile) => (

                    <span

                      key={profile.id}

                      className="rounded-full border border-black/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.08em] text-black/45"

                    >

                      {profile.platform}

                    </span>

                  )

                )}



                {creator.profileUrl && (

                  <a

                    href={creator.profileUrl}

                    target="_blank"

                    rel="noreferrer"

                    className="rounded-full border border-black/10 px-4 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-black/60 transition hover:bg-black/5"

                  >

                    Ver perfil

                  </a>

                )}

              </div>

            </div>

          </div>

        ))}

      </div>

    </>

  ) : (

    <div className="px-6 py-10">

      <div className="rounded-xl bg-black/[0.025] px-5 py-5">

        <p className="text-xs font-medium text-black/55">

          Discovery preparado

        </p>



        <p className="mt-1 text-xs leading-5 text-black/35">

          Pulsa “Buscar creadores externos” para encontrar

          influencers compatibles con esta campaña.

        </p>

      </div>

    </div>

  )}

</section>

      {/* ==========================================
          CANDIDATURAS RECIBIDAS — FLUJO REAL
          ========================================== */}

      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
                Selección
              </p>

              <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">
                Candidaturas recibidas
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-black/40">
                Solo aparecen creadores que ya han indicado que quieren participar.
                Desde aquí ST.MARY AGENCY  revisa, descarta y prepara la shortlist.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-black px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-white">
                {pendingApplications.length} pendientes
              </span>

              <span className="rounded-full border border-black/10 px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-black/45">
                {shortlistedApplications.length} shortlist
              </span>
            </div>
          </div>
        </div>
        {applicationMessage && (
  <div className="border-b border-black/10 bg-[#F4EDE2] px-6 py-4">
    <p className="text-xs font-medium text-[#8A6340]">
      {applicationMessage}
    </p>
  </div>
)}

        {applicationsLoading ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-black/40">Cargando candidaturas...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-black/55">
              Todavía no hay candidaturas.
            </p>
            <p className="mt-2 text-xs text-black/35">
              Cuando un creador compatible pulse “Me interesa”, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {applications.map((application) => {
              const creator = application.creator;
              const creatorName =
                creator?.user?.name ||
                creator?.username ||
                "Creador";

              const processing =
                applicationActionId === application.id;
                const applicationProposal =
                proposals.find(
                  (proposal) =>
                    proposal.creatorId ===
                    application.creatorId
                ) || null;

              const awaitingClientApproval =
                applicationProposal?.status === "PROPOSED";

              return (
                <div key={application.id} className="px-6 py-5">
                  <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
                        {creatorName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {creatorName}
                        </p>

                        {creator?.username && (
                          <p className="mt-1 text-xs text-black/40">
                            @{creator.username}
                          </p>
                        )}

                        <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-black/30">
                          Se apuntó · {formatDate(application.appliedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {creator?.socialAccounts?.slice(0, 3).map((account) => (
                        <div key={account.id}>
                          <p className="text-[8px] uppercase tracking-[0.12em] text-black/30">
                            {account.platform}
                          </p>
                          <p className="mt-1 text-xs font-medium">
                            {account.username ? `@${account.username}` : "Conectado"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {application.status === "APPLIED" && (
                        <>
                          <span className="rounded-full bg-black/5 px-3 py-2 text-[8px] uppercase tracking-[0.12em] text-black/45">
                            Pendiente
                          </span>

                          {creator?.id && (
                            <Link
                              to={`/admin/creators/${creator.id}`}
                              className="rounded-full border border-black/15 px-4 py-2.5 text-[8px] uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
                            >
                              Ver perfil
                            </Link>
                          )}

                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => rejectApplication(application.id)}
                            className="rounded-full border border-black/15 px-4 py-2.5 text-[8px] uppercase tracking-[0.12em] transition hover:bg-black/5 disabled:opacity-40"
                          >
                            Descartar
                          </button>

                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => shortlistApplication(application.id)}
                            className="rounded-full bg-black px-4 py-2.5 text-[8px] uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:opacity-40"
                          >
                            {processing ? "Procesando..." : "Añadir a shortlist"}
                          </button>
                        </>
                      )}

                      {application.status === "SHORTLISTED" && (
  <>
    {awaitingClientApproval ? (
      <>
        <span className="rounded-full bg-[#F4EDE2] px-3 py-2 text-[8px] font-medium uppercase tracking-[0.12em] text-[#8A6340]">
          Pendiente del cliente
        </span>

        <span className="text-[9px] text-black/35">
          Propuesta enviada
        </span>
      </>
    ) : (
      <>
        <span className="rounded-full bg-black/5 px-3 py-2 text-[8px] uppercase tracking-[0.12em] text-black/45">
          En shortlist
        </span>

        <button
          type="button"
          disabled={
            processing ||
            availableCreatorSlots === 0
          }
          onClick={() =>
            advanceApplication(application.id)
          }
          className="rounded-full bg-black px-4 py-2.5 text-[8px] uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {processing
            ? "Procesando..."
            : "Continuar selección"}
        </button>
      </>
    )}
  </>
)}

                      {application.status === "NOT_SELECTED" && (
                        <span className="rounded-full bg-black/5 px-3 py-2 text-[8px] uppercase tracking-[0.12em] text-black/35">
                          Descartado
                        </span>
                      )}

                      {application.status === "SELECTED" && (
                        <span className="rounded-full bg-black px-3 py-2 text-[8px] uppercase tracking-[0.12em] text-white">
                          Seleccionado
                        </span>
                      )}

                      {application.status === "WITHDRAWN" && (
                        <span className="rounded-full border border-black/10 px-3 py-2 text-[8px] uppercase tracking-[0.12em] text-black/35">
                          Retirada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* ==========================================

          MATCHING ENGINE

          ========================================== */}



      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">

        <div className="border-b border-black/10 px-6 py-6">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">

                Matching Engine

              </p>



              <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">

                Creadores recomendados

              </h2>



              <p className="mt-2 max-w-2xl text-xs leading-5 text-black/40">

                Ranking automático basado en el encaje con la campaña,

                calidad de audiencia, Trust Score, engagement y señales

                de riesgo.

              </p>

            </div>



            <div className="text-left md:text-right">

              <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">

                Criterios

              </p>



              <p className="mt-1 text-[10px] text-black/45">

                Campaign Fit · Audience · Trust · Risk

              </p>

            </div>

          </div>

        </div>



        {matchesLoading ? (

          <div className="px-6 py-14 text-center">

            <p className="text-sm text-black/40">

              Analizando creadores...

            </p>



            <p className="mt-2 text-xs text-black/25">

              Calculando compatibilidad, audiencia, confianza y riesgo.

            </p>

          </div>

        ) : matchesError ? (

          <div className="px-6 py-10">

            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">

              <p className="text-xs font-medium text-red-700">

                No se ha podido calcular el matching.

              </p>



              <p className="mt-1 text-xs text-red-600/80">

                {matchesError}

              </p>

            </div>

          </div>

        ) : !matches.length ? (

          <div className="px-6 py-14 text-center">

            <p className="text-sm text-black/40">

              No hay creadores disponibles para esta campaña.

            </p>

          </div>

        ) : (

          <div className="divide-y divide-black/5">

           {matches.map((match, index) => {

            const creator =

            match.creator ||

            match.externalCreator;

            if (!creator) {

              return null;

            }

            const isExternal = match.source === "EXTERNAL";

            const isShortlisted = match.matchStatus == "SHORTLISTED";

            const isRejected = match.matchStatus === "REJECTED";

            const isSelected =

            !isExternal &&

            selectedCreatorIds.has(

              creator.id

            );

            return (

                <div

                  key={creator.id}

                  className="px-6 py-6 transition-colors hover:bg-black/[0.015]"

                >

                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                    {/* CREATOR */}



                    <div className="flex min-w-0 items-start gap-5">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium tracking-[0.08em] text-white">

                        {getRankingLabel(index)}

                      </div>



                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                          <p className="text-sm font-medium">

                              {creator.user?.name ||

                                creator.displayName ||

                                creator.username ||

                                "Creador"}

                          </p>

                          {creator.username && (

                            <span className="text-xs text-black/35">

                              @{creator.username}

                            </span>

                          )}



                          <span

                            className={

                              isExternal

                                ? "rounded-full bg-black px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.1em] text-white"

                                : "rounded-full border border-black/10 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.1em] text-black/45"

                            }

                          >

                            {isExternal

                              ? "Externo"

                              : "ST.MARY AGENCY"}

                          </span>

                        </div>



                        {creator.bio && (

                          <p className="mt-2 max-w-xl text-xs leading-5 text-black/45">

                            {creator.bio}

                          </p>

                        )}



                        <div className="mt-3 flex flex-wrap gap-2">

                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">

                           {Number(

                              creator.followers || 0

                            ).toLocaleString("es-ES")}{" "}

                            seguidores

                          </span>



                          <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">

                            {Number(

                              creator.engagementRate || 0

                            ).toLocaleString("es-ES", {

                              maximumFractionDigits: 2,

                            })}% engagement

                          </span>



                          {creator.location && (

                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-black/45">

                              {creator.location}

                            </span>

                          )}

                        </div>

                      </div>

                    </div>



                    {/* SCORE */}



                    <div className="flex shrink-0 flex-wrap items-center gap-5">

                      <div className="text-right">

                        <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">

                          Match Score

                        </p>



                        <p className="mt-1 text-3xl font-medium tracking-[-0.05em]">

                          {match.score}

                        </p>

                      </div>



                      <span

                        className={`rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] ${getRiskClasses(

                          match.risk?.level

                        )}`}

                      >

                        Riesgo{" "}

                        {getRiskLabel(match.risk?.level)}

                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/10 px-4 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-black/45">
                          Compatible
                        </span>

                        <span className="text-[9px] uppercase tracking-[0.1em] text-black/30">
                          Visible para el creador
                        </span>
                      </div>

                    </div>

                  </div>



                  {/* BREAKDOWN */}



                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">

                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Campaign Fit

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.campaignFit ?? 0}

                      </p>

                    </div>



                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Audience Quality

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.audienceQuality ?? 0}

                      </p>

                    </div>



                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Trust Score

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.trustScore ?? 0}

                      </p>

                    </div>



                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Categoría

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.category ?? 0}

                      </p>

                    </div>



                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Plataforma

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.platform ?? 0}

                      </p>

                    </div>



                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Engagement

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.engagement ?? 0}

                      </p>

                    </div>



                    <div className="rounded-xl bg-black/[0.025] p-3">

                      <p className="text-[8px] uppercase tracking-[0.1em] text-black/30">

                        Riesgo

                      </p>



                      <p className="mt-2 text-sm font-medium">

                        {match.breakdown?.risk ?? 0}

                      </p>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </section>



      {campaign.description && (

        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">

          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">

            Descripción

          </p>



          <p className="mt-4 max-w-4xl text-sm leading-7 text-black/60">

            {campaign.description}

          </p>

        </section>

      )}

    </div>



    {/* ==========================================

        MODAL — SELECCIONAR CREADOR

        ========================================== */}



    {selectedCreator && (

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

        <div

          className="absolute inset-0 bg-black/40 backdrop-blur-sm"

          onClick={closeSelectCreator}

        />



        <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-2xl">

          <div className="flex items-start justify-between gap-6">

            <div>

              <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">

                Matching Engine

              </p>



              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">

                Seleccionar creador

              </h2>



              <p className="mt-2 text-sm leading-6 text-black/50">

                Añade este creador a la campaña como colaboración

                seleccionada.

              </p>

            </div>



            <button

              type="button"

              onClick={closeSelectCreator}

              disabled={selectionLoading}

              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/50 transition hover:bg-black/5 disabled:opacity-40"

            >

              ×

            </button>

          </div>



          <div className="mt-6 rounded-xl border border-black/10 bg-black/[0.02] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <h3 className="text-lg font-medium">

                  {selectedCreator.creator.user?.name ||

                    selectedCreator.creator.username}

                </h3>



                <p className="mt-1 text-xs text-black/40">

                  @{selectedCreator.creator.username}

                </p>



                {selectedCreator.creator.bio && (

                  <p className="mt-2 text-sm leading-5 text-black/50">

                    {selectedCreator.creator.bio}

                  </p>

                )}

              </div>



              <div className="text-right">

                <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">

                  Match Score

                </p>



                <p className="mt-1 text-2xl font-medium">

                  {selectedCreator.score}

                </p>

              </div>

            </div>



            <div className="mt-4 flex flex-wrap gap-2">

              <span

                className={`rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] ${getRiskClasses(

                  selectedCreator.risk?.level

                )}`}

              >

                Riesgo{" "}

                {getRiskLabel(

                  selectedCreator.risk?.level

                )}

              </span>



              {selectedCreator.creator.location && (

                <span className="rounded-full border border-black/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] text-black/50">

                  {selectedCreator.creator.location}

                </span>

              )}



              <span className="rounded-full border border-black/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] text-black/50">

                {selectedCreator.creator.followers?.toLocaleString(

                  "es-ES"

                )}{" "}

                seguidores

              </span>

            </div>

          </div>



          <div className="mt-6">

            <label className="block">

              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-black/45">

                Fee del creador

              </span>



              <div className="relative mt-2">

                <input

                  type="text"

                  inputMode="decimal"

                  value={creatorFee}

                  onChange={(event) =>

                    setCreatorFee(event.target.value)

                  }

                  placeholder="150.00"

                  disabled={selectionLoading}

                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-black/25 focus:border-black/30 disabled:bg-black/5"

                />



                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-black/35">

                  €

                </span>

              </div>



              <p className="mt-2 text-xs text-black/35">

                Tarifa acordada con el creador. No modifica el

                presupuesto de la campaña.

              </p>

            </label>

          </div>



          {creatorFee &&

            !Number.isNaN(

              Number(creatorFee.replace(",", "."))

            ) && (

              <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] p-4">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-black/45">

                    Margen estimado tras esta selección

                  </span>



                  <span className="font-medium">

                  {formatCurrency(

                    Number(campaign?.budget || 0) -

                    totalCreatorFees -

                    Number(

                      creatorFee.replace(",", ".")



                    )

                  )}

                  </span>

                </div>

              </div>

            )}



          {selectionError && (

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              {selectionError}

            </div>

          )}



          <div className="mt-6 flex justify-end gap-3">

            <button

              type="button"

              onClick={closeSelectCreator}

              disabled={selectionLoading}

              className="rounded-full border border-black/10 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-black/60 transition hover:bg-black/5 disabled:opacity-40"

            >

              Cancelar

            </button>



            <button

              type="button"

              onClick={confirmCreatorSelection}

              disabled={

                selectionLoading ||

                !creatorFee.trim()

              }

              className="rounded-full bg-black px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"

            >

              {selectionLoading

                ? "Seleccionando..."

                : "Confirmar selección"}

            </button>

          </div>

        </div>

      </div>

    )}

  </>

);

}



export default AdminCampaignDetail;