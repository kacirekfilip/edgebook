const STORAGE_KEY = "edgebook.entry-checklist-template";
const DEFAULT_ITEMS = [
  "Bias potvrzen",
  "Vybrání likvidity",
  "Pullback do zóny",
  "Limitní vstup",
  "Dodržen risk",
];

function normalizeChecklist(items) {
  return (items ?? [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function getDefaultChecklist() {
  return DEFAULT_ITEMS.map((item) => ({ id: crypto.randomUUID(), label: item }));
}

export function getStoredChecklist() {
  if (typeof window === "undefined") return getDefaultChecklist();

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) return getDefaultChecklist();

  try {
    const parsed = JSON.parse(rawValue);
    const normalized = normalizeChecklist(Array.isArray(parsed) ? parsed : []);
    return normalized.length ? normalized.map((label) => ({ id: crypto.randomUUID(), label })) : getDefaultChecklist();
  } catch {
    return getDefaultChecklist();
  }
}

export function saveStoredChecklist(items) {
  if (typeof window === "undefined") return;

  const normalized = normalizeChecklist(items.map((item) => item.label));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function createChecklistState(items) {
  return items.map((item) => ({ id: item.id, label: item.label, checked: false }));
}

export function getTradeChecklist(trade, templateItems) {
  const template = templateItems ?? getStoredChecklist();
  const storedValues = Array.isArray(trade?.entryChecklist) ? trade.entryChecklist : [];

  return template.map((item) => {
    const storedItem = storedValues.find((value) => value.id === item.id);
    return {
      id: item.id,
      label: item.label,
      checked: Boolean(storedItem?.checked),
    };
  });
}

export function buildTradeChecklist(trade, templateItems) {
  return getTradeChecklist(trade, templateItems).map((item) => ({ id: item.id, label: item.label, checked: Boolean(item.checked) }));
}

export function updateChecklistValue(checklist, id, checked) {
  return checklist.map((item) => (item.id === id ? { ...item, checked } : item));
}
