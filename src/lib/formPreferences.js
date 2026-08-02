// Ukládání posledních hodnot formuláře (trh, setup, seance, bias).
// Uživatel tak při přidání dalšího obchodu nemusí znovu vybírat stejné volby.

const STORAGE_KEY = "edgebook.form-preferences";

const DEFAULT_PREFERENCES = {
  market: "NASDAQ",
  setup: "Breakout",
  session: "Asijská",
  bias: "Neutral (50/50)",
};

// Určí obchodní seanci podle času (HH:mm).
// 00:00–07:59 → Asijská, 08:00–13:59 → Londýnská,
// 14:00–16:59 → Londýn-NY, 17:00–22:00 → New York.
// Mimo tyto rozsahy (22:01–23:59) vrací null → fallback na poslední hodnotu / "Ostatní".
export function getSessionForTime(timeValue) {
  const normalized = String(timeValue ?? "").trim();
  if (!normalized) return null;

  const match = /^([0-9]|[01][0-9]|2[0-3]):([0-5][0-9])$/u.exec(normalized);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 8 * 60) return "Asijská";
  if (totalMinutes < 14 * 60) return "Londýnská";
  if (totalMinutes < 17 * 60) return "Londýn-NY";
  if (totalMinutes <= 22 * 60) return "New York";
  return null;
}

export function getFormPreferences() {
  if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES };

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return { ...DEFAULT_PREFERENCES };

    const parsed = JSON.parse(rawValue);
    return {
      market: parsed.market || DEFAULT_PREFERENCES.market,
      setup: parsed.setup || DEFAULT_PREFERENCES.setup,
      session: parsed.session || DEFAULT_PREFERENCES.session,
      bias: parsed.bias || DEFAULT_PREFERENCES.bias,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveFormPreferences(values) {
  if (typeof window === "undefined") return;

  const current = getFormPreferences();
  const next = {
    market: values.market ?? current.market,
    setup: values.setup ?? current.setup,
    session: values.session ?? current.session,
    bias: values.bias ?? current.bias,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}