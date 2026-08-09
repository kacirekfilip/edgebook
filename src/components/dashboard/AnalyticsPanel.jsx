import { formatCurrency, formatDate } from "@/lib/formatters";
import { formatR } from "@/lib/numberFormat";
import { getTradeAnalytics } from "@/lib/tradingAnalytics";

function EquityCurve({ data }) {
  if (data.length < 2) {
    return <div className="grid h-56 place-items-center rounded-xl border border-dashed border-line text-sm text-slate-500">Přidej alespoň dva obchody pro equity curve.</div>;
  }

  const width = 680;
  const height = 230;
  const padding = 24;
  const values = data.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const coordinates = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + ((maxValue - point.value) / range) * (height - padding * 2);
    return { x, y };
  });
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const lastValue = values.at(-1);
  const firstValue = values[0];

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white sm:text-base">Equity curve</p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Vývoj účtu z uložených obchodů</p>
        </div>
        <p className={`text-sm font-bold ${lastValue >= firstValue ? "text-positive" : "text-negative"} sm:text-base`}>{formatCurrency(lastValue)}</p>
      </div>
      <svg className="h-auto w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Vývoj hodnoty obchodního účtu">
        <defs>
          <linearGradient id="equity-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#E14AF4" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#874DFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="equity-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#E14AF4" />
            <stop offset="100%" stopColor="#22DDBD" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((line) => <line key={line} x1={padding} x2={width - padding} y1={padding + line * (height - padding * 2)} y2={padding + line * (height - padding * 2)} stroke="rgba(164, 73, 237, 0.18)" strokeDasharray="4 6" />)}
        <polygon points={area} fill="url(#equity-fill)" />
        <polyline points={points} fill="none" stroke="url(#equity-line)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {coordinates.map(({ x, y }, index) => <circle cx={x} cy={y} fill="#F5EFFF" key={`${data[index].date}-${index}`} r="4" stroke="#E14AF4" strokeWidth="2" />)}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-slate-500"><span>{formatDate(data[0].date)}</span><span>{formatDate(data.at(-1).date)}</span></div>
    </div>
  );
}

function CompactMetric({ label, value, detail, accent = "text-white" }) {
  return (
    <div className="rounded-xl border border-line/80 bg-ink/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function AnalyticsPanel({ trades, startingCapital }) {
  const analytics = getTradeAnalytics(trades, startingCapital);
  const profitFactor = analytics.profitFactor !== null ? formatR(analytics.profitFactor) : "—";

  return (
    <section id="analytics" className="grid grid-cols-1 gap-4 xl:grid-cols-5" aria-label="Analytika obchodování">
      <article className="neo-surface rounded-2xl p-5 xl:col-span-3 sm:p-6"><EquityCurve data={analytics.equityCurve} /></article>
      <article className="neo-surface rounded-2xl p-5 xl:col-span-2 sm:p-6">
        <p className="text-sm font-semibold text-accent sm:text-base">Performance snapshot</p>
        <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">Co říkají data</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <CompactMetric label="Profit factor" value={profitFactor} detail="Hrubý zisk / hrubá ztráta" accent={analytics.profitFactor === null || analytics.profitFactor >= 1 ? "text-positive" : "text-negative"} />
          <CompactMetric label="Průměrné R" value={analytics.averageR !== null ? `${formatR(analytics.averageR)}R` : "—"} detail="Čistý výsledek vůči risku" accent={analytics.averageR !== null ? (analytics.averageR >= 0 ? "text-positive" : "text-negative") : "text-slate-400"} />
          <CompactMetric label="Nejlepší setup" value={analytics.bestSetup?.setup ?? "—"} detail={analytics.bestSetup ? `${formatCurrency(analytics.bestSetup.netPnl)} · ${analytics.bestSetup.winRate}% win rate` : "Zatím bez dat"} />
        </div>
      </article>
      <article className="neo-surface rounded-2xl p-5 xl:col-span-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-accent sm:text-base">Setup performance</p><h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">Které setupy ti skutečně vydělávají</h2></div>
          <p className="text-sm text-slate-400 sm:text-base">{analytics.tradeCount} obchodů ve výběru</p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {analytics.bySetup.length ? analytics.bySetup.map((setup, index) => (
            <div className="rounded-xl border border-line/80 bg-ink/50 p-4" key={`${setup.setup}-${index}`}>
              <p className="truncate font-semibold text-slate-100 sm:text-base">{setup.setup}</p>
              <p className={`mt-3 text-xl font-bold ${setup.netPnl >= 0 ? "text-positive" : "text-negative"} sm:text-2xl`}>{setup.netPnl >= 0 ? "+" : ""}{formatCurrency(setup.netPnl)}</p>
              <p className="mt-2 text-xs text-slate-500 sm:text-sm">{setup.tradeCount} obchodů · {setup.winRate}% win rate</p>
            </div>
          )) : <p className="text-sm text-slate-500 sm:text-base">Přidej první obchod a analytika se objeví tady.</p>}
        </div>
      </article>
    </section>
  );
}
