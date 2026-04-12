import { useId } from "react";
import "./PaymentForm.css";

const METHODS = [
  { id: "card", label: "Tarjeta de crédito", value: "card" },
  { id: "paypal", label: "PayPal", value: "paypal" },
  { id: "apple", label: "Apple Pay", value: "apple" },
];

function PaymentForm({
  paymentMethod = "card",
  onPaymentMethodChange,
  cardNumber = "",
  onCardNumberChange,
}) {
  const baseId = useId();

  return (
    <section className="payment-form" aria-labelledby="payment-form-title">
      <h2 id="payment-form-title" className="payment-form__title">
        Pago
      </h2>

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

      {paymentMethod === "card" ? (
        <div
          className="payment-form__card-fields"
          aria-label="Datos de la tarjeta"
        >
          <div className="payment-form__field">
            <label
              className="payment-form__field-label"
              htmlFor={`${baseId}-card-number`}
            >
              Número de tarjeta
            </label>
            <input
              id={`${baseId}-card-number`}
              className="payment-form__input"
              type="text"
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => onCardNumberChange?.(e.target.value)}
            />
          </div>
          <div className="payment-form__card-row">
            <div className="payment-form__field">
              <label
                className="payment-form__field-label"
                htmlFor={`${baseId}-expiry`}
              >
                Fecha de caducidad
              </label>
              <input
                id={`${baseId}-expiry`}
                className="payment-form__input"
                type="text"
                name="cardExpiry"
                autoComplete="cc-exp"
                placeholder="MM / AA"
              />
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
                className="payment-form__input"
                type="text"
                name="cardCvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default PaymentForm;
