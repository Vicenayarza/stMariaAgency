
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import stmaryLogo from "../assets/brand/stmary-logo-horizontal-marron.svg";
import {
  connectInstagram,
  getInstagramCalculatorResult,
  getInstagramStatus
} from "../lib/socialCalculator";

const PLATFORMS = {
  INSTAGRAM: {
    label: "Instagram",
    description:
      "Conecta tu cuenta profesional de Instagram para consultar tus métricas y calcular tu engagement.",
  },
  TIKTOK: {
    label: "TikTok",
    available: false,
    description:
      "Conecta tu cuenta de TikTok para analizar tus publicaciones y la interacción de tu audiencia.",
  },
  YOUTUBE: {
    label: "YouTube",
    available: false,
    description:
      "Conecta tu canal de YouTube para analizar sus métricas y calcular la interacción de tu audiencia.",
  },
};

function getResultText(value) {
  if (value < 1) return "Interacción baja";
  if (value < 3) return "Interacción moderada";
  if (value < 6) return "Buena interacción";
  return "Interacción muy alta";
}

function Calculator() {
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [calculatorMode, setCalculatorMode] = useState("manual");

  const [followers, setFollowers] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [connectedResult, setConnectedResult] = useState(null);
  const [connectionError, setConnectionError] = useState("");
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [instagramAvailable, setInstagramAvailable] = useState(false);

useEffect(() => {
  let active = true;

  getInstagramStatus()
    .then((data) => {
      if (active) {
        setInstagramAvailable(Boolean(data?.enabled));
      }
    })
    .catch(() => {
      if (active) {
        setInstagramAvailable(false);
      }
    });

  return () => {
    active = false;
  };
}, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("instagram");
    if (!status) return;

    const resultId = params.get("result");
    params.delete("instagram");
    params.delete("result");
    const remaining = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${remaining ? `?${remaining}` : ""}${window.location.hash}`
    );

    setPlatform("INSTAGRAM");
    setCalculatorMode("connected");

    if (status !== "success" || !resultId) {
      const messages = {
        cancelled: "Has cancelado la autorización de Instagram.",
        invalid_state: "La autorización ha caducado o no se ha podido verificar.",
        missing_code: "Instagram no ha devuelto el código de autorización.",
      };
      setConnectionError(messages[status] || "No se ha podido conectar con Instagram.");
      return;
    }

    let active = true;
    setConnectionLoading(true);
    getInstagramCalculatorResult(resultId)
      .then((data) => {
        if (active) {
          setConnectedResult(data);
          setConnectionError("");
        }
      })
      .catch(() => {
        if (active) setConnectionError("No se ha podido recuperar el resultado. Vuelve a conectar Instagram.");
      })
      .finally(() => {
        if (active) setConnectionLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectedPlatform = PLATFORMS[platform];

  function resetResult() {
    setResult(null);
    setError("");
  }

  function changePlatform(value) {
    setPlatform(value);
    resetResult();
    setConnectionError("");
  }

  function changeMode(value) {
    setCalculatorMode(value);
    resetResult();
    setConnectionError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    resetResult();

    const followersNumber = Number(followers);
    const likesNumber = Number(likes);
    const commentsNumber = Number(comments);

    if (
      !Number.isFinite(followersNumber) ||
      followersNumber <= 0
    ) {
      setError("Introduce un número de seguidores válido.");
      return;
    }

    if (
      !Number.isFinite(likesNumber) ||
      likesNumber < 0 ||
      !Number.isFinite(commentsNumber) ||
      commentsNumber < 0
    ) {
      setError(
        "Introduce valores válidos para likes y comentarios."
      );
      return;
    }

    const engagement =
      ((likesNumber + commentsNumber) / followersNumber) * 100;

    setResult(engagement);
  }

  return (
    <div className="min-h-screen bg-[#F4EDE2] text-[#3E2B1B]">
      {/* HEADER */}
      <header className="border-b border-[#5A3E28]/10">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <Link to="/">
            <img
              src={stmaryLogo}
              alt="ST.MARIA Agency"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <Link
            to="/"
            className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#6F6052] transition hover:text-[#8A6340]"
          >
            ← Volver
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-[1500px] px-6 py-16 md:px-10 md:py-24">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">

          {/* INTRO */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8A6340]">
              ST.MARIA Tools
            </p>

            <h1 className="mt-5 max-w-xl text-5xl font-medium leading-[0.95] tracking-[-0.055em] md:text-7xl">
              Calcula tu
              <br />
              <span className="font-light italic">
                engagement.
              </span>
            </h1>

            <p className="mt-8 max-w-md text-sm leading-relaxed text-[#6F6052]">
              Analiza la interacción de tu audiencia en
              Instagram, TikTok o YouTube. Introduce tus
              métricas manualmente o conecta tu cuenta
              profesional de Instagram cuando esté habilitada.
            </p>

            <div className="mt-12 border-t border-[#5A3E28]/10 pt-6">
              <p className="text-xs leading-relaxed text-[#6F6052]">
                El resultado es orientativo. En el cálculo
                manual se utiliza la suma de likes y
                comentarios medios dividida entre el
                número de seguidores o suscriptores.
                Esta fórmula no representa necesariamente
                todas las métricas de interacción de cada
                plataforma.
              </p>
            </div>
          </div>

          {/* CALCULATOR */}
          <div className="rounded-3xl border border-[#5A3E28]/10 bg-white/45 p-6 md:p-10">

            {/* PLATFORM */}
            <div>
              <label
                htmlFor="platform"
                className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
              >
                Plataforma
              </label>

              <select
                id="platform"
                value={platform}
                onChange={(event) =>
                  changePlatform(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-[#F4EDE2] px-5 py-4 text-sm outline-none transition focus:border-[#8A6340]"
              >
                {Object.entries(PLATFORMS).map(
                  ([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* MODES */}
            <div className="mt-7 grid grid-cols-2 gap-2 rounded-2xl bg-[#F4EDE2] p-1.5">
              <button
                type="button"
                onClick={() => changeMode("manual")}
                className={`rounded-xl px-3 py-4 text-[10px] font-medium uppercase tracking-[0.08em] transition ${
                  calculatorMode === "manual"
                    ? "bg-[#8A6340] text-[#F4EDE2]"
                    : "text-[#6F6052] hover:bg-white/50"
                }`}
              >
                Manual
              </button>

              <button
                type="button"
                onClick={() => changeMode("connected")}
                className={`rounded-xl px-3 py-4 text-[10px] font-medium uppercase tracking-[0.08em] transition ${
                  calculatorMode === "connected"
                    ? "bg-[#8A6340] text-[#F4EDE2]"
                    : "text-[#6F6052] hover:bg-white/50"
                }`}
              >
                Conectar cuenta
              </button>
            </div>

            {/* MANUAL CALCULATOR */}
            {calculatorMode === "manual" && (
              <>
                <form onSubmit={handleSubmit}>
                  <div className="mt-7">
                    <label
                      htmlFor="followers"
                      className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
                    >
                      {platform === "YOUTUBE"
                        ? "Suscriptores"
                        : "Seguidores"}
                    </label>

                    <input
                      id="followers"
                      type="number"
                      min="1"
                      step="1"
                      value={followers}
                      onChange={(event) =>
                        setFollowers(event.target.value)
                      }
                      placeholder="25000"
                      required
                      className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-transparent px-5 py-4 text-sm outline-none placeholder:text-[#6F6052]/40 focus:border-[#8A6340]"
                    />
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="likes"
                        className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
                      >
                        Likes medios
                      </label>

                      <input
                        id="likes"
                        type="number"
                        min="0"
                        step="any"
                        value={likes}
                        onChange={(event) =>
                          setLikes(event.target.value)
                        }
                        placeholder="1350"
                        required
                        className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-transparent px-5 py-4 text-sm outline-none placeholder:text-[#6F6052]/40 focus:border-[#8A6340]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="comments"
                        className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
                      >
                        Comentarios medios
                      </label>

                      <input
                        id="comments"
                        type="number"
                        min="0"
                        step="any"
                        value={comments}
                        onChange={(event) =>
                          setComments(event.target.value)
                        }
                        placeholder="48"
                        required
                        className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-transparent px-5 py-4 text-sm outline-none placeholder:text-[#6F6052]/40 focus:border-[#8A6340]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="mt-7 w-full rounded-full bg-[#8A6340] px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-[#F4EDE2] transition hover:bg-[#5A3E28]"
                  >
                    Calcular engagement →
                  </button>
                </form>

                {/* RESULT */}
                {result !== null && (
                  <div className="mt-8 rounded-2xl bg-[#8A6340] p-7 text-[#F4EDE2]">
                    <p className="text-[9px] uppercase tracking-[0.18em] opacity-60">
                      Engagement rate · {selectedPlatform.label}
                    </p>

                    <p className="mt-4 text-5xl font-medium tracking-[-0.06em]">
                      {result.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      %
                    </p>

                    <p className="mt-4 text-sm opacity-70">
                      {getResultText(result)}
                    </p>

                    <div className="mt-6 border-t border-[#F4EDE2]/20 pt-5">
                      <p className="text-xs leading-relaxed opacity-60">
                        Basado en likes y comentarios medios
                        respecto al total de seguidores o
                        suscriptores. La clasificación es
                        orientativa.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CONNECTED CALCULATOR */}
            {calculatorMode === "connected" && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#8A6340]/10">
                  <span className="text-3xl text-[#8A6340]">◎</span>
                </div>

                <h2 className="mt-6 text-2xl font-medium tracking-tight">
                  {connectedResult && platform === "INSTAGRAM"
                    ? "Tu Instagram conectado"
                    : `Conecta tu ${selectedPlatform.label}`}
                </h2>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#6F6052]">
                  {selectedPlatform.description}
                </p>

                {connectionError && platform === "INSTAGRAM" && (
                  <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                    {connectionError}
                  </div>
                )}

                {connectionLoading && platform === "INSTAGRAM" && (
                  <p role="status" className="mt-6 text-sm text-[#6F6052]">
                    Recuperando las métricas de Instagram…
                  </p>
                )}

                {connectedResult && platform === "INSTAGRAM" && (
                  <div className="mt-8 text-left">
                    <div className="flex items-center gap-4 rounded-2xl border border-[#5A3E28]/10 bg-[#F4EDE2]/70 p-5">
                      {connectedResult.profile.profilePictureUrl && (
                        <img
                          src={connectedResult.profile.profilePictureUrl}
                          alt="Foto del perfil de Instagram"
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">@{connectedResult.profile.username}</p>
                        <p className="mt-1 text-xs text-[#6F6052]">
                          {connectedResult.profile.followers.toLocaleString("es-ES")} seguidores
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      {[
                        ["Publicaciones", connectedResult.metrics.analyzedPosts],
                        ["Likes medios", connectedResult.metrics.averageLikes],
                        ["Comentarios", connectedResult.metrics.averageComments],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-[#F4EDE2]/70 p-3">
                          <p className="text-lg font-medium">{Number(value).toLocaleString("es-ES")}</p>
                          <p className="mt-1 text-[10px] text-[#6F6052]">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-2xl bg-[#8A6340] p-7 text-[#F4EDE2]">
                      <p className="text-[9px] uppercase tracking-[0.18em] opacity-60">
                        Engagement rate · Instagram
                      </p>
                      {connectedResult.metrics.engagementRate !== null ? (
                        <>
                          <p className="mt-4 text-5xl font-medium tracking-[-0.06em]">
                            {connectedResult.metrics.engagementRate.toLocaleString("es-ES", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}%
                          </p>
                          <p className="mt-4 text-sm opacity-70">
                            {getResultText(connectedResult.metrics.engagementRate)}
                          </p>
                        </>
                      ) : (
                        <p className="mt-4 text-sm">
                          No hay suficientes métricas disponibles para calcular el engagement.
                        </p>
                      )}
                      <p className="mt-6 border-t border-[#F4EDE2]/20 pt-5 text-xs leading-relaxed opacity-60">
                        Cálculo orientativo basado en las publicaciones accesibles a través de Instagram.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setConnectionError("");
                    setConnectedResult(null);
                    connectInstagram();
                  }}
                  disabled={platform !== "INSTAGRAM" || !instagramAvailable || connectionLoading}
                  className={`mt-8 w-full rounded-full px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-[#F4EDE2] transition ${
                    platform === "INSTAGRAM" && instagramAvailable && !connectionLoading
                      ? "bg-[#8A6340] hover:bg-[#5A3E28]"
                      : "cursor-not-allowed bg-[#8A6340]/60"
                  }`}
                >
                  {connectedResult && platform === "INSTAGRAM"
                    ? "Volver a conectar Instagram"
                    : `Conectar con ${selectedPlatform.label}`}
                </button>

                <p className="mt-4 text-xs text-[#6F6052]">
                  {platform === "INSTAGRAM" && instagramAvailable
                    ? "La conexión requiere autorizar el acceso a las métricas disponibles de tu cuenta profesional."
                    : "Integración automática en preparación."}
                </p>

                <div className="mt-8 rounded-2xl border border-[#5A3E28]/10 bg-[#F4EDE2]/70 p-5 text-left">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8A6340]">
                    ¿Qué podrás consultar?
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#6F6052]">
                    Tu perfil, seguidores o suscriptores, publicaciones y métricas de interacción
                    disponibles según los permisos que autorices y las capacidades de la API.
                  </p>
                </div>

                <p className="mt-6 text-xs leading-relaxed text-[#6F6052]">
                  Conectar una cuenta no implicará por sí solo incorporarla a Creator Discovery.
                  Esa opción requerirá una autorización diferenciada.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Calculator;
