import { normalizeHotelCurrencyCode } from "../constants/hotelCurrency";

const STORAGE_KEY = "travelhub-traveler-display-currency";

/** @type {string} */
export const TRAVELER_DISPLAY_CURRENCY_EVENT = "travelhub-traveler-display-currency";

/**
 * Moneda de **presentación** en la app viajera (listados, detalle, checkout mock).
 * Distinta de la moneda operativa del portal hotelero (`hotelPortalCurrency.js`).
 * @returns {"USD" | "COP"} — sin clave en `localStorage`, **COP**.
 */
export function getTravelerDisplayCurrencyCode() {
  if (typeof window === "undefined") {
    return "COP";
  }
  const v = window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  if (v === "") return "COP";
  return normalizeHotelCurrencyCode(v);
}

/**
 * @param {string | null | undefined} code
 */
export function setTravelerDisplayCurrencyCode(code) {
  if (typeof window === "undefined") return;
  const normalized = normalizeHotelCurrencyCode(code);
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(TRAVELER_DISPLAY_CURRENCY_EVENT, { detail: { code: normalized } }),
  );
}
