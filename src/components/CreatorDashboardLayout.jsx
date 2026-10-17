
import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const navigation = [
  {
    label: "Resumen",
    path: "/creator",
  },
  {
    label: "Oportunidades",
    path: "/creator/opportunities",
  },
  {
    label: "Mis candidaturas",
    path: "/creator/applications",
  },
  {
    label: "Mis campañas",
    path: "/creator/campaigns",
  },
  {
    label: "Mi perfil",
    path: "/creator/profile",
  },
  {
    label: "Pagos",
    path: "/creator/payments",
  },
];

function CreatorDashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = user?.name || "Creador";

  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "C";

  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      closeMenu();
      navigate("/login", { replace: true });
    }
  };

  const navLinkClass = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-[#8A6340] text-white"
        : "text-[#5A3E28] hover:bg-[#D8C3A5]/50"
    }`;

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* LOGO */}
      <div className="border-b border-[#D8C3A5] px-7 py-6">
        <Link
          to="/creator"
          onClick={closeMenu}
          className="text-xl font-semibold tracking-[-0.05em] text-[#5A3E28]"
        >
          ST.MARY AGENCY
        </Link>

        <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">
          Creator Platform
        </p>
      </div>

      {/* USUARIO */}
      <div className="border-b border-[#D8C3A5] px-7 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8A6340] text-[10px] font-medium text-white">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#3E2B1B]">
              {displayName}
            </p>

            <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#8A6340]">
              Creador
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav
        aria-label="Navegación de creador"
        className="flex-1 px-4 py-6"
      >
        <p className="px-3 pb-3 text-[9px] uppercase tracking-[0.16em] text-[#8A6340]">
          Plataforma
        </p>

        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/creator"}
              onClick={closeMenu}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* PIE DEL MENÚ */}
      <div className="border-t border-[#D8C3A5] p-4">
        <NavLink
  to="/creator/settings"
  onClick={closeMenu}
  className={navLinkClass}
>
  Ajustes
</NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 w-full rounded-xl px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A6340] transition-colors hover:bg-[#D8C3A5]/50"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EDE2] font-sans text-[#3E2B1B]">
      {/* MENÚ DESKTOP */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-[#D8C3A5] bg-[#EBDCC4] md:block">
        {renderSidebarContent()}
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
            aria-label="Menú de creador"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#EBDCC4] shadow-2xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              {renderSidebarContent()}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-w-0 md:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#D8C3A5]/70 bg-[#F4EDE2]/95 px-5 backdrop-blur-xl md:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8C3A5] text-xl text-[#5A3E28] hover:bg-[#EBDCC4] md:hidden"
            >
              ☰
            </button>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
                ST.MARY AGENCY
              </p>

              <p className="mt-1 text-sm font-medium text-[#3E2B1B]">
                Creator Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <NotificationBell />

            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-[#3E2B1B]">
                {displayName}
              </p>

              <p className="text-[10px] text-[#6F6052]">
                Cuenta profesional
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8A6340] text-xs font-medium text-white">
              {initials}
            </div>
          </div>
        </header>

        {/* PÁGINA ACTUAL */}
        <div className="px-5 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default CreatorDashboardLayout;
