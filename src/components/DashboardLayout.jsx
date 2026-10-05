import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function DashboardLayout() {
  const navigate = useNavigate();

  const {
    user,
    membership,
    can,
    logout,
  } = useAuth();

  /*
   * Marca asociada al usuario actual.
   */
  const brand = membership?.brand;

  /*
   * Nombre mostrado en el sidebar.
   */
  const brandName =
    brand?.companyName ||
    user?.name ||
    "Marca";

  /*
   * Inicial para el avatar.
   */
  const brandInitial =
    brandName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "M";

  /*
   * El menú se construye según los permisos
   * reales del BrandMember.
   */
  const menuItems = [
    {
      label: "Resumen",
      path: "/platform",
      visible: true,
    },

    {
      label: "Campañas",
      path: "/platform/campaigns",
      visible: can("canViewCampaigns"),
    },

    {
      label: "Creadores",
      path: "/platform/creators",
      visible: can("canDiscoverCreators"),
    },

    {
      label: "Propuestas",
      path: "/platform/proposals",
      visible: can("canViewProposals"),
    },

    {
      label: "Resultados",
      path: "/platform/results",
      visible: can("canViewResults"),
    },
  ].filter((item) => item.visible);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#111111]">

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-black/10 bg-[#f5f5f2] md:flex md:flex-col">

        {/* LOGO */}

        <div className="border-b border-black/10 px-7 py-7">
          <Link
            to="/"
            className="text-xl font-semibold tracking-[-0.05em]"
          >
            ST.MARY AGENCY 
          </Link>

          <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-black/35">
            Platform
          </p>
        </div>

        {/* CLIENTE */}

        <div className="border-b border-black/10 px-7 py-6">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
              {brandInitial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {brandName}
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-black/35">
                Cliente
              </p>
            </div>

          </div>
        </div>

        {/* =========================
            NAVIGATION
        ========================== */}

        <nav className="flex-1 px-4 py-6">

          <p className="mb-4 px-3 text-[9px] uppercase tracking-[0.16em] text-black/30">
            Plataforma
          </p>

          <div className="space-y-1">

            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/platform"}
                className={({ isActive }) =>
                  `
                  flex items-center rounded-xl px-3 py-3
                  text-[10px] uppercase tracking-[0.13em]
                  transition-all
                  ${
                    isActive
                      ? "bg-black text-white"
                      : "text-black/50 hover:bg-black/[0.04] hover:text-black"
                  }
                  `
                }
              >
                {item.label}
              </NavLink>
            ))}

          </div>

        </nav>

        {/* =========================
            BOTTOM
        ========================== */}

        <div className="border-t border-black/10 p-4">

          <Link
            to="/platform/settings"
            className="block rounded-xl px-3 py-3 text-[10px] uppercase tracking-[0.13em] text-black/45 hover:bg-black/[0.04] hover:text-black"
          >
            Configuración
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 w-full rounded-xl px-3 py-3 text-left text-[10px] uppercase tracking-[0.13em] text-black/45 hover:bg-black/[0.04] hover:text-black"
          >
            Cerrar sesión
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================== */}

      <div className="md:pl-64">

        {/* MOBILE HEADER */}

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-[#f5f5f2]/90 px-5 py-4 backdrop-blur-xl md:hidden">

          <div>
            <Link
              to="/"
              className="text-lg font-semibold tracking-[-0.05em]"
            >
              ST.MARY AGENCY 
            </Link>

            <p className="mt-1 max-w-[180px] truncate text-[8px] uppercase tracking-[0.12em] text-black/35">
              {brandName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-[9px] uppercase tracking-[0.14em] text-black/45"
          >
            Salir
          </button>

        </header>

        {/* PAGE */}

        <main className="px-6 py-10 md:px-10 md:py-12">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;