import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import "./PaymentForm.css";

/** @typedef {'paypal' | 'apple_pay' | 'google_pay' | 'mercado_pago'} WalletPaymentMethodId */

/** @type {readonly WalletPaymentMethodId[]} */
export const WALLET_PAYMENT_METHOD_IDS = Object.freeze([
  "paypal",
  "apple_pay",
  "google_pay",
  "mercado_pago",
]);

function IconPayPal({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
      <rect width="48" height="32" rx="6" fill="#003087" />
      <path
        fill="#009cde"
        d="M18 10h8c3 0 5 1.6 5 4.2 0 3.4-2.4 5.6-6 5.6h-3.4l-.8 5.2H14l2.4-15zm5.2 7.6c1.4 0 2.3-.9 2.3-2.4 0-1.6-.9-2.2-2.4-2.2h-2l-.6 4.6h2.7z"
      />
      <path
        fill="#fff"
        d="M28 10h5l-.6 3.6h-4c-.9 0-1.5.5-1.7 1.3l-.1.6h4.8l-.6 3.8h-9l1.5-9.3z"
      />
    </svg>
  );
}

function IconApplePay({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
      <rect width="48" height="32" rx="6" fill="#000" />
      <path
        fill="#fff"
        d="M17 11.2c-.5 0-1.2.4-1.6.9-.4.5-.8 1.3-.7 2 .7 0 1.3-.4 1.7-.9.4-.6.7-1.4.6-2zm1.5 1.9c-1 0-1.8.6-2.3.6-.6 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.8 1.7-1 1.7-.3 4.2.7 5.6.5.7 1 1.5 1.8 1.5.7 0 1-.5 1.8-.5.9 0 1.1.5 1.9.5s1.3-.7 1.8-1.4c.5-.7.8-1.4.8-1.5-.1 0-1.5-.6-1.5-2.3 0-1.5 1.2-2.2 1.2-2.3-.7-1-1.8-1.1-2.2-1.1zm7.4-.9h1.2l2.4 6.8h.1l2.3-6.8h1.2l-3 8.4h-1.3l-3-8.4zm8.7 0h3.2c1.5 0 2.6 1 2.6 2.6 0 1.7-1.2 2.7-2.8 2.7h-2v3.1h-1.1v-8.4zm1.1 4h2.1c1 0 1.7-.6 1.7-1.7 0-1-.7-1.6-1.7-1.6h-2.1v3.3z"
      />
    </svg>
  );
}

function IconGooglePay({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
      <rect width="48" height="32" rx="6" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
      <path fill="#4285F4" d="M22 12.5v3.2h4.7c-.2 1-1.2 3-4.7 3-2.8 0-5.1-2.3-5.1-5.2s2.3-5.2 5.1-5.2c1.6 0 2.7.7 3.3 1.3l2.3-2.2C26.5 10 24.4 9 22 9c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5 0-1-.1-1.4H22z" />
      <path fill="#34A853" d="M14.5 14.1l1.6 1.2c.4-1.2 1.7-2.5 3.5-2.5 1 0 1.8.4 2.4.9l1.8-1.8c-1.1-1-2.5-1.6-4.2-1.6-2.6 0-4.8 1.6-5.1 4.8z" />
      <path fill="#FBBC05" d="M22 25c2.3 0 4.2-.8 5.6-2.1l-2.6-2c-.8.5-1.8.9-3 .9-2.8 0-5.2-1.9-6-4.5l-2.7 2.1c1.4 3.4 4.6 5.6 8.7 5.6z" />
      <path fill="#EA4335" d="M14.4 11.7c-.2.6-.3 1.2-.3 1.8s.1 1.3.3 1.8l.1-.1 2.7-2.1-.1-.2c-.6-1.7-1.7-2.6-2.7-3.2z" />
    </svg>
  );
}

function IconMercadoPago({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 32" width="48" height="32" aria-hidden="true">
      <rect width="48" height="32" rx="6" fill="#0A0080" />
      <circle cx="18" cy="16" r="7" fill="#00B1EA" opacity="0.95" />
      <circle cx="30" cy="16" r="7" fill="#FFDB58" opacity="0.95" />
      <path
        fill="#fff"
        fillOpacity="0.25"
        d="M22 16c0-2.8 2.2-5 5-5 1.2 0 2.3.4 3.2 1.1-1.2-2.2-3.5-3.6-6.2-3.6-3.9 0-7 3.1-7 7s3.1 7 7 7c2.5 0 4.7-1.3 5.9-3.3-.9.7-2 1.1-3.2 1.1-2.8 0-5-2.2-5-5z"
      />
    </svg>
  );
}

const WALLET_ICONS = {
  paypal: IconPayPal,
  apple_pay: IconApplePay,
  google_pay: IconGooglePay,
  mercado_pago: IconMercadoPago,
};

/**
 * @param {{
 *   selectedPaymentMethod: WalletPaymentMethodId | null;
 *   onSelectedPaymentMethodChange: (id: WalletPaymentMethodId) => void;
 *   onValidityChange?: (valid: boolean) => void;
 * }} props
 */
function PaymentForm({
  selectedPaymentMethod = null,
  onSelectedPaymentMethodChange,
  onValidityChange,
}) {
  const { t } = useTranslation();
  const baseId = useId();
  const groupId = `${baseId}-wallets`;

  const paymentDataValid =
    selectedPaymentMethod != null &&
    WALLET_PAYMENT_METHOD_IDS.includes(selectedPaymentMethod);

  useEffect(() => {
    onValidityChange?.(paymentDataValid);
  }, [paymentDataValid, onValidityChange]);

  return (
    <section className="payment-form" aria-labelledby="payment-form-title">
      <h2 id="payment-form-title" className="payment-form__title">
        {t("paymentForm.title")}
      </h2>
      <p className="payment-form__wallets-intro">{t("paymentForm.walletsIntro")}</p>

      <div
        className="payment-form__wallets"
        role="radiogroup"
        aria-labelledby="payment-form-title"
        id={groupId}
      >
        {WALLET_PAYMENT_METHOD_IDS.map((id) => {
          const selected = selectedPaymentMethod === id;
          const Icon = WALLET_ICONS[id];
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={
                "payment-form__wallet-card" +
                (selected ? " payment-form__wallet-card--selected" : "")
              }
              onClick={() => onSelectedPaymentMethodChange?.(id)}
            >
              <span className="payment-form__wallet-card-inner">
                <span className="payment-form__wallet-icon-wrap" aria-hidden="true">
                  <Icon className="payment-form__wallet-icon" />
                </span>
                <span className="payment-form__wallet-copy">
                  <span className="payment-form__wallet-name">
                    {t(`paymentForm.wallet.${id}.name`)}
                  </span>
                  <span className="payment-form__wallet-desc">
                    {t(`paymentForm.wallet.${id}.desc`)}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default PaymentForm;
