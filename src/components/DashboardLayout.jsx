
import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, membership, can, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brand = membership?.brand;

  const brandName =
    brand?.companyName ||
    user?.name ||
    "Marca";

  const brandInitial =
    brandName.trim().charAt(0).toUpperCase() || "M";

  /*
   * Solo mostramos pantallas existentes y
   * autorizadas para esta marca.
   *
   * Resultados y Configuración quedan ocultos
   * hasta tener rutas operativas.
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
  ].filter((item) => item.visible);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setMobileMenuOpen(false);
      navigate("/login", { replace: true });
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const navigation = (
    <>
      <nav
        aria-label="Navegación de marca"
        className="flex-1 px-4 py-6"
      >
        <p className="mb-4 px-3 text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">
          Plataforma
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/platform"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-4 py-3
                text-[10px] font-medium uppercase tracking-[0.13em]
                transition-colors ${
                  isActive
                    ? "bg-[#8A6340] text-white"
                    : "text-[#5A3E28] hover:bg-[#D8C3A5]/50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-[#D8C3A5] p-4">
        <NavLink
  to="/platform/settings"
  onClick={closeMenu}
  className={({ isActive }) =>
    `block rounded-xl px-4 py-3 text-[10px] font-medium uppercase tracking-[0.13em] transition-colors ${
      isActive
        ? "bg-[#8A6340] text-white"
        : "text-[#5A3E28] hover:bg-[#D8C3A5]/50"
    }`
  }
>
  Ajustes
</NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.13em] text-[#8A6340] transition-colors hover:bg-[#D8C3A5]/50 hover:text-[#3E2B1B]"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#D8C3A5] px-7 py-7">
        <Link
          to="/"
          onClick={closeMenu}
          className="text-xl font-semibold tracking-[-0.05em] text-[#5A3E28]"
        >
          ST.MARY AGENCY
        </Link>

        <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">
          Platform
        </p>
      </div>

      <div className="border-b border-[#D8C3A5] px-7 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8A6340] text-xs font-medium text-white">
            {brandInitial}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#3E2B1B]">
              {brandName}
            </p>

            <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#8A6340]">
              Cliente
            </p>
          </div>
        </div>
      </div>

      {navigation}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EDE2] font-sans text-[#3E2B1B]">
      {/* SIDEBAR DESKTOP */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-[#D8C3A5] bg-[#EBDCC4] md:block">
        {sidebarContent}
      </aside>

      {/* MENÚ MÓVIL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMenu}
            className="absolute inset-0 bg-[#3E2B1B]/50"
          />

          <aside
            aria-label="Menú de marca"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#EBDCC4] shadow-2xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              {sidebarContent}
            </div>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Cerrar navegación"
              className="absolute right-3 top-4 rounded-lg px-3 py-2 text-sm text-[#5A3E28] hover:bg-[#D8C3A5]"
            >
              ✕
            </button>
          </aside>
        </div>
      )}

      {/* CONTENIDO */}
      <div className="min-w-0 md:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#D8C3A5]/70 bg-[#F4EDE2]/95 px-5 backdrop-blur-xl md:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8C3A5] text-[#5A3E28] hover:bg-[#EBDCC4] md:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
                ST.MARY AGENCY
              </p>
              <p className="mt-1 max-w-[200px] truncate text-sm font-medium text-[#3E2B1B]">
                {brandName}
              </p>
            </div>
          </div>

          <div
            title={brandName}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8A6340] text-xs font-medium text-white"
          >
            {brandInitial}
          </div>
        </header>

        <main className="px-5 py-8 md:px-10 md:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
