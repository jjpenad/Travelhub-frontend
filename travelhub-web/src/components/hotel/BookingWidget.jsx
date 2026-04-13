import { useNavigate } from "react-router-dom";
import { formatFriendlyDate, formatGuestsLabel } from "../../utils/searchUrlParams";
import "./BookingWidget.css";

/** En `false` se ocultan tarifa de limpieza, tarifa de servicio e impuestos del desglose (y no se suman al total). */
const showBreakdownExtraFees = false;

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
      width="16"
      height="16"
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
  return `$${Number(n).toLocaleString("es-ES")}`;
}

function BookingWidget({
  hotel,
  pricePerNight: pricePerNightProp,
  nights: nightsProp,
  rating: ratingProp,
  cleaningFee = 75,
  serviceFee = 45,
  taxes = 62,
  cancellationText: cancellationTextProp,
  onReserve,
  selectedRoom,
  onSelectedRoomChange,
  availableRooms: availableRoomsProp,
  defaultCheckIn = "",
  defaultCheckOut = "",
  defaultGuests = "2",
  roomTypeId = "",
}) {
  const navigate = useNavigate();
  const pricePerNight = pricePerNightProp ?? hotel?.price ?? 380;
  const rating = ratingProp ?? hotel?.rating ?? 4.9;
  const cancellationText =
    cancellationTextProp ??
    (hotel?.isRefundable === false
      ? "Tarifa no reembolsable"
      : "Cancelación gratuita");

  const nights = typeof nightsProp === "number" && nightsProp > 0 ? nightsProp : 5;
  const roomSubtotal = pricePerNight * nights;
  const cleaningFeeApplied = showBreakdownExtraFees ? cleaningFee : 0;
  const serviceFeeApplied = showBreakdownExtraFees ? serviceFee : 0;
  const taxesApplied = showBreakdownExtraFees ? taxes : 0;
  const total =
    roomSubtotal + cleaningFeeApplied + serviceFeeApplied + taxesApplied;

  const formKey = `${hotel?.id ?? ""}-${defaultCheckIn}-${defaultCheckOut}-${defaultGuests}-${nights}`;
  const ratingDisplay =
    typeof rating === "number" ? rating.toFixed(1) : String(rating);

  const checkInDisplay =
    defaultCheckIn.trim() !== "" ? formatFriendlyDate(defaultCheckIn) : "—";
  const checkOutDisplay =
    defaultCheckOut.trim() !== "" ? formatFriendlyDate(defaultCheckOut) : "—";
  const guestsDisplay = formatGuestsLabel(defaultGuests);

  const availableRooms =
    Array.isArray(availableRoomsProp) && availableRoomsProp.length > 0
      ? availableRoomsProp
      : hotel?.availableRooms ?? [];

  const hotelId = hotel?.id;
  const roomType =
    availableRooms.length > 0
      ? (selectedRoom ?? availableRooms[0] ?? "")
      : "";

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const checkIn = String(fd.get("checkIn") ?? "");
    const checkOut = String(fd.get("checkOut") ?? "");
    const guestsRaw = fd.get("guests");
    const guests = guestsRaw != null ? Number(guestsRaw) : 2;

    if (hotelId) {
      navigate(`/checkout/${hotelId}`, {
        state: {
          roomType,
          roomTypeId,
          total,
          nights,
          guests: Number.isFinite(guests) ? guests : 2,
          checkIn,
          checkOut,
          pricePerNight,
          cleaningFee: cleaningFeeApplied,
          serviceFee: serviceFeeApplied,
          taxes: taxesApplied,
          roomSubtotal,
        },
      });
    }
    onReserve?.(e);
  }

  return (
    <div className="booking-widget">
      <div className="booking-widget__header">
        <div className="booking-widget__header-top">
          <p className="booking-widget__price-line">
            <span className="booking-widget__price-amount">
              {fmtMoney(pricePerNight)}
            </span>
            <span className="booking-widget__price-unit"> / noche</span>
          </p>
          <p className="booking-widget__rating" aria-label={`Valoración ${ratingDisplay}`}>
            <span className="booking-widget__rating-value">{ratingDisplay}</span>
            <span className="booking-widget__rating-max">/5</span>
          </p>
        </div>
      </div>

      <form
        key={formKey}
        className="booking-widget__form"
        onSubmit={handleSubmit}
      >
        <div className="booking-widget__grid">
          <div className="booking-widget__field">
            <span className="booking-widget__label">Entrada</span>
            <input type="hidden" name="checkIn" value={defaultCheckIn} />
            <div
              className="booking-widget__static-field"
              aria-label={`Entrada: ${checkInDisplay}`}
            >
              {checkInDisplay}
            </div>
          </div>
          <div className="booking-widget__field">
            <span className="booking-widget__label">Salida</span>
            <input type="hidden" name="checkOut" value={defaultCheckOut} />
            <div
              className="booking-widget__static-field"
              aria-label={`Salida: ${checkOutDisplay}`}
            >
              {checkOutDisplay}
            </div>
          </div>
          <div className="booking-widget__field booking-widget__field--full">
            <span className="booking-widget__label">Huéspedes</span>
            <input type="hidden" name="guests" value={defaultGuests} />
            <div
              className="booking-widget__static-field booking-widget__static-field--guests"
              aria-label={`Huéspedes: ${guestsDisplay}`}
            >
              {guestsDisplay}
            </div>
          </div>
        </div>

        {availableRooms.length > 0 && typeof onSelectedRoomChange === "function" ? (
          <div className="booking-widget__room-type">
            <label
              className="booking-widget__room-type-label"
              htmlFor="booking-widget-room-type"
            >
              Tipo de habitación
            </label>
            <select
              id="booking-widget-room-type"
              className="booking-widget__select"
              name="roomType"
              value={selectedRoom ?? availableRooms[0] ?? ""}
              onChange={(e) => onSelectedRoomChange(e.target.value)}
              aria-label="Tipo de habitación"
            >
              {availableRooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="booking-widget__breakdown">
          <div className="booking-widget__row">
            <span>
              {fmtMoney(pricePerNight)} × {nights} noches
            </span>
            <span>{fmtMoney(roomSubtotal)}</span>
          </div>
          {showBreakdownExtraFees ? (
            <>
              <div className="booking-widget__row">
                <span>Tarifa de limpieza</span>
                <span>{fmtMoney(cleaningFee)}</span>
              </div>
              <div className="booking-widget__row">
                <span>Tarifa de servicio</span>
                <span>{fmtMoney(serviceFee)}</span>
              </div>
              <div className="booking-widget__row">
                <span>Impuestos</span>
                <span>{fmtMoney(taxes)}</span>
              </div>
            </>
          ) : null}
          <div className="booking-widget__row booking-widget__row--total">
            <span>Total</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </div>

        <button type="submit" className="booking-widget__reserve">
          <IconLock className="booking-widget__reserve-icon" />
          Reservar ahora
        </button>
      </form>

      <footer className="booking-widget__footer">
        <p className="booking-widget__cancel-note">{cancellationText}</p>
        <p className="booking-widget__ssl">
          <IconShieldSsl className="booking-widget__ssl-icon" />
          <span>Pago seguro con SSL</span>
        </p>
      </footer>
    </div>
  );
}

export default BookingWidget;
