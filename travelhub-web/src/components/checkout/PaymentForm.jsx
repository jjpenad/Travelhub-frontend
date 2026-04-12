import { useEffect, useId, useMemo, useState } from "react";
import "./PaymentForm.css";

const METHODS = [
  { id: "card", label: "Tarjeta de crédito", value: "card" },
  { id: "paypal", label: "PayPal", value: "paypal" },
  { id: "apple", label: "Apple Pay", value: "apple" },
];

/**
 * En false, oculta la UI de selección de método de pago (radios).
 * El bloque JSX completo sigue en el archivo; solo no se renderiza.
 */
const SHOW_PAYMENT_METHOD_SELECTOR = false;

function onlyDigits(s) {
  return String(s ?? "").replace(/\D/g, "");
}

function formatCardNumberInput(value) {
  const d = onlyDigits(value).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function luhnCheck(numStr) {
  let sum = 0;
  let alt = false;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let n = parseInt(numStr[i], 10);
    if (Number.isNaN(n)) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function validateCardNumber(digits) {
  if (!digits) return "Indica el número de tarjeta.";
  if (digits.length < 13 || digits.length > 19) {
    return "El número debe tener entre 13 y 19 dígitos.";
  }
  if (!luhnCheck(digits)) return "Número de tarjeta no válido.";
  return null;
}

function formatExpiryInput(raw) {
  const d = onlyDigits(raw).slice(0, 4);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)} / ${d.slice(2, 4)}`;
}

function validateExpiry(displayValue) {
  const d = onlyDigits(displayValue);
  if (d.length !== 4) return "Indica mes y año (MM/AA).";
  const mm = parseInt(d.slice(0, 2), 10);
  const yy = parseInt(d.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return "Mes inválido (01–12).";
  const fullYear = 2000 + yy;
  const now = new Date();
  const expYm = fullYear * 12 + (mm - 1);
  const curYm = now.getFullYear() * 12 + now.getMonth();
  if (expYm < curYm) return "La tarjeta está caducada.";
  return null;
}

function validateCvv(value) {
  const d = onlyDigits(value);
  if (!d) return "Indica el CVV.";
  if (d.length < 3 || d.length > 4) {
    return "El CVV debe tener 3 o 4 dígitos.";
  }
  return null;
}

function validateCardholder(name) {
  const t = name.trim().replace(/\s+/g, " ");
  if (!t) return "Indica el titular de la tarjeta.";
  if (t.length < 2) return "Nombre demasiado corto.";
  if (t.length > 80) return "El nombre no puede superar 80 caracteres.";
  if (!/^[\p{L}\s'.-]+$/u.test(t)) {
    return "Usa solo letras y espacios.";
  }
  return null;
}

function isCardPaymentDataValid(cardNumber, cardholderName, cardExpiry, cardCvv) {
  const digits = onlyDigits(cardNumber);
  return (
    validateCardNumber(digits) === null &&
    validateCardholder(cardholderName) === null &&
    validateExpiry(cardExpiry) === null &&
    validateCvv(cardCvv) === null
  );
}

function PaymentForm({
  paymentMethod = "card",
  onPaymentMethodChange,
  cardNumber = "",
  onCardNumberChange,
  onValidityChange,
}) {
  const baseId = useId();
  const [cardholderName, setCardholderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [touched, setTouched] = useState({
    cardNumber: false,
    cardholderName: false,
    cardExpiry: false,
    cardCvv: false,
  });

  const digits = onlyDigits(cardNumber);
  const errCard = touched.cardNumber ? validateCardNumber(digits) : null;
  const errHolder = touched.cardholderName
    ? validateCardholder(cardholderName)
    : null;
  const errExpiry = touched.cardExpiry ? validateExpiry(cardExpiry) : null;
  const errCvv = touched.cardCvv ? validateCvv(cardCvv) : null;

  const paymentDataValid = useMemo(() => {
    if (paymentMethod !== "card") return true;
    return isCardPaymentDataValid(
      cardNumber,
      cardholderName,
      cardExpiry,
      cardCvv,
    );
  }, [paymentMethod, cardNumber, cardholderName, cardExpiry, cardCvv]);

  useEffect(() => {
    onValidityChange?.(paymentDataValid);
  }, [paymentDataValid, onValidityChange]);

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  return (
    <section className="payment-form" aria-labelledby="payment-form-title">
      <h2 id="payment-form-title" className="payment-form__title">
        Métodos de pago
      </h2>

      {SHOW_PAYMENT_METHOD_SELECTOR ? (
        <fieldset className="payment-form__fieldset">
          <legend className="payment-form__legend">Método de pago</legend>
          <div
            className="payment-form__methods"
            role="radiogroup"
            aria-label="Método de pago"
          >
            {METHODS.map((m) => {
              const selected = paymentMethod === m.value;
              return (
                <label
                  key={m.id}
                  className={
                    "payment-form__method" +
                    (selected ? " payment-form__method--selected" : "")
                  }
                >
                  <input
                    className="payment-form__radio"
                    type="radio"
                    name="paymentMethod"
                    value={m.value}
                    checked={selected}
                    onChange={() => onPaymentMethodChange?.(m.value)}
                  />
                  <span className="payment-form__method-label">{m.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {paymentMethod === "card" ? (
        <div
          className={
            "payment-form__card-fields" +
            (!SHOW_PAYMENT_METHOD_SELECTOR
              ? " payment-form__card-fields--no-method-row"
              : "")
          }
          aria-label="Datos de la tarjeta"
        >
          <div className="payment-form__card-row payment-form__card-row--number-titular">
            <div className="payment-form__field">
              <label
                className="payment-form__field-label"
                htmlFor={`${baseId}-card-number`}
              >
                Número de tarjeta
              </label>
              <input
                id={`${baseId}-card-number`}
                className={
                  "payment-form__input" +
                  (errCard ? " payment-form__input--error" : "")
                }
                type="text"
                name="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) =>
                  onCardNumberChange?.(formatCardNumberInput(e.target.value))
                }
                onBlur={() => markTouched("cardNumber")}
                aria-invalid={Boolean(errCard)}
                aria-describedby={
                  errCard ? `${baseId}-err-card` : undefined
                }
              />
              {errCard ? (
                <p
                  id={`${baseId}-err-card`}
                  className="payment-form__error"
                  role="alert"
                >
                  {errCard}
                </p>
              ) : null}
            </div>
            <div className="payment-form__field">
              <label
                className="payment-form__field-label"
                htmlFor={`${baseId}-cardholder`}
              >
                Titular
              </label>
              <input
                id={`${baseId}-cardholder`}
                className={
                  "payment-form__input" +
                  (errHolder ? " payment-form__input--error" : "")
                }
                type="text"
                name="ccname"
                autoComplete="cc-name"
                placeholder="Como figura en la tarjeta"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                onBlur={() => markTouched("cardholderName")}
                aria-invalid={Boolean(errHolder)}
                aria-describedby={
                  errHolder ? `${baseId}-err-holder` : undefined
                }
              />
              {errHolder ? (
                <p
                  id={`${baseId}-err-holder`}
                  className="payment-form__error"
                  role="alert"
                >
                  {errHolder}
                </p>
              ) : null}
            </div>
          </div>
          <div className="payment-form__card-row payment-form__card-row--expiry-cvv">
            <div className="payment-form__field">
              <label
                className="payment-form__field-label"
                htmlFor={`${baseId}-expiry`}
              >
                Fecha de expiración
              </label>
              <input
                id={`${baseId}-expiry`}
                className={
                  "payment-form__input" +
                  (errExpiry ? " payment-form__input--error" : "")
                }
                type="text"
                name="cardExpiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                onBlur={() => markTouched("cardExpiry")}
                aria-invalid={Boolean(errExpiry)}
                aria-describedby={
                  errExpiry ? `${baseId}-err-expiry` : undefined
                }
              />
              {errExpiry ? (
                <p
                  id={`${baseId}-err-expiry`}
                  className="payment-form__error"
                  role="alert"
                >
                  {errExpiry}
                </p>
              ) : null}
            </div>
            <div className="payment-form__field payment-form__field--cvv">
              <label
                className="payment-form__field-label"
                htmlFor={`${baseId}-cvv`}
              >
                CVV
              </label>
              <input
                id={`${baseId}-cvv`}
                className={
                  "payment-form__input" +
                  (errCvv ? " payment-form__input--error" : "")
                }
                type="text"
                name="cardCvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={cardCvv}
                onChange={(e) =>
                  setCardCvv(onlyDigits(e.target.value).slice(0, 4))
                }
                onBlur={() => markTouched("cardCvv")}
                aria-invalid={Boolean(errCvv)}
                aria-describedby={errCvv ? `${baseId}-err-cvv` : undefined}
              />
              {errCvv ? (
                <p
                  id={`${baseId}-err-cvv`}
                  className="payment-form__error"
                  role="alert"
                >
                  {errCvv}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default PaymentForm;
