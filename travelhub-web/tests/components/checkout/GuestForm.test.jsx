import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuestForm from "../../../src/components/checkout/GuestForm.jsx";

/**
 * Misma regla que CheckoutPage + BookingSummaryCard: el pago queda deshabilitado
 * mientras GuestForm notifique validez false.
 */
function GuestFormWithPayButton() {
  const [guestFormValid, setGuestFormValid] = useState(false);
  return (
    <>
      <GuestForm onValidityChange={setGuestFormValid} />
      <button
        type="button"
        data-testid="checkout-confirm-pay"
        disabled={!guestFormValid}
      >
        Confirmar y Pagar
      </button>
    </>
  );
}

describe("GuestForm (integración con botón de pago)", () => {
  it("deja el botón de pago deshabilitado por defecto", async () => {
    const { getByTestId } = render(<GuestFormWithPayButton />);
    const pay = getByTestId("checkout-confirm-pay");
    await waitFor(() => {
      expect(pay).toBeDisabled();
    });
  });

  it("habilita el botón solo tras completar nombre, apellidos, correo y teléfono válidos", async () => {
    const user = userEvent.setup();
    const { getByTestId, getByLabelText } = render(<GuestFormWithPayButton />);
    const pay = getByTestId("checkout-confirm-pay");

    await waitFor(() => expect(pay).toBeDisabled());

    await user.type(getByLabelText(/^Nombre$/i), "Ana");
    await user.type(getByLabelText(/^Apellidos$/i), "García López");
    await user.type(
      getByLabelText(/Correo electrónico/i),
      "ana@example.com",
    );

    await waitFor(() => expect(pay).toBeDisabled());

    await user.type(getByLabelText(/^Teléfono$/i), "600123456");

    await waitFor(() => expect(pay).toBeEnabled());
  });

  it("mantiene el botón habilitado si Peticiones especiales está vacío", async () => {
    const user = userEvent.setup();
    const { getByTestId, getByLabelText } = render(<GuestFormWithPayButton />);
    const pay = getByTestId("checkout-confirm-pay");

    await user.type(getByLabelText(/^Nombre$/i), "Luis");
    await user.type(getByLabelText(/^Apellidos$/i), "Pérez");
    await user.type(
      getByLabelText(/Correo electrónico/i),
      "luis@example.com",
    );
    await user.type(getByLabelText(/^Teléfono$/i), "611000000");

    await waitFor(() => expect(pay).toBeEnabled());

    const peticiones = getByLabelText(/Peticiones especiales/i);
    expect(peticiones).toHaveValue("");
    expect(pay).toBeEnabled();
  });
});
