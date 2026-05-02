import { normalizeFxCurrencyCode } from "../constants/fxCurrency";
import { formatFlexibleMoneyWithIsoSuffix } from "./formatHotelPortalMoney";
import { postFxConvertToApi } from "../services/api";
import { fxCacheDefaultTtlMs, getFxRatePayloadCached } from "./fxRateCache";

/** Decimal JSON suele llegar como string (`Decimal` → Pydantic). */
function parseFxDecimal(v) {
  if (v == null || v === "") return NaN;
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  const s = String(v).trim().replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Interpreta tasas típicas de `model_dump()` (`ExchangeRateResult`: `rate`, `as_of_iso`, …).
 * Convención: `rate` = 1 unit of base → quote.
 * @param {unknown} data
 * @returns {number | null}
 */
export function extractRateFromFxResponse(data) {
  if (!data || typeof data !== "object") return null;
  const d = /** @type {Record<string, unknown>} */ (data);

  const direct = parseFxDecimal(d.rate ?? d.fx_rate ?? d.exchange_rate ?? d.spot_rate);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const nb = parseFxDecimal(d.base_amount);
  const nq = parseFxDecimal(d.quote_amount);
  if (Number.isFinite(nb) && nb !== 0 && Number.isFinite(nq) && nq > 0) {
    return nq / nb;
  }

  return null;
}

/**
 * @param {unknown} data — cuerpo de POST /v1/convert
 * @returns {{ value: number, currencyHints: string[] }}
 */
export function extractConvertedAmountFromResponse(data) {
  if (!data || typeof data !== "object") {
    return { value: NaN, currencyHints: [] };
  }
  const d = /** @type {Record<string, unknown>} */ (data);

  const n = parseFxDecimal(
    d.converted_amount ??
      d.quote_amount ??
      d.amount_quote ??
      d.to_amount ??
      d.result_amount ??
      d.amount_out,
  );

  const hints = [
    d.to_currency,
    d.quote_currency,
    d.currency,
    d.target_currency,
  ]
    .filter((x) => typeof x === "string" && x.trim() !== "")
    .map((x) => String(x));

  return { value: n, currencyHints: hints };
}

/**
 * Estimación sólo UI: multiply amount in `from` por tasa cached (servidor definido en GET rates).
 *
 * @param {number} amount
 * @param {string} fromCurrency
 * @param {string} toCurrency
 * @param {{ ttlMs?: number }} [opts]
 */
export async function estimateConvertWithCachedRate(amount, fromCurrency, toCurrency, opts = {}) {
  const from = normalizeFxCurrencyCode(fromCurrency);
  const to = normalizeFxCurrencyCode(toCurrency);

  const n = Number(amount);
  if (!Number.isFinite(n)) return null;

  if (from === to) {
    return {
      amount: n,
      formatted: formatFlexibleMoneyWithIsoSuffix(n, to, { variant: "detail" }),
      rate: 1,
      fromCache: true,
    };
  }

  const { data, fromCache } = await getFxRatePayloadCached(from, to, {
    ttlMs: opts.ttlMs ?? fxCacheDefaultTtlMs(),
  });

  const rate = extractRateFromFxResponse(data);
  if (!Number.isFinite(rate) || rate <= 0) return null;

  const converted = n * rate;

  return {
    amount: converted,
    formatted: formatFlexibleMoneyWithIsoSuffix(converted, to, { variant: "detail" }),
    rate,
    fromCache,
  };
}

/**
 * Monto oficial para cobro / persistencia según servidor (POST `/v1/convert`).
 *
 * @param {number|string} amount
 * @param {string} fromCurrency
 * @param {string} toCurrency
 * @returns {Promise<{ numeric: number, formatted: string, currencyCode: string, raw: Record<string, unknown> }>}
 */
export async function convertAmountAuthoritative(amount, fromCurrency, toCurrency) {
  const from = normalizeFxCurrencyCode(fromCurrency);
  const to = normalizeFxCurrencyCode(toCurrency);

  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) {
    throw new Error("Invalid amount for conversion");
  }

  if (from === to) {
    const currencyCode = to;
    return {
      numeric: n,
      formatted: formatFlexibleMoneyWithIsoSuffix(n, currencyCode, { variant: "detail" }),
      currencyCode,
      raw: { amount: n, converted_amount: n, from_currency: from, to_currency: to },
    };
  }

  /** Contrato {@link ConversionRequest}: `amount` admite número o string decimal. */
  const body = {
    amount: n,
    from_currency: from,
    to_currency: to,
  };

  const raw = await postFxConvertToApi(body);
  const payload = raw && typeof raw === "object" ? raw : {};

  const payloadToRaw =
    typeof /** @type {Record<string, unknown>} */ (payload).to_currency === "string"
      ? String(payload.to_currency).trim()
      : "";
  const payloadTo = payloadToRaw ? normalizeFxCurrencyCode(payloadToRaw) : null;

  const { value, currencyHints } = extractConvertedAmountFromResponse(payload);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error("conversion_response_invalid");
    err.status = 502;
    /** @type {any} */ (err).body = payload;
    throw err;
  }

  const hintedNorm = currencyHints
    .map((x) => normalizeFxCurrencyCode(x))
    .find((x) => x === to);
  const currencyCode = payloadTo ?? hintedNorm ?? to;

  return {
    numeric: value,
    formatted: formatFlexibleMoneyWithIsoSuffix(value, currencyCode, { variant: "detail" }),
    currencyCode,
    raw: payload,
  };
}
