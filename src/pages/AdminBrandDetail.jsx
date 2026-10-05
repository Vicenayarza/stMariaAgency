import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

function getAccessLabel(accessMode) {
  switch (accessMode) {
    case "SELF_MANAGED":
      return "Autogestionado";
    case "PORTAL":
      return "Portal cliente";
    case "MANAGED":
    default:
      return "Gestionado";
  }
}
const ACCESS_PRESETS = {
  CONSULTA: {
    label: "Consulta",
    description:
      "El cliente puede consultar campañas, propuestas, entregables y resultados.",

    accessMode: "PORTAL",
    role: "VIEWER",

    canViewCampaigns: true,
    canCreateCampaigns: false,
    canEditCampaigns: false,

    canViewProposals: true,
    canApproveCreators: false,

    canViewDeliverables: true,
    canApproveContent: false,

    canViewResults: true,
    canExportReports: false,

    canDiscoverCreators: false,
    canContactCreators: false,
    canSelectCreators: false,
  },

  APROBACIONES: {
    label: "Aprobaciones",
    description:
      "Puede consultar la campaña y aprobar creadores y contenidos.",

    accessMode: "PORTAL",
    role: "MARKETING",

    canViewCampaigns: true,
    canCreateCampaigns: false,
    canEditCampaigns: false,

    canViewProposals: true,
    canApproveCreators: true,

    canViewDeliverables: true,
    canApproveContent: true,

    canViewResults: true,
    canExportReports: true,

    canDiscoverCreators: false,
    canContactCreators: false,
    canSelectCreators: false,
  },

  AUTOGESTION: {
    label: "Autogestionado",
    description:
      "El cliente puede crear y editar campañas y trabajar directamente con creadores.",

    accessMode: "SELF_MANAGED",
    role: "OWNER",

    canViewCampaigns: true,
    canCreateCampaigns: true,
    canEditCampaigns: true,

    canViewProposals: true,
    canApproveCreators: true,

    canViewDeliverables: true,
    canApproveContent: true,

    canViewResults: true,
    canExportReports: true,

    canDiscoverCreators: true,
    canContactCreators: true,
    canSelectCreators: true,
  },
};

function AdminBrandDetail() {
  const { id } = useParams();

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAccessForm, setShowAccessForm] =
  useState(false);

const [accessLoading, setAccessLoading] =
  useState(false);

const [accessError, setAccessError] =
  useState("");

const [accessForm, setAccessForm] = useState({
  name: "",
  email: "",
  password: "",
  preset: "CONSULTA",
});
const [editAccessOpen, setEditAccessOpen] =
  useState(false);

const [editAccessLoading, setEditAccessLoading] =
  useState(false);

const [editAccessError, setEditAccessError] =
  useState("");

const [editAccessSuccess, setEditAccessSuccess] =
  useState("");

const [editAccessForm, setEditAccessForm] =
  useState(null);

  useEffect(() => {
    loadBrand();
  }, [id]);

  async function loadBrand() {
    try {
      setLoading(true);
      setError("");

      const data = await api.get(
        `/api/admin/brands/${id}`
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
  async function handleGiveAccess(event) {
  event.preventDefault();

  try {
    setAccessLoading(true);
    setAccessError("");

    const preset =
      ACCESS_PRESETS[accessForm.preset];

    await api.post(
      `/api/admin/brands/${brand.id}/access`,
      {
        name: accessForm.name,
        email: accessForm.email,
        password: accessForm.password,

        accessMode: preset.accessMode,
        role: preset.role,

        canViewCampaigns:
          preset.canViewCampaigns,

        canCreateCampaigns:
          preset.canCreateCampaigns,

        canEditCampaigns:
          preset.canEditCampaigns,

        canViewProposals:
          preset.canViewProposals,

        canApproveCreators:
          preset.canApproveCreators,

        canViewDeliverables:
          preset.canViewDeliverables,

        canApproveContent:
          preset.canApproveContent,

        canViewResults:
          preset.canViewResults,

        canExportReports:
          preset.canExportReports,

        canDiscoverCreators:
          preset.canDiscoverCreators,

        canContactCreators:
          preset.canContactCreators,

        canSelectCreators:
          preset.canSelectCreators,
      }
    );

    setShowAccessForm(false);

    setAccessForm({
      name: "",
      email: "",
      password: "",
      preset: "CONSULTA",
    });

    /*
     * Recargamos el cliente.
     *
     * Así veremos inmediatamente:
     * - usuario
     * - email
     * - tipo de acceso
     * - estado
     */
    await loadBrand();
  } catch (err) {
    console.error(err);

    if (
      err?.data?.error ===
      "EMAIL_ALREADY_EXISTS"
    ) {
      setAccessError(
        "Ya existe una cuenta con este email."
      );
    } else if (
      err?.data?.error ===
      "PASSWORD_TOO_SHORT"
    ) {
      setAccessError(
        "La contraseña debe tener al menos 8 caracteres."
      );
    } else {
      setAccessError(
        err?.data?.message ||
          err?.message ||
          "No se ha podido crear el acceso."
      );
    }
  } finally {
    setAccessLoading(false);
  }
}
function openEditAccess() {
  const member = brand.members?.[0];

  if (!member) {
    return;
  }

  setEditAccessForm({
    accessMode:
      brand.accessMode || "PORTAL",

    role:
      member.role || "VIEWER",

    canViewCampaigns:
      member.canViewCampaigns ?? true,

    canCreateCampaigns:
      member.canCreateCampaigns ?? false,

    canEditCampaigns:
      member.canEditCampaigns ?? false,

    canViewProposals:
      member.canViewProposals ?? true,

    canApproveCreators:
      member.canApproveCreators ?? false,

    canViewDeliverables:
      member.canViewDeliverables ?? true,

    canApproveContent:
      member.canApproveContent ?? false,

    canViewResults:
      member.canViewResults ?? true,

    canExportReports:
      member.canExportReports ?? false,

    canDiscoverCreators:
      member.canDiscoverCreators ?? false,

    canContactCreators:
      member.canContactCreators ?? false,

    canSelectCreators:
      member.canSelectCreators ?? false,
  });

  setEditAccessError("");
  setEditAccessSuccess("");
  setEditAccessOpen(true);
}

function applyEditPreset(presetKey) {
  const preset =
    ACCESS_PRESETS[presetKey];

  if (!preset) {
    return;
  }

  setEditAccessForm({
    accessMode: preset.accessMode,
    role: preset.role,

    canViewCampaigns:
      preset.canViewCampaigns,

    canCreateCampaigns:
      preset.canCreateCampaigns,

    canEditCampaigns:
      preset.canEditCampaigns,

    canViewProposals:
      preset.canViewProposals,

    canApproveCreators:
      preset.canApproveCreators,

    canViewDeliverables:
      preset.canViewDeliverables,

    canApproveContent:
      preset.canApproveContent,

    canViewResults:
      preset.canViewResults,

    canExportReports:
      preset.canExportReports,

    canDiscoverCreators:
      preset.canDiscoverCreators,

    canContactCreators:
      preset.canContactCreators,

    canSelectCreators:
      preset.canSelectCreators,
  });
}

function toggleEditPermission(permission) {
  setEditAccessForm((current) => ({
    ...current,
    [permission]: !current[permission],
  }));
}

async function handleUpdateAccess(event) {
  event.preventDefault();

  const member = brand.members?.[0];

  if (!member || !editAccessForm) {
    return;
  }

  try {
    setEditAccessLoading(true);
    setEditAccessError("");
    setEditAccessSuccess("");

    await api.patch(
      `/api/admin/brands/${brand.id}/members/${member.id}`,
      editAccessForm
    );

    setEditAccessSuccess(
      "Los permisos se han actualizado correctamente."
    );

    await loadBrand();
  } catch (err) {
    console.error(err);

    setEditAccessError(
      err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "No se han podido actualizar los permisos."
    );
  } finally {
    setEditAccessLoading(false);
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
          {error || "Cliente no encontrado."}
        </div>
      </div>
    );
  }

  /*
   * Para el MVP utilizamos el primer miembro
   * como contacto principal de la empresa.
   *
   * Más adelante podremos marcar explícitamente
   * un contacto principal.
   */
  const primaryMember =
    brand.members?.[0] ?? null;

  const contact =
    primaryMember?.user ?? null;

  const hasPortalAccess =
    (brand.members?.length ?? 0) > 0;

  return (
    <div>
      <Link
        to="/admin/brands"
        className="text-[10px] uppercase tracking-[0.14em] text-black/40 hover:text-black"
      >
        ← Volver a clientes
      </Link>

      {/* HEADER */}
      <div className="mt-6 mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">
            Cliente
          </p>

          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            {brand.companyName}
          </h1>

          <p className="mt-3 text-sm text-black/45">
            Información, campañas y actividad
            del cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/admin/brands/${brand.id}/campaigns/new`}
            className="rounded-full bg-black px-5 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black/80"
          >
            + Nueva campaña
          </Link>

          <span className="inline-flex rounded-full bg-black/5 px-4 py-2 text-[9px] uppercase tracking-[0.12em] text-black/50">
            {getAccessLabel(brand.accessMode)}
          </span>

          <span
            className={`inline-flex rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.12em] ${
              hasPortalAccess
                ? "bg-black text-white"
                : "bg-black/5 text-black/45"
            }`}
          >
            {hasPortalAccess
              ? "Con acceso"
              : "Sin acceso"}
          </span>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* EMPRESA */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Empresa
          </p>

          <p className="mt-4 text-lg font-medium">
            {brand.companyName}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Sector
              </p>

              <p className="mt-1 text-sm">
                {brand.industry ||
                  "No especificado"}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Web
              </p>

              <p className="mt-1 break-all text-sm">
                {brand.website ||
                  "No especificada"}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                Gestión
              </p>

              <p className="mt-1 text-sm">
                {getAccessLabel(
                  brand.accessMode
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CONTACTO / ACCESO */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              Contacto y acceso
            </p>

            {primaryMember && (
              <span className="rounded-full bg-black/5 px-3 py-1 text-[8px] uppercase tracking-[0.1em] text-black/45">
                {primaryMember.role}
              </span>
            )}
          </div>

          {contact ? (
            <>
              <p className="mt-4 text-lg font-medium">
                {contact.name}
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm">
                    {contact.email}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
                    Estado
                  </p>

                  <p className="mt-1 text-sm">
                    {contact.status}
                  </p>
                </div>
                <button
  type="button"
  onClick={openEditAccess}
  className="mt-2 rounded-xl border border-black/10 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
>
  Gestionar acceso
</button>
              </div>
            </>
          ) : (
            <div className="mt-5">
              <p className="text-sm font-medium">
                Sin acceso al portal
              </p>

              <p className="mt-2 text-sm leading-6 text-black/40">
                ST.MARY AGENCY gestiona actualmente
                este cliente. No existe ninguna
                cuenta de usuario vinculada.
              </p>

              {/*
                Este botón lo conectaremos en
                el siguiente paso.
              */}
              <button
                  type="button"
                  onClick={() =>
                    setShowAccessForm(true)
                  }
                  className="mt-6 rounded-xl border border-black/10 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
                >
                  Dar acceso
              </button>
            </div>
          )}
        </div>

        {/* ACTIVIDAD */}
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Actividad
          </p>

          <p className="mt-4 text-3xl font-medium">
            {brand.campaigns?.length || 0}
          </p>

          <p className="mt-1 text-sm text-black/40">
            campañas creadas
          </p>

          <div className="mt-6 border-t border-black/5 pt-5">
            <p className="text-[9px] uppercase tracking-[0.14em] text-black/30">
              Usuarios con acceso
            </p>

            <p className="mt-1 text-lg font-medium">
              {brand.members?.length ?? 0}
            </p>
          </div>
        </div>
      </div>
      {editAccessOpen && editAccessForm && primaryMember && (
  <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 md:p-8">
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Acceso cliente
        </p>

        <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">
          Gestionar acceso de {brand.companyName}
        </h2>

        <p className="mt-2 text-sm text-black/45">
          {contact?.name} · {contact?.email}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setEditAccessOpen(false);
          setEditAccessError("");
          setEditAccessSuccess("");
        }}
        className="text-sm text-black/35 transition hover:text-black"
      >
        ✕
      </button>
    </div>

    <form
      onSubmit={handleUpdateAccess}
      className="mt-8"
    >
      {/* PRESETS */}

      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Configuración rápida
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {Object.entries(ACCESS_PRESETS).map(
            ([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  applyEditPreset(key)
                }
                className="rounded-2xl border border-black/10 p-5 text-left transition hover:border-black/30 hover:bg-black/[0.02]"
              >
                <p className="text-sm font-medium">
                  {preset.label}
                </p>

                <p className="mt-2 text-xs leading-5 text-black/40">
                  {preset.description}
                </p>
              </button>
            )
          )}
        </div>
      </div>

      {/* GENERAL */}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
            Modo de acceso
          </label>

          <select
            value={editAccessForm.accessMode}
            onChange={(event) =>
              setEditAccessForm({
                ...editAccessForm,
                accessMode:
                  event.target.value,
              })
            }
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="PORTAL">
              Portal cliente
            </option>

            <option value="SELF_MANAGED">
              Autogestionado
            </option>
          </select>
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
            Rol
          </label>

          <select
            value={editAccessForm.role}
            onChange={(event) =>
              setEditAccessForm({
                ...editAccessForm,
                role: event.target.value,
              })
            }
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="VIEWER">
              Viewer
            </option>

            <option value="MARKETING">
              Marketing
            </option>

            <option value="ADMIN">
              Admin
            </option>

            <option value="OWNER">
              Owner
            </option>
          </select>
        </div>
      </div>

      {/* PERMISOS */}

      <div className="mt-8">
        <div className="mb-5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
            Permisos
          </p>

          <p className="mt-2 text-xs text-black/40">
            Puedes utilizar una configuración rápida
            y después personalizar permisos
            individualmente.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PermissionGroup
            title="Campañas"
            form={editAccessForm}
            toggle={toggleEditPermission}
            permissions={[
              [
                "canViewCampaigns",
                "Ver campañas",
              ],
              [
                "canCreateCampaigns",
                "Crear campañas",
              ],
              [
                "canEditCampaigns",
                "Editar campañas",
              ],
            ]}
          />

          <PermissionGroup
            title="Propuestas"
            form={editAccessForm}
            toggle={toggleEditPermission}
            permissions={[
              [
                "canViewProposals",
                "Ver propuestas",
              ],
              [
                "canApproveCreators",
                "Aprobar creadores",
              ],
            ]}
          />

          <PermissionGroup
            title="Contenido"
            form={editAccessForm}
            toggle={toggleEditPermission}
            permissions={[
              [
                "canViewDeliverables",
                "Ver entregables",
              ],
              [
                "canApproveContent",
                "Aprobar contenido",
              ],
            ]}
          />

          <PermissionGroup
            title="Resultados"
            form={editAccessForm}
            toggle={toggleEditPermission}
            permissions={[
              [
                "canViewResults",
                "Ver resultados",
              ],
              [
                "canExportReports",
                "Exportar informes",
              ],
            ]}
          />

          <PermissionGroup
            title="Creadores"
            form={editAccessForm}
            toggle={toggleEditPermission}
            permissions={[
              [
                "canDiscoverCreators",
                "Descubrir creadores",
              ],
              [
                "canContactCreators",
                "Contactar creadores",
              ],
              [
                "canSelectCreators",
                "Seleccionar creadores",
              ],
            ]}
          />
        </div>
      </div>

      {editAccessError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {editAccessError}
        </div>
      )}

      {editAccessSuccess && (
        <div className="mt-6 rounded-xl border border-black/10 bg-black/[0.025] px-4 py-3 text-sm">
          {editAccessSuccess}
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            setEditAccessOpen(false)
          }
          className="rounded-xl border border-black/10 px-5 py-3 text-[10px] uppercase tracking-[0.12em] transition hover:bg-black/5"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={editAccessLoading}
          className="rounded-xl bg-black px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {editAccessLoading
            ? "Guardando..."
            : "Guardar cambios"}
        </button>
      </div>
    </form>
  </div>
)}
      {showAccessForm && (
  <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 md:p-8">
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Acceso cliente
        </p>

        <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">
          Dar acceso a {brand.companyName}
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-black/45">
          Crea una cuenta para que el cliente
          pueda acceder a su espacio.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setShowAccessForm(false);
          setAccessError("");
        }}
        className="text-sm text-black/35 transition hover:text-black"
      >
        ✕
      </button>
    </div>

    <form
      onSubmit={handleGiveAccess}
      className="mt-8"
    >
      {/* DATOS */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
            Nombre
          </label>

          <input
            type="text"
            required
            value={accessForm.name}
            onChange={(event) =>
              setAccessForm({
                ...accessForm,
                name: event.target.value,
              })
            }
            placeholder="Nombre del contacto"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
          />
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
            Email
          </label>

          <input
            type="email"
            required
            value={accessForm.email}
            onChange={(event) =>
              setAccessForm({
                ...accessForm,
                email: event.target.value,
              })
            }
            placeholder="cliente@empresa.com"
            className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="text-[9px] uppercase tracking-[0.14em] text-black/40">
          Contraseña temporal
        </label>

        <input
          type="password"
          required
          minLength={8}
          value={accessForm.password}
          onChange={(event) =>
            setAccessForm({
              ...accessForm,
              password:
                event.target.value,
            })
          }
          placeholder="Mínimo 8 caracteres"
          className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-black/40 md:max-w-md"
        />

        <p className="mt-2 text-xs text-black/35">
          Temporalmente utilizaremos una
          contraseña creada por ST.MARY AGENCY .
          Después lo sustituiremos por
          invitación por email.
        </p>
      </div>

      {/* TIPO DE ACCESO */}
      <div className="mt-8">
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Nivel de acceso
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {Object.entries(
            ACCESS_PRESETS
          ).map(([key, preset]) => {
            const selected =
              accessForm.preset === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setAccessForm({
                    ...accessForm,
                    preset: key,
                  })
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  selected
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white hover:border-black/30"
                }`}
              >
                <p className="text-sm font-medium">
                  {preset.label}
                </p>

                <p
                  className={`mt-2 text-xs leading-5 ${
                    selected
                      ? "text-white/60"
                      : "text-black/40"
                  }`}
                >
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* RESUMEN PERMISOS */}
      <div className="mt-6 rounded-2xl bg-black/[0.025] p-5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
          El cliente podrá
        </p>

        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          {accessForm.preset ===
            "CONSULTA" && (
            <>
              <p>✓ Ver campañas</p>
              <p>✓ Ver propuestas</p>
              <p>✓ Ver entregables</p>
              <p>✓ Ver resultados</p>
            </>
          )}

          {accessForm.preset ===
            "APROBACIONES" && (
            <>
              <p>✓ Ver campañas</p>
              <p>✓ Ver propuestas</p>
              <p>✓ Aprobar creadores</p>
              <p>✓ Revisar entregables</p>
              <p>✓ Aprobar contenido</p>
              <p>✓ Exportar resultados</p>
            </>
          )}

          {accessForm.preset ===
            "AUTOGESTION" && (
            <>
              <p>✓ Crear campañas</p>
              <p>✓ Editar campañas</p>
              <p>✓ Buscar creadores</p>
              <p>✓ Seleccionar creadores</p>
              <p>✓ Aprobar contenido</p>
              <p>✓ Consultar resultados</p>
            </>
          )}
        </div>
      </div>

      {accessError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {accessError}
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAccessForm(false);
            setAccessError("");
          }}
          className="rounded-xl border border-black/10 px-5 py-3 text-[10px] uppercase tracking-[0.12em] transition hover:bg-black/5"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={accessLoading}
          className="rounded-xl bg-black px-6 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {accessLoading
            ? "Creando acceso..."
            : "Crear acceso"}
        </button>
      </div>
    </form>
  </div>
)}

      {/* CAMPAÑAS */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="border-b border-black/10 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
            Campañas del cliente
          </p>
        </div>

        {!brand.campaigns?.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-black/40">
              Este cliente todavía no tiene
              campañas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {brand.campaigns.map(
              (campaign) => (
                <Link
                  key={campaign.id}
                  to={`/admin/campaigns/${campaign.id}`}
                  className="group flex flex-col justify-between gap-4 px-6 py-5 transition hover:bg-black/[0.02] md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {campaign.name}
                    </p>

                    <p className="mt-1 text-xs text-black/35">
                      {campaign.category ||
                        "Sin categoría"}

                      {campaign.platform
                        ? ` · ${campaign.platform}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                        Presupuesto
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {Number(
                          campaign.budget
                        ).toLocaleString(
                          "es-ES",
                          {
                            style:
                              "currency",
                            currency:
                              "EUR",
                          }
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-black/30">
                        Creadores
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {campaign._count
                          ?.creators ?? 0}
                      </p>
                    </div>

                    <span className="rounded-full bg-black/5 px-3 py-1 text-[9px] uppercase tracking-[0.1em] text-black/50">
                      {campaign.status}
                    </span>

                    <span className="text-lg text-black/25 transition group-hover:text-black">
                      →
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function PermissionGroup({
  title,
  form,
  toggle,
  permissions,
}) {
  return (
    <div className="rounded-2xl border border-black/10 p-5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-black/35">
        {title}
      </p>

      <div className="mt-4 space-y-3">
        {permissions.map(
          ([permission, label]) => (
            <label
              key={permission}
              className="flex cursor-pointer items-center justify-between gap-4"
            >
              <span className="text-sm">
                {label}
              </span>

              <input
                type="checkbox"
                checked={
                  Boolean(form[permission])
                }
                onChange={() =>
                  toggle(permission)
                }
                className="h-4 w-4"
              />
            </label>
          )
        )}
      </div>
    </div>
  );
}
export default AdminBrandDetail;