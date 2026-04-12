import { useNavigate } from "react-router-dom";
import "./BookingSummaryCard.css";

function buildReservationReference() {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TRV-${year}-${num}`;
}

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
  roomType,
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
  paymentMethod = "card",
  cardNumber = "",
  onConfirm,
}) {
  const navigate = useNavigate();
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

  function handleConfirm() {
    onConfirm?.();
    const reference = buildReservationReference();
    const hotelPayload = hotel
      ? {
          id: hotel.id,
          name: hotel.name,
          location: hotel.location,
          image: hotel.image,
          rating: hotel.rating,
        }
      : null;

    navigate("/confirmation", {
      state: {
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
        guestEmail:
          typeof guestEmail === "string" && guestEmail.trim() !== ""
            ? guestEmail.trim()
            : null,
        paymentMethod,
        paymentLabel: buildPaymentLabel(paymentMethod, cardNumber),
        checkInTime: "15:00",
        checkOutTime: "11:00",
      },
    });
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
        <div className="booking-summary-card__row">
          <span>Tarifa de limpieza</span>
          <span>{fmtMoney(cleaningFee)}</span>
        </div>
        <div className="booking-summary-card__row">
          <span>Tarifa de servicio</span>
          <span>{fmtMoney(serviceFee)}</span>
        </div>
        <div className="booking-summary-card__row">
          <span>Impuestos</span>
          <span>{fmtMoney(taxes)}</span>
        </div>
        <div className="booking-summary-card__row booking-summary-card__row--total">
          <span>Total</span>
          <span className="booking-summary-card__total-amount">
            {fmtMoney(total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="booking-summary-card__confirm"
        disabled={!guestFormValid}
        onClick={handleConfirm}
      >
        <IconLock className="booking-summary-card__confirm-icon" />
        Confirmar y pagar {fmtMoney(total)}
      </button>

      <footer className="booking-summary-card__footer">
        <p className="booking-summary-card__cancellation">Cancelación gratuita</p>
        <p className="booking-summary-card__ssl">
          <IconShieldSsl className="booking-summary-card__ssl-icon" />
          <span>Pago seguro con SSL</span>
        </p>
      </footer>
    </aside>
  );
}

export default BookingSummaryCard;
