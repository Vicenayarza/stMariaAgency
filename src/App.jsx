import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import stmaryLogo from "./assets/brand/stmary-logo-horizontal-marron.svg";
import stmaryLogoLight from "./assets/brand/stmary-logo-horizontal-crema.svg";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Calculator from "./pages/Calculator";
import ActivateAccount from "./pages/ActivateAccount";

import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DataDeletion from "./pages/DataDeletion";

import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import AccountSettings from "./pages/AccountSettings";

import Campaigns from "./pages/Campaigns";
import NewCampaign from "./pages/NewCampaign";
import CampaignDetail from "./pages/CampaignDetail";
import CampaignCreators from "./pages/CampaignCreators";
import CampaignEdit from "./pages/CampaignEdit";
import AddCampaignCreator from "./pages/AddCampaignCreator";
import CollaborationDetail from "./pages/CollaborationDetail";
import Proposals from "./pages/Proposals";
import CampaignProposals from "./pages/CampaignProposals";

import CreatorDashboardLayout from "./components/CreatorDashboardLayout";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorCampaigns from "./pages/CreatorCampaigns";
import CreatorProfile from "./pages/CreatorProfile";
import CreatorPayments from "./pages/CreatorPayments";
import Creators from "./pages/Creators";
import CreatorDetail from "./pages/CreatorDetail";
import CreatorCollaborationDetail from "./pages/CreatorCollaborationDetail";
import CreatorOpportunities from "./pages/CreatorOpportunities";
import CreatorApplications from "./pages/CreatorApplications";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardLayout from "./components/AdminDashboardLayout";
import AdminDashboard from "./pages/AdminDashboard";
import MetricVerification from "./pages/MetricVerification";
import AdminBrands from "./pages/AdminBrands";
import AdminBrandDetail from "./pages/AdminBrandDetail";
import AdminNewBrand from "./pages/AdminNewBrand";
import AdminCreators from "./pages/AdminCreators";
import AdminCreatorDetail from "./pages/AdminCreatorDetail";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminCampaignDetail from "./pages/AdminCampaignDetail";
import AdminCampaignEdit from "./pages/AdminCampaignEdit";
import AdminFinance from "./pages/AdminFinance";
import AdminNewCampaign from "./pages/AdminNewCampaign";
import AdminCampaignManagement from "./pages/AdminCampaignManagement";
import AdminCollaborationDetail from "./pages/AdminCollaborationDetail";
import AdminBrandRequests from "./pages/AdminBrandRequests";
import AdminCreatorRequests from "./pages/AdminCreatorRequests";

const services = [
  {
    number: "01",
    title: "DESCUBRIR",
    text: "Identificamos los creadores que realmente encajan con tu marca, tu audiencia y tus objetivos.",
  },
  {
    number: "02",
    title: "CONECTAR",
    text: "Construimos colaboraciones auténticas y relevantes entre marcas y creadores.",
  },
  {
    number: "03",
    title: "ACTIVAR",
    text: "Desde la estrategia hasta el contenido, convertimos las ideas en campañas que dejan huella.",
  },
  {
    number: "04",
    title: "MEDIR",
    text: "Analizamos los resultados y transformamos los datos de cada campaña en decisiones accionables.",
  },
];

const stats = [
  ["01", "CREADORES"],
  ["02", "CAMPAÑAS"],
  ["03", "RESULTADOS"],
];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4EDE2] text-[#3E2B1B] selection:bg-[#8A6340] selection:text-white">
      
      {/* NAVBAR */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-[#5A3E28]/10 bg-[#F4EDE2]/90 backdrop-blur-xl">
  <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
    
    {/* LOGO */}

    <a href="/">
      <img
        src={stmaryLogo}
        alt="ST.MARY AGENCY"
        className="h-9 w-auto object-contain"
      />
    </a>

    {/* DESKTOP NAVIGATION */}

    <div className="hidden items-center gap-6 text-[10px] font-medium uppercase tracking-[0.14em] lg:flex">
      <a
        href="#what-we-do"
        className="transition-colors hover:text-[#8A6340]"
      >
        Qué hacemos
      </a>

      <a
        href="#brands"
        className="transition-colors hover:text-[#8A6340]"
      >
        Para marcas
      </a>

      <a
        href="#creators"
        className="transition-colors hover:text-[#8A6340]"
      >
        Para creadores
      </a>

      <a
        href="#about"
        className="transition-colors hover:text-[#8A6340]"
      >
        Nosotros
      </a>

      <a
        href="/calculadora"
        className="transition-colors hover:text-[#8A6340]"
      >
        Calculadora
      </a>
    </div>

    {/* DESKTOP ACTIONS */}

    <div className="hidden items-center gap-3 lg:flex">
      <a
        href="#contact"
        className="rounded-full border border-[#5A3E28]/20 px-5 py-3 text-[9px] font-medium uppercase tracking-[0.14em] transition-colors hover:bg-[#8A6340] hover:text-[#F4EDE2]"
      >
        Hablemos
      </a>

      <a
        href="/login"
        className="rounded-full border border-[#8A6340] px-5 py-3 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340] transition-colors hover:bg-[#8A6340] hover:text-[#F4EDE2]"
      >
        Acceder
      </a>

      {/* REGISTER DROPDOWN */}

      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setRegisterOpen((current) => !current)
          }
          className="rounded-full border border-[#8A6340] px-5 py-3 text-[9px] font-medium uppercase tracking-[0.14em] text-[#8A6340] transition-colors hover:bg-[#8A6340] hover:text-[#F4EDE2]"
        >
          Crear cuenta 
        </button>

        {registerOpen && (
          <div className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-2xl border border-[#5A3E28]/10 bg-[#F4EDE2] p-2 shadow-xl">
            <a
              href="/register?type=creator"
              className="block rounded-xl px-4 py-4 transition-colors hover:bg-[#EBDCC4]"
              onClick={() =>
                setRegisterOpen(false)
              }
            >
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#3E2B1B]">
                Cuenta de creador
              </span>

              <span className="mt-1 block text-xs text-[#6F6052]">
                Únete como creador de contenido.
              </span>
            </a>

            <a
              href="/register?type=brand"
              className="mt-1 block rounded-xl px-4 py-4 transition-colors hover:bg-[#EBDCC4]"
              onClick={() =>
                setRegisterOpen(false)
              }
            >
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#3E2B1B]">
                Marca / Agencia
              </span>

              <span className="mt-1 block text-xs text-[#6F6052]">
                Trabaja con ST.MARY AGENCY.
              </span>
            </a>
          </div>
        )}
      </div>
    </div>

    {/* MOBILE BUTTON */}

    <button
      type="button"
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="Abrir menú"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#5A3E28]/20 lg:hidden"
    >
      <div className="space-y-1.5">
        <span className="block h-px w-4 bg-[#8A6340]" />
        <span className="block h-px w-4 bg-[#8A6340]" />
      </div>
    </button>
  </nav>

  {/* MOBILE MENU */}

  {menuOpen && (
    <div className="border-t border-[#5A3E28]/10 bg-[#F4EDE2] px-6 py-8 lg:hidden">
      <div className="flex flex-col gap-6 text-sm uppercase tracking-[0.12em]">
        <a
          href="#what-we-do"
          onClick={() => setMenuOpen(false)}
        >
          Qué hacemos
        </a>

        <a
          href="#brands"
          onClick={() => setMenuOpen(false)}
        >
          Para marcas
        </a>

        <a
          href="#creators"
          onClick={() => setMenuOpen(false)}
        >
          Para creadores
        </a>

        <a
          href="#about"
          onClick={() => setMenuOpen(false)}
        >
          Nosotros
        </a>

        <a
          href="/calculadora"
          onClick={() => setMenuOpen(false)}
        >
          Calculadora
        </a>

        <a
          href="#contact"
          onClick={() => setMenuOpen(false)}
        >
          Hablemos
        </a>

        <a
          href="/login"
          onClick={() => setMenuOpen(false)}
        >
          Acceder
        </a>

        <div className="border-t border-[#5A3E28]/10 pt-6">
          <p className="mb-4 text-[9px] text-[#6F6052]">
            Crear cuenta
          </p>

          <div className="grid gap-3">
            <a
              href="/register?type=creator"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-[#5A3E28]/15 px-4 py-4"
            >
              Cuenta de creador
            </a>

            <a
              href="/register?type=brand"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-[#8A6340] px-4 py-4 text-[#F4EDE2]"
            >
              Marca / Agencia
            </a>
          </div>
        </div>
      </div>
    </div>
  )}
</header>

      <main>

        {/* HERO */}
        <section className="relative flex min-h-screen items-end overflow-hidden px-6 pb-10 pt-32 md:px-10 md:pb-14">
          
          <div className="mx-auto w-full max-w-[1500px]">
            
            <div className="mb-10 flex items-start justify-between">
              
              <div className="max-w-xs text-[10px] uppercase leading-relaxed tracking-[0.16em] text-black/50">
                Influencer marketing
                <br />
                Agencia & tecnología
              </div>

              <div className="hidden text-right text-[10px] uppercase tracking-[0.16em] text-black/50 md:block">
                España
              </div>
            </div>

            <div className="relative">
              
              <h1 className="max-w-[1300px] text-[18vw] font-medium leading-[0.78] tracking-[-0.085em] md:text-[14vw]">
                INFLUENCIA,
                <br />
                <span className="ml-[8vw] italic font-light">
                  REDEFINIDA.
                </span>
              </h1>

              <div className="mt-12 flex flex-col justify-between gap-10 md:ml-[25%] md:flex-row md:items-end">
                
                <p className="max-w-md text-lg leading-relaxed text-black/65 md:text-xl">
                  Marketing de influencers basado en personas, creatividad y
                  resultados medibles.
                </p>

                <a
                  href="#what-we-do"
                  className="group flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.18em]"
                >
                  Descubre ST.MARY AGENCY 

                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 transition-all group-hover:bg-[#8A6340] group-hover:text-[#F4EDE2]">
                    ↓
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section className="overflow-hidden border-y border-black/10 bg-[#8A6340] py-5 text-white">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
            {[
              "INFLUENCIA",
              "CREATIVIDAD",
              "DATOS",
              "RESULTADOS",
              "INFLUENCIA",
              "CREATIVIDAD",
              "DATOS",
              "RESULTADOS",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-10">
                <span className="text-sm font-medium uppercase tracking-[0.2em] md:text-base">
                  {item}
                </span>

                <span className="text-white/30">✦</span>
              </div>
            ))}
          </div>
        </section>

        {/* INTRO */}
        <section id="about" className="px-6 py-28 md:px-10 md:py-40">
          <div className="mx-auto grid max-w-[1500px] gap-16 md:grid-cols-12">
            
            <div className="md:col-span-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/45">
                01 — Nosotros
              </p>
            </div>

            <div className="md:col-span-8 md:col-start-5">
              
              <h2 className="text-4xl font-medium leading-[1.05] tracking-[-0.045em] md:text-7xl">
                Creemos que la influencia es mucho más que un número.
              </h2>

              <p className="mt-10 max-w-2xl text-lg leading-relaxed text-black/55 md:text-xl">
                ST.MARY AGENCY  conecta marcas con las personas que dan forma a la
                cultura. Combinamos estrategia, creatividad y tecnología para
                crear campañas de influencer marketing auténticas y capaces
                de generar resultados reales.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section
          id="what-we-do"
          className="border-t border-black/10 px-6 py-28 md:px-10 md:py-40"
        >
          <div className="mx-auto max-w-[1500px]">
            
            <div className="mb-20 flex items-end justify-between">
              
              <div>
                <p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-black/45">
                  02 — Qué hacemos
                </p>

                <h2 className="text-5xl font-medium tracking-[-0.055em] md:text-8xl">
                  DE LA IDEA
                  <br />
                  AL IMPACTO.
                </h2>
              </div>

              <p className="hidden max-w-xs text-sm leading-relaxed text-black/50 md:block">
                Una visión completa del influencer marketing, desde encontrar
                al creador adecuado hasta comprender el impacto real de cada
                colaboración.
              </p>
            </div>

            <div className="border-t border-black/20">
              
              {services.map((service) => (
                <div
                  key={service.number}
                  className="group grid border-b border-black/20 py-8 transition-all hover:px-4 md:grid-cols-12 md:py-12"
                >
                  <span className="text-[10px] tracking-[0.16em] text-black/40 md:col-span-2">
                    {service.number}
                  </span>

                  <h3 className="mt-5 text-3xl font-medium tracking-[-0.04em] md:col-span-4 md:mt-0 md:text-5xl">
                    {service.title}
                  </h3>

                  <p className="mt-5 max-w-lg text-base leading-relaxed text-black/55 md:col-span-5 md:col-start-8 md:mt-0">
                    {service.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BRANDS */}
        <section
          id="brands"
          className="bg-[#8A6340] px-6 py-28 text-white md:px-10 md:py-40"
        >
          <div className="mx-auto max-w-[1500px]">
            
            <div className="grid gap-16 md:grid-cols-12">
              
              <div className="md:col-span-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  03 — Para marcas
                </p>
              </div>

              <div className="md:col-span-8 md:col-start-5">
                
                <h2 className="text-5xl font-medium leading-[0.95] tracking-[-0.055em] md:text-8xl">
                  TU MARCA.
                  <br />
                  LAS PERSONAS
                  <br />
                  <span className="italic font-light">ADECUADAS.</span>
                </h2>

                <p className="mt-10 max-w-xl text-lg leading-relaxed text-white/55">
                  Ayudamos a las marcas a identificar a los creadores que
                  realmente importan, construir colaboraciones relevantes y
                  convertir la influencia en resultados medibles para el
                  negocio.
                </p>

               <a
  href="/login"
  className="mt-10 inline-flex rounded-full border border-white/30 px-7 py-4 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-[#F4EDE2] hover:text-[#5A3E28]"
>
  Iniciar una campaña
</a>
              </div>
            </div>

            <div className="mt-28 grid border-t border-white/15 md:grid-cols-3">
              
              {[
                [
                  "ESTRATEGIA",
                  "Estrategias de campaña diseñadas alrededor de tus objetivos.",
                ],
                [
                  "CREADORES",
                  "Creadores relevantes seleccionados según tu audiencia.",
                ],
                [
                  "RESULTADOS",
                  "Informes claros y análisis detallado del rendimiento.",
                ],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="border-b border-white/15 px-0 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0"
                >
                  <h3 className="text-sm font-medium tracking-[0.12em]">
                    {title}
                  </h3>

                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CREATORS */}
        <section
          id="creators"
          className="px-6 py-28 md:px-10 md:py-40"
        >
          <div className="mx-auto grid max-w-[1500px] gap-16 md:grid-cols-12">
            
            <div className="md:col-span-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-black/45">
                04 — Para creadores
              </p>
            </div>

            <div className="md:col-span-8 md:col-start-5">
              
              <h2 className="text-5xl font-medium leading-[0.95] tracking-[-0.055em] md:text-8xl">
                TU
                <br />
                <span className="italic font-light">INFLUENCIA.</span>
                <br />
                TU FUTURO.
              </h2>

              <p className="mt-10 max-w-xl text-lg leading-relaxed text-black/55">
                Crea tu perfil profesional como creador, descubre
                oportunidades relevantes y conecta con marcas que creen en
                tu trabajo.
              </p>

              <a
  href="/login"
  className="mt-10 inline-flex rounded-full bg-[#8A6340] px-7 py-4 text-[10px] uppercase tracking-[0.18em] text-white transition-transform hover:scale-105"
>
  Únete a nuestra red de creadores
</a>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section className="border-y border-black/10 bg-[#D8C3A5] px-6 py-28 md:px-10 md:py-40">
          <div className="mx-auto max-w-[1500px]">
            
            <div className="grid gap-16 md:grid-cols-12">
              
              <div className="md:col-span-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-black/45">
                  05 — Tecnología
                </p>
              </div>

              <div className="md:col-span-8 md:col-start-5">
                
                <h2 className="text-5xl font-medium leading-[0.95] tracking-[-0.055em] md:text-8xl">
                  TECNOLOGÍA
                  <br />
                  E
                  <br />
                  <span className="italic font-light">INFLUENCIA.</span>
                </h2>

                <p className="mt-10 max-w-xl text-lg leading-relaxed text-black/55">
                  Estamos construyendo una nueva generación de herramientas
                  para descubrir, gestionar y medir campañas de influencer
                  marketing.
                </p>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="mt-20 overflow-hidden rounded-2xl border border-black/10 bg-[#F4EDE2] shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                
                <span className="text-xs font-semibold tracking-[-0.03em]">
                  ST.MARY AGENCY / PLATFORM
                </span>

                <span className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                  Resumen de última campaña 
                </span>
              </div>

              <div className="grid md:grid-cols-4">
                
                {[
                  ["2", "Creadores"],
                  ["6.5M", "Alcance"],
                  ["17M", "Visualizaciones"],
                  ["7K", "Likes"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="border-b border-black/10 p-7 md:border-r md:last:border-r-0"
                  >
                    <div className="text-4xl font-medium tracking-[-0.06em]">
                      {value}
                    </div>

                    <div className="mt-2 text-[9px] uppercase tracking-[0.15em] text-black/40">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid min-h-[260px] md:grid-cols-2">
                
                <div className="border-r border-black/10 p-7">
                  
                  <div className="mb-8 flex items-center justify-between">
                    
                    <span className="text-xs font-medium">
                      Rendimiento de la campaña
                    </span>

                    <span className="text-[9px] uppercase tracking-widest text-black/40">
                      Últimos 30 días
                    </span>
                  </div>

                  <div className="flex h-40 items-end gap-2">
                    {[32, 48, 41, 65, 57, 78, 69, 92, 82, 100, 87, 95].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-sm bg-[#5A3E28] transition-all hover:bg-[#5A3E28]"
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="p-7">
                  
                  <div className="mb-8 text-xs font-medium">
                    Numero de creadores
                  </div>

                  {[
                    ["@creator_one", "94% coincidencia"],
                    ["@creator_two", "91% coincidencia"]
                  ].map(([name, match], index) => (
                    <div
                      key={name}
                      className="flex items-center justify-between border-b border-black/10 py-4"
                    >
                      
                      <div className="flex items-center gap-3">
                        
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8A6340] text-[9px] text-[#F4EDE2]">
                          0{index + 1}
                        </div>

                        <span className="text-sm">{name}</span>
                      </div>

                      <span className="text-[9px] uppercase tracking-widest text-black/40">
                        {match}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="px-6 py-28 md:px-10 md:py-40">
          <div className="mx-auto max-w-[1500px]">
            
            <div className="mb-16">
              
              <p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-black/45">
                06 — Nuestro enfoque
              </p>

              <h2 className="text-5xl font-medium tracking-[-0.055em] md:text-8xl">
                SIMPLE.
                <br />
                <span className="italic font-light">POTENTE.</span>
              </h2>
            </div>

            <div className="grid border-t border-black/20 md:grid-cols-4">
              
              {[
                "DESCUBRIR",
                "CONECTAR",
                "ACTIVAR",
                "MEDIR",
              ].map((item, index) => (
                <div
                  key={item}
                  className="border-b border-black/20 py-8 md:border-b-0 md:border-r md:px-7 md:first:pl-0"
                >
                  
                  <span className="text-[9px] tracking-[0.18em] text-black/40">
                    0{index + 1}
                  </span>

                  <h3 className="mt-8 text-2xl font-medium tracking-[-0.04em]">
                    {item}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          id="contact"
          className="bg-[#8A6340] px-6 py-28 text-white md:px-10 md:py-40"
        >
          <div className="mx-auto max-w-[1500px]">
            
            <p className="mb-8 text-[10px] uppercase tracking-[0.18em] text-white/40">
              07 — Trabajemos juntos
            </p>

            <h2 className="max-w-6xl text-[15vw] font-medium leading-[0.78] tracking-[-0.08em] md:text-[10vw]">
              HAZ QUE
              <br />
              <span className="italic font-light">LA INFLUENCIA</span>
              <br />
              IMPORTE.
            </h2>

            <div className="mt-16 flex flex-col justify-between gap-10 md:flex-row md:items-end">
              
              <p className="max-w-md text-lg leading-relaxed text-white/50">
                Tanto si eres una marca que busca a los creadores adecuados
                como si eres un creador que busca colaboraciones relevantes,
                hablemos.
              </p>

              <a
                href="mailto:info@stmaryagency.com"
                className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.18em]"
              >
                info@stmaryagency.com

                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 transition-all group-hover:bg-[#F4EDE2] group-hover:text-[#5A3E28]">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#8A6340] px-6 pb-8 text-white md:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center">
          
          <div>
            <div className="text-xl font-semibold tracking-[-0.05em]">
              ST.MARY AGENCY 
            </div>
            

            <div className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
              Influencer Marketing
            </div>
          </div>
          <img
  src={stmaryLogoLight}
  alt="ST.MARY AGENCY"
  className="h-12 w-auto object-contain"
/>

          <div className="flex gap-6 text-[9px] uppercase tracking-[0.16em] text-white/40">
            
            <a href="http://instagram.com/stmaryagency/" className="hover:text-white">
              Instagram
            </a>

            <a href="#" className="hover:text-white">
              LinkedIn
            </a>
          </div>

          <div className="text-[9px] uppercase tracking-[0.16em] text-white/30">
            © 2026 ST.MARY AGENCY 
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 border-t border-white/20 pt-6 text-xs">
  <a href="/terms" className="hover:underline">
    Condiciones de uso
  </a>

  <a href="/privacy" className="hover:underline">
    Política de privacidad
  </a>

  <a href="/data-deletion" className="hover:underline">
    Eliminación de datos
  </a>
</div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* WEB PÚBLICA */}

          <Route
            path="/"
            element={<Landing />}
          />
          <Route
  path="/calculadora"
  element={<Calculator />}
  
/>

<Route
  path="/calculator"
  element={<Calculator />}
/>

<Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />
<Route
  path="/data-deletion"
  element={<DataDeletion />}
/>

          {/* AUTENTICACIÓN */}

          <Route
            path="/login"
            element={<Login />}
          />
          <Route path="/activate-account" element={<ActivateAccount />} />

          <Route
            path="/register"
            element={<Register />}
          />
          {/* =========================
              STAFF
          ========================== */}

       <Route element={<ProtectedRoute allowedRoles={["STAFF"]} />}>
        <Route path="/admin" element={<AdminDashboardLayout />}>
          <Route index element={<AdminDashboard />} />

          <Route path="brands" element={<AdminBrands />} />

          <Route
            path="brands/:id"
            element={<AdminBrandDetail />}
          />

          <Route
            path="brands/:brandId/campaigns/new"
            element={<AdminNewCampaign />}
          />
<Route path="settings" element={<AccountSettings />} />
          <Route path="creators" element={<AdminCreators />} />
          <Route
            path="creators/:id"
            element={<AdminCreatorDetail />}
          />
          <Route
            path="/admin/brands/new"
            element={<AdminNewBrand />}
          />
           <Route path="campaigns" element={<AdminCampaigns />} />
          <Route
            path="campaigns/:id"
            element={<AdminCampaignDetail />}
          />
          <Route
            path="campaigns/:id/edit"
            element={<AdminCampaignEdit />}
          />
          <Route
  path="/admin/campaigns/:id/manage"
  element={
    <AdminCampaignManagement />
  }
/>
<Route
  path="/admin/brand-requests"
  element={<AdminBrandRequests />}
/>
<Route
  path="/admin/campaigns/:campaignId/creators/:campaignCreatorId"
  element={<AdminCollaborationDetail />}
/>
<Route
  path="creator-requests"
  element={<AdminCreatorRequests />}
/>
          <Route path="finance" element={<AdminFinance />} />
          <Route
            path="metric-verification"
            element={<MetricVerification />}
          />
        </Route>
      </Route>

          {/* =========================
    MARCA
========================== */}

<Route
  element={
    <ProtectedRoute allowedRoles={["BRAND"]} />
  }
>
  <Route
    path="/platform"
    element={<DashboardLayout />}
  >
    {/* DASHBOARD */}
    <Route
      index
      element={<Dashboard />}
    />
    <Route path="settings" element={<AccountSettings />} />

    {/* =====================
        VER CAMPAÑAS
    ====================== */}

    <Route
      element={
        <ProtectedRoute
          allowedRoles={["BRAND"]}
          permission="canViewCampaigns"
        />
      }
    >
      <Route
        path="campaigns"
        element={<Campaigns />}
      />

      <Route
        path="campaigns/:id"
        element={<CampaignDetail />}
      />

      <Route
        path="campaigns/:id/creators"
        element={<CampaignCreators />}
      />

      <Route
        path="campaigns/:campaignId/creators/:campaignCreatorId"
        element={<CollaborationDetail />}
      />
      <Route
  element={
    <ProtectedRoute
      allowedRoles={["BRAND"]}
      permission="canViewProposals"
    />
  }
>
 <Route
  path="proposals"
  element={<Proposals />}
/>

<Route
  path="proposals/:campaignId"
  element={<CampaignProposals />}
/>
</Route>
    </Route>

    {/* =====================
        CREAR CAMPAÑAS
    ====================== */}

    <Route
      element={
        <ProtectedRoute
          allowedRoles={["BRAND"]}
          permission="canCreateCampaigns"
        />
      }
    >
      <Route
        path="campaigns/new"
        element={<NewCampaign />}
      />
    </Route>

    {/* =====================
        EDITAR CAMPAÑAS
    ====================== */}

    <Route
      element={
        <ProtectedRoute
          allowedRoles={["BRAND"]}
          permission="canEditCampaigns"
        />
      }
    >
      <Route
        path="campaigns/:id/edit"
        element={<CampaignEdit />}
      />
    </Route>

    {/* =====================
        DESCUBRIR CREADORES
    ====================== */}

    <Route
      element={
        <ProtectedRoute
          allowedRoles={["BRAND"]}
          permission="canDiscoverCreators"
        />
      }
    >
      <Route
        path="creators"
        element={<Creators />}
      />
    </Route>

    {/* =====================
        VER PERFIL CREADOR
    ====================== */}

    <Route
      path="creators/:id"
      element={<CreatorDetail />}
    />

    {/* =====================
        SELECCIONAR CREADORES
    ====================== */}

    <Route
      element={
        <ProtectedRoute
          allowedRoles={["BRAND"]}
          permission="canSelectCreators"
        />
      }
    >
      <Route
        path="campaigns/:id/creators/add"
        element={<AddCampaignCreator />}
      />
    </Route>
  </Route>
</Route>
          {/* =========================
              CREADOR
          ========================== */}

          <Route element={<ProtectedRoute allowedRoles={["CREATOR"]} />}>

            <Route
              path="/creator"
              element={<CreatorDashboardLayout />}
            >

              <Route
                index
                element={<CreatorDashboard />}
              />
              <Route path="settings" element={<AccountSettings />} />

              <Route
                path="campaigns"
                element={<CreatorCampaigns />}
              />
              <Route
                path="applications"
                element={<CreatorApplications />}
              />
              <Route
                path="opportunities"
                element={<CreatorOpportunities />}
              />

              <Route
                path="profile"
                element={<CreatorProfile />}
              />

              <Route
                path="payments"
                element={<CreatorPayments />}
              />
              <Route
                path="campaigns/:id"
                element={<CreatorCollaborationDetail />}
              />

            </Route>

          </Route>

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;