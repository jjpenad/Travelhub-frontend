import "./CheckoutStepper.css";

const STEPS = [
  { id: "details", label: "Reserva" },
  { id: "payment", label: "Pago" },
  { id: "confirm", label: "Confirmación", labelDone: "Confirmado" },
];

function IconCheck({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    </svg>
  );
}

function CheckoutStepper({ activeStep = "payment", variant = "default" }) {
  const isConfirmationDone = variant === "confirmation";

  return (
    <ol
      className={
        "checkout-stepper" +
        (isConfirmationDone ? " checkout-stepper--confirmation-done" : "")
      }
      aria-label="Progreso del pago"
    >
      {STEPS.map((step, index) => {
        const activeIndex = STEPS.findIndex((s) => s.id === activeStep);
        const isPast =
          isConfirmationDone || activeIndex > index;
        const isActive = !isConfirmationDone && activeStep === step.id;
        const isLast = index === STEPS.length - 1;
        const showCheckmark = isConfirmationDone && isLast;
        const label =
          showCheckmark && step.labelDone ? step.labelDone : step.label;

        return (
          <li
            key={step.id}
            className={
              "checkout-stepper__item" +
              (isActive ? " checkout-stepper__item--active" : "") +
              (isPast ? " checkout-stepper__item--complete" : "") +
              (showCheckmark ? " checkout-stepper__item--done" : "")
            }
            aria-current={isActive ? "step" : undefined}
          >
            <span
              className={
                "checkout-stepper__marker" +
                (showCheckmark ? " checkout-stepper__marker--check" : "")
              }
              aria-hidden="true"
            >
              {showCheckmark ? (
                <IconCheck className="checkout-stepper__check-icon" />
              ) : (
                index + 1
              )}
            </span>
            <span className="checkout-stepper__label">{label}</span>
            {index < STEPS.length - 1 ? (
              <span className="checkout-stepper__connector" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default CheckoutStepper;
