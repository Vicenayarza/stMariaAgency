import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", path: "/platform" },
      { name: "Campañas", path: "/platform/campaigns" },
      { name: "Creadores", path: "/platform/creators" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { name: "Mensajes", path: "/platform/messages" },
      { name: "Contenido", path: "/platform/content" },
      { name: "Resultados", path: "/platform/results" },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { name: "Facturación", path: "/platform/billing" },
      { name: "Configuración", path: "/platform/settings" },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-black/10 bg-[#f5f5f2] lg:block">

      <div className="flex h-full flex-col">

        {/* LOGO */}

        <div className="border-b border-black/10 px-7 py-6">

          <div className="text-xl font-semibold tracking-[-0.05em]">
            ST.MARIA
          </div>

          <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-black/40">
            Platform
          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          {navigation.map((section) => (

            <div key={section.label} className="mb-8">

              <p className="mb-3 px-3 text-[9px] uppercase tracking-[0.16em] text-black/35">
                {section.label}
              </p>

              <div className="space-y-1">

                {section.items.map((item) => (

                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/platform"}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 text-sm transition-colors ${
                        isActive
                          ? "bg-black text-white"
                          : "text-black/60 hover:bg-black/5 hover:text-black"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>

                ))}

              </div>

            </div>

          ))}

        </nav>


        {/* USER */}

        <div className="border-t border-black/10 p-4">

          <div className="flex items-center gap-3 rounded-lg p-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[10px] text-white">
              MA
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-medium">
                Mi empresa
              </p>

              <p className="truncate text-[10px] text-black/40">
                Empresa
              </p>

            </div>

          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;