
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const initialSettings = {

  emailNotifications: true,
  campaignNotifications: true,
};

const inputClass =
  "w-full rounded-xl border border-[#D8C3A5] bg-white px-4 py-3 text-sm text-[#3E2B1B] outline-none transition focus:border-[#8A6340]";

function AccountSettings() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [accountName, setAccountName] = useState(user?.name ?? "");
const [savingAccount, setSavingAccount] = useState(false);
const [accountMessage, setAccountMessage] = useState("");
const [accountError, setAccountError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
  setAccountName(user?.name ?? "");
}, [user?.name]);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await api.get("/auth/settings");

        if (active) {
          setSettings({
            ...initialSettings,
            ...response.settings,
          });
        }
      } catch (error) {
        console.error("Error al cargar ajustes:", error);

        if (active) {
          setSettingsError(
            "No se han podido cargar tus preferencias."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSettingsMessage("");
    setSettingsError("");
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();

    setSaving(true);
    setSettingsMessage("");
    setSettingsError("");

    try {
    const response = await api.patch("/auth/settings", {
  emailNotifications: settings.emailNotifications,
  campaignNotifications: settings.campaignNotifications,
});

      setSettings(response.settings);
      setSettingsMessage(
        "Tus preferencias se han guardado correctamente."
      );
    } catch (error) {
      console.error("Error al guardar ajustes:", error);

      setSettingsError(
        "No se han podido guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordError("");

    if (newPassword.length < 12) {
      setPasswordError(
        "La nueva contraseña debe tener al menos 12 caracteres."
      );
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 1024) {
      setPasswordError(
        "La contraseña es demasiado larga."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "Las nuevas contraseñas no coinciden."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "La nueva contraseña debe ser diferente de la actual."
      );
      return;
    }

    setChangingPassword(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // El backend invalida las sesiones después del cambio.
      await logout().catch(() => {});

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Contraseña actualizada. Inicia sesión de nuevo.",
        },
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);

      const errorCode = error.response?.data?.error;

      if (errorCode === "INVALID_CURRENT_PASSWORD") {
        setPasswordError(
          "La contraseña actual no es correcta."
        );
      } else if (errorCode === "INVALID_SESSION") {
        setPasswordError(
          "Tu sesión ha caducado. Inicia sesión de nuevo."
        );
      } else {
        setPasswordError(
          "No se ha podido cambiar la contraseña. Comprueba los datos e inténtalo de nuevo."
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };
const handleSaveAccount = async (event) => {
  event.preventDefault();

  setAccountMessage("");
  setAccountError("");

  const name = accountName.trim();

  if (name.length < 2 || name.length > 100) {
    setAccountError(
      "El nombre debe tener entre 2 y 100 caracteres."
    );
    return;
  }

  try {
    setSavingAccount(true);

    const response = await api.patch("/auth/me", {
      name,
    });

    setAccountName(response.user.name);

    await refreshUser();

    setAccountMessage("Nombre actualizado correctamente.");
  } catch (error) {
    setAccountError(
      error.data?.message ||
        error.message ||
        "No se ha podido actualizar el nombre."
    );
  } finally {
    setSavingAccount(false);
  }
};

  return (
    <div className="mx-auto max-w-5xl text-[#3E2B1B]">
      <div className="mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8A6340]">
          Mi cuenta
        </p>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] md:text-5xl">
          Ajustes
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#6F6052]">
          Gestiona tus preferencias, notificaciones y seguridad
          de acceso a ST.MARY Agency.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#D8C3A5] bg-white/60 p-8 text-sm text-[#6F6052]">
          Cargando ajustes...
        </div>
      ) : (
        <div className="space-y-8">
          {/* PREFERENCIAS */}
          <form
            onSubmit={handleSaveSettings}
            className="overflow-hidden rounded-2xl border border-[#D8C3A5] bg-white/70"
          >
            <section className="mb-8 rounded-2xl border border-[#D8C3A5] bg-white p-6 md:p-8">
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-[#3E2B1B]">
      Información de cuenta
    </h2>

    <p className="mt-2 text-sm text-[#6F6052]">
      Consulta y actualiza tus datos personales.
    </p>
  </div>

  <form onSubmit={handleSaveAccount} className="space-y-5">
    <div>
      <label
        htmlFor="account-name"
        className="mb-2 block text-sm font-medium text-[#3E2B1B]"
      >
        Nombre
      </label>

      <input
        id="account-name"
        type="text"
        value={accountName}
        onChange={(event) => setAccountName(event.target.value)}
        minLength={2}
        maxLength={100}
        required
        className="w-full rounded-xl border border-[#D8C3A5] bg-[#F4EDE2]/40 px-4 py-3 text-sm text-[#3E2B1B] outline-none focus:border-[#8A6340]"
      />
    </div>

    <div>
      <label
        htmlFor="account-email"
        className="mb-2 block text-sm font-medium text-[#3E2B1B]"
      >
        Correo electrónico
      </label>

      <input
        id="account-email"
        type="email"
        value={user?.email ?? ""}
        readOnly
        className="w-full cursor-not-allowed rounded-xl border border-[#D8C3A5] bg-[#EBDCC4]/40 px-4 py-3 text-sm text-[#6F6052]"
      />

      <p className="mt-2 text-xs text-[#8A6340]">
        El correo electrónico no se puede modificar desde aquí.
      </p>
    </div>

    {accountError && (
      <p role="alert" className="text-sm text-red-600">
        {accountError}
      </p>
    )}

    {accountMessage && (
      <p role="status" className="text-sm text-green-700">
        {accountMessage}
      </p>
    )}

    <button
      type="submit"
      disabled={savingAccount}
      className="rounded-xl bg-[#8A6340] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5A3E28] disabled:opacity-50"
    >
      {savingAccount ? "Guardando..." : "Guardar información"}
    </button>
  </form>
</section>
             {/* NOTIFICACIONES */}
            <div className="p-6 md:p-8">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8A6340]">
                Comunicación
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                Notificaciones
              </h2>

              <p className="mt-2 text-sm text-[#6F6052]">
                Elige qué comunicaciones deseas recibir.
              </p>

              <div className="mt-7 divide-y divide-[#D8C3A5]">
                <label className="flex cursor-pointer items-center justify-between gap-4 py-5">
                  <span>
                    <span className="block text-sm font-medium">
                      Notificaciones por correo
                    </span>
                    <span className="mt-1 block text-xs text-[#6F6052]">
                      Recibir avisos y novedades por email.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(event) =>
                      updateSetting(
                        "emailNotifications",
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 accent-[#8A6340]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-4 py-5">
                  <span>
                    <span className="block text-sm font-medium">
                      Campañas y colaboraciones
                    </span>
                    <span className="mt-1 block text-xs text-[#6F6052]">
                      Avisos relacionados con campañas y oportunidades.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={settings.campaignNotifications}
                    onChange={(event) =>
                      updateSetting(
                        "campaignNotifications",
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 accent-[#8A6340]"
                  />
                </label>

                <div className="flex items-center justify-between gap-4 py-5">
                  <span>
                    <span className="block text-sm font-medium">
                      Avisos de seguridad
                    </span>
                    <span className="mt-1 block text-xs text-[#6F6052]">
                      Comunicaciones esenciales para proteger tu cuenta.
                    </span>
                  </span>

                  <span className="rounded-full bg-[#EBDCC4] px-3 py-1 text-[10px] font-medium text-[#5A3E28]">
                    Siempre activos
                  </span>
                </div>
              </div>

              {settingsError && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {settingsError}
                </p>
              )}

              {settingsMessage && (
                <p role="status" className="mt-4 text-sm text-green-700">
                  {settingsMessage}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#5A3E28] px-7 py-3 text-xs font-medium text-white transition-colors hover:bg-[#8A6340] disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar preferencias"}
                </button>
              </div>
            </div>
          </form>

          {/* SEGURIDAD */}
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-[#D8C3A5] bg-white/70 p-6 md:p-8"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8A6340]">
              Protección de cuenta
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
              Seguridad
            </h2>

            <p className="mt-2 text-sm text-[#6F6052]">
              Cambia tu contraseña de acceso. Por seguridad,
              tendrás que iniciar sesión de nuevo.
            </p>

            <div className="mt-7 grid gap-5">
              <div>
                <label
                  htmlFor="current-password"
                  className="mb-2 block text-xs font-medium"
                >
                  Contraseña actual
                </label>

                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-xs font-medium"
                >
                  Nueva contraseña
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-[#6F6052]">
                  Mínimo 12 caracteres.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-medium"
                >
                  Confirmar nueva contraseña
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {passwordError && (
              <p role="alert" className="mt-5 text-sm text-red-700">
                {passwordError}
              </p>
            )}

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-full bg-[#5A3E28] px-7 py-3 text-xs font-medium text-white transition-colors hover:bg-[#8A6340] disabled:opacity-50"
              >
                {changingPassword
                  ? "Actualizando..."
                  : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;
