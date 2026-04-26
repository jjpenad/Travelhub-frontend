import { useState } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuestForm from "../../../src/components/checkout/GuestForm.jsx";

beforeEach(() => {
  // Make sure no leftover JWT from another test's localStorage hydrates the
  // form before the explicit cases below run.
  localStorage.clear();
  sessionStorage.clear();
});

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

describe("GuestForm pre-fill desde el JWT", () => {
  it("pre-rellena nombre/apellidos/email cuando hay datos en `prefillOverride` y los marca readOnly", () => {
    const { getByLabelText } = render(
      <GuestForm
        prefillOverride={{
          firstName: "Ana",
          lastName: "Lopez",
          email: "ana@example.com",
        }}
      />,
    );

    const nombre = getByLabelText(/^Nombre$/i);
    const apellidos = getByLabelText(/^Apellidos$/i);
    const email = getByLabelText(/Correo electrónico/i);

    expect(nombre).toHaveValue("Ana");
    expect(apellidos).toHaveValue("Lopez");
    expect(email).toHaveValue("ana@example.com");

    // Mismo contrato que la pantalla de booking en Android: campos
    // canónicos del usuario en read-only.
    expect(nombre).toHaveAttribute("readonly");
    expect(apellidos).toHaveAttribute("readonly");
    expect(email).toHaveAttribute("readonly");
  });

  it("deja teléfono editable y desbloquea el pago cuando el usuario lo completa", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [valid, setValid] = useState(false);
      return (
        <>
          <GuestForm
            prefillOverride={{
              firstName: "Ana",
              lastName: "Lopez",
              email: "ana@example.com",
            }}
            onValidityChange={setValid}
          />
          <button data-testid="pay" disabled={!valid}>
            Pagar
          </button>
        </>
      );
    }
    const { getByLabelText, getByTestId } = render(<Harness />);

    // Pre-fill no basta — el form aún no es válido sin teléfono.
    await waitFor(() => expect(getByTestId("pay")).toBeDisabled());

    await user.type(getByLabelText(/^Teléfono$/i), "600123456");
    await waitFor(() => expect(getByTestId("pay")).toBeEnabled());
  });

  it("flujo anónimo (sin override y sin token): los campos arrancan vacíos y editables", () => {
    const { getByLabelText } = render(<GuestForm />);
    const nombre = getByLabelText(/^Nombre$/i);
    expect(nombre).toHaveValue("");
    expect(nombre).not.toHaveAttribute("readonly");
  });

  it("solo bloquea los campos que vinieron pre-rellenados (lastName vacío sigue editable)", async () => {
    const { getByLabelText } = render(
      <GuestForm
        prefillOverride={{
          firstName: "Cher",
          lastName: "",
          email: "cher@example.com",
        }}
      />,
    );

    expect(getByLabelText(/^Nombre$/i)).toHaveAttribute("readonly");
    expect(getByLabelText(/Correo electrónico/i)).toHaveAttribute("readonly");
    // Apellidos no vino del JWT → sigue editable para que el usuario pueda
    // completarlo y poder pagar.
    expect(getByLabelText(/^Apellidos$/i)).not.toHaveAttribute("readonly");
  });
});
