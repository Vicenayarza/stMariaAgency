import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { api } from "../lib/api";

import CampaignForm from "../components/campaign/CampaignForm";

function AdminNewCampaign() {
  const { brandId } = useParams();

  const navigate = useNavigate();

  const [brand, setBrand] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [
    creationError,
    setCreationError,
  ] = useState("");

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  async function loadBrand() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/api/admin/brands/${brandId}`
      );

      setBrand(data.brand);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido cargar el cliente."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(form) {
    try {
      setCreating(true);
      setCreationError("");

      const data = await api.post(
        `/api/admin/brands/${brandId}/campaigns`,
        buildCampaignPayload(form)
      );

      navigate(
        `/admin/campaigns/${data.campaign.id}`
      );
    } catch (err) {
      console.error(err);

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

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-black/40">
          Cargando cliente...
        </p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div>
        <Link
          to="/admin/brands"
          className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
        >
          ← Volver a clientes
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          {error ||
            "Cliente no encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/admin/brands/${brand.id}`}
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a {brand.companyName}
      </Link>

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
          Nueva campaña
        </p>

        <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
          {brand.companyName}
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/45">
          Crea y configura una nueva
          campaña para este cliente.
        </p>
      </div>

      <div className="mt-10">
        <CampaignForm
          brand={brand}
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

    
    publicationStart:
      form.publicationStart || null,

    publicationDeadline:
      form.publicationDeadline || null,

    contentItems:
      form.contentItems || [],
  };
}

function splitValues(value) {
  if (!value) return [];

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default AdminNewCampaign;