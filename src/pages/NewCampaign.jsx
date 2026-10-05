import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { api } from "../lib/api";

import CampaignForm from "../components/campaign/CampaignForm";

function NewCampaign() {
  const navigate = useNavigate();

  const [creating, setCreating] =
    useState(false);

  const [
    creationError,
    setCreationError,
  ] = useState("");

  async function createCampaign(form) {
    try {
      setCreating(true);
      setCreationError("");

      const data = await api.post(
        "/api/campaigns",
        buildCampaignPayload(form)
      );

      navigate(
        `/platform/campaigns/${data.campaign.id}`
      );
    } catch (err) {
      console.error(err);

      /*
       * La cuenta está gestionada por
       * ST.MARY AGENCY o el miembro no tiene
       * permiso para crear campañas.
       */
      if (
        err?.data?.error ===
        "CAMPAIGN_CREATION_NOT_ALLOWED"
      ) {
        setCreationError(
          err?.data?.message ||
            "No tienes permiso para crear campañas."
        );

        return;
      }

      if (
        err?.data?.error ===
        "BRAND_MEMBERSHIP_REQUIRED"
      ) {
        setCreationError(
          err?.data?.message ||
            "No perteneces a ninguna marca."
        );

        return;
      }

      setCreationError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se ha podido crear la campaña."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          navigate(
            "/platform/campaigns"
          )
        }
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a campañas
      </button>

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Campañas
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] md:text-5xl">
          Nueva campaña
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
          Define los objetivos, el público,
          los creadores y el contenido de
          tu nueva campaña.
        </p>
      </div>

      <div className="mt-10">
        <CampaignForm
          submitting={creating}
          error={creationError}
          submitLabel="Crear campaña"
          onSubmit={createCampaign}
        />
      </div>
    </div>
  );
}

function buildCampaignPayload(form) {
  return {
    name: form.name,

    description:
      form.description,

    objective:
      form.objective,

    budget: String(
      form.budget || ""
    ).replace(",", "."),

    campaignType:
      form.campaignType,

    collaborationType:
      form.collaborationType,

    platforms:
      form.platforms || [],

    formats:
      form.formats || [],

    category:
      form.category,

    countries:
      form.country
        ? [form.country]
        : [],

    provinces:
      form.province
        ? [form.province]
        : [],

    gender:
      form.gender,

    minAge:
      form.minAge || null,

    maxAge:
      form.maxAge || null,

    interests:
      form.interests || [],

    targetCreatorCount:
      form.creatorCount || null,

    startDate:
      form.startDate || null,

    endDate:
      form.endDate || null,

    publicationStart:
      form.publicationStart || null,

    publicationDeadline:
      form.publicationDeadline || null,

    contentItems:
      form.contentItems || [],

    requirements:
      form.requirements,

    hashtags:
      splitValues(
        form.hashtags
      ),

    mentions:
      splitValues(
        form.mentions
      ),

    links:
      splitValues(
        form.links
      ),

    forbiddenContent:
      form.prohibitedContent,

    approvalRequired:
      form.requiresApproval,
  };
}

function splitValues(value) {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

export default NewCampaign;