import { roundCurrency } from "@/lib/numberFormat";

const STORAGE_KEY = "edgebook.starting-capital";

export function getStoredStartingCapital() {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (rawValue == null) return null;

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? roundCurrency(parsedValue) : null;
}

export function setStoredStartingCapital(value) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, String(roundCurrency(value)));
}