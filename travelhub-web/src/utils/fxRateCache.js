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
  cache.set(k, {
    expiresAt: now + ttlMs,
    payload,
  });

  return { data: payload, fromCache: false };
}
