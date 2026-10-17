
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
  { label: "Resumen", path: "/admin" },
  { label: "Clientes", path: "/admin/brands" },
  { label: "Creadores", path: "/admin/creators" },
  { label: "Campañas", path: "/admin/campaigns" },
  { label: "Finanzas", path: "/admin/finance" },
  { label: "Solicitudes Marcas", path: "/admin/brand-requests" },
  { label: "Solicitudes Creadores", path: "/admin/creator-requests" },
];
function AdminDashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setMobileMenuOpen(false);
      navigate("/login", { replace: true });
    }
  };

  const navLinkClass = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-[#F4EDE2] text-[#5A3E28]"
        : "text-[#EBDCC4] hover:bg-[#8A6340] hover:text-white"
    }`;

  const renderNavigation = () => (
    <>
      <nav
        aria-label="Administración"
        className="flex-1 px-4 py-6"
      >
        <p className="px-3 pb-3 text-[9px] uppercase tracking-[0.16em] text-[#D8C3A5]">
          Administración
        </p>

        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>


      <div className="border-t border-[#A07A55]/40 p-4">
            <NavLink
  to="/admin/settings"
  onClick={() => setMobileMenuOpen(false)}
  className={navLinkClass}
>
  Ajustes
</NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-[#EBDCC4] transition-colors hover:bg-[#8A6340] hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#A07A55]/40 px-7 py-6">
        <Link
          to="/admin"
          onClick={() => setMobileMenuOpen(false)}
          className="text-xl font-semibold tracking-[-0.05em] text-[#F4EDE2]"
        >
          ST.MARY AGENCY
        </Link>

        <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-[#D8C3A5]">
          Backoffice
        </p>
      </div>

      <div className="border-b border-[#A07A55]/40 px-7 py-5">
        <p className="truncate text-sm font-medium text-[#F4EDE2]">
          {user?.name || "ST.MARY AGENCY"}
        </p>

        <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#D8C3A5]">
          Staff
        </p>
      </div>

      {renderNavigation()}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4EDE2] font-sans text-[#3E2B1B]">
      {/* SIDEBAR DESKTOP */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-[#8A6340]/30 bg-[#5A3E28] md:block">
        {renderSidebarContent()}
      </aside>

      {/* SIDEBAR MÓVIL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-[#3E2B1B]/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside
            aria-label="Menú de administración"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#5A3E28] shadow-2xl"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              {renderSidebarContent()}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 rounded-lg px-3 py-2 text-sm text-[#F4EDE2] hover:bg-[#8A6340]"
              aria-label="Cerrar navegación"
            >
              ✕
            </button>
          </aside>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-w-0 md:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#D8C3A5]/70 bg-[#F4EDE2]/95 px-5 backdrop-blur-xl md:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8C3A5] text-[#5A3E28] hover:bg-[#EBDCC4] md:hidden"
            >
              <span className="text-xl leading-none">☰</span>
            </button>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8A6340]">
                ST.MARY AGENCY
              </p>

              <p className="mt-1 text-sm font-medium text-[#3E2B1B]">
                Backoffice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div
              title={user?.name || "Staff"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8A6340] text-[10px] font-semibold text-white"
            >
              {String(user?.name || "SM")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0))
                .join("")
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="px-5 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardLayout;
