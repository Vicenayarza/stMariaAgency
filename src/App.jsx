import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";

import Campaigns from "./pages/Campaigns";
import NewCampaign from "./pages/NewCampaign";
import CampaignDetail from "./pages/CampaignDetail";
import CampaignCreators from "./pages/CampaignCreators";
import CampaignEdit from "./pages/CampaignEdit";
import AddCampaignCreator from "./pages/AddCampaignCreator";
import CollaborationDetail from "./pages/CollaborationDetail";

import CreatorDashboardLayout from "./components/CreatorDashboardLayout";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorCampaigns from "./pages/CreatorCampaigns";
import CreatorProfile from "./pages/CreatorProfile";
import CreatorPayments from "./pages/CreatorPayments";
import Creators from "./pages/Creators";
import CreatorDetail from "./pages/CreatorDetail";
import CreatorCollaborationDetail from "./pages/CreatorCollaborationDetail";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardLayout from "./components/AdminDashboardLayout";
import AdminDashboard from "./pages/AdminDashboard";
import MetricVerification from "./pages/MetricVerification";
import AdminBrands from "./pages/AdminBrands";
import AdminBrandDetail from "./pages/AdminBrandDetail";
import AdminCreators from "./pages/AdminCreators";
import AdminCreatorDetail from "./pages/AdminCreatorDetail";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminCampaignDetail from "./pages/AdminCampaignDetail";
import AdminFinance from "./pages/AdminFinance";

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

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#111111] selection:bg-[#111111] selection:text-white">
      
      {/* NAVBAR */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-black/10 bg-[#f5f5f2]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5 md:px-10">
          
          <a
            href="#"
            className="text-xl font-semibold tracking-[-0.05em]"
          >
            ST.MARIA
          </a>

          <div className="hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[0.16em] md:flex">
            <a href="#what-we-do" className="transition-opacity hover:opacity-50">
              Qué hacemos
            </a>

            <a href="#brands" className="transition-opacity hover:opacity-50">
              Para marcas
            </a>

            <a href="#creators" className="transition-opacity hover:opacity-50">
              Para creadores
            </a>

            <a href="#about" className="transition-opacity hover:opacity-50">
              Nosotros
            </a>
          </div>

        <div className="hidden items-center gap-3 md:flex">

  <a
    href="#contact"
    className="rounded-full border border-black/15 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-black hover:text-white"
  >
    Hablemos
  </a>

  <a
    href="/login"
    className="rounded-full bg-[#111111] px-6 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition-transform hover:scale-105"
  >
    Acceder
  </a>

</div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 md:hidden"
          >
            <div className="space-y-1.5">
              <span className="block h-px w-4 bg-black" />
              <span className="block h-px w-4 bg-black" />
            </div>
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-black/10 bg-[#f5f5f2] px-6 py-8 md:hidden">
            <div className="flex flex-col gap-6 text-sm uppercase tracking-[0.12em]">
              <a href="#what-we-do" onClick={() => setMenuOpen(false)}>
                Qué hacemos
              </a>

              <a href="#brands" onClick={() => setMenuOpen(false)}>
                Para marcas
              </a>

              <a href="#creators" onClick={() => setMenuOpen(false)}>
                Para creadores
              </a>

              <a href="#about" onClick={() => setMenuOpen(false)}>
                Nosotros
              </a>

              <a href="#contact" onClick={() => setMenuOpen(false)}>
               Hablemos
              </a>
              <a href="/login" onClick={() => setMenuOpen(false)}>
                Acceder
              </a>
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
                Madrid / Barcelona / España
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
                  Descubre ST.MARIA

                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 transition-all group-hover:bg-black group-hover:text-white">
                    ↓
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section className="overflow-hidden border-y border-black/10 bg-[#111111] py-5 text-white">
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
                ST.MARIA conecta marcas con las personas que dan forma a la
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
          className="bg-[#111111] px-6 py-28 text-white md:px-10 md:py-40"
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
  className="mt-10 inline-flex rounded-full border border-white/30 px-7 py-4 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-white hover:text-black"
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
  className="mt-10 inline-flex rounded-full bg-black px-7 py-4 text-[10px] uppercase tracking-[0.18em] text-white transition-transform hover:scale-105"
>
  Únete a nuestra red de creadores
</a>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY */}
        <section className="border-y border-black/10 bg-[#deded9] px-6 py-28 md:px-10 md:py-40">
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
            <div className="mt-20 overflow-hidden rounded-2xl border border-black/10 bg-[#f5f5f2] shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                
                <span className="text-xs font-semibold tracking-[-0.03em]">
                  ST.MARIA / PLATFORM
                </span>

                <span className="text-[9px] uppercase tracking-[0.15em] text-black/40">
                  Resumen de campaña
                </span>
              </div>

              <div className="grid md:grid-cols-4">
                
                {[
                  ["24", "Creadores"],
                  ["1.24M", "Alcance"],
                  ["83K", "Interacciones"],
                  ["7.8%", "Engagement"],
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
                          className="flex-1 rounded-t-sm bg-black/80 transition-all hover:bg-black"
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="p-7">
                  
                  <div className="mb-8 text-xs font-medium">
                    Mejores creadores
                  </div>

                  {[
                    ["@creator_one", "94% coincidencia"],
                    ["@creator_two", "91% coincidencia"],
                    ["@creator_three", "88% coincidencia"],
                  ].map(([name, match], index) => (
                    <div
                      key={name}
                      className="flex items-center justify-between border-b border-black/10 py-4"
                    >
                      
                      <div className="flex items-center gap-3">
                        
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[9px] text-white">
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
          className="bg-[#111111] px-6 py-28 text-white md:px-10 md:py-40"
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
                href="mailto:hello@stmaria.agency"
                className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.18em]"
              >
                hello@stmaria.agency

                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 transition-all group-hover:bg-white group-hover:text-black">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#111111] px-6 pb-8 text-white md:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center">
          
          <div>
            <div className="text-xl font-semibold tracking-[-0.05em]">
              ST.MARIA
            </div>

            <div className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
              Influencer Marketing
            </div>
          </div>

          <div className="flex gap-6 text-[9px] uppercase tracking-[0.16em] text-white/40">
            
            <a href="#" className="hover:text-white">
              Instagram
            </a>

            <a href="#" className="hover:text-white">
              LinkedIn
            </a>

            <a href="#" className="hover:text-white">
              Privacidad
            </a>
          </div>

          <div className="text-[9px] uppercase tracking-[0.16em] text-white/30">
            © 2026 ST.MARIA AGENCY
          </div>
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

          {/* AUTENTICACIÓN */}

          <Route
            path="/login"
            element={<Login />}
          />

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
          <Route path="brands/:id" element={<AdminBrandDetail />} />

          <Route path="creators" element={<AdminCreators />} />
          <Route
            path="creators/:id"
            element={<AdminCreatorDetail />}
          />
           <Route path="campaigns" element={<AdminCampaigns />} />
          <Route
            path="campaigns/:id"
            element={<AdminCampaignDetail />}
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

          <Route element={<ProtectedRoute allowedRoles={["BRAND"]} />}>

            <Route
              path="/platform"
              element={<DashboardLayout />}
            >

              <Route
                index
                element={<Dashboard />}
              />

              <Route
                path="campaigns"
                element={<Campaigns />}
              />

              <Route
                path="campaigns/new"
                element={<NewCampaign />}
              />

              <Route
                path="campaigns/:id"
                element={<CampaignDetail />}
              />
              <Route
                path="creators"
                element={<Creators />}
              />
              <Route
                path="creators/:id"
               element={<CreatorDetail />}
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
                path="campaigns/:id/edit"
                element={<CampaignEdit />}
              />
              <Route
                path="campaigns/:id/creators/add"
                element={<AddCampaignCreator />}
              />

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

              <Route
                path="campaigns"
                element={<CreatorCampaigns />}
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