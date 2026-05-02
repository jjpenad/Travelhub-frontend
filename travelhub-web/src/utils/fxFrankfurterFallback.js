/**
 * Fallback público cuando falla service-external (`/currency/v1/rates` y `/convert`):
 * Frankfurter v2 (misma idea que `ExchangeClient` en Python: GET `…/v2/rate/{base}/{quote}`).
 *
 * @see https://www.frankfurter.dev/docs/
 */

const DEFAULT_FRANKFURTER_BASE = "https://api.frankfurter.dev";

/**
 * Desactivar con `VITE_FX_FRANKFURTER_FALLBACK=false` (p. ej. entornos sin salida a Internet).
 */
export function isFrankfurterFxFallbackEnabled() {
  const v = String(import.meta.env.VITE_FX_FRANKFURTER_FALLBACK ?? "1")
    .trim()
    .toLowerCase();
  return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

function frankfurterRoot() {
  return String(import.meta.env.VITE_FRANKFURTER_BASE_URL || DEFAULT_FRANKFURTER_BASE).replace(
    /\/+$/,
    "",
  );
}

/**
 * GET `…/v2/rate/:base/:quote` → objeto compatible con {@link ./fxConversion#extractRateFromFxResponse}.
 *
 * @param {string} baseCurrency
 * @param {string} quoteCurrency
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchFrankfurterRatePayload(baseCurrency, quoteCurrency) {
  const base = String(baseCurrency ?? "").trim().toUpperCase();
  const quote = String(quoteCurrency ?? "").trim().toUpperCase();
  if (!base || !quote) {
    const err = new Error("base y quote son obligatorios para tasas FX");
    err.status = 400;
    throw err;
  }
  if (base === quote) {
    const now = new Date().toISOString();
    return {
      base_currency: base,
      quote_currency: quote,
      rate: 1,
      as_of_iso: now,
      fx_fallback_source: "frankfurter",
    };
  }
  if (base === "USDC" || quote === "USDC") {
    const err = new Error("frankfurter_pair_not_supported");
    err.status = 422;
    throw err;
  }

  const url = `${frankfurterRoot()}/v2/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`;
  const res = await fetch(url, { method: "GET", mode: "cors", credentials: "omit" });
  const text = await res.text();
  let json = /** @type {Record<string, unknown>} */ ({});
  try {
    json = text ? /** @type {Record<string, unknown>} */ (JSON.parse(text)) : {};
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof json.message === "string" && json.message.trim() !== ""
        ? json.message
        : `Frankfurter HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const rate = Number(json.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    const err = new Error("frankfurter_invalid_rate_payload");
    err.status = 502;
    throw err;
  }

  const dateStr = typeof json.date === "string" ? json.date : "";
  const asOf = dateStr ? `${dateStr}T12:00:00.000Z` : new Date().toISOString();

  return {
    ...json,
    base_currency: typeof json.base === "string" ? json.base : base,
    quote_currency: typeof json.quote === "string" ? json.quote : quote,
    rate,
    as_of_iso: asOf,
    fx_fallback_source: "frankfurter",
  };
}

/**
 * Emula POST `/currency/v1/convert` usando la tasa Frankfurter (misma semántica que el adapter Python).
 *
 * @param {Record<string, unknown>} body — `{ amount, from_currency, to_currency }` snake_case
 * @returns {Promise<Record<string, unknown>>}
 */
export async function frankfurterConvertPayload(body) {
  const from = String(body?.from_currency ?? "").trim().toUpperCase();
  const to = String(body?.to_currency ?? "").trim().toUpperCase();
  const amount = Number(body?.amount);
  if (!from || !to) {
    const e = new Error("from_currency y to_currency son obligatorios");
    e.status = 400;
    throw e;
  }
  if (!Number.isFinite(amount)) {
    const e = new Error("Invalid amount for conversion");
    e.status = 400;
    throw e;
  }
  if (from === to) {
    return {
      amount: body.amount,
      from_currency: from,
      to_currency: to,
      converted_amount: amount,
      rate: 1,
      as_of_iso: new Date().toISOString(),
      fx_fallback_source: "frankfurter",
    };
  }

  const ratePayload = await fetchFrankfurterRatePayload(from, to);
  const rate = Number(ratePayload.rate);
  const converted = amount * rate;
  return {
    amount: body.amount,
    from_currency: from,
    to_currency: to,
    converted_amount: converted,
    rate,
    as_of_iso: ratePayload.as_of_iso,
    fx_fallback_source: "frankfurter",
  };
}
