import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

import { apiFetch } from "../lib/api";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialType =
    searchParams.get("type") === "creator"
      ? "creator"
      : "brand";

  const [type, setType] = useState(initialType);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    username: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setError("");
    setSuccess("");

    navigate(`/register?type=${newType}`, {
      replace: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (form.password.length < 8) {
        throw new Error("PASSWORD_TOO_SHORT");
      }

      let endpoint;
      let body;

      if (type === "brand") {
        endpoint = "/api/auth/register/brand";

        body = {
          name: form.name,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
        };
      } else {
        endpoint = "/api/auth/register/creator";

        body = {
          name: form.name,
          email: form.email,
          password: form.password,
          username: form.username,
        };
      }

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setSuccess(
        "Cuenta creada correctamente. Redirigiendo al acceso..."
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1000);

    } catch (error) {
      console.error("Register error:", error);

      if (error.message === "PASSWORD_TOO_SHORT") {
        setError(
          "La contraseña debe tener al menos 8 caracteres."
        );
      } else if (
        error.status === 409 &&
        error.data?.error === "EMAIL_ALREADY_EXISTS"
      ) {
        setError(
          "Ya existe una cuenta con ese email."
        );
      } else if (
        error.status === 409 &&
        error.data?.error === "USERNAME_ALREADY_EXISTS"
      ) {
        setError(
          "Ese nombre de usuario ya está registrado."
        );
      } else {
        setError(
          "No se ha podido crear la cuenta. Comprueba los datos e inténtalo de nuevo."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#111111]">

      <div className="grid min-h-screen md:grid-cols-2">

        {/* LEFT */}

        <div className="hidden bg-[#111111] p-10 text-white md:flex md:flex-col md:justify-between">

          <div>

            <Link
              to="/"
              className="text-xl font-semibold tracking-[-0.05em]"
            >
              ST.MARIA
            </Link>

            <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
              Platform
            </p>

          </div>


          <div>

            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Únete a ST.MARIA
            </p>

            <h1 className="mt-6 max-w-xl text-7xl font-medium leading-[0.88] tracking-[-0.06em]">
              CREA.
              <br />

              <span className="italic font-light">
                CONECTA.
              </span>

              <br />

              CRECE.
            </h1>

            <p className="mt-8 max-w-md text-lg leading-relaxed text-white/45">
              Una nueva forma de conectar marcas, creadores y campañas.
            </p>

          </div>


          <div className="text-[9px] uppercase tracking-[0.16em] text-white/30">
            © 2026 ST.MARIA AGENCY
          </div>

        </div>


        {/* RIGHT */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}

            <div className="mb-10 md:hidden">

              <Link
                to="/"
                className="text-xl font-semibold tracking-[-0.05em]"
              >
                ST.MARIA
              </Link>

            </div>


            {/* HEADER */}

            <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">
              Registro
            </p>

            <h2 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
              Crea tu cuenta.
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-black/50">
              Elige cómo quieres formar parte de ST.MARIA.
            </p>


            {/* TYPE SELECTOR */}

            <div className="mt-8 grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() => handleTypeChange("brand")}
                className={`rounded-xl border p-5 text-left transition-all ${
                  type === "brand"
                    ? "border-black bg-black text-white"
                    : "border-black/10 hover:border-black/30"
                }`}
              >

                <p className="text-[9px] uppercase tracking-[0.15em] opacity-60">
                  Soy una
                </p>

                <p className="mt-2 text-lg font-medium">
                  Marca
                </p>

                <p className="mt-2 text-xs opacity-50">
                  Quiero trabajar con creadores.
                </p>

              </button>


              <button
                type="button"
                onClick={() => handleTypeChange("creator")}
                className={`rounded-xl border p-5 text-left transition-all ${
                  type === "creator"
                    ? "border-black bg-black text-white"
                    : "border-black/10 hover:border-black/30"
                }`}
              >

                <p className="text-[9px] uppercase tracking-[0.15em] opacity-60">
                  Soy
                </p>

                <p className="mt-2 text-lg font-medium">
                  Creador
                </p>

                <p className="mt-2 text-xs opacity-50">
                  Quiero colaborar con marcas.
                </p>

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >

              {/* NAME */}

              <div>

                <label
                  htmlFor="name"
                  className="text-[9px] uppercase tracking-[0.16em] text-black/40"
                >
                  {type === "brand"
                    ? "Persona de contacto"
                    : "Nombre"}
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={
                    type === "brand"
                      ? "Nombre de contacto"
                      : "Tu nombre"
                  }
                  required
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-transparent px-5 py-4 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black/40"
                />

              </div>


              {/* COMPANY / USERNAME */}

              <div className="mt-5">

                <label
                  htmlFor={
                    type === "brand"
                      ? "companyName"
                      : "username"
                  }
                  className="text-[9px] uppercase tracking-[0.16em] text-black/40"
                >
                  {type === "brand"
                    ? "Empresa"
                    : "Nombre de usuario"}
                </label>

                <input
                  id={
                    type === "brand"
                      ? "companyName"
                      : "username"
                  }
                  name={
                    type === "brand"
                      ? "companyName"
                      : "username"
                  }
                  type="text"
                  value={
                    type === "brand"
                      ? form.companyName
                      : form.username
                  }
                  onChange={handleChange}
                  placeholder={
                    type === "brand"
                      ? "Nombre de la empresa"
                      : "@tuusuario"
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-black/10 bg-transparent px-5 py-4 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black/40"
                />

              </div>


              {/* EMAIL */}

              <div className="mt-5">

                <label
                  htmlFor="email"
                  className="text-[9px] uppercase tracking-[0.16em] text-black/40"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-transparent px-5 py-4 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black/40"
                />

              </div>


              {/* PASSWORD */}

              <div className="mt-5">

                <label
                  htmlFor="password"
                  className="text-[9px] uppercase tracking-[0.16em] text-black/40"
                >
                  Contraseña
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-transparent px-5 py-4 text-sm outline-none transition-colors placeholder:text-black/25 focus:border-black/40"
                />

              </div>


              {/* ERROR */}

              {error && (

                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-600">
                  {error}
                </div>

              )}


              {/* SUCCESS */}

              {success && (

                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs leading-relaxed text-green-700">
                  {success}
                </div>

              )}


              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="mt-7 w-full rounded-full bg-black px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading
                  ? "Creando cuenta..."
                  : type === "brand"
                    ? "Crear cuenta de marca"
                    : "Crear cuenta de creador"}

              </button>

            </form>


            {/* LOGIN */}

            <div className="mt-8 border-t border-black/10 pt-7">

              <p className="text-center text-sm text-black/45">
                ¿Ya tienes una cuenta?
              </p>

              <Link
                to="/login"
                className="mt-4 flex w-full items-center justify-center rounded-full border border-black/15 px-6 py-4 text-[10px] uppercase tracking-[0.14em] transition-colors hover:bg-black hover:text-white"
              >
                Iniciar sesión
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;