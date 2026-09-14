
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const PLATFORM_LABELS = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  TWITTER: "X / Twitter",
  FACEBOOK: "Facebook",
  TWITCH: "Twitch",
  LINKEDIN: "LinkedIn",
  OTHER: "Otra",
};

const VERIFICATION_LABELS = {
  UNVERIFIED: "No verificado",
  PENDING: "Pendiente de revisión",
  VERIFIED: "Verificado por ST.MARIA",
  REJECTED: "Rechazado",
};

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES").format(
    Number(value || 0)
  );
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(2).replace(".", ",")}%`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function verificationClasses(status) {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function platformIcon(platform) {
  const icons = {
    INSTAGRAM: "◎",
    TIKTOK: "♪",
    YOUTUBE: "▶",
    TWITTER: "𝕏",
    FACEBOOK: "f",
    TWITCH: "◈",
    LINKEDIN: "in",
    OTHER: "•",
  };

  return icons[platform] || "•";
}

export default function CreatorProfile() {
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showAddSocial, setShowAddSocial] =
    useState(false);

  const [newSocial, setNewSocial] = useState({
    platform: "INSTAGRAM",
    username: "",
    profileUrl: "",
  });

  const [metricForms, setMetricForms] = useState({});

  const [expandedAccount, setExpandedAccount] =
    useState(null);

  useEffect(() => {
    loadProfile();
    loadSocialAccounts();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        "/api/creator-portal/profile"
      );

      setProfile(data.creator);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudo cargar el perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSocialAccounts() {
    try {
      setAccountsLoading(true);

      const data = await api.get(
        "/api/social/accounts"
      );

      setAccounts(data.accounts || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudieron cargar las redes sociales."
      );
    } finally {
      setAccountsLoading(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const data = await api.patch(
        "/api/creator-portal/profile",
        {
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          categories:
            typeof profile.categories === "string"
              ? profile.categories
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : profile.categories || [],
          platforms:
            typeof profile.platforms === "string"
              ? profile.platforms
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : profile.platforms || [],
        }
      );

      setProfile(data.creator);

      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudo actualizar el perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateProfileField(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAddSocial(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      if (!newSocial.username.trim()) {
        setError(
          "Introduce el nombre de usuario de la red social."
        );
        return;
      }

      await api.post("/api/social/accounts", {
        platform: newSocial.platform,
        username: newSocial.username,
        profileUrl:
          newSocial.profileUrl || null,
      });

      setNewSocial({
        platform: "INSTAGRAM",
        username: "",
        profileUrl: "",
      });

      setShowAddSocial(false);

      setMessage("Red social añadida correctamente.");

      await loadSocialAccounts();
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudo añadir la red social."
      );
    }
  }

  function updateMetricField(
    accountId,
    field,
    value
  ) {
    setMetricForms((current) => ({
      ...current,
      [accountId]: {
        ...(current[accountId] || {}),
        [field]: value,
      },
    }));
  }

  async function handleAddMetric(account) {
    try {
      setError("");
      setMessage("");

      const form = metricForms[account.id] || {};

      if (
        form.followers === undefined ||
        form.followers === ""
      ) {
        setError(
          "Introduce el número de seguidores."
        );
        return;
      }

      const payload = {
        followers: Number(form.followers),
        following:
          form.following === ""
            ? null
            : Number(form.following || 0),
        posts:
          form.posts === ""
            ? null
            : Number(form.posts || 0),
        likes: Number(form.likes || 0),
        comments: Number(form.comments || 0),
        views: Number(form.views || 0),
        reach:
          form.reach === ""
            ? null
            : Number(form.reach || 0),
        impressions:
          form.impressions === ""
            ? null
            : Number(form.impressions || 0),
        engagementRate: Number(
          form.engagementRate || 0
        ),
      };

      await api.post(
        `/api/social/accounts/${account.id}/metrics`,
        payload
      );

      setMetricForms((current) => ({
        ...current,
        [account.id]: {},
      }));

      setMessage(
        "Métricas actualizadas correctamente."
      );

      await loadSocialAccounts();
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudieron guardar las métricas."
      );
    }
  }

  async function handleRequestVerification(
    metricId
  ) {
    try {
      setError("");
      setMessage("");

      await api.patch(
        `/api/social/metrics/${metricId}/request-verification`,
        {}
      );

      setMessage(
        "Solicitud de verificación enviada a ST.MARIA."
      );

      await loadSocialAccounts();
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudo solicitar la verificación."
      );
    }
  }

  async function handleDeleteSocial(accountId) {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar esta red social?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(
        `/api/social/accounts/${accountId}`
      );

      setMessage("Red social eliminada.");

      await loadSocialAccounts();
    } catch (err) {
      console.error(err);

      setError(
        err?.data?.message ||
          err?.message ||
          "No se pudo eliminar la red social."
      );
    }
  }

  const verifiedAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const metric = account.metrics?.[0];

        return (
          metric?.verificationStatus ===
          "VERIFIED"
        );
      }).length,
    [accounts]
  );

  const totalFollowers = useMemo(
    () =>
      accounts.reduce((total, account) => {
        const metric = account.metrics?.[0];

        return (
          total +
          Number(metric?.followers || 0)
        );
      }, 0),
    [accounts]
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Cargando perfil...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">
          No se pudo cargar el perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Mi perfil
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Gestiona tus datos, redes sociales y
          métricas profesionales.
        </p>
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      {/* RESUMEN */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Seguidores totales
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {formatNumber(totalFollowers)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Entre tus redes registradas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Redes conectadas
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {accounts.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Redes sociales registradas
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Métricas verificadas
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {verifiedAccounts}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Verificadas por ST.MARIA
          </p>
        </div>
      </section>

      {/* PERFIL */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Información personal
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Esta información aparecerá en tu perfil
            dentro de ST.MARIA.
          </p>
        </div>

        <form
          onSubmit={handleSaveProfile}
          className="space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Nombre
              </label>

              <input
                value={profile.name || ""}
                onChange={(event) =>
                  updateProfileField(
                    "name",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Usuario
              </label>

              <input
                value={profile.username || ""}
                onChange={(event) =>
                  updateProfileField(
                    "username",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              value={profile.email || ""}
              disabled
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Biografía
            </label>

            <textarea
              value={profile.bio || ""}
              onChange={(event) =>
                updateProfileField(
                  "bio",
                  event.target.value
                )
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Cuéntanos quién eres..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Ubicación
              </label>

              <input
                value={profile.location || ""}
                onChange={(event) =>
                  updateProfileField(
                    "location",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Categorías
              </label>

              <input
                value={
                  Array.isArray(profile.categories)
                    ? profile.categories.join(", ")
                    : profile.categories || ""
                }
                onChange={(event) =>
                  updateProfileField(
                    "categories",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                placeholder="Fitness, tecnología, lifestyle..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Plataformas
            </label>

            <input
              value={
                Array.isArray(profile.platforms)
                  ? profile.platforms.join(", ")
                  : profile.platforms || ""
              }
              onChange={(event) =>
                updateProfileField(
                  "platforms",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Instagram, TikTok, YouTube..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>

      {/* REDES SOCIALES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Redes sociales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Añade tus perfiles y mantén tus métricas
              actualizadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddSocial((current) => !current)
            }
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {showAddSocial
              ? "Cancelar"
              : "+ Añadir red social"}
          </button>
        </div>

        {showAddSocial && (
          <form
            onSubmit={handleAddSocial}
            className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Plataforma
                </label>

                <select
                  value={newSocial.platform}
                  onChange={(event) =>
                    setNewSocial((current) => ({
                      ...current,
                      platform:
                        event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {Object.entries(
                    PLATFORM_LABELS
                  ).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Usuario
                </label>

                <input
                  value={newSocial.username}
                  onChange={(event) =>
                    setNewSocial(
                      (current) => ({
                        ...current,
                        username:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="@usuario"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  URL del perfil
                </label>

                <input
                  value={newSocial.profileUrl}
                  onChange={(event) =>
                    setNewSocial(
                      (current) => ({
                        ...current,
                        profileUrl:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Añadir cuenta
              </button>
            </div>
          </form>
        )}

        {accountsLoading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Cargando redes sociales...
          </div>
        ) : accounts.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="font-medium text-slate-700">
              Todavía no tienes redes sociales añadidas.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Añade Instagram, TikTok, YouTube u
              otras plataformas para empezar a construir
              tu perfil profesional.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {accounts.map((account) => {
              const metric =
                account.metrics?.[0] || null;

              const form =
                metricForms[account.id] || {};

              const isExpanded =
                expandedAccount === account.id;

              return (
                <div
                  key={account.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white">
                          {platformIcon(
                            account.platform
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">
                              {
                                PLATFORM_LABELS[
                                  account.platform
                                ]
                              }
                            </h3>

                            {metric && (
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${verificationClasses(
                                  metric.verificationStatus
                                )}`}
                              >
                                {
                                  VERIFICATION_LABELS[
                                    metric
                                      .verificationStatus
                                  ]
                                }
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            @{account.username}
                          </p>

                          {account.profileUrl && (
                            <a
                              href={
                                account.profileUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs font-medium text-slate-600 underline"
                            >
                              Ver perfil
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAccount(
                              isExpanded
                                ? null
                                : account.id
                            )
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {isExpanded
                            ? "Ocultar métricas"
                            : "Gestionar métricas"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSocial(
                              account.id
                            )
                          }
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {metric && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">
                            Seguidores
                          </p>

                          <p className="mt-1 text-xl font-bold text-slate-950">
                            {formatNumber(
                              metric.followers
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">
                            Engagement
                          </p>

                          <p className="mt-1 text-xl font-bold text-slate-950">
                            {formatPercentage(
                              metric.engagementRate
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">
                            Visualizaciones
                          </p>

                          <p className="mt-1 text-xl font-bold text-slate-950">
                            {formatNumber(
                              metric.views
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-500">
                            Actualizado
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formatDate(
                              metric.recordedAt
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-5">
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* NUEVA MÉTRICA */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <h4 className="font-semibold text-slate-950">
                            Actualizar métricas
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            Cada actualización crea un
                            nuevo registro histórico.
                          </p>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {[
                              [
                                "followers",
                                "Seguidores",
                              ],
                              [
                                "following",
                                "Siguiendo",
                              ],
                              [
                                "posts",
                                "Publicaciones",
                              ],
                              [
                                "likes",
                                "Likes",
                              ],
                              [
                                "comments",
                                "Comentarios",
                              ],
                              [
                                "views",
                                "Visualizaciones",
                              ],
                              [
                                "reach",
                                "Alcance",
                              ],
                              [
                                "impressions",
                                "Impresiones",
                              ],
                            ].map(
                              ([
                                field,
                                label,
                              ]) => (
                                <div key={field}>
                                  <label className="text-xs font-medium text-slate-600">
                                    {label}
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      form[
                                        field
                                      ] ?? ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateMetricField(
                                        account.id,
                                        field,
                                        event.target
                                          .value
                                      )
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                  />
                                </div>
                              )
                            )}

                            <div className="sm:col-span-2">
                              <label className="text-xs font-medium text-slate-600">
                                Engagement rate (%)
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  form.engagementRate ??
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateMetricField(
                                    account.id,
                                    "engagementRate",
                                    event.target
                                      .value
                                  )
                                }
                                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                placeholder="4.82"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddMetric(
                                account
                              )
                            }
                            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Guardar métricas
                          </button>
                        </div>

                        {/* ESTADO */}
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h4 className="font-semibold text-slate-950">
                              Verificación
                            </h4>

                            {!metric ? (
                              <p className="mt-3 text-sm text-slate-500">
                                Añade primero las métricas
                                de esta cuenta.
                              </p>
                            ) : (
                              <>
                                <div className="mt-4">
                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${verificationClasses(
                                      metric.verificationStatus
                                    )}`}
                                  >
                                    {
                                      VERIFICATION_LABELS[
                                        metric
                                          .verificationStatus
                                      ]
                                    }
                                  </span>
                                </div>

                                <p className="mt-3 text-sm text-slate-500">
                                  Última actualización:{" "}
                                  <strong className="text-slate-700">
                                    {formatDate(
                                      metric.recordedAt
                                    )}
                                  </strong>
                                </p>

                                {metric.verificationStatus ===
                                  "VERIFIED" && (
                                  <p className="mt-3 text-sm text-emerald-700">
                                    ✓ Estas métricas han
                                    sido verificadas por
                                    ST.MARIA.
                                  </p>
                                )}

                                {metric.verificationStatus ===
                                  "UNVERIFIED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRequestVerification(
                                        metric.id
                                      )
                                    }
                                    className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                  >
                                    Solicitar verificación
                                  </button>
                                )}

                                {metric.verificationStatus ===
                                  "REJECTED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRequestVerification(
                                        metric.id
                                      )
                                    }
                                    className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                                  >
                                    Volver a solicitar
                                    verificación
                                  </button>
                                )}

                                {metric.verificationStatus ===
                                  "PENDING" && (
                                  <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                                    Tu solicitud está
                                    pendiente de revisión
                                    por ST.MARIA.
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h4 className="font-semibold text-slate-950">
                              Fuente de los datos
                            </h4>

                            <p className="mt-2 text-sm text-slate-500">
                              {metric?.source ===
                                "STMARIA" &&
                                "Métricas verificadas directamente por ST.MARIA."}

                              {metric?.source ===
                                "API" &&
                                "Métricas obtenidas mediante una integración con la plataforma."}

                              {metric?.source ===
                                "CREATOR" &&
                                "Métricas introducidas manualmente por el creador."}

                              {!metric &&
                                "Todavía no hay métricas registradas."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
