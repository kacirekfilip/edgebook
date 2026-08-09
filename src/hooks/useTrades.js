"use client";

import { useEffect, useState } from "react";
import { deleteTradeById, initializeTrades, saveTrade } from "@/lib/tradeRepository";


function sortByNewest(trades) {
  return [...trades].sort((first, second) => `${second.date}-${second.createdAt ?? ""}`.localeCompare(`${first.date}-${first.createdAt ?? ""}`));
}

export function useTrades() {
  const [trades, setTrades] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTrades() {
      try {
        const savedTrades = await initializeTrades();
        if (isMounted) setTrades(savedTrades);
      } catch (databaseError) {
        if (isMounted) setError(databaseError.message ?? "Lokální databázi se nepodařilo načíst.");
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    loadTrades();
    return () => {
      isMounted = false;
    };
  }, []);

  async function createTrade(trade) {
    const timestamp = new Date().toISOString();
    const newTrade = { ...trade, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
    try {
      await saveTrade(newTrade);
      setTrades((current) => sortByNewest([newTrade, ...current]));
      return newTrade;
    } catch (databaseError) {
      setError(databaseError.message ?? "Obchod se nepodařilo uložit.");
      throw databaseError;
    }
  }

  async function updateTrade(trade) {
    const updatedTrade = { ...trade, updatedAt: new Date().toISOString() };
    try {
      await saveTrade(updatedTrade);
      setTrades((current) => sortByNewest(current.map((item) => (item.id === updatedTrade.id ? updatedTrade : item))));
      return updatedTrade;
    } catch (databaseError) {
      setError(databaseError.message ?? "Obchod se nepodařilo upravit.");
      throw databaseError;
    }
  }

  async function removeTrade(id) {
    try {
      await deleteTradeById(id);
      setTrades((current) => current.filter((trade) => trade.id !== id));
    } catch (databaseError) {
      setError(databaseError.message ?? "Obchod se nepodařilo smazat.");
      throw databaseError;
    }
  }

  return { trades, isReady, error, createTrade, updateTrade, removeTrade };
}
