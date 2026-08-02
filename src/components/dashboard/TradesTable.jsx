import { formatCurrency, formatDate, formatPrice } from "@/lib/formatters";
import { getNetPnl } from "@/lib/tradingAnalytics";

export default function TradesTable({ trades, onView, onEdit, onDelete }) {
  return (
    <section id="trades" className="neo-surface rounded-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-line/80 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Obchodní deník</h2>
          <p className="mt-1 text-sm text-slate-400 sm:text-base">Otevři detail, uprav data nebo si poznamenej lekci pro příště.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-left text-sm md:min-w-[930px]">
          <thead className="bg-panelMuted/70 text-xs uppercase tracking-wider text-slate-400 sm:text-sm">
            <tr>
              <th className="px-5 py-3.5 font-medium sm:px-6">Datum</th>
              <th className="px-5 py-3.5 font-medium">Trh</th>
              <th className="px-5 py-3.5 font-medium">Směr</th>
              <th className="px-5 py-3.5 font-medium">Setup a tagy</th>
              <th className="px-5 py-3.5 font-medium">Vstup / výstup</th>
              <th className="px-5 py-3.5 text-right font-medium">Čistý P/L</th>
              <th className="px-5 py-3.5 text-right font-medium sm:px-6">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {trades.length ? trades.map((trade) => {
              const netPnl = getNetPnl(trade);
              const positive = netPnl >= 0;
              const rating = Number(trade.setupRating) || 0;
              return (
                <tr className="transition hover:bg-panelMuted/45" key={trade.id}>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-400 sm:px-6 sm:text-base">{formatDate(trade.date)}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white sm:text-base">{trade.symbol}</p>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{trade.market}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trade.direction === "Long" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"} sm:text-sm`}>{trade.direction}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-200 sm:text-base">{trade.setup}</p>
                    {rating ? <p className="mt-1 text-xs text-amber-300 sm:text-sm">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</p> : null}
                    {trade.bias ? <p className="mt-1 text-xs text-violet-300 sm:text-sm">Bias: {trade.bias}</p> : null}
                    {trade.rrPlan != null || trade.rrActual != null || trade.rrMax != null ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">RR {trade.rrPlan ?? "—"}/{trade.rrActual ?? "—"}/{trade.rrMax ?? "—"}</p> : null}
                    {(trade.entryTime || trade.exitTime) ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">{trade.entryTime ? `Vstup ${trade.entryTime}` : ""}{trade.exitTime ? ` • Výstup ${trade.exitTime}` : ""}</p> : null}
                    {(trade.entryScreenshot || trade.exitScreenshot) ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">📷 screenshot</p> : null}
                    {trade.tags?.length ? <p className="mt-1 max-w-40 truncate text-xs text-violet-300 sm:text-sm">{trade.tags.join(" · ")}</p> : null}
                  </td>
                  <td className="px-5 py-4 text-slate-400 sm:text-base">{formatPrice(trade.entry)} <span className="text-slate-600">→</span> {formatPrice(trade.exit)}</td>
                  <td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${positive ? "text-positive" : "text-negative"} sm:text-base`}>{positive ? "+" : ""}{formatCurrency(netPnl)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                    <button className="mr-2 text-xs font-semibold text-accent hover:text-accentHover sm:text-sm" type="button" onClick={() => onView(trade)}>Detail</button>
                    <button className="mr-2 text-xs font-semibold text-slate-300 hover:text-white sm:text-sm" type="button" onClick={() => onEdit(trade)}>Upravit</button>
                    <button className="text-xs font-semibold text-negative hover:text-rose-300 sm:text-sm" type="button" onClick={() => onDelete(trade)}>Smazat</button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-6 py-12 text-center text-slate-400 sm:text-base" colSpan="7">Žádný obchod neodpovídá vybranému filtru.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
