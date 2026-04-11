import { useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import CheckoutStepper from "../components/checkout/CheckoutStepper";
import ConfirmationTicket from "../components/confirmation/ConfirmationTicket";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import "./ConfirmationPage.css";

function IconCheckCelebration({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="32"
      height="32"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      />
    </svg>
  );
}

function IconArrowRight({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
      />
    </svg>
  );
}

function IconQrSmall({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm6-2h2v2h-2v-2zm4 0h2v4h-2v-4zm-4 4h2v2h4v2h-2v2h-2v-2h-2v-2h2v-2zm8-4h2v8h-2v-4h-2v-2h2v-2z"
      />
    </svg>
  );
}

function buildReceiptText({
  reference,
  hotel,
  total,
  checkIn,
  checkOut,
  roomType,
  guestEmail,
}) {
  const lines = [
    "TravelHub — Recibo de reserva",
    `Referencia: #${reference}`,
    hotel?.name ? `Hotel: ${hotel.name}` : null,
    hotel?.location ? `Ubicación: ${hotel.location}` : null,
    checkIn ? `Entrada: ${checkIn}` : null,
    checkOut ? `Salida: ${checkOut}` : null,
    roomType ? `Habitación: ${roomType}` : null,
    typeof total === "number" && Number.isFinite(total)
      ? `Total pagado: ${total.toFixed(2)}`
      : null,
    guestEmail ? `Correo del huésped: ${guestEmail}` : null,
  ].filter(Boolean);
  return `${lines.join("\n")}\n`;
}

function ConfirmationPage() {
  const location = useLocation();
  const data = location.state;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hotel = data?.hotel;
  const reference = data?.reference;
  const total = data?.total;
  const checkIn = data?.checkIn;
  const checkOut = data?.checkOut;
  const roomType = data?.roomType;
  const paymentLabel =
    typeof data?.paymentLabel === "string" ? data.paymentLabel : "Visa ···· 4242";
  const checkInTime = data?.checkInTime ?? "15:00";
  const checkOutTime = data?.checkOutTime ?? "11:00";
  const guestEmail =
    typeof data?.guestEmail === "string" && data.guestEmail.trim() !== ""
      ? data.guestEmail.trim()
      : "tu correo electrónico";

  const hasBooking = Boolean(hotel && reference);

  function handleDownloadReceipt() {
    if (!reference) return;
    const body = buildReceiptText({
      reference,
      hotel,
      total,
      checkIn,
      checkOut,
      roomType,
      guestEmail:
        typeof data?.guestEmail === "string" && data.guestEmail.trim() !== ""
          ? data.guestEmail.trim()
          : undefined,
    });
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travelhub-recibo-${reference}.txt`;
    a.rel = "noopener";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tripDetailsTo =
    hotel?.id != null && hotel.id !== ""
      ? `/hotel/${encodeURIComponent(String(hotel.id))}`
      : "/";

  return (
    <div className="confirmation-page">
      <Navbar />
      <PageContainer>
        <div className="confirmation">
          <div className="confirmation-card">
            <div className="confirmation-card__stepper">
              <CheckoutStepper variant="confirmation" />
            </div>

            {hasBooking ? (
              <div className="confirmation-card__body">
                <section
                  className="confirmation-header"
                  aria-labelledby="confirmation-header-title"
                >
                  <div className="confirmation-header__visual">
                    <span className="confirmation-header__ring confirmation-header__ring--outer" />
                    <span className="confirmation-header__ring confirmation-header__ring--mid" />
                    <span className="confirmation-header__ring confirmation-header__ring--inner" />
                    <span className="confirmation-header__check">
                      <IconCheckCelebration className="confirmation-header__check-icon" />
                    </span>
                  </div>

                  <div className="confirmation-header__text-group">
                    <h1
                      id="confirmation-header-title"
                      className="confirmation-header__title"
                    >
                      ¡Reserva confirmada! 🥳
                    </h1>
                    <p className="confirmation-header__text">
                      Tu reserva está confirmada. Hemos enviado un correo de
                      confirmación a{" "}
                      <strong className="confirmation-header__email">
                        {guestEmail}
                      </strong>
                      .
                    </p>
                    <p className="confirmation-header__ref">
                      Ref. de reserva: #{reference}
                    </p>
                  </div>
                </section>

                <ConfirmationTicket
                  hotel={hotel}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  checkInTime={checkInTime}
                  checkOutTime={checkOutTime}
                  total={total}
                  paymentLabel={paymentLabel}
                  paymentStatus="Pagado"
                />

                {roomType ? (
                  <p className="confirmation-card__room-type-note">
                    <strong>Tipo de habitación:</strong> {roomType}
                  </p>
                ) : null}

                <div className="confirmation-actions">
                  <div className="confirmation-actions__buttons">
                    <Link
                      className="confirmation-actions__btn confirmation-actions__btn--primary"
                      to={tripDetailsTo}
                    >
                      Ver detalles del viaje
                      <IconArrowRight className="confirmation-actions__btn-icon" />
                    </Link>
                    <button
                      type="button"
                      className="confirmation-actions__btn confirmation-actions__btn--secondary"
                      onClick={handleDownloadReceipt}
                    >
                      Descargar recibo
                    </button>
                  </div>
                  <p className="confirmation-actions__qr-note">
                    <IconQrSmall className="confirmation-actions__qr-icon" />
                    El código QR de check-in está disponible en Detalles del viaje
                  </p>
                </div>

                <Link className="confirmation-card__cta" to="/">
                  Volver al inicio
                </Link>
              </div>
            ) : (
              <div className="confirmation-card__body confirmation-card__body--empty">
                <h1 className="confirmation-card__title">Confirmación</h1>
                <p className="confirmation-card__lead">
                  No hay datos de reserva. Si acabas de completar el pago, vuelve
                  desde el checkout.
                </p>
                <Link className="confirmation-card__cta" to="/">
                  Ir al inicio
                </Link>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default ConfirmationPage;
