const controlClass = "w-full rounded-lg border border-line bg-ink/80 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-accent";

export default function TradesFilters({ filters, markets, setups, onChange, onClear, resultCount }) {
  return (
    <section className="mb-4 rounded-2xl border border-violet/25 bg-panel/50 p-4" aria-label="Filtrování obchodů">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <label className="min-w-52 flex-1 text-sm font-medium text-slate-300">
          Hledat symbol nebo tag
          <input
            className={`${controlClass} mt-1.5`}
            type="search"
            name="search"
            value={filters.search}
            placeholder="Např. NVDA nebo Momentum"
            onChange={onChange}
          />
        </label>
        <label className="min-w-36 text-sm font-medium text-slate-300">
          Trh
          <select className={`${controlClass} mt-1.5`} name="market" value={filters.market} onChange={onChange}>
            <option value="all">Všechny trhy</option>
            {markets.map((market) => <option value={market} key={market}>{market}</option>)}
          </select>
        </label>
        <label className="min-w-36 text-sm font-medium text-slate-300">
          Setup
          <select className={`${controlClass} mt-1.5`} name="setup" value={filters.setup} onChange={onChange}>
            <option value="all">Všechny setupy</option>
            {setups.map((setup) => <option value={setup} key={setup}>{setup}</option>)}
          </select>
        </label>
        <label className="min-w-36 text-sm font-medium text-slate-300">
          Výsledek
          <select className={`${controlClass} mt-1.5`} name="outcome" value={filters.outcome} onChange={onChange}>
            <option value="all">Všechny výsledky</option>
            <option value="Win">Zisk</option>
            <option value="Loss">Ztráta</option>
            <option value="Breakeven">Breakeven</option>
          </select>
        </label>
        <div className="flex items-center justify-between gap-3 xl:pb-0.5">
          <p className="whitespace-nowrap text-sm text-slate-400">{resultCount} {resultCount === 1 ? "obchod" : "obchodů"}</p>
          <button className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10 hover:text-accentHover" type="button" onClick={onClear}>
            Vyčistit
          </button>
        </div>
      </div>
    </section>
  );
}
