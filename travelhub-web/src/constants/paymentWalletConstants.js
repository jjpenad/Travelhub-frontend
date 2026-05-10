/** @typedef {'paypal' | 'apple_pay' | 'google_pay' | 'mercado_pago'} WalletPaymentMethodId */

/** @type {readonly WalletPaymentMethodId[]} */
export const WALLET_PAYMENT_METHOD_IDS = Object.freeze([
  "paypal",
  "apple_pay",
  "google_pay",
  "mercado_pago",
]);
