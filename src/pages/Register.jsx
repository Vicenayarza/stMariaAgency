import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import stmaryLogo from "../assets/brand/stmary-logo-horizontal-marron.svg";
import stmaryLogoLight from "../assets/brand/stmary-logo-horizontal-crema.svg";
import CreatorRegisterFields from "../components/auth/CreatorRegisterFields";
import BrandRegisterFields from "../components/auth/BrandRegisterFields";

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
  // Comunes
  name: "",
  lastName: "",
  email: "",
  country: "",

  // Creator
  password: "",
  confirmPassword: "",
  username:"",
  invitationCode: "",
  privacyAccepted: false,

  // Brand / Agency
  companyName: "",
  website: "",
  phone: "",
  employeeCount: "",
  services: "",
  needs: "",
  discoverySource: "",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
  const {
    name,
    value,
    type: inputType,
    checked,
  } = event.target;

  setForm((current) => ({
    ...current,
    [name]:
      inputType === "checkbox"
        ? checked
        : value,
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
    <div className="min-h-screen bg-[#F4EDE2] text-[#3E2B1B]">

      <div className="grid min-h-screen md:grid-cols-2">

        {/* LEFT */}

        <div className="hidden bg-[#8A6340] p-10 text-[#F4EDE2] md:flex md:flex-col md:justify-between">

          <div>

            <Link to="/">
  <img
    src={stmaryLogoLight}
    alt="ST.MARY AGENCY"
    className="h-12 w-auto"
  />
</Link>

            <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
              Platform
            </p>

          </div>


          <div>

            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Únete a ST.MARY AGENCY
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
            © 2026 ST.MARY AGENCY
          </div>

        </div>


        {/* RIGHT */}

        <div className="flex items-center justify-center px-6 py-12">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}

            <div className="mb-10 md:hidden">

              <Link to="/">
  <img
    src={stmaryLogo}
    alt="ST.MARY AGENCY"
    className="h-11 w-auto"
  />
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
              Elige cómo quieres formar parte de ST.MARY AGENCY.
            </p>


            {/* TYPE SELECTOR */}

            <div className="mt-8 grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() => handleTypeChange("brand")}
                className={`rounded-xl border p-5 text-left transition-all ${
                  type === "brand"
                     ? "border-[#8A6340] bg-[#8A6340] text-[#F4EDE2]"
                     : "border-[#5A3E28]/15 hover:border-[#8A6340]/50"
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
                     ? "border-[#8A6340] bg-[#8A6340] text-[#F4EDE2]"
                     : "border-[#5A3E28]/15 hover:border-[#8A6340]/50"
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

             {type === "creator" ? (
  <CreatorRegisterFields
    form={form}
    handleChange={handleChange}
  />
) : (
  <BrandRegisterFields
    form={form}
    handleChange={handleChange}
  />
)}


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