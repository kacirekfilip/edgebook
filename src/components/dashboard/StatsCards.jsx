import StatsCard from "./StatsCard";
import { formatCurrency } from "@/lib/formatters";
import { formatR } from "@/lib/numberFormat";
import { getTradeAnalytics } from "@/lib/tradingAnalytics";

export default function StatsCards({ trades, startingCapital }) {
  const analytics = getTradeAnalytics(trades, startingCapital);
  const balance = startingCapital + analytics.totalPnl;
  const streakPositive = analytics.currentStreak.type === "výhry";

  const cards = [
    {
      label: "Zůstatek účtu",
      value: formatCurrency(balance),
      detail: `${analytics.totalPnl >= 0 ? "+" : ""}${formatCurrency(analytics.totalPnl)} čistý P/L`,
      trend: analytics.totalPnl >= 0 ? "positive" : "negative",
    },
    {
      label: "Úspěšnost",
      value: analytics.winRate !== null ? `${analytics.winRate}%` : "—",
      detail: `${analytics.wins} z ${analytics.tradeCount} ziskových obchodů`,
      trend: analytics.winRate !== null ? (analytics.winRate >= 50 ? "positive" : "negative") : "neutral",
    },
    {
      label: "Průměrný obchod",
      value: analytics.averageTrade !== null ? formatCurrency(analytics.averageTrade) : "—",
      detail: analytics.averageR !== null ? `${analytics.averageR >= 0 ? "+" : ""}${formatR(analytics.averageR)}R očekávání` : "Bez dat pro R",
      trend: analytics.averageTrade !== null ? (analytics.averageTrade >= 0 ? "positive" : "negative") : "neutral",
    },
    {
      label: "Aktivní série",
      value: analytics.currentStreak.count ? `${analytics.currentStreak.count} ${analytics.currentStreak.type}` : "Bez série",
      detail: analytics.currentStreak.count ? "Počítáno od posledního obchodu" : "Další obchod založí novou sérii",
      trend: streakPositive ? "positive" : analytics.currentStreak.count ? "negative" : "neutral",
    },
  ];

  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Klíčové metriky">{cards.map((card) => <StatsCard key={card.label} {...card} />)}</section>;
}
