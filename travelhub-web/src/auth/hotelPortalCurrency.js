/**
 * Persistencia de la moneda operativa del hotel en el portal (solo lectura/escritura en storage).
 * El valor “fuente de verdad” ideal es el backend (analytics / login); el cliente guarda para formatear
 * filas y detalle sin un round-trip extra y para que el listado sea coherente con el dashboard.
 */
import { normalizeHotelCurrencyCode } from "../constants/hotelCurrency";

const STORAGE_KEY = "travelhub-hotel-portal-currency";

/**
 * @returns {"USD" | "COP"}
 */
export function getHotelPortalCurrencyCode() {
  if (typeof window === "undefined") {
    return normalizeHotelCurrencyCode(null);
  }
  const v =
    window.localStorage.getItem(STORAGE_KEY)?.trim() ||
    window.sessionStorage.getItem(STORAGE_KEY)?.trim() ||
    "";
  return normalizeHotelCurrencyCode(v || null);
}

/**
 * @param {string | null | undefined} code
 */
export function setHotelPortalCurrencyCode(code) {
  if (typeof window === "undefined") return;
  const normalized = normalizeHotelCurrencyCode(code);
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
    window.sessionStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    /* storage lleno o deshabilitado */
  }
}

export function clearHotelPortalCurrency() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Extrae moneda de respuestas API habituales (analytics, reserva, hotel anidado).
 * @param {unknown} obj
 * @returns {"USD" | "COP" | null} null si el payload no trae moneda
 */
export function pickHotelCurrencyFromApiPayload(obj) {
  if (!obj || typeof obj !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (obj);
  const candidates = [
    o.currency_code,
    o.currency,
    o.hotel_currency_code,
    o.hotel_currency,
  ];
  let raw = candidates.find((x) => x != null && String(x).trim() !== "");
  if (raw == null && o.hotel && typeof o.hotel === "object") {
    const h = /** @type {Record<string, unknown>} */ (o.hotel);
    const nested = [
      h.currency_code,
      h.currency,
      h.hotel_currency_code,
      h.hotel_currency,
    ];
    raw = nested.find((x) => x != null && String(x).trim() !== "");
  }
  if (raw == null) return null;
  return normalizeHotelCurrencyCode(String(raw));
}

/**
 * Persiste moneda devuelta por el panel de analíticas (si viene en el JSON).
 * @param {unknown} dto
 */
export function syncHotelPortalCurrencyFromAnalyticsDto(dto) {
  const c = pickHotelCurrencyFromApiPayload(dto);
  if (c) setHotelPortalCurrencyCode(c);
}
