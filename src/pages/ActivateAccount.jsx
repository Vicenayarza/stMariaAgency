
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace de activación no es válido.");
      return;
    }

    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/activate-account", {
        token,
        password,
      });

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const code = err?.response?.data?.error;

      if (
        code === "INVALID_OR_EXPIRED_TOKEN" ||
        code === "INVALID_ACTIVATION_TOKEN"
      ) {
        setError(
          "Este enlace no es válido, ya se ha utilizado o ha caducado."
        );
      } else if (code === "INVALID_PASSWORD") {
        setError("La contraseña no cumple los requisitos.");
      } else {
        setError(
          "No hemos podido activar tu cuenta. Inténtalo de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-stone-200">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-3">
            ST.MARIA AGENCY
          </p>

          <h1 className="text-2xl font-semibold text-stone-900">
            {success ? "¡Cuenta activada!" : "Activa tu cuenta"}
          </h1>

          <p className="text-sm text-stone-500 mt-3">
            {success
              ? "Ya puedes acceder a la plataforma."
              : "Establece una contraseña para comenzar."}
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 text-center">
              Tu cuenta de creador se ha activado correctamente.
            </div>

            <Link
              to="/login"
              className="block w-full rounded-lg bg-stone-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-stone-800 transition"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-5">
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Falta el token de activación. Abre el enlace que has recibido por correo.
            </div>

            <Link
              to="/"
              className="block text-center text-sm text-stone-600 underline"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 12 caracteres"
                className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Confirmar contraseña
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full rounded-lg border border-stone-300 px-4 py-3 text-sm outline-none focus:border-stone-800"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition"
            >
              {loading ? "Activando cuenta..." : "Activar mi cuenta"}
            </button>

            <p className="text-center text-xs text-stone-500">
              El enlace de activación caduca en 24 horas.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
