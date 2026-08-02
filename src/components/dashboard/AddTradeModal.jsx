import { useEffect, useMemo, useRef, useState } from "react";
import { formatTimeValue, normalizeTimeValue } from "@/lib/formatters";
import { createChecklistState, getDefaultChecklist, getStoredChecklist, getTradeChecklist, saveStoredChecklist } from "@/lib/entryChecklist";
import { toFiniteNumber, roundCurrency, formatR } from "@/lib/numberFormat";
import { getFormPreferences, getSessionForTime, saveFormPreferences } from "@/lib/formPreferences";
import { getTradeStatus } from "@/lib/tradingAnalytics";

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    entryTime: formatTimeValue(now),
    exitTime: formatTimeValue(now),
  };
}

function getEmptyForm() {
  const currentDateTime = getCurrentDateTime();
  const preferences = getFormPreferences();
  // Obchodní seance se automaticky určí z času vstupu; mimo rozsahy spadne na poslední preferenci.
  const autoSession = getSessionForTime(currentDateTime.entryTime);
  return {
    date: currentDateTime.date,
    market: preferences.market,
    symbol: "",
    direction: "Long",
    setup: preferences.setup,
    session: autoSession ?? preferences.session,
    bias: preferences.bias,
    entryTime: currentDateTime.entryTime,
    exitTime: currentDateTime.exitTime,
    setupRating: 0,
    entryChecklist: createChecklistState(getStoredChecklist()),
    entryScreenshot: "",
    exitScreenshot: "",
    reason: "",
    confirmation: "",
    planFollowed: "",
    lesson: "",
    mood: "Neutrální",
    entry: "",
    exit: "",
    risk: "",
    quantity: "",
    fees: "0",
    notes: "",
    tags: "",
  };
}

function tradeToForm(trade) {
  return {
    date: trade.date,
    market: trade.market,
    symbol: trade.symbol,
    direction: trade.direction,
    setup: trade.setup,
    session: trade.session ?? "Asijská",
    bias: trade.bias ?? "Neutral (50/50)",
    entryTime: formatTimeValue(trade.entryTime ?? ""),
    exitTime: formatTimeValue(trade.exitTime ?? ""),
    setupRating: trade.setupRating ?? 0,
    entryChecklist: getTradeChecklist(trade, getStoredChecklist()),
    entryScreenshot: trade.entryScreenshot ?? "",
    exitScreenshot: trade.exitScreenshot ?? "",
    reason: trade.reason ?? "",
    confirmation: trade.confirmation ?? "",
    planFollowed: trade.planFollowed ?? "",
    lesson: trade.lesson ?? "",
    mood: trade.mood ?? "Neutrální",
    entry: String(trade.entry ?? ""),
    exit: String(trade.exit ?? ""),
    risk: String(trade.risk ?? ""),
    quantity: String(trade.quantity ?? ""),
    fees: String(trade.fees ?? 0),
    notes: trade.notes ?? "",
    tags: Array.isArray(trade.tags) ? trade.tags.join(", ") : "",
  };
}

function StarRating({ value, onChange }) {
  return (
    <div className="mt-2 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition ${star <= value ? "text-amber-400" : "text-slate-600 hover:text-amber-300"} focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-ink rounded-sm`}
          onClick={() => onChange(star)}
          aria-label={`Hodnocení ${star} z 5`}
          style={{ minWidth: '2rem', minHeight: '2rem' }} // Zajištění minimální velikosti pro dotyková zařízení
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-400">{value ? `${value}/5` : "Nevyhodnoceno"}</span>
    </div>
  );
}

const fieldClass = "mt-1.5 w-full rounded-lg border border-line bg-ink/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:border-accent";

// Validace screenshotů: povolené typy a maximální velikost souboru (8 MB).
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SCREENSHOT_SIZE = 8 * 1024 * 1024; // 8 MB

export default function AddTradeModal({ isOpen, trade, onClose, onSave }) {
  const [form, setForm] = useState(getEmptyForm);
  const [formError, setFormError] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [checklistTemplate, setChecklistTemplate] = useState(getStoredChecklist);
  const [isChecklistEditorOpen, setIsChecklistEditorOpen] = useState(false);
  const [checklistDraft, setChecklistDraft] = useState(getStoredChecklist);
  const isEditing = Boolean(trade);
  const checklistItems = useMemo(() => form.entryChecklist ?? [], [form.entryChecklist]);
  // Sleduje, jestli uživatel ručně změnil seanci — pak se už automaticky nepřepisuje.
  const sessionTouchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const template = getStoredChecklist();
    setChecklistTemplate(template);
    setChecklistDraft(template);
    setForm(isEditing ? tradeToForm(trade) : getEmptyForm());
    setFormError("");
    setScreenshotError("");
    sessionTouchedRef.current = false;
  }, [isOpen, isEditing, trade]);

  // Automatické výpočty (P/L, RR, status) — živě při psaní.
  const computed = useMemo(() => {
    const entry = toFiniteNumber(form.entry);
    const exit = toFiniteNumber(form.exit);
    const quantity = toFiniteNumber(form.quantity);
    const risk = toFiniteNumber(form.risk);
    const fees = toFiniteNumber(form.fees);

    const hasPrices = Number.isFinite(entry) && Number.isFinite(exit) && Number.isFinite(quantity) && quantity !== 0;
    const hasRisk = Number.isFinite(risk) && risk > 0;

    let pnl = null;
    if (hasPrices) {
      const multiplier = form.direction === "Short" ? -1 : 1;
      pnl = (exit - entry) * quantity * multiplier - (Number.isFinite(fees) ? fees : 0);
    }

    let rMultiple = null;
    if (hasPrices && hasRisk) {
      const multiplier = form.direction === "Short" ? -1 : 1;
      const grossPnl = (exit - entry) * quantity * multiplier - (Number.isFinite(fees) ? fees : 0);
      rMultiple = grossPnl / risk;
    }

    let status = null;
    if (pnl != null) {
      if (pnl > 0) status = "Win";
      else if (pnl < 0) status = "Loss";
      else status = "Breakeven";
    }

    return { pnl, rMultiple, status, hasPrices, hasRisk };
  }, [form.entry, form.exit, form.quantity, form.risk, form.fees, form.direction]);

  if (!isOpen) return null;

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    if (name === "session") sessionTouchedRef.current = true;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  // Změna času vstupu automaticky přepočítá seanci, dokud ji uživatel nemanuálně nezměnil.
  function handleEntryTimeChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (!sessionTouchedRef.current) {
        const autoSession = getSessionForTime(value);
        if (autoSession) next.session = autoSession;
      }
      return next;
    });
  }

  function handleTimeBlur(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: normalizeTimeValue(value) }));
  }

  function toggleChecklistItem(id) {
    setForm((current) => ({ ...current, entryChecklist: (current.entryChecklist ?? []).map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)) }));
  }

  function openChecklistEditor() {
    setChecklistDraft(checklistTemplate.map((item) => ({ ...item })));
    setIsChecklistEditorOpen(true);
  }

  function closeChecklistEditor() {
    setIsChecklistEditorOpen(false);
    setChecklistDraft(checklistTemplate.map((item) => ({ ...item })));
  }

  function saveChecklistTemplate() {
    const normalizedItems = checklistDraft.map((item) => ({ ...item, label: item.label.trim() })).filter((item) => item.label);
    const nextTemplate = normalizedItems.length ? normalizedItems : getDefaultChecklist();
    setChecklistTemplate(nextTemplate);
    saveStoredChecklist(nextTemplate);
    setForm((current) => ({ ...current, entryChecklist: nextTemplate.map((item) => ({ id: item.id, label: item.label, checked: false })) }));
    setIsChecklistEditorOpen(false);
  }

  function updateChecklistDraft(index, label) {
    setChecklistDraft((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, label } : item)));
  }

  function moveChecklistDraft(index, direction) {
    setChecklistDraft((current) => {
      const next = [...current];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function removeChecklistDraft(index) {
    setChecklistDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addChecklistDraft() {
    setChecklistDraft((current) => [...current, { id: crypto.randomUUID(), label: "" }]);
  }

  function handleScreenshotUpload(event) {
    const { name, files } = event.target;
    const file = files?.[0];
    if (!file || typeof window === "undefined" || typeof window.FileReader === "undefined") return;

    // Ověření typu souboru.
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setScreenshotError("Nepodporovaný formát. Nahraj PNG, JPG, WEBP nebo GIF.");
      event.target.value = "";
      return;
    }

    // Ověření maximální velikosti.
    if (file.size > MAX_SCREENSHOT_SIZE) {
      setScreenshotError("Soubor je příliš velký. Maximální velikost je 8 MB.");
      event.target.value = "";
      return;
    }

    setScreenshotError("");

    // Okamžitý náhled — data URL se zobrazí a uloží spolu s obchodem.
    const reader = new window.FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, [name]: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function removeScreenshot(name) {
    setForm((current) => ({ ...current, [name]: "" }));
    setScreenshotError("");
  }

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const entry = toFiniteNumber(form.entry);
    const exit = toFiniteNumber(form.exit);
    const risk = toFiniteNumber(form.risk);
    const quantity = toFiniteNumber(form.quantity);
    const fees = toFiniteNumber(form.fees);
    const directionMultiplier = form.direction === "Short" ? -1 : 1;
    // P/L se počítá na plné přesnosti; zaokrouhluje se až při zobrazení.
    const pnl = (exit - entry) * quantity * directionMultiplier;

    if (!form.symbol.trim() || !Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(risk) || !Number.isFinite(quantity) || !Number.isFinite(fees)) {
      setFormError("Vyplň symbol a všechny číselné hodnoty.");
      return;
    }
    if (risk <= 0 || quantity <= 0 || fees < 0) {
      setFormError("Risk a velikost pozice musí být kladné; poplatky nemohou být záporné.");
      return;
    }

    // Zapamatovat poslední volby pro příští obchod.
    saveFormPreferences({ market: form.market, setup: form.setup, session: form.session, bias: form.bias });

    const savedTrade = {
      ...(trade ?? {}),
      date: form.date,
      market: form.market,
      symbol: form.symbol.trim().toUpperCase(),
      direction: form.direction,
      setup: form.setup,
      session: form.session,
      bias: form.bias,
      entryTime: normalizeTimeValue(form.entryTime),
      exitTime: normalizeTimeValue(form.exitTime),
      setupRating: Math.max(0, Math.min(5, Number(form.setupRating) || 0)),
      entryChecklist: (form.entryChecklist ?? []).map((item) => ({ id: item.id, label: item.label, checked: Boolean(item.checked) })),
      entryScreenshot: form.entryScreenshot || "",
      exitScreenshot: form.exitScreenshot || "",
      reason: form.reason.trim(),
      confirmation: form.confirmation.trim(),
      planFollowed: form.planFollowed.trim(),
      lesson: form.lesson.trim(),
      mood: form.mood,
      entry,
      exit,
      pnl,
      risk,
      quantity,
      fees,
      notes: form.notes.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    savedTrade.status = getTradeStatus(savedTrade);

    try {
      setIsSaving(true);
      await onSave(savedTrade);
    } catch {
      setFormError("Obchod se nepodařilo uložit. Zkus to prosím znovu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={handleBackdropMouseDown}>
      <div className="mx-auto flex min-h-full w-full items-start justify-center py-4 sm:max-w-3xl sm:py-4">
        <section
          className="neo-surface my-4 w-full rounded-2xl p-5 shadow-2xl sm:m-4 sm:p-6 md:m-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trade-form-title"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-accent">Trading journal</p>
              <h2 id="trade-form-title" className="mt-1 text-xl font-semibold text-white">{isEditing ? "Upravit obchod" : "Přidat obchod"}</h2>
              <p className="mt-1 text-sm text-slate-400">Zapiš rozhodnutí i kontext — později z nich vzniknou použitelné insighty.</p>
            </div>
            <button className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-panelMuted hover:text-white" type="button" aria-label="Zavřít" onClick={onClose}>
              ×
            </button>
          </div>
          <form className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-300">
              Datum
              <input className={fieldClass} type="date" name="date" value={form.date} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Symbol
              <input className={fieldClass} type="text" name="symbol" placeholder="např. AAPL" value={form.symbol} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Trh
              <select className={fieldClass} name="market" value={form.market} onChange={updateField}>
                <option>NASDAQ</option>
                <option>NYSE</option>
                <option>Forex</option>
                <option>Crypto</option>
                <option>Futures</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Směr
              <select className={fieldClass} name="direction" value={form.direction} onChange={updateField}>
                <option>Long</option>
                <option>Short</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Setup
              <select className={fieldClass} name="setup" value={form.setup} onChange={updateField}>
                <option>Breakout</option>
                <option>Pullback</option>
                <option>Reversal</option>
                <option>Range fade</option>
                <option>Trend continuation</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Seance
              <select className={fieldClass} name="session" value={form.session} onChange={updateField}>
                <option>Asijská</option>
                <option>Londýnská</option>
                <option>New York</option>
                <option>Londýn-NY</option>
                <option>Ostatní</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Bias
              <select className={fieldClass} name="bias" value={form.bias} onChange={updateField}>
                <option>Strong Short (80/20)</option>
                <option>Short (65/35)</option>
                <option>Neutral (50/50)</option>
                <option>Long (65/35)</option>
                <option>Strong Long (80/20)</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Nálada obchodníka
              <select className={fieldClass} name="mood" value={form.mood} onChange={updateField}>
                <option>Velmi špatná 😞</option>
                <option>Špatná 😕</option>
                <option>Neutrální 😐</option>
                <option>Dobrá 🙂</option>
                <option>Velmi dobrá 🤩</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300">
              Čas vstupu
              <input className={fieldClass} type="text" inputMode="numeric" name="entryTime" value={form.entryTime} onChange={handleEntryTimeChange} onBlur={handleTimeBlur} placeholder="HH:mm" />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Čas výstupu
              <input className={fieldClass} type="text" inputMode="numeric" name="exitTime" value={form.exitTime} onChange={updateField} onBlur={handleTimeBlur} placeholder="HH:mm" />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Velikost pozice
              <input className={fieldClass} type="number" inputMode="numeric" min="0" name="quantity" step="any" placeholder="např. 100" value={form.quantity} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Entry cena
              <input className={fieldClass} type="number" inputMode="numeric" name="entry" step="any" placeholder="0.00" value={form.entry} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Výstupní cena
              <input className={fieldClass} type="number" inputMode="numeric" name="exit" step="any" placeholder="0.00" value={form.exit} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Risk (USD)
              <input className={fieldClass} type="number" inputMode="numeric" min="0" name="risk" step="0.01" placeholder="např. 100" value={form.risk} onChange={updateField} required />
            </label>
            <label className="text-sm font-medium text-slate-300">
              Poplatky (USD)
              <input className={fieldClass} type="number" inputMode="numeric" min="0" name="fees" step="0.01" value={form.fees} onChange={updateField} required />
            </label>

            {/* Živý automatický výpočet */}
            <div className="rounded-xl border border-line/70 bg-ink/50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-semibold text-white">Automatický výpočet</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-line/60 bg-ink/40 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">P/L</p>
                  <p className={`mt-1 text-lg font-bold ${computed.pnl == null ? "text-slate-500" : computed.pnl > 0 ? "text-positive" : computed.pnl < 0 ? "text-negative" : "text-slate-300"}`}>
                    {computed.pnl == null ? "—" : `${computed.pnl >= 0 ? "+" : ""}${roundCurrency(computed.pnl).toFixed(2)} USD`}
                  </p>
                </div>
                <div className="rounded-lg border border-line/60 bg-ink/40 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">R-multiple</p>
                  <p className={`mt-1 text-lg font-bold ${computed.rMultiple == null ? "text-slate-500" : computed.rMultiple >= 0 ? "text-positive" : "text-negative"}`}>
                    {computed.rMultiple == null ? "—" : `${formatR(computed.rMultiple)}R`}
                  </p>
                </div>
                <div className="rounded-lg border border-line/60 bg-ink/40 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Výsledek</p>
                  <p className={`mt-1 text-lg font-bold ${computed.status == null ? "text-slate-500" : computed.status === "Win" ? "text-positive" : computed.status === "Loss" ? "text-negative" : "text-slate-300"}`}>
                    {computed.status ?? "—"}
                  </p>
                </div>
              </div>
              {!computed.hasPrices ? <p className="mt-2 text-xs text-slate-500">Zadej entry, výstup a velikost pozice pro výpočet P/L.</p> : null}
            </div>

            <div className="rounded-xl border border-line/70 bg-ink/50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-semibold text-white">Hodnocení setupu</p>
              <StarRating value={Number(form.setupRating) || 0} onChange={(value) => setForm((current) => ({ ...current, setupRating: value }))} />
            </div>
            <div className="rounded-xl border border-line/70 bg-ink/50 p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Kritéria vstupu</p>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={openChecklistEditor}>
                    Upravit checklist
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {checklistItems.length ? checklistItems.map((item) => (
                  <label className="flex items-center gap-2 text-sm text-slate-300" key={item.id}>
                    <input className="h-4 w-4 rounded border-line bg-ink" type="checkbox" checked={Boolean(item.checked)} onChange={() => toggleChecklistItem(item.id)} />
                    {item.label}
                  </label>
                )) : <p className="text-sm text-slate-500 sm:col-span-2 lg:col-span-3">Žádná kritéria. Vytvořte si vlastní checklist.</p>}
              </div>
            </div>
            <div className="rounded-xl border border-line/70 bg-ink/50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-semibold text-white">Snímky grafu</p>
              <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP nebo GIF · max 8 MB</p>
              {screenshotError ? <p className="mt-2 text-sm font-medium text-negative" role="alert">{screenshotError}</p> : null}
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="text-sm font-medium text-slate-300">
                  Před vstupem
                  <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line bg-ink/40 px-3 py-2.5 text-sm text-slate-400 transition hover:border-accent hover:text-slate-200">
                    {form.entryScreenshot ? "Nahradit obrázek…" : "Vybrat obrázek…"}
                    <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" name="entryScreenshot" onChange={handleScreenshotUpload} />
                  </label>
                  {form.entryScreenshot ? (
                    <div className="relative mt-3">
                      <img className="h-32 w-full rounded-lg border border-line object-cover" src={form.entryScreenshot} alt="Snímek grafu před vstupem" />
                      <button
                        className="absolute right-2 top-2 rounded-lg bg-ink/85 px-2.5 py-1.5 text-xs font-semibold text-rose-200 shadow transition hover:bg-negative hover:text-white"
                        type="button"
                        onClick={() => removeScreenshot("entryScreenshot")}
                      >
                        Odstranit
                      </button>
                    </div>
                  ) : <p className="mt-2 text-xs text-slate-500">Zatím bez obrázku.</p>}
                </div>
                <div className="text-sm font-medium text-slate-300">
                  Po ukončení
                  <label className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-line bg-ink/40 px-3 py-2.5 text-sm text-slate-400 transition hover:border-accent hover:text-slate-200">
                    {form.exitScreenshot ? "Nahradit obrázek…" : "Vybrat obrázek…"}
                    <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" name="exitScreenshot" onChange={handleScreenshotUpload} />
                  </label>
                  {form.exitScreenshot ? (
                    <div className="relative mt-3">
                      <img className="h-32 w-full rounded-lg border border-line object-cover" src={form.exitScreenshot} alt="Snímek grafu po ukončení" />
                      <button
                        className="absolute right-2 top-2 rounded-lg bg-ink/85 px-2.5 py-1.5 text-xs font-semibold text-rose-200 shadow transition hover:bg-negative hover:text-white"
                        type="button"
                        onClick={() => removeScreenshot("exitScreenshot")}
                      >
                        Odstranit
                      </button>
                    </div>
                  ) : <p className="mt-2 text-xs text-slate-500">Zatím bez obrázku.</p>}
                </div>
              </div>
            </div>
            <label className="text-sm font-medium text-slate-300 sm:col-span-2">
              Tagy <span className="font-normal text-slate-500">(odděl čárkou)</span>
              <input className={fieldClass} type="text" name="tags" placeholder="A+, Momentum, Pravidlo" value={form.tags} onChange={updateField} />
            </label>
            <div className="rounded-xl border border-line/70 bg-ink/50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-semibold text-white">Reflexe obchodu</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="text-sm font-medium text-slate-300">
                  Proč jsem vstoupil?
                  <textarea className={`${fieldClass} min-h-24 resize-y`} name="reason" placeholder="Jaký byl důvod vstupu?" value={form.reason} onChange={updateField} />
                </label>
                <label className="text-sm font-medium text-slate-300">
                  Co potvrdilo vstup?
                  <textarea className={`${fieldClass} min-h-24 resize-y`} name="confirmation" placeholder="Jaký signál nebo podklad vstup potvrdil?" value={form.confirmation} onChange={updateField} />
                </label>
                <label className="text-sm font-medium text-slate-300">
                  Dodržel jsem plán?
                  <textarea className={`${fieldClass} min-h-24 resize-y`} name="planFollowed" placeholder="Dodržel jsem vstupní a výstupní plán?" value={form.planFollowed} onChange={updateField} />
                </label>
                <label className="text-sm font-medium text-slate-300">
                  Co bych příště udělal jinak?
                  <textarea className={`${fieldClass} min-h-24 resize-y`} name="lesson" placeholder="Co bych zlepšil příště?" value={form.lesson} onChange={updateField} />
                </label>
              </div>
            </div>
            <label className="text-sm font-medium text-slate-300 sm:col-span-2 lg:col-span-3">
              Poznámka k obchodu
              <textarea className={`${fieldClass} min-h-28 resize-y`} name="notes" placeholder="Další poznámky k obchodu" value={form.notes} onChange={updateField} />
            </label>
            {formError ? <p className="text-sm font-medium text-negative sm:col-span-2 lg:col-span-3">{formError}</p> : null}
            <div className="mt-2 flex justify-end gap-3 sm:col-span-2 lg:col-span-3">
              <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={onClose} disabled={isSaving}>
                Zrušit
              </button>
              <button className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:from-accentHover disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving}>
                {isSaving ? "Ukládám…" : isEditing ? "Uložit změny" : "Uložit obchod"}
              </button>
            </div>
          </form>
        </section>
      </div>
      {isChecklistEditorOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-violet/30 bg-panel p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-accent">Správa checklistu</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Uprav si vlastní kritéria vstupu</h3>
              </div>
              <button className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-panelMuted hover:text-white" type="button" onClick={closeChecklistEditor}>×</button>
            </div>
            <div className="mt-4 space-y-2">
              {checklistDraft.map((item, index) => (
                <div className="flex items-center gap-2" key={item.id}>
                  <button className="rounded-lg border border-line px-2 py-1 text-sm text-slate-300" type="button" onClick={() => moveChecklistDraft(index, -1)} aria-label="Přesunout nahoru">↑</button>
                  <button className="rounded-lg border border-line px-2 py-1 text-sm text-slate-300" type="button" onClick={() => moveChecklistDraft(index, 1)} aria-label="Přesunout dolů">↓</button>
                  <input className="flex-1 rounded-lg border border-line bg-ink/80 px-3 py-2 text-sm text-white" value={item.label} onChange={(event) => updateChecklistDraft(index, event.target.value)} placeholder="Název kritéria" />
                  <button className="rounded-lg px-2 py-1 text-sm text-negative hover:bg-negative/10" type="button" onClick={() => removeChecklistDraft(index)}>Smazat</button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={addChecklistDraft}>+ Přidat kritérium</button>
              <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={() => { setChecklistDraft(getDefaultChecklist()); }}>Obnovit výchozí checklist</button>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={closeChecklistEditor}>Zrušit</button>
              <button className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2 text-sm font-bold text-white" type="button" onClick={saveChecklistTemplate}>Uložit checklist</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}