import { getFxRateFromApi } from "../services/api";

/**
 * Caché en memoria de cotizaciones (no persiste histórico; TTL configurable).
 * @typedef {{ expiresAt: number, payload: Record<string, unknown> }} FxCacheEntry
 */

const cache = /** @type {Map<string, FxCacheEntry>} */ (new Map());

const DEFAULT_TTL_MS = Number(import.meta.env.VITE_FX_CACHE_TTL_MS) || 600_000;

export function fxCacheDefaultTtlMs() {
  return DEFAULT_TTL_MS;
}

function cacheKey(base, quote) {
  return `${String(base).toUpperCase().trim()}:${String(quote).toUpperCase().trim()}`;
}

/**
 * ¿El JSON de tasas trae un factor usable (1 base → quote)? Sin importar
 * `fxConversion` (evita ciclo con este módulo).
 * @param {unknown} payload
 * @returns {boolean}
 */
function payloadHasPositiveFxRate(payload) {
  if (!payload || typeof payload !== "object") return false;
  const d = /** @type {Record<string, unknown>} */ (payload);
  const raw = d.rate ?? d.fx_rate ?? d.exchange_rate ?? d.spot_rate;
  const direct =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : Number(String(raw ?? "").trim().replace(/,/g, ""));
  if (Number.isFinite(direct) && direct > 0) return true;
  const nb = Number(d.base_amount);
  const nq = Number(d.quote_amount);
  return Number.isFinite(nb) && nb !== 0 && Number.isFinite(nq) && nq > 0;
}

export function invalidateFxRateCache(base, quote) {
  cache.delete(cacheKey(base, quote));
}

export function clearFxRateCache() {
  cache.clear();
}

/**
 * GET `/currency/v1/rates` (service-external) con memoria TTL. No convierte montos ni redondea.
 *
 * @param {string} baseCurrency
 * @param {string} quoteCurrency
 * @param {{ ttlMs?: number, forceRefresh?: boolean }} [options]
 * @returns {Promise<{ data: Record<string, unknown>, fromCache: boolean }>}
 */
export async function getFxRatePayloadCached(baseCurrency, quoteCurrency, options = {}) {
  const ttlMs = typeof options.ttlMs === "number" && options.ttlMs >= 0 ? options.ttlMs : DEFAULT_TTL_MS;
  const k = cacheKey(baseCurrency, quoteCurrency);
  const now = Date.now();

  if (!options.forceRefresh) {
    const hit = cache.get(k);
    if (hit && hit.expiresAt > now) {
      return { data: hit.payload, fromCache: true };
    }
  }

  const data = await getFxRateFromApi(baseCurrency, quoteCurrency);
  const payload =
    data && typeof data === "object" ? /** @type {Record<string, unknown>} */ (data) : {};

  // No cachear fallos o cuerpos sin tasa: si no, el cliente guarda `{}` 10 min
  // y `formatPaymentInDisplayCurrency` cree que no hay tasa → el selector COP|USD no cambia montos.
  if (payloadHasPositiveFxRate(payload)) {
    cache.set(k, {
      expiresAt: now + ttlMs,
      payload,
    });
  }

  return { data: payload, fromCache: false };
}
