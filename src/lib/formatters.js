import { roundTo } from "@/lib/numberFormat";

// Zobrazení hodnot probíhá na zaokrouhlené hodnotě (plná přesnost se drží ve výpočtech).
function formatNumericCurrency(value, options = {}) {
  const numericValue = roundTo(value, 2);
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });
  return `${formatter.format(numericValue)} USD`;
}

export function formatCurrency(value, options = {}) {
  return formatNumericCurrency(value, options);
}

export function formatPrice(value) {
  return formatNumericCurrency(value);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function normalizeTimeValue(value) {
  if (value == null) return "";

  const trimmed = String(value).trim();
  if (!trimmed) return "";

  const match24Hour = /^([0-9]|[01][0-9]|2[0-3]):([0-5][0-9])$/u.exec(trimmed);
  if (match24Hour) {
    const hours = String(Number(match24Hour[1])).padStart(2, "0");
    return `${hours}:${match24Hour[2]}`;
  }

  const match12Hour = /^(\d{1,2}):(\d{1,2})\s*([AP]M)$/i.exec(trimmed);
  if (match12Hour) {
    const hours = Number(match12Hour[1]);
    const minutes = String(match12Hour[2]).padStart(2, "0");
    const meridiem = match12Hour[3].toUpperCase();

    if (Number.isNaN(hours) || hours < 1 || hours > 12) return "";

    let normalizedHours = hours;
    if (meridiem === "PM" && hours !== 12) normalizedHours += 12;
    if (meridiem === "AM" && hours === 12) normalizedHours = 0;

    return `${String(normalizedHours).padStart(2, "0")}:${minutes}`;
  }

  return "";
}

export function formatTimeValue(value) {
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }

  return normalizeTimeValue(value);
}