// Jediné centrální místo pro veškeré zaokrouhlování v Edgebooku.
//
// Principy:
// - Výpočty (P/L, R, průměry, součty) probíhají na plné přesnosti.
// - Zaokrouhlují se až zobrazované / formátované hodnoty.
// - Number.EPSILON kompenzuje floating-point artefakty
//   (např. 367.5 / 100 = 3.6749999999999998 → 3.68).

export function roundTo(value, decimals = 2) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  const factor = 10 ** decimals;
  return Math.round((numericValue + Number.EPSILON) * factor) / factor;
}

// Měnové hodnoty: P/L, kapitál, poplatky, risk, průměrný obchod → 2 desetinná místa.
export const roundCurrency = (value) => roundTo(value, 2);

// Procenta (win rate) → 1 desetinné místo.
export const roundPercent = (value) => roundTo(value, 1);

// Formátovaný řetězec R / profit faktoru (vždy 2 desetinná místa, bez artefaktů).
export function formatR(value) {
  return roundTo(value, 2).toFixed(2);
}

// Bezpečný převod na číslo pro uživatelský vstup.
// Prázdný řetězec i nečíselná hodnota → NaN (na rozdíl od Number("") = 0).
export function toFiniteNumber(value) {
  const text = String(value ?? "").trim();
  if (text === "") return NaN;
  const numericValue = Number(text);
  return Number.isFinite(numericValue) ? numericValue : NaN;
}