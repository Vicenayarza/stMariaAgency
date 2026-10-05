import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { api } from "../lib/api";

function CampaignProposals() {
  const { campaignId } = useParams();

  const [campaign, setCampaign] =
    useState(null);

  const [stats, setStats] =
    useState(null);

  const [proposals, setProposals] =
    useState({
      pending: [],
      approved: [],
      rejected: [],
    });

  const [permissions, setPermissions] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [showHistory, setShowHistory] =
    useState(false);

  useEffect(() => {
    loadProposals();
  }, [campaignId]);

  async function loadProposals() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/api/campaigns/proposals/campaigns/${campaignId}`
      );

      setCampaign(data.campaign);
      setStats(data.stats);

      setProposals(
        data.proposals || {
          pending: [],
          approved: [],
          rejected: [],
        }
      );

      setPermissions(
        data.permissions || {}
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se han podido cargar las propuestas."
      );
    } finally {
      setLoading(false);
    }
  }

  async function decide(
    proposalId,
    status
  ) {
    try {
      setUpdatingId(proposalId);
      setError("");

      await api.patch(
        `/api/campaigns/proposals/${proposalId}/status`,
        {
          status,
        }
      );

      await loadProposals();
    } catch (err) {
      console.error(err);

      if (
        err?.data?.error ===
        "CAMPAIGN_CREATOR_LIMIT_REACHED"
      ) {
        setError(
          "La campaña ya ha alcanzado el número máximo de creadores."
        );

        await loadProposals();
        return;
      }

      if (
        err?.data?.error ===
        "PROPOSAL_ALREADY_DECIDED"
      ) {
        setError(
          "Esta propuesta ya ha sido respondida."
        );

        await loadProposals();
        return;
      }

      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "No se ha podido actualizar la propuesta."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-black/40">
        Cargando propuestas...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-sm text-black/50">
        {error ||
          "Campaña no encontrada."}
      </div>
    );
  }

  const selectionComplete =
    campaign.targetCreatorCount != null &&
    stats?.available === 0;

  return (
    <div>
      <Link
        to="/platform/proposals"
        className="text-[9px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a propuestas
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Propuestas
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            {campaign.name}
          </h1>

          <p className="mt-3 text-sm text-black/45">
            {campaign.platform ||
              campaign.platforms?.join(
                " · "
              )}
          </p>
        </div>

        {selectionComplete && (
          <span className="w-fit rounded-full bg-black px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-white">
            Selección completa
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Summary
          label="Objetivo"
          value={
            campaign.targetCreatorCount ??
            "—"
          }
        />

        <Summary
          label="Seleccionados"
          value={
            campaign.targetCreatorCount
              ? `${stats.approved} / ${campaign.targetCreatorCount}`
              : stats.approved
          }
        />

        <Summary
          label="Plazas disponibles"
          value={stats.available ?? "—"}
        />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Pendientes
            </p>

            <h2 className="mt-1 text-xl font-medium">
              Propuestas pendientes
            </h2>
          </div>

          <span className="text-sm text-black/40">
            {proposals.pending.length}
          </span>
        </div>

        {proposals.pending.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-black/10 bg-white px-6 py-10 text-center text-sm text-black/40">
            No hay propuestas pendientes.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {proposals.pending.map(
              (proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  canApprove={
                    permissions.canApproveCreators
                  }
                  selectionComplete={
                    selectionComplete
                  }
                  updating={
                    updatingId ===
                    proposal.id
                  }
                  onApprove={() =>
                    decide(
                      proposal.id,
                      "APPROVED"
                    )
                  }
                  onReject={() =>
                    decide(
                      proposal.id,
                      "REJECTED"
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Seleccionados
            </p>

            <h2 className="mt-1 text-xl font-medium">
              Creadores aprobados
            </h2>
          </div>

          <span className="text-sm text-black/40">
            {proposals.approved.length}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {proposals.approved.length ===
          0 ? (
            <div className="rounded-2xl border border-black/10 bg-white px-6 py-10 text-center text-sm text-black/40">
              Todavía no hay creadores
              seleccionados.
            </div>
          ) : (
            proposals.approved.map(
              (proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  approved
                />
              )
            )
          )}
        </div>
      </section>

      <section className="mt-12">
        <button
          type="button"
          onClick={() =>
            setShowHistory(
              (current) => !current
            )
          }
          className="text-[10px] uppercase tracking-[0.14em] text-black/45 hover:text-black"
        >
          {showHistory
            ? "Ocultar historial"
            : `Ver historial (${proposals.rejected.length})`}
        </button>

        {showHistory && (
          <div className="mt-5 space-y-4">
            {proposals.rejected.length ===
            0 ? (
              <div className="rounded-2xl border border-black/10 bg-white px-6 py-10 text-center text-sm text-black/40">
                No hay propuestas rechazadas.
              </div>
            ) : (
              proposals.rejected.map(
                (proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    rejected
                  />
                )
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ProposalCard({
  proposal,
  canApprove = false,
  selectionComplete = false,
  updating = false,
  onApprove,
  onReject,
  approved = false,
  rejected = false,
}) {
  const creator =
    proposal.creator;

  const external =
    proposal.externalCreator;

  const name =
    creator?.user?.name ||
    creator?.username ||
    external?.displayName ||
    external?.username ||
    "Creador";

  const username =
    creator?.username ||
    external?.username;

  const followers =
    creator?.followers ??
    external?.followers ??
    0;

  const engagement =
    creator?.engagementRate ??
    external?.engagementRate ??
    0;

  const profileUrl =
    external?.profileUrl ||
    creator?.socialAccounts?.[0]
      ?.profileUrl;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-xs text-white">
            {name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {name}
              </p>

              {external && (
                <span className="rounded-full bg-black/5 px-2 py-1 text-[8px] uppercase tracking-[0.1em] text-black/40">
                  Externo
                </span>
              )}
            </div>

            {username && (
              <p className="mt-1 text-xs text-black/40">
                @{username}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Metric
            label="Seguidores"
            value={Number(
              followers
            ).toLocaleString("es-ES")}
          />

          <Metric
            label="Engagement"
            value={`${Number(
              engagement
            ).toFixed(2)}%`}
          />

          {approved && (
            <span className="rounded-full bg-black px-3 py-1.5 text-[8px] uppercase tracking-[0.12em] text-white">
              Seleccionado
            </span>
          )}

          {rejected && (
            <span className="rounded-full bg-black/5 px-3 py-1.5 text-[8px] uppercase tracking-[0.12em] text-black/40">
              Rechazado
            </span>
          )}

          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/15 px-4 py-2.5 text-[9px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"
            >
              Ver perfil
            </a>
          )}

          {canApprove &&
            !approved &&
            !rejected && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    updating ||
                    selectionComplete
                  }
                  onClick={onApprove}
                  className="rounded-full bg-black px-4 py-2.5 text-[9px] uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {updating
                    ? "Guardando..."
                    : selectionComplete
                      ? "Completo"
                      : "Aprobar"}
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={onReject}
                  className="rounded-full border border-black/15 px-4 py-2.5 text-[9px] uppercase tracking-[0.12em] disabled:opacity-30"
                >
                  Rechazar
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <p className="text-[8px] uppercase tracking-[0.14em] text-black/30">
        {label}
      </p>

      <p className="mt-2 text-2xl font-medium">
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[0.12em] text-black/30">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

export default CampaignProposals;