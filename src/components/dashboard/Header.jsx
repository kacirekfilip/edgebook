export default function Header({ onAddTrade, onOpenSettings }) {
  return (
    <header className="border-b border-violet/40 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-9">
          <a className="flex items-center gap-2.5" href="#overview" aria-label="Edgebook dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-violet text-lg font-black text-white shadow-lg shadow-accent/30">
              E
            </span>
            <span className="text-lg font-bold tracking-tight text-white sm:text-xl">Edgebook</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Hlavní navigace">
            {[{ label: "Přehled", href: "#overview" }, { label: "Obchody", href: "#trades" }, { label: "Analytika", href: "#analytics" }].map((item, index) => (
              <a
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  index === 0 ? "bg-violet/25 text-white ring-1 ring-violet/50" : "text-slate-400 hover:text-white"
                }`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="hidden rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white sm:block"
            type="button"
            onClick={onOpenSettings}
          >
            Nastavení
          </button>
          <button
            className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:from-accentHover hover:to-violet md:px-3.5 md:py-2"
            type="button"
            onClick={onAddTrade}
          >
            <span aria-hidden="true">+</span> Přidat obchod
          </button>
        </div>
      </div>
    </header>
  );
}
