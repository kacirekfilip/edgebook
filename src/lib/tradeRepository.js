const DATABASE_NAME = "edgebook";
const DATABASE_VERSION = 1;
const TRADES_STORE = "trades";

function getDatabase() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("Tento prohlížeč nepodporuje lokální databázi."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () => reject(request.error ?? new Error("Databázi se nepodařilo otevřít."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(TRADES_STORE)) {
        const store = database.createObjectStore(TRADES_STORE, { keyPath: "id" });
        store.createIndex("date", "date");
        store.createIndex("market", "market");
        store.createIndex("setup", "setup");
      }
    };
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Databázový dotaz selhal."));
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Databázová změna selhala."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Databázová změna byla zrušena."));
  });
}

function sortByNewest(trades) {
  return [...trades].sort((first, second) => {
    const firstDate = `${first.date}-${first.createdAt ?? ""}`;
    const secondDate = `${second.date}-${second.createdAt ?? ""}`;
    return secondDate.localeCompare(firstDate);
  });
}

export async function readTrades() {
  const database = await getDatabase();
  const transaction = database.transaction(TRADES_STORE, "readonly");
  const records = await requestResult(transaction.objectStore(TRADES_STORE).getAll());
  await transactionComplete(transaction);
  database.close();
  return sortByNewest(records);
}

export async function saveTrade(trade) {
  const database = await getDatabase();
  const transaction = database.transaction(TRADES_STORE, "readwrite");
  transaction.objectStore(TRADES_STORE).put(trade);
  await transactionComplete(transaction);
  database.close();
  return trade;
}

export async function deleteTradeById(id) {
  const database = await getDatabase();
  const transaction = database.transaction(TRADES_STORE, "readwrite");
  transaction.objectStore(TRADES_STORE).delete(id);
  await transactionComplete(transaction);
  database.close();
}

async function seedTrades(trades) {
  const database = await getDatabase();
  const transaction = database.transaction(TRADES_STORE, "readwrite");
  const store = transaction.objectStore(TRADES_STORE);
  trades.forEach((trade) => store.put(trade));
  await transactionComplete(transaction);
  database.close();
  return sortByNewest(trades);
}

function upgradeLegacyTrade(trade) {
  const pnl = Number(trade.pnl ?? 0);
  return {
    ...trade,
    risk: Number(trade.risk) > 0 ? Number(trade.risk) : Math.max(Math.round(Math.abs(pnl) / 2), 1),
    quantity: Number(trade.quantity) > 0 ? Number(trade.quantity) : 1,
    fees: Number.isFinite(Number(trade.fees)) ? Number(trade.fees) : 0,
    session: trade.session ?? "Asijská",
    bias: trade.bias ?? "Neutral (50/50)",
    entryTime: trade.entryTime ?? "",
    exitTime: trade.exitTime ?? "",
    rrPlan: Number.isFinite(Number(trade.rrPlan)) ? Number(trade.rrPlan) : null,
    rrActual: Number.isFinite(Number(trade.rrActual)) ? Number(trade.rrActual) : null,
    rrMax: Number.isFinite(Number(trade.rrMax)) ? Number(trade.rrMax) : null,
    setupRating: Number.isFinite(Number(trade.setupRating)) ? Math.max(0, Math.min(5, Number(trade.setupRating))) : 0,
    entryChecklist: Array.isArray(trade.entryChecklist)
      ? trade.entryChecklist.map((item) => ({ id: item.id, label: item.label, checked: Boolean(item.checked) }))
      : [],
    entryScreenshot: trade.entryScreenshot ?? "",
    exitScreenshot: trade.exitScreenshot ?? "",
    reason: trade.reason ?? "",
    confirmation: trade.confirmation ?? "",
    planFollowed: trade.planFollowed ?? "",
    lesson: trade.lesson ?? "",
    mood: trade.mood ?? "Neutrální",
    notes: trade.notes ?? "",
    tags: Array.isArray(trade.tags) ? trade.tags : [],
    createdAt: trade.createdAt ?? `${trade.date}T12:00:00.000Z`,
  };
}

export async function initializeTrades(seedData) {
  const savedTrades = await readTrades();
  if (savedTrades.length) {
    const upgradedTrades = savedTrades.map(upgradeLegacyTrade);
    const needsUpgrade = upgradedTrades.some((trade, index) => JSON.stringify(trade) !== JSON.stringify(savedTrades[index]));
    return needsUpgrade ? seedTrades(upgradedTrades) : savedTrades;
  }
  return seedTrades(seedData);
}
