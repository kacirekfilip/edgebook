import { supabase } from "./supabase";

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Uživatel není přihlášen.");
  }

  return user;
}

function sortByNewest(trades) {
  return [...trades].sort((first, second) => {
    const firstDate = `${first.date}-${first.createdAt ?? ""}`;
    const secondDate = `${second.date}-${second.createdAt ?? ""}`;

    return secondDate.localeCompare(firstDate);
  });
}

export async function readTrades() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("trades")
    .select("id, trade_data, created_at")
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  const trades = (data ?? []).map((row) => ({
    ...row.trade_data,
    id: row.id,
    createdAt: row.trade_data?.createdAt ?? row.created_at,
  }));

  return sortByNewest(trades);
}

export async function saveTrade(trade) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("trades")
    .upsert(
      {
        id: trade.id,
        user_id: user.id,
        trade_data: trade,
        created_at: trade.createdAt ?? new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    throw error;
  }

  return trade;
}

export async function deleteTradeById(id) {
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

export async function initializeTrades() {
  // Demo/mock data se už automaticky nenačítají.
  // Po přihlášení se načtou pouze obchody aktuálního uživatele.
  return readTrades();
}
