import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatFriendlyDate, formatGuestsLabel } from "../../utils/searchUrlParams";
import { createBooking } from "../../services/api";
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
  const [userState, setUserState] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });
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

  const [isBooking, setIsBooking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    
    const checkIn = String(fd.get("checkIn") ?? defaultCheckIn);
    const checkOut = String(fd.get("checkOut") ?? defaultCheckOut);
    const guestsRaw = fd.get("guests");
    const guests = guestsRaw != null ? Number(guestsRaw) : Number(defaultGuests);

    // Validación de datos requeridos
    if (!hotelId || !roomTypeId || !checkIn || !checkOut) {
      alert("Por favor completa la selección de fechas y habitación antes de continuar.");
      return;
    }

    const bookingPayload = {
      hotel_id: hotelId,
      room_type_id: roomTypeId,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests,
      base_price: roomSubtotal.toFixed(2),
      taxes: taxesApplied.toFixed(2),
      discounts: "0.00",
      total_price: total.toFixed(2),
      currency_code: "USD",
      special_requests: "" // Se puede expandir en el futuro
    };

    setIsBooking(true);
    try {
      const response = await createBooking(bookingPayload);
      
      // Caso 1: La reserva no puede proceder (ej: No hay agenda disponible)
      if (response.result?.proceed === false) {
        console.warn("Reserva rechazada:", response.result.message);
        setErrorModal({ 
          show: true, 
          message: response.result.message || "No hay disponibilidad para las fechas seleccionadas." 
        });
        return;
      }

      // Caso 2: Éxito
      setUserState(response);
      console.log("Reserva creada con éxito:", response);
      
      setShowSuccessModal(true);
      
      setTimeout(() => {
        navigate(`/checkout/${hotelId}`, { 
          state: { 
            bookingResponse: response 
          } 
        });
      }, 2000);
      
    } catch (err) {
      console.error("Error al crear la reserva:", err);
      setErrorModal({ 
        show: true, 
        message: "Hubo un problema al procesar tu reserva. Por favor intenta de nuevo." 
      });
    } finally {
      setIsBooking(false);
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

        <button 
          type="submit" 
          className="booking-widget__reserve"
          disabled={isBooking}
        >
          <IconLock className="booking-widget__reserve-icon" />
          {isBooking ? "Procesando..." : "Reservar ahora"}
        </button>
      </form>

      <footer className="booking-widget__footer">
        <p className="booking-widget__cancel-note">{cancellationText}</p>
        <p className="booking-widget__ssl">
          <IconShieldSsl className="booking-widget__ssl-icon" />
          <span>Pago seguro con SSL</span>
        </p>
      </footer>

      {showSuccessModal && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            <div className="booking-modal__icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#4caf50" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="booking-modal__title">¡Ya está hecha la reserva!</h3>
            <p className="booking-modal__text">Estamos preparando todo para tu viaje. Redirigiéndote al pago...</p>
            <div className="booking-modal__loader"></div>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="booking-modal-overlay">
          <div className="booking-modal booking-modal--error">
            <div className="booking-modal__icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#ef4444" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <h3 className="booking-modal__title">No se pudo completar</h3>
            <p className="booking-modal__text">{errorModal.message}</p>
            <button 
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
    </div>
  );
}

export default BookingWidget;
