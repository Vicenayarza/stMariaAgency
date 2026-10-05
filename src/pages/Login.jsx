import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import stmaryLogo from "../assets/brand/stmary-logo-horizontal-marron.svg";
import stmaryLogoLight from "../assets/brand/stmary-logo-horizontal-crema.svg";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    loading: authLoading,
    login,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    if (user.role === "BRAND") {
      navigate("/platform", {
        replace: true,
      });
    }

    if (user.role === "CREATOR") {
      navigate("/creator", {
        replace: true,
      });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loggedUser = await login(
        email,
        password
      );

      if (loggedUser.role === "BRAND") {
        navigate("/platform", {
          replace: true,
        });

        return;
      }
      if (loggedUser.role === "STAFF") {
        navigate("/admin");
        return;
      }

      if (loggedUser.role === "CREATOR") {
        navigate("/creator", {
          replace: true,
        });

        return;
      }

      setError(
        "Este tipo de usuario todavía no tiene un panel configurado."
      );
    } catch (error) {
      console.error(error);

      if (error.status === 401) {
        setError(
          "El email o la contraseña no son correctos."
        );
      } else {
        setError(
          "No se ha podido iniciar sesión. Inténtalo de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EDE2] text-[#3E2B1B]">

      <div className="grid min-h-screen md:grid-cols-2">

        {/* LEFT */}

       <div className="hidden bg-[#8A6340] p-10 text-[#F4EDE2] md:flex md:flex-col md:justify-between">

          <div>

            <Link to="/" className="inline-block">
  <img
    src={stmaryLogoLight}
    alt="ST.MARY AGENCY"
    className="h-12 w-auto"
  />
</Link>

          </div>

          <div>

            <p className="mb-6 text-[10px] uppercase tracking-[0.18em] text-[#F4EDE2]/50">
              Influencer Marketing
            </p>

            <h1 className="max-w-xl text-7xl font-medium leading-[0.9] tracking-[-0.06em]">

              INFLUENCIA
              <br />

              <span className="italic font-light">
                REDEFINIDA
              </span>

            </h1>

            <p className="mt-8 max-w-md text-lg leading-relaxed text-[#F4EDE2]/60">
              Gestiona campañas, descubre creadores y convierte influencia
              en resultados.
            </p>

          </div>

          <div className="text-[9px] uppercase tracking-[0.16em] text-[#F4EDE2]/40">
            © 2026 ST.MARY AGENCY
          </div>

        </div>


        {/* RIGHT */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}

            <div className="mb-12 md:hidden">

              <Link to="/" className="inline-block">
  <img
    src={stmaryLogo}
    alt="ST.MARY AGENCY"
    className="h-11 w-auto"
  />
</Link>

            </div>


            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6F6052]">
              Plataforma
            </p>

            <h2 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
              Bienvenido
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-[#6F6052]">
              Accede a tu espacio de ST.MARY AGENCY
            </p>


            <form
              onSubmit={handleSubmit}
              className="mt-10"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="tu@email.com"
                  required
                  className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-white/40 px-5 py-4 text-sm text-[#3E2B1B] outline-none transition-colors placeholder:text-[#6F6052]/40 focus:border-[#8A6340]"
                />

              </div>


              {/* PASSWORD */}

              <div className="mt-5">

                <label
                  htmlFor="password"
                  className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
                >
                  Contraseña
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  required
                  className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-white/40 px-5 py-4 text-sm text-[#3E2B1B] outline-none transition-colors placeholder:text-[#6F6052]/40 focus:border-[#8A6340]"
                />

              </div>


              {/* ERROR */}

              {error && (

                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                  {error}
                </div>

              )}


              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="mt-7 w-full rounded-full bg-[#8A6340] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-[#F4EDE2] transition-all hover:scale-[1.01] hover:bg-[#5A3E28] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading
                  ? "Accediendo..."
                  : "Acceder"
                }

              </button>

            </form>


            {/* REGISTER */}

            <div className="mt-10 border-t border-[#5A3E28]/15 pt-8">

              <p className="text-center text-sm text-[#6F6052]">
                ¿Todavía no tienes cuenta?
              </p>

              <div className="mt-4 flex justify-center gap-6">

                <Link
                  to="/register?type=brand"
                  className="text-[10px] uppercase tracking-[0.14em] text-[#5A3E28] underline underline-offset-4 transition hover:text-[#8A6340]"
                >
                  Soy una marca
                </Link>

                <Link
                  to="/register?type=creator"
                  className="text-[10px] uppercase tracking-[0.14em] text-[#5A3E28] underline underline-offset-4 transition hover:text-[#8A6340]"
                >
                  Soy creador
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;