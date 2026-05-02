/** Divisas admitidas (portal hotelero y selector viajero); COP primero — moneda por defecto en viajero. */
export const HOTEL_PORTAL_SUPPORTED_CURRENCIES = ["COP", "USD"];

/**
 * Normaliza código ISO 4217 a una divisa admitida por el frontend.
 * Cualquier valor desconocido cae en USD (comportamiento seguro hasta que el backend envíe otra admitida).
 * @param {string | null | undefined} code
 * @returns {"USD" | "COP"}
 */
export function normalizeHotelCurrencyCode(code) {
  const u = String(code ?? "").trim().toUpperCase();
  if (u === "COP") return "COP";
  return "USD";
}
