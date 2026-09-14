function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/10 bg-[#f5f5f2]/90 px-6 backdrop-blur-xl lg:px-10">

      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
          Plataforma
        </p>

        <h1 className="mt-1 text-lg font-medium tracking-[-0.03em]">
          Dashboard
        </h1>
      </div>


      <div className="flex items-center gap-5">

        {/* NOTIFICATIONS */}

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-xs hover:bg-black hover:text-white"
          aria-label="Notificaciones"
        >
          ♧
        </button>


        {/* USER */}

        <div className="hidden text-right sm:block">

          <p className="text-xs font-medium">
            Mi empresa
          </p>

          <p className="text-[9px] uppercase tracking-[0.12em] text-black/35">
            Administrador
          </p>

        </div>


        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[10px] text-white">
          MA
        </div>

      </div>

    </header>
  );
}

export default Topbar;