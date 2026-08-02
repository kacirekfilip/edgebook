import { formatCurrency, formatDate, formatPrice, formatTimeValue } from "@/lib/formatters";
import { formatR } from "@/lib/numberFormat";
import { getNetPnl, getRMultiple } from "@/lib/tradingAnalytics";

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-line/80 bg-ink/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default function TradeDetailModal({ trade, onClose, onEdit, onDelete }) {
  if (!trade) return null;

  const netPnl = getNetPnl(trade);
  const rMultiple = getRMultiple(trade);
  const criteria = (trade.entryChecklist ?? []).filter((item) => item.checked);

  function handleBackdropMouseDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={handleBackdropMouseDown}>
      <div className="mx-auto flex min-h-full w-full items-start justify-center py-4 sm:max-w-2xl sm:py-4">
        <section
          className="neo-surface my-4 w-full rounded-2xl p-5 shadow-2xl sm:m-4 sm:p-6 md:m-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trade-detail-title"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-accent">{formatDate(trade.date)} · {trade.market}</p>
              <h2 id="trade-detail-title" className="mt-1 text-2xl font-semibold text-white">{trade.symbol} <span className="text-base font-medium text-slate-400">{trade.direction}</span></h2>
            </div>
            <button className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-panelMuted hover:text-white" type="button" aria-label="Zavřít" onClick={onClose}>×</button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailItem label="Setup" value={trade.setup} />
            <DetailItem label="Čistý P/L" value={`${netPnl >= 0 ? "+" : ""}${formatCurrency(netPnl)}`} />
            <DetailItem label="R-multiple" value={`${formatR(rMultiple)}R`} />
            <DetailItem label="Vstup / výstup" value={`${formatPrice(trade.entry)} → ${formatPrice(trade.exit)}`} />
            <DetailItem label="Risk" value={formatCurrency(trade.risk)} />
            <DetailItem label="Pozice" value={String(trade.quantity)} />
            <DetailItem label="Hrubý P/L" value={formatCurrency(trade.pnl)} />
            <DetailItem label="Poplatky" value={formatCurrency(trade.fees)} />
            <DetailItem label="Výsledek" value={netPnl > 0 ? "Zisk" : netPnl < 0 ? "Ztráta" : "Breakeven"} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Seance" value={trade.session || "—"} />
            <DetailItem label="Bias" value={trade.bias || "—"} />
            <DetailItem label="Čas vstupu" value={formatTimeValue(trade.entryTime) || "—"} />
            <DetailItem label="Čas výstupu" value={formatTimeValue(trade.exitTime) || "—"} />
            <DetailItem label="RR plán / skutečné / max" value={trade.rrPlan != null || trade.rrActual != null || trade.rrMax != null ? `${trade.rrPlan ?? "—"} / ${trade.rrActual ?? "—"} / ${trade.rrMax ?? "—"}` : "—"} />
            <DetailItem label="Setup rating" value={trade.setupRating ? `${"★".repeat(trade.setupRating)}${"☆".repeat(5 - trade.setupRating)} (${trade.setupRating}/5)` : "—"} />
          </div>

          {(trade.entryScreenshot || trade.exitScreenshot) ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {trade.entryScreenshot ? (
                <div className="rounded-xl border border-line/80 bg-ink/50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Graf před vstupem</p>
                  <img className="mt-3 h-40 w-full rounded-lg border border-line object-cover" src={trade.entryScreenshot} alt="Graf před vstupem" />
                </div>
              ) : null}
              {trade.exitScreenshot ? (
                <div className="rounded-xl border border-line/80 bg-ink/50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Graf po ukončení</p>
                  <img className="mt-3 h-40 w-full rounded-lg border border-line object-cover" src={trade.exitScreenshot} alt="Graf po ukončení" />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Kritéria vstupu</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {criteria.length ? criteria.map((item) => <span className="rounded-full bg-violet/20 px-2.5 py-1 text-xs font-semibold text-violet-200" key={item.id}>{item.label}</span>) : <span className="text-sm text-slate-500">Žádná kritéria</span>}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Tagy</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {trade.tags?.length ? trade.tags.map((tag, index) => <span className="rounded-full bg-violet/20 px-2.5 py-1 text-xs font-semibold text-violet-200" key={`${tag}-${index}`}>{tag}</span>) : <span className="text-sm text-slate-500">Bez tagů</span>}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line/80 bg-ink/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Reflexe obchodu</p>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-300">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Proč jsem vstoupil?</p>
                <p className="mt-1 whitespace-pre-wrap">{trade.reason || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Co potvrdilo vstup?</p>
                <p className="mt-1 whitespace-pre-wrap">{trade.confirmation || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dodržel jsem plán?</p>
                <p className="mt-1 whitespace-pre-wrap">{trade.planFollowed || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Co bych příště udělal jinak?</p>
                <p className="mt-1 whitespace-pre-wrap">{trade.lesson || "—"}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line/80 bg-ink/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Poznámka</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{trade.notes || "K tomuto obchodu zatím není žádná poznámka."}</p>
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button className="rounded-lg px-3 py-2.5 text-sm font-semibold text-negative hover:bg-negative/10" type="button" onClick={() => onDelete(trade)}>Smazat obchod</button>
            <div className="flex gap-3">
              <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-panelMuted" type="button" onClick={onClose}>Zavřít</button>
              <button className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:from-accentHover" type="button" onClick={() => onEdit(trade)}>Upravit</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
