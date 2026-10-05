import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../lib/api";

import CampaignForm from "../components/campaign/CampaignForm";

function CampaignEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [campaign, setCampaign] =
    useState(null);

  const [initialValues, setInitialValues] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadCampaign();
  }, [id]);

  async function loadCampaign() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/api/campaigns/${id}`
      );

      const loadedCampaign =
        data.campaign;

      setCampaign(loadedCampaign);

      setInitialValues(
        campaignToForm(
          loadedCampaign
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido cargar la campaña."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateCampaign(form) {
    try {
      setSaving(true);
      setError("");

      const data = await api.patch(
        `/api/campaigns/${id}`,
        buildCampaignPayload(
          form,
          campaign
        )
      );

      navigate(
        `/platform/campaigns/${data.campaign.id}`
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se ha podido guardar la campaña."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando campaña...
        </p>
      </div>
    );
  }

  if (
    error &&
    !campaign
  ) {
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

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (
    !campaign ||
    !initialValues
  ) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          navigate(
            `/platform/campaigns/${id}`
          )
        }
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a la campaña
      </button>

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Campañas
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] md:text-5xl">
          Editar campaña
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
          Modifica la configuración,
          segmentación, contenidos y
          calendario de la campaña.
        </p>
      </div>

      <div className="mt-10">
        <CampaignForm
  brand={campaign.brand}
  initialValues={initialValues}
  submitting={saving}
  error={error}
  submitLabel="Guardar cambios"
  onSubmit={updateCampaign}
/>
      </div>
    </div>
  );
}

/*
 * ==========================================
 * CAMPAIGN -> CAMPAIGN FORM
 * ==========================================
 */

function campaignToForm(campaign) {
  const instructions =
    campaign.instructions || [];

  /*
   * El brief general es la instrucción
   * que contiene las condiciones globales
   * de la campaña.
   */
  const generalInstruction =
    instructions.find(
      (instruction) =>
        instruction.title ===
        "Brief general"
    );

  /*
   * El resto de instrucciones representan
   * los contenidos solicitados.
   */
  const contentInstructions =
    instructions.filter(
      (instruction) =>
        instruction.title !==
        "Brief general"
    );

  const contentItems =
    contentInstructions.map(
      (instruction) => ({
        platform:
          instruction.platform ||
          "",

        contentType:
          instruction.contentType ||
          "",

        quantity:
          instruction.quantity ||
          1,
      })
    );

  /*
   * Compatibilidad con campañas antiguas:
   * si todavía no tienen instrucciones de
   * contenido utilizamos formats.
   */
  const fallbackContentItems =
    contentItems.length > 0
      ? contentItems
      : (
          campaign.formats || []
        ).map((format) => ({
          platform:
            inferPlatform(
              format,
              campaign.platforms
            ),

          contentType:
            format,

          quantity: 1,
        }));

  return {
    /*
     * 01 — Tipo
     */

    campaignType:
      campaign.campaignType ||
      "INFLUENCER_MARKETING",

   collaborationType:
  campaign.collaborationType ||
  "PAID",

    /*
     * 02 — Segmentación
     */

    platforms:
      campaign.platforms || [],

    formats:
      campaign.formats || [],

    category:
      campaign.category || "",

    country:
      campaign.countries?.[0] ||
      "",

    province:
      campaign.provinces?.[0] ||
      "",

    gender:
      campaign.gender ||
      "ALL",

    minAge:
      campaign.minAge !==
        null &&
      campaign.minAge !==
        undefined
        ? String(
            campaign.minAge
          )
        : "",

    maxAge:
      campaign.maxAge !==
        null &&
      campaign.maxAge !==
        undefined
        ? String(
            campaign.maxAge
          )
        : "",

    interests:
      campaign.interests || [],

    creatorCount:
      campaign.targetCreatorCount !==
        null &&
      campaign.targetCreatorCount !==
        undefined
        ? String(
            campaign.targetCreatorCount
          )
        : "",

    /*
     * 03 — Información
     */

    name:
      campaign.name || "",

    description:
      campaign.description || "",

    objective:
      campaign.objective || "",

    budget:
      campaign.budget !==
        null &&
      campaign.budget !==
        undefined
        ? String(
            campaign.budget
          )
        : "",

    startDate:
      formatDateForInput(
        campaign.startDate
      ),

    endDate:
      formatDateForInput(
        campaign.endDate
      ),

    /*
     * 04 — Instrucciones
     */

    publicationStart:
      formatDateForInput(
        campaign.publicationStart
      ),

    publicationDeadline:
      formatDateForInput(
        campaign.publicationDeadline
      ),

    contentItems:
      fallbackContentItems,

    requirements:
      generalInstruction
        ?.description ||
      "",

    hashtags:
      arrayToText(
        generalInstruction
          ?.hashtags
      ),

    mentions:
      arrayToText(
        generalInstruction
          ?.mentions
      ),

    links:
      arrayToText(
        generalInstruction
          ?.links
      ),

    prohibitedContent:
      generalInstruction
        ?.forbiddenContent ||
      "",

    requiresApproval:
      Boolean(
        generalInstruction
          ?.approvalRequired
      ),
  };
}

/*
 * ==========================================
 * CAMPAIGN FORM -> API
 * ==========================================
 */

function buildCampaignPayload(
  form,
  campaign
) {
  return {
    name:
      form.name,

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

    /*
     * Conservamos el estado actual.
     *
     * El estado de campaña lo gestionaremos
     * como una acción independiente y no
     * dentro del formulario de configuración.
     */
    status:
      campaign.status,
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

function arrayToText(values) {
  if (!Array.isArray(values)) {
    return "";
  }

  return values.join(", ");
}

function formatDateForInput(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function inferPlatform(
  format,
  platforms = []
) {
  if (
    format === "TikTok"
  ) {
    return "TikTok";
  }

  if (
    format === "YouTube"
  ) {
    return "YouTube";
  }

  if (
    [
      "Reel",
      "Story",
      "Post",
    ].includes(format)
  ) {
    return "Instagram";
  }

  return (
    platforms[0] || ""
  );
}

export default CampaignEdit;