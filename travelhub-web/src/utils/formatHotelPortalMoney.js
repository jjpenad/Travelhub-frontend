import { normalizeFxCurrencyCode } from "../constants/fxCurrency";
import { HOTEL_PORTAL_SUPPORTED_CURRENCIES, normalizeHotelCurrencyCode } from "../constants/hotelCurrency";

/**
 * Locales de formato monetario por divisa (presentación regional, independiente del idioma UI).
 * @param {"USD" | "COP"} currency
 * @returns {string}
 */
function localeTagForHotelCurrency(currency) {
  const c = normalizeHotelCurrencyCode(currency);
  return c === "COP" ? "es-CO" : "en-US";
}

/**
 * @param {unknown} amount
 * @param {string | null | undefined} currencyCode
 * @param {{ variant?: "compact" | "detail" }} [options] - compact: sin decimales (métricas, gráfico); detail: USD con 2 dec., COP entero
 * @returns {string}
 */
export function formatHotelPortalMoney(amount, currencyCode, options = {}) {
  const variant = options.variant ?? "detail";
  const c = normalizeHotelCurrencyCode(currencyCode);
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return "—";
  }

  let minimumFractionDigits;
  let maximumFractionDigits;
  if (variant === "compact") {
    minimumFractionDigits = 0;
    maximumFractionDigits = 0;
  } else {
    maximumFractionDigits = c === "COP" ? 0 : 2;
    minimumFractionDigits = c === "COP" ? 0 : 2;
  }

  return new Intl.NumberFormat(localeTagForHotelCurrency(c), {
    style: "currency",
    currency: c,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(n);
}

/**
 * Checkout / FX: COP y USD como en portal; `USDC` u otras códigos ISO con número en `en-US` + sufijo cuando `Intl` no admite la divisa (p. ej. USDC).
 *
 * @param {unknown} amount
 * @param {string | null | undefined} currencyCode
 * @param {{ variant?: "compact" | "detail" }} [options]
 * @returns {string}
 */
export function formatFlexibleMoney(amount, currencyCode, options = {}) {
  const variant = options.variant ?? "detail";
  const c = String(currencyCode ?? "").trim().toUpperCase();

  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";

  if (c === "COP" || c === "USD") {
    return formatHotelPortalMoney(n, c, { variant });
  }

  const maxFrac = variant === "compact" ? 0 : c === "USDC" ? 6 : 2;
  const minFrac = variant === "compact" ? 0 : 2;

  if (c === "USDC") {
    const num = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }).format(n);
    return `${num} USDC`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: c,
      minimumFractionDigits: variant === "compact" ? 0 : 2,
      maximumFractionDigits: maxFrac,
    }).format(n);
  } catch {
    const num = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }).format(n);
    return `${num} ${c}`;
  }
}

/**
 * Igual que {@link formatFlexibleMoney} y al final el código ISO (p. ej. `… 1.234.567 COP`) para checkout / confirmación.
 *
 * @param {unknown} amount
 * @param {string | null | undefined} currencyCode
 * @param {{ variant?: "compact" | "detail" }} [options]
 * @returns {string}
 */
export function formatFlexibleMoneyWithIsoSuffix(amount, currencyCode, options = {}) {
  const code = normalizeFxCurrencyCode(currencyCode);
  const formatted = formatFlexibleMoney(amount, code, options);
  const t = String(formatted).trimEnd();
  if (code === "USDC" && t.endsWith("USDC")) return formatted;
  return `${formatted} ${code}`;
}

export { HOTEL_PORTAL_SUPPORTED_CURRENCIES };
