"use client";

import { useEffect, useMemo, useState } from "react";
import AddTradeButton from "./AddTradeButton";
import AddTradeModal from "./AddTradeModal";
import AnalyticsPanel from "./AnalyticsPanel";
import Header from "./Header";
import StatsCards from "./StatsCards";
import TradeDetailModal from "./TradeDetailModal";
import TradesFilters from "./TradesFilters";
import TradesTable from "./TradesTable";
import { useTrades } from "@/hooks/useTrades";
import { getStoredStartingCapital, setStoredStartingCapital } from "@/lib/accountSettings";
import { roundCurrency, toFiniteNumber } from "@/lib/numberFormat";
import { getTradeStatus } from "@/lib/tradingAnalytics";

const defaultFilters = { search: "", market: "all", setup: "all", outcome: "all" };

export default function Dashboard() {
  const { trades, isReady, error, createTrade, updateTrade, removeTrade } = useTrades();
  const [filters, setFilters] = useState(defaultFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [startingCapital, setStartingCapital] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [capitalInput, setCapitalInput] = useState("");
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCapital = getStoredStartingCapital();
    if (storedCapital == null) {
      setShowWelcomePrompt(true);
      setStartingCapital(0);
      setCapitalInput("");
      return;
    }

    setStartingCapital(storedCapital);
    setCapitalInput(String(storedCapital));
  }, []);

  useEffect(() => {
    if (startingCapital === 0 && typeof window !== "undefined" && getStoredStartingCapital() == null) {
      return;
    }
  }, [startingCapital]);

  const markets = useMemo(() => [...new Set(trades.map((trade) => trade.market))].sort(), [trades]);
  const setups = useMemo(() => [...new Set(trades.map((trade) => trade.setup))].sort(), [trades]);
  const filteredTrades = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return trades.filter((trade) => {
      const searchable = [trade.symbol, trade.market, trade.setup, ...(trade.tags ?? [])].join(" ").toLowerCase();
      return (!search || searchable.includes(search))
        && (filters.market === "all" || trade.market === filters.market)
        && (filters.setup === "all" || trade.setup === filters.setup)
        && (filters.outcome === "all" || getTradeStatus(trade) === filters.outcome);
    });
  }, [filters, trades]);

  function closeTradeForm() {
    setIsModalOpen(false);
    setEditingTrade(null);
  }

  function openNewTrade() {
    setEditingTrade(null);
    setIsModalOpen(true);
  }

  function openEditTrade(trade) {
    setSelectedTrade(null);
    setEditingTrade(trade);
    setIsModalOpen(true);
  }

  async function saveTrade(trade) {
    if (editingTrade) {
      await updateTrade(trade);
    } else {
      await createTrade(trade);
    }
    closeTradeForm();
  }

  async function handleDelete(trade) {
    if (!window.confirm(`Opravdu chceš smazat obchod ${trade.symbol} z ${trade.date}?`)) return;
    await removeTrade(trade.id);
    if (selectedTrade?.id === trade.id) setSelectedTrade(null);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function openSettings() {
    setCapitalInput(String(startingCapital));
    setIsSettingsOpen(true);
  }

  function saveStartingCapital() {
    const parsedValue = toFiniteNumber(capitalInput);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return;
    }

    const normalizedValue = roundCurrency(parsedValue);
    setStoredStartingCapital(normalizedValue);
    setStartingCapital(normalizedValue);
    setShowWelcomePrompt(false);
    setIsSettingsOpen(false);
  }

  function handleWelcomeSubmit(event) {
    event.preventDefault();
    saveStartingCapital();
  }

  return (
    <main id="overview" className="app-shell min-h-screen">
      <Header onAddTrade={openNewTrade} onOpenSettings={openSettings} />
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-accent">Tvůj trading workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Obchoduj plán, ne emoce.</h1>
            <p className="mt-2 max-w-xl text-slate-400">Každý obchod, poznámka a metrika je uložená přímo v tomto zařízení.</p>
          </div>
          <div className="rounded-xl border border-violet/35 bg-panel/65 px-4 py-3 text-sm text-slate-300 shadow-[0_0_24px_rgba(135,77,255,0.12)]">
            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${isReady ? "bg-positive" : "animate-pulse bg-accent"}`} />
            {isReady ? "Lokální databáze připravena" : "Načítám obchodní deník…"}
          </div>
        </div>

        {error ? <div className="mb-6 rounded-xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-rose-100">{error} Zobrazuji dočasná data této relace.</div> : null}

        <StatsCards trades={filteredTrades} startingCapital={startingCapital} />
        <div className="mt-8"><AnalyticsPanel trades={filteredTrades} startingCapital={startingCapital} /></div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="xl:row-start-1 xl:row-end-2">
            <TradesFilters filters={filters} markets={markets} setups={setups} resultCount={filteredTrades.length} onChange={handleFilterChange} onClear={() => setFilters(defaultFilters)} />
            <TradesTable trades={filteredTrades} onView={setSelectedTrade} onEdit={openEditTrade} onDelete={handleDelete} />
          </section>
          <aside className="neo-surface h-fit rounded-2xl p-5 xl:row-start-1 xl:row-end-3">
            <p className="text-sm font-semibold text-accent">Denní fokus</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Zapisuj kvalitu, ne jen výsledek.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Před vstupem si ověř setup, definuj risk a po výstupu napiš krátkou lekci. Analytika pak odhalí opakující se vzorce.</p>
            <div className="mt-5 rounded-xl border border-violet/25 bg-violet/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Dnešní checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>✓ Risk definovaný před vstupem</li>
                <li>✓ Poznámka po uzavření obchodu</li>
                <li>✓ Žádný impulzivní trade</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <AddTradeButton onClick={openNewTrade} />
      <AddTradeModal isOpen={isModalOpen} trade={editingTrade} onClose={closeTradeForm} onSave={saveTrade} />
      <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} onEdit={openEditTrade} onDelete={handleDelete} />
      {showWelcomePrompt ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-4">
          <div className="w-full max-w-md rounded-2xl border border-violet/30 bg-panel p-5 shadow-2xl">
            <p className="text-sm font-semibold text-accent">Počáteční kapitál</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Zadejte počáteční velikost účtu.</h2>
            <p className="mt-2 text-sm text-slate-400">Tato hodnota bude základem pro výpočet aktuálního zůstatku.</p>
            <form className="mt-5 space-y-4" onSubmit={handleWelcomeSubmit}>
              <label className="block text-sm font-medium text-slate-300">
                Počáteční kapitál (USD)
                <input className="mt-2 w-full rounded-lg border border-line bg-ink/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600" type="number" min="0" step="0.01" value={capitalInput} onChange={(event) => setCapitalInput(event.target.value)} placeholder="5000" autoFocus />
              </label>
              <div className="flex justify-end gap-3">
                <button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={() => { setCapitalInput("0"); saveStartingCapital(); }}>
                  Přeskočit
                </button>
                <button className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2 text-sm font-bold text-white" type="submit">
                  Uložit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {isSettingsOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-4">
          <div className="w-full max-w-md rounded-2xl border border-violet/30 bg-panel p-5 shadow-2xl">
            <p className="text-sm font-semibold text-accent">Nastavení aplikace</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Změnit počáteční kapitál</h2>
            <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); saveStartingCapital(); }}>
              <label className="block text-sm font-medium text-slate-300">
                Počáteční kapitál (USD)
                <input className="mt-2 w-full rounded-lg border border-line bg-ink/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600" type="number" min="0" step="0.01" value={capitalInput} onChange={(event) => setCapitalInput(event.target.value)} />
              </label>
              <div className="flex justify-end gap-3">
                <button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={() => setIsSettingsOpen(false)}>
                  Zrušit
                </button>
                <button className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2 text-sm font-bold text-white" type="submit">
                  Uložit změny
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
