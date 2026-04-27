import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appendLocalReservation } from "../../bookings/localReservations";
import {
  isAuthenticated,
  isLoggedIn,
  persistSessionFromLogin,
} from "../../auth/sessionAuth";
import { processPayment, registerUser } from "../../services/api";
import "./BookingSummaryCard.css";

function buildPaymentLabel(
  paymentMethod,
  cardNumberRaw,
) {
  if (paymentMethod === "paypal") return "PayPal";
  if (paymentMethod === "apple") return "Apple Pay";
  const digits = String(cardNumberRaw ?? "").replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : "4242";
  return `Visa ···· ${last4}`;
}

function IconLock({ className }) {
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
        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      />
    </svg>
  );
}

function IconShieldSsl({ className }) {
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
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
      />
    </svg>
  );
}

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toLocaleString("es-ES")}`;
}

function formatDateLabel(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BookingSummaryCard({
  hotel,
  hotelId: _hotelId = "",
  reservationId = "",
  roomType,
  roomTypeId: _roomTypeId = "",
  checkIn = "",
  checkOut = "",
  guests: guestsProp = 2,
  nights = 5,
  pricePerNight = 0,
  cleaningFee = 75,
  serviceFee = 45,
  taxes = 62,
  total = 0,
  guestEmail = "",
  guestFormValid = false,
  paymentFormValid = false,
  paymentMethod = "card",
  cardNumber = "",
  guestFirstName = "",
  guestLastName = "",
  onConfirm,
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
  /** Solo huéspedes sin sesión pueden optar por registro en el checkout. */
  const [createAccount, setCreateAccount] = useState(
    () => !isAuthenticated() && !isLoggedIn(),
  );

  const hasAuthSession = isAuthenticated() || isLoggedIn();

  const name = hotel?.name ?? "Hotel";
  const locationText = hotel?.location ?? "—";
  const imageSrc = hotel?.image;
  const rating =
    typeof hotel?.rating === "number"
      ? hotel.rating.toFixed(1)
      : String(hotel?.rating ?? "—");

  const roomSubtotal = Number(pricePerNight) * Number(nights);
  const guests = Number(guestsProp);
  const guestCount = Number.isFinite(guests) ? guests : 2;

  async function handleConfirm() {
    onConfirm?.();
    setSubmitting(true);
    setApiError(null);

    try {
      const paymentPayload = {
        reservation_id: reservationId,
        primary_guest: {
          first_name: guestFirstName || "Huésped",
          last_name: guestLastName || "",
          document_type: "CC",
          document_number: "1234567890", // Debería capturarse en el form si es real
          nationality: "COL",
          email: guestEmail || "guest@example.com",
        },
        payment: {
          amount: Number(total).toFixed(2),
          currency_code: "USD",
          payment_token: `tok_visa_${(cardNumber || "4242424242424242").replace(/\D/g, "")}`,
        },
      };

      const response = await processPayment(paymentPayload);

      // Verificamos si el pago fue exitoso según la respuesta del backend
      // El backend devuelve 200 OK pero con success: false en caso de error
      const result = response.result || {};

      if (result.success === false) {
        setSubmitting(false);
        setErrorModal({
          show: true,
          message: result.error || "No se pudo procesar el pago",
        });
        return;
      }

      const reference =
        result.confirmation_code ||
        result.reservation_id ||
        reservationId ||
        "N/A";

      const loggedInOrHasToken = isAuthenticated() || isLoggedIn();

      if (createAccount && !loggedInOrHasToken) {
        const email = String(guestEmail || "").trim();
        if (email) {
          try {
            const reg = await registerUser({
              email: email.toLowerCase(),
              password: Math.random().toString(36).slice(-10),
              first_name: guestFirstName || "Huésped",
              last_name: guestLastName || "",
            });
            if (reg.token) {
              persistSessionFromLogin({
                email: reg.email || email,
                accessToken: reg.token,
                userType: reg.user_type,
                firstName: reg.first_name || guestFirstName,
                lastName: reg.last_name || guestLastName,
                remember: true,
              });
            }
          } catch (err) {
            console.error("Registro automático falló:", err);
          }
        }
      }

      const hotelPayload = hotel
        ? {
            id: hotel.id,
            name: hotel.name,
            location: hotel.location,
            image: hotel.image,
            rating: hotel.rating,
          }
        : null;

      // Misma forma que develop envía a /confirmation (no perder campos)
      const confirmationState = {
        reference,
        total: Number(total),
        hotel: hotelPayload,
        roomType: roomType || null,
        checkIn,
        checkOut,
        guests: guestCount,
        nights: Number(nights),
        pricePerNight: Number(pricePerNight),
        cleaningFee: Number(cleaningFee),
        serviceFee: Number(serviceFee),
        taxes: Number(taxes),
        guestEmail: guestEmail || null,
        paymentMethod,
        paymentLabel: buildPaymentLabel(paymentMethod, cardNumber),
        checkInTime: "15:00",
        checkOutTime: "11:00",
      };

      appendLocalReservation(confirmationState);

      navigate("/confirmation", {
        state: confirmationState,
      });
    } catch (err) {
      console.error("Reservation failed:", err);
      setApiError(err.message || "Error al crear la reserva");
      setSubmitting(false);
    }
  }

  return (
    <aside
      className="booking-summary-card"
      aria-labelledby="booking-summary-card-title"
    >
      <div className="booking-summary-card__media">
        {imageSrc ? (
          <img
            className="booking-summary-card__image"
            src={imageSrc}
            alt={name}
            loading="lazy"
            width={320}
            height={180}
          />
        ) : (
          <div
            className="booking-summary-card__image booking-summary-card__image--placeholder"
            role="img"
            aria-label={name}
          />
        )}
        <div className="booking-summary-card__rating-badge">
          <span className="booking-summary-card__rating-value">{rating}</span>
          <span className="booking-summary-card__rating-max">/5</span>
        </div>
      </div>

      <h2 id="booking-summary-card-title" className="booking-summary-card__hotel-name">
        {name}
      </h2>
      <p className="booking-summary-card__location">{locationText}</p>

      {roomType ? (
        <p className="booking-summary-card__room">{roomType}</p>
      ) : null}

      <ul className="booking-summary-card__trip-meta">
        <li className="booking-summary-card__trip-item">
          <span className="booking-summary-card__trip-label">Fechas</span>
          <span className="booking-summary-card__trip-value">
            {checkIn && checkOut
              ? `${formatDateLabel(checkIn)} – ${formatDateLabel(checkOut)}`
              : "—"}
          </span>
        </li>
        <li className="booking-summary-card__trip-item">
          <span className="booking-summary-card__trip-label">Huéspedes</span>
          <span className="booking-summary-card__trip-value">
            {guestCount}{" "}
            {guestCount === 1 ? "huésped" : "huéspedes"}
          </span>
        </li>
        <li className="booking-summary-card__trip-item">
          <span className="booking-summary-card__trip-label">Noches</span>
          <span className="booking-summary-card__trip-value">{nights}</span>
        </li>
      </ul>

      <div className="booking-summary-card__breakdown">
        <div className="booking-summary-card__row">
          <span>
            {fmtMoney(pricePerNight)} × {nights} noches
          </span>
          <span>{fmtMoney(roomSubtotal)}</span>
        </div>
        {cleaningFee > 0 ? (
          <div className="booking-summary-card__row">
            <span>Tarifa de limpieza</span>
            <span>{fmtMoney(cleaningFee)}</span>
          </div>
        ) : null}
        {serviceFee > 0 ? (
          <div className="booking-summary-card__row">
            <span>Tarifa de servicio</span>
            <span>{fmtMoney(serviceFee)}</span>
          </div>
        ) : null}
        {taxes > 0 ? (
          <div className="booking-summary-card__row">
            <span>Impuestos</span>
            <span>{fmtMoney(taxes)}</span>
          </div>
        ) : null}
        <div className="booking-summary-card__row booking-summary-card__row--total">
          <span>Total</span>
          <span className="booking-summary-card__total-amount">
            {fmtMoney(total)}
          </span>
        </div>
      </div>

      {apiError && (
        <p style={{ color: "#e53935", fontSize: "0.875rem", margin: "0.5rem 0", textAlign: "center" }}>
          {apiError}
        </p>
      )}

      <button
        type="button"
        className="booking-summary-card__confirm"
        disabled={!guestFormValid || !paymentFormValid || submitting}
        onClick={handleConfirm}
      >
        <IconLock className="booking-summary-card__confirm-icon" />
        {submitting ? "Procesando..." : "Confirmar y Pagar"}
      </button>

      {hasAuthSession ? (
        <p className="booking-summary-card__account-check booking-summary-card__check-note">
          Ya tienes sesión activa; el pago quedará asociado a tu cuenta.
        </p>
      ) : (
        <div className="booking-summary-card__account-check">
          <label className="booking-summary-card__check-label">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="booking-summary-card__checkbox"
            />
            <span className="booking-summary-card__check-text">
              Autorizo la creación de una cuenta para gestionar mis reservas.
              <small className="booking-summary-card__check-note">
                De lo contrario, solo podrás consultar tus viajes con tu código de reserva.
              </small>
            </span>
          </label>
        </div>
      )}

      <footer className="booking-summary-card__footer">
        <p className="booking-summary-card__cancellation">Cancelación gratuita</p>
        <p className="booking-summary-card__ssl">
          <IconShieldSsl className="booking-summary-card__ssl-icon" />
          <span>Pago seguro con SSL</span>
        </p>
      </footer>

      {errorModal.show && (
        <div className="booking-modal-overlay">
          <div className="booking-modal booking-modal--error">
            <div className="booking-modal__icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#ef4444" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <h3 className="booking-modal__title">No se pudo completar el pago</h3>
            <p className="booking-modal__text">{errorModal.message}</p>
            <button
              type="button"
              className="booking-modal__button"
              onClick={() => {
                setErrorModal({ show: false, message: "" });
                navigate("/");
              }}
            >
              Volver a buscar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default BookingSummaryCard;
