/** Divisas admitidas (portal hotelero y selector viajero); COP primero — moneda por defecto en viajero. */
export const HOTEL_PORTAL_SUPPORTED_CURRENCIES = ["COP", "USD"];

/**
 * Normaliza código ISO 4217 a una divisa admitida por el frontend (sólo COP | USD).
 * Cualquier valor desconocido u omitido cae en **COP** (moneda por defecto del viajero y portal).
 * @param {string | null | undefined} code
 * @returns {"USD" | "COP"}
 */
export function normalizeHotelCurrencyCode(code) {
  const u = String(code ?? "").trim().toUpperCase();
  if (u === "USD") return "USD";
  return "COP";
}
