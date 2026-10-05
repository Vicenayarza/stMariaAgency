import { useState } from "react";
import { Link } from "react-router-dom";

import stmaryLogo from "../assets/brand/stmary-logo-horizontal-marron.svg";

function Calculator() {
  const [platform, setPlatform] =
    useState("INSTAGRAM");

  const [followers, setFollowers] =
    useState("");

  const [likes, setLikes] =
    useState("");

  const [comments, setComments] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setResult(null);

    const followersNumber =
      Number(String(followers).replace(",", "."));

    const likesNumber =
      Number(String(likes).replace(",", "."));

    const commentsNumber =
      Number(String(comments).replace(",", "."));

    if (
      !followersNumber ||
      followersNumber <= 0
    ) {
      setError(
        "Introduce un número de seguidores válido."
      );
      return;
    }

    if (
      Number.isNaN(likesNumber) ||
      likesNumber < 0 ||
      Number.isNaN(commentsNumber) ||
      commentsNumber < 0
    ) {
      setError(
        "Introduce valores válidos para likes y comentarios."
      );
      return;
    }

    const engagement =
      ((likesNumber + commentsNumber) /
        followersNumber) *
      100;

    setResult(engagement);
  }

  function getResultText(value) {
    if (value < 1) {
      return "Interacción baja";
    }

    if (value < 3) {
      return "Interacción moderada";
    }

    if (value < 6) {
      return "Buena interacción";
    }

    return "Interacción muy alta";
  }

  return (
    <div className="min-h-screen bg-[#F4EDE2] text-[#3E2B1B]">
      {/* HEADER */}

      <header className="border-b border-[#5A3E28]/10">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          <Link to="/">
            <img
              src={stmaryLogo}
              alt="ST.MARY AGENCY"
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
              ST.MARY Tools
            </p>

            <h1 className="mt-5 max-w-xl text-5xl font-medium leading-[0.95] tracking-[-0.055em] md:text-7xl">
              Calcula tu
              <br />
              <span className="font-light italic">
                engagement.
              </span>
            </h1>

            <p className="mt-8 max-w-md text-sm leading-relaxed text-[#6F6052]">
              Descubre qué porcentaje de tu
              audiencia interactúa con tu
              contenido a partir de tus
              métricas medias.
            </p>

            <div className="mt-12 border-t border-[#5A3E28]/10 pt-6">
              <p className="text-xs leading-relaxed text-[#6F6052]">
                El resultado es orientativo y
                se calcula a partir de los
                datos introducidos.
              </p>
            </div>
          </div>

          {/* CALCULATOR */}

          <div className="rounded-3xl border border-[#5A3E28]/10 bg-white/45 p-6 md:p-10">
            <form onSubmit={handleSubmit}>
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
                    setPlatform(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-[#F4EDE2] px-5 py-4 text-sm outline-none transition focus:border-[#8A6340]"
                >
                  <option value="INSTAGRAM">
                    Instagram
                  </option>

                  <option value="TIKTOK">
                    TikTok
                  </option>
                </select>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="followers"
                  className="text-[9px] uppercase tracking-[0.16em] text-[#6F6052]"
                >
                  Seguidores
                </label>

                <input
                  id="followers"
                  type="number"
                  min="1"
                  value={followers}
                  onChange={(event) =>
                    setFollowers(
                      event.target.value
                    )
                  }
                  placeholder="25.000"
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
                    value={likes}
                    onChange={(event) =>
                      setLikes(
                        event.target.value
                      )
                    }
                    placeholder="1.350"
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
                    value={comments}
                    onChange={(event) =>
                      setComments(
                        event.target.value
                      )
                    }
                    placeholder="48"
                    required
                    className="mt-2 w-full rounded-xl border border-[#5A3E28]/15 bg-transparent px-5 py-4 text-sm outline-none placeholder:text-[#6F6052]/40 focus:border-[#8A6340]"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
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
                  Engagement rate
                </p>

                <p className="mt-4 text-5xl font-medium tracking-[-0.06em]">
                  {result.toLocaleString(
                    "es-ES",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                  %
                </p>

                <p className="mt-4 text-sm opacity-70">
                  {getResultText(result)}
                </p>

                <div className="mt-6 border-t border-[#F4EDE2]/20 pt-5">
                  <p className="text-xs leading-relaxed opacity-60">
                    Basado en la media de likes
                    y comentarios respecto al
                    número total de seguidores.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Calculator;