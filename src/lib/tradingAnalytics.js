import { roundPercent } from "@/lib/numberFormat";

// Veškeré výpočty probíhají na plné přesnosti.
// Zaokrouhlují se pouze zobrazované/formátované hodnoty.

function getGrossPnl(trade) {
  const entry = Number(trade.entry ?? 0);
  const exit = Number(trade.exit ?? 0);
  const quantity = Number(trade.quantity ?? 0);

  if (!Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(quantity) || quantity === 0) {
    return Number(trade.pnl ?? 0);
  }

  const directionMultiplier = trade.direction === "Short" ? -1 : 1;
  return (exit - entry) * quantity * directionMultiplier;
}

export function getNetPnl(trade) {
  return getGrossPnl(trade) - Number(trade.fees ?? 0);
}

export function getTradeStatus(trade) {
  const netPnl = getNetPnl(trade);
  if (netPnl > 0) return "Win";
  if (netPnl < 0) return "Loss";
  return "Breakeven";
}

export function getRMultiple(trade) {
  const risk = Number(trade.risk ?? 0);
  return risk > 0 ? getNetPnl(trade) / risk : 0;
}

function sortByOldest(trades) {
  return [...trades].sort((first, second) => {
    const firstDate = `${first.date}-${first.createdAt ?? ""}`;
    const secondDate = `${second.date}-${second.createdAt ?? ""}`;
    return firstDate.localeCompare(secondDate);
  });
}

function getCurrentStreak(trades) {
  const recentTrades = [...trades].sort((first, second) => `${second.date}-${second.createdAt ?? ""}`.localeCompare(`${first.date}-${first.createdAt ?? ""}`));
  if (!recentTrades.length) return { count: 0, type: "Žádná série" };

  const firstStatus = getTradeStatus(recentTrades[0]);
  if (firstStatus === "Breakeven") return { count: 0, type: "Breakeven" };

  const count = recentTrades.findIndex((trade) => getTradeStatus(trade) !== firstStatus);
  return { count: count === -1 ? recentTrades.length : count, type: firstStatus === "Win" ? "výhry" : "prohry" };
}

export function getTradeAnalytics(trades, startingCapital = 0) {
  const totalPnl = trades.reduce((sum, trade) => sum + getNetPnl(trade), 0);
  const wins = trades.filter((trade) => getNetPnl(trade) > 0);
  const losses = trades.filter((trade) => getNetPnl(trade) < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + getNetPnl(trade), 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + getNetPnl(trade), 0));
  const setupMap = new Map();

  trades.forEach((trade) => {
    const current = setupMap.get(trade.setup) ?? { setup: trade.setup, tradeCount: 0, wins: 0, netPnl: 0 };
    current.tradeCount += 1;
    current.wins += getNetPnl(trade) > 0 ? 1 : 0;
    current.netPnl += getNetPnl(trade);
    setupMap.set(trade.setup, current);
  });

  const bySetup = [...setupMap.values()]
    .map((setup) => ({ ...setup, winRate: roundPercent((setup.wins / setup.tradeCount) * 100) }))
    .sort((first, second) => second.netPnl - first.netPnl);

  let runningPnl = 0;
  const equityCurve = sortByOldest(trades).map((trade) => {
    runningPnl += getNetPnl(trade);
    return { date: trade.date, value: startingCapital + runningPnl };
  });

  const tradeCount = trades.length;
  const streak = getCurrentStreak(trades);

  return {
    tradeCount,
    totalPnl,
    wins: wins.length,
    losses: losses.length,
    // Statistiky bez dostatečných dat vrací null → UI zobrazí "—" místo zavádějící 0.
    winRate: tradeCount ? roundPercent((wins.length / tradeCount) * 100) : null,
    averageTrade: tradeCount ? totalPnl / tradeCount : null,
    averageR: tradeCount ? trades.reduce((sum, trade) => sum + getRMultiple(trade), 0) / tradeCount : null,
    // Profit factor: při nulové hrubé ztrátě (všechny zisky) je matematicky ∞,
    // ale pro uživatele nemá smysl → null (UI zobrazí "—").
    profitFactor: grossLoss ? grossProfit / grossLoss : null,
    currentStreak: streak,
    bestSetup: bySetup[0] ?? null,
    bySetup,
    equityCurve,
  };
}