
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function CreatorDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const navigation = [
    {
      label: "Resumen",
      path: "/creator",
    },
    {
      label: "Campañas",
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  const displayName = user?.name || "Creador";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#111111]">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-black/10 bg-[#f5f5f2] md:block">

        <div className="flex h-full flex-col">

          {/* LOGO */}

          <div className="border-b border-black/10 px-7 py-6">

            <Link
              to="/creator"
              className="text-xl font-semibold tracking-[-0.05em]"
            >
              ST.MARIA
            </Link>

            <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-black/35">
              Creator Platform
            </p>

          </div>


          {/* USER */}

          <div className="border-b border-black/10 px-7 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
                {initials || "C"}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-medium">
                  {displayName}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-black/35">
                  Creador
                </p>

              </div>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="flex-1 px-4 py-6">

            <p className="px-3 pb-3 text-[9px] uppercase tracking-[0.16em] text-black/30">
              Plataforma
            </p>

            <div className="space-y-1">

              {navigation.map((item) => {

                const active =
                  location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                      active
                        ? "bg-black text-white"
                        : "text-black/55 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                );

              })}

            </div>

          </nav>


          {/* BOTTOM */}

          <div className="border-t border-black/10 p-4">

            <Link
              to="/"
              className="block rounded-xl px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-black/40 hover:bg-black/5 hover:text-black"
            >
              ← Volver a ST.MARIA
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 w-full rounded-xl px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-black/40 hover:bg-black/5 hover:text-black"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </aside>


      {/* MAIN */}

      <main className="md:ml-64">

        {/* TOPBAR */}

        <header className="flex h-20 items-center justify-between border-b border-black/10 px-6 md:px-10">

          <div>

            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              ST.MARIA
            </p>

            <p className="mt-1 text-sm font-medium">
              Creator Platform
            </p>

          </div>


          <div className="flex items-center gap-4">

            <div className="hidden text-right md:block">

              <p className="text-sm font-medium">
                {displayName}
              </p>

              <p className="text-[10px] text-black/35">
                Cuenta profesional
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
              {initials || "C"}
            </div>

          </div>

        </header>


        {/* PAGE */}

        <div className="px-6 py-8 md:px-10 md:py-10">

          <Outlet />

        </div>

      </main>

    </div>
  );
}

export default CreatorDashboardLayout;
