import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    label: "Resumen",
    path: "/admin",
  },
  {
    label: "Clientes",
    path: "/admin/brands",
  },
  {
    label: "Creadores",
    path: "/admin/creators",
  },
  {
    label: "Campañas",
    path: "/admin/campaigns",
  },
  {
    label: "Finanzas",
    path: "/admin/finance",
  },
];

function AdminDashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-black/10 bg-[#111111] text-white md:block">

        <div className="flex h-full flex-col">

          <div className="border-b border-white/10 px-7 py-6">

            <Link
              to="/admin"
              className="text-xl font-semibold tracking-[-0.05em]"
            >
              ST.MARIA
            </Link>

            <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
              Backoffice
            </p>

          </div>

          <div className="border-b border-white/10 px-7 py-5">

            <p className="text-sm font-medium">
              {user?.name || "ST.MARIA"}
            </p>

            <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/35">
              Staff
            </p>

          </div>

          <nav className="flex-1 px-4 py-6">

            <p className="px-3 pb-3 text-[9px] uppercase tracking-[0.16em] text-white/25">
              Administración
            </p>

            <div className="space-y-1">

              {navigation.map((item) => (

                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-white text-black"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>

              ))}

            </div>

          </nav>

          <div className="border-t border-white/10 p-4">

            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-white/40 hover:bg-white/5 hover:text-white"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </aside>

      <main className="md:ml-64">

        <header className="flex h-20 items-center justify-between border-b border-black/10 bg-[#f5f5f2] px-6 md:px-10">

          <div>

            <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
              ST.MARIA Agency
            </p>

            <p className="mt-1 text-sm font-medium">
              Backoffice
            </p>

          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[10px] text-white">
            SM
          </div>

        </header>

        <div className="px-6 py-8 md:px-10 md:py-10">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

export default AdminDashboardLayout;