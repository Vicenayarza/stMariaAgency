import { useState } from "react";

import CampaignTypeStep from "./CampaignTypeStep";
import CampaignSegmentationStep from "./CampaignSegmentationStep";
import CampaignInfoStep from "./CampaignInfoStep";
import CampaignInstructionsStep from "./CampaignInstructionsStep";
import CampaignSummaryStep from "./CampaignSummaryStep";

export const INITIAL_CAMPAIGN_FORM = {
  // 01 — Tipo
  campaignType: "INFLUENCER_MARKETING",
  collaborationType: "PAID",

  // 02 — Segmentación
  platforms: [],
  formats: [],
  category: "",
  country: "España",
  province: "",
  gender: "ALL",
  minAge: "",
  maxAge: "",
  interests: [],
  creatorCount: "4",

  // 03 — Información
  name: "",
  description: "",
  objective: "",
  budget: "",
  startDate: "",
  endDate: "",

  // Ventana de publicación
  publicationStart: "",
  publicationDeadline: "",

  // 04 — Contenido solicitado
  contentItems: [],

  // 04 — Brief
  requirements: "",
  hashtags: "",
  mentions: "",
  links: "",
  prohibitedContent: "",
  requiresApproval: true,
};

const STEPS = [
  [1, "01", "Tipo"],
  [2, "02", "Segmentación"],
  [3, "03", "Información"],
  [4, "04", "Contenido"],
  [5, "05", "Resumen"],
];

function CampaignForm({
  brand,
  initialValues,
  submitLabel = "Crear campaña",
  submitting = false,
  error = "",
  onSubmit,
}) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ...INITIAL_CAMPAIGN_FORM,
    ...(initialValues || {}),
  });

  function validateCurrentStep() {
    if (step === 2) {
      if (!form.platforms?.length) {
        return "Selecciona al menos una plataforma.";
      }

      if (
        form.minAge &&
        form.maxAge &&
        Number(form.minAge) >
          Number(form.maxAge)
      ) {
        return "La edad mínima no puede ser mayor que la edad máxima.";
      }
    }

    if (step === 3) {
      if (!form.name?.trim()) {
        return "Introduce un nombre para la campaña.";
      }

      if (!String(form.budget || "").trim()) {
        return "Introduce el presupuesto de la campaña.";
      }

      if (
        form.startDate &&
        form.endDate &&
        new Date(form.startDate) >
          new Date(form.endDate)
      ) {
        return "La fecha de inicio no puede ser posterior a la fecha de finalización.";
      }
    }

    return "";
  }

  function nextStep() {
    const validationError =
      validateCurrentStep();

    if (validationError) {
      return validationError;
    }

    setStep((current) =>
      Math.min(5, current + 1)
    );

    return "";
  }

  async function handleSubmit() {
    if (!form.name?.trim()) {
      setStep(3);
      return;
    }

    if (!String(form.budget || "").trim()) {
      setStep(3);
      return;
    }

    if (!form.platforms?.length) {
      setStep(2);
      return;
    }

    await onSubmit(form);
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white">
      {/* STEPS */}

      <div className="border-b border-black/10 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          {STEPS.map(
            ([stepNumber, number, label]) => (
              <button
                key={number}
                type="button"
                onClick={() =>
                  setStep(stepNumber)
                }
                className={`rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.12em] transition ${
                  step === stepNumber
                    ? "bg-black text-white"
                    : step > stepNumber
                      ? "bg-black/10 text-black/60"
                      : "bg-black/5 text-black/35"
                }`}
              >
                {number} · {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* CONTENT */}

      <div className="px-6 py-10 md:px-10">
        {step === 1 && (
          <CampaignTypeStep
            form={form}
            setForm={setForm}
          />
        )}

        {step === 2 && (
          <CampaignSegmentationStep
            form={form}
            setForm={setForm}
          />
        )}

        {step === 3 && (
          <CampaignInfoStep
            form={form}
            setForm={setForm}
            brand={brand}
          />
        )}

        {step === 4 && (
          <CampaignInstructionsStep
            form={form}
            setForm={setForm}
          />
        )}

        {step === 5 && (
          <CampaignSummaryStep
            form={form}
            brand={brand}
          />
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700 md:px-10">
          {error}
        </div>
      )}

      {/* NAVIGATION */}

      <div className="flex items-center justify-between border-t border-black/10 px-6 py-5 md:px-10">
        <button
          type="button"
          onClick={() =>
            setStep((current) =>
              Math.max(1, current - 1)
            )
          }
          disabled={step === 1}
          className="text-[10px] uppercase tracking-[0.14em] text-black/45 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-20"
        >
          ← Anterior
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={() => {
              const validationError =
                nextStep();

              if (validationError) {
                // La validación visual global
                // la mejoraremos después.
                alert(validationError);
              }
            }}
            className="rounded-full bg-black px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black/80"
          >
            Continuar →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-black px-6 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Guardando..."
              : `${submitLabel} →`}
          </button>
        )}
      </div>
    </div>
  );
}

export default CampaignForm;