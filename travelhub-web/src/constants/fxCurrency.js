/**
 * Normaliza divisas contra el contrato del servicio FX (service-external):
 * ISO 4217 de 3 letras o `USDC` (ver `domains/currency/currency_codes.py` en service-external).
 *
 * Para presentación sólo COP/USD en portal hotelero, usar {@link ./hotelCurrency#normalizeHotelCurrencyCode}.
 */

const FX_CCY_RE = /^(USDC|[A-Z]{3})$/;

/**
 * @param {string | null | undefined} code
 * @returns {string}
 */
export function normalizeFxCurrencyCode(code) {
  const u = String(code ?? "").trim().toUpperCase();
  if (FX_CCY_RE.test(u)) return u;
  return "USD";
}
