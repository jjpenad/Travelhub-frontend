import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import BookingSummaryCard from "../components/checkout/BookingSummaryCard";
import CheckoutStepper from "../components/checkout/CheckoutStepper";
import GuestForm from "../components/checkout/GuestForm";
import PaymentForm from "../components/checkout/PaymentForm";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
// TODO(backend): mockHotels removed — hotel data now comes from location.state via BookingWidget
import "./CheckoutPage.css";

const DEFAULT_NIGHTS = 5;
const DEFAULT_GUESTS = 2;
const DEFAULT_CLEANING = 75;
const DEFAULT_SERVICE = 45;
const DEFAULT_TAXES = 62;

/**
 * Combina lo enviado desde el detalle (useLocation().state) con el hotel del mock.
 * Si no hay state (p. ej. F5), los precios y el nombre salen de mockHotels[hotelId].
 */
function buildBookingSummaryData(locationState, hotelFromMock) {
  const nav = locationState || {};
  const bookingRes = nav.bookingResponse?.result || {};
  const pricing = bookingRes.pricing || {};

  // Priorizamos la información del backend (bookingResponse)
  const nights = Number(pricing.nights || nav.nights || DEFAULT_NIGHTS);
  const guests = Number(pricing.guests || nav.guests || DEFAULT_GUESTS);
  const pricePerNight = Number(pricing.price_per_night || nav.pricePerNight || hotelFromMock?.price || 0);
  const cleaningFee = Number(nav.cleaningFee || DEFAULT_CLEANING);
  const serviceFee = Number(nav.serviceFee || DEFAULT_SERVICE);
  const taxes = Number(pricing.taxes || nav.taxes || DEFAULT_TAXES);
  
  const checkIn = bookingRes.check_in || nav.checkIn || "";
  const checkOut = bookingRes.check_out || nav.checkOut || "";
  
  const roomType = bookingRes.room_type?.name || nav.roomType || hotelFromMock?.availableRooms?.[0] || "";
  
  const total = Number(pricing.total || nav.total || (pricePerNight * nights + cleaningFee + serviceFee + taxes));

  // Combinamos la información del hotel del backend con el mock si es necesario
  const hotel = bookingRes.hotel || hotelFromMock;

  return {
    hotel,
    roomType,
    checkIn,
    checkOut,
    guests,
    nights,
    pricePerNight,
    cleaningFee,
    serviceFee,
    taxes,
    total,
  };
}

function CheckoutPage() {
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState({ firstName: "", lastName: "" });
  const [guestFormValid, setGuestFormValid] = useState(false);
  const [paymentFormValid, setPaymentFormValid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
  const { hotelId } = useParams();
  const location = useLocation();
  /** Datos enviados desde BookingWidget al navegar a /checkout/:hotelId */
  const detailState = location.state;
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getTimerColor = () => {
    if (timeLeft >= 240) return "#22c55e"; // Verde (5:00 - 4:00)
    if (timeLeft >= 120) return "#eab308"; // Amarillo (4:00 - 2:00)
    return "#ef4444"; // Rojo (< 2:00)
  };

  const summary = buildBookingSummaryData(detailState, null);

  const hotel = summary.hotel;

  return (
    <div className="checkout-page">
      <Navbar />
      <PageContainer>
        <div className="checkout">
          <nav className="checkout__breadcrumb" aria-label="Migas de pan">
            <Link className="checkout__breadcrumb-link" to={PATH_TRAVELERS_HOME}>
              Inicio
            </Link>
            <span className="checkout__breadcrumb-sep" aria-hidden="true">
              /
            </span>
            {hotel ? (
              <Link
                className="checkout__breadcrumb-link"
                to={`/hotel/${hotelId}`}
              >
                {hotel.name}
              </Link>
            ) : (
              <span className="checkout__breadcrumb-current">Hotel</span>
            )}
            <span className="checkout__breadcrumb-sep" aria-hidden="true">
              /
            </span>
            <span className="checkout__breadcrumb-current">Pago</span>
          </nav>

          <CheckoutStepper activeStep="payment" />

          <div className="checkout__layout">
            <div className="checkout__main">
              <GuestForm
                onGuestEmailChange={setGuestEmail}
                onGuestNameChange={setGuestName}
                onValidityChange={setGuestFormValid}
              />
              <PaymentForm
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                cardNumber={cardNumber}
                onCardNumberChange={setCardNumber}
                onValidityChange={setPaymentFormValid}
              />
            </div>
            <div className="checkout__aside">
              <div className="checkout__timer" style={{
                background: "#fff",
                padding: "1rem",
                borderRadius: "12px",
                marginBottom: "1rem",
                border: "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Tiempo restante para completar la reserva
                </span>
                <span style={{ 
                  fontSize: "1.75rem", 
                  fontWeight: 800, 
                  color: getTimerColor(),
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.3s ease"
                }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <BookingSummaryCard
                hotel={hotel}
                hotelId={hotelId}
                reservationId={detailState?.bookingResponse?.result?.reservation_id || ""}
                roomType={summary.roomType}
                roomTypeId={detailState?.roomTypeId || ""}
                checkIn={summary.checkIn}
                checkOut={summary.checkOut}
                guests={summary.guests}
                nights={summary.nights}
                pricePerNight={summary.pricePerNight}
                cleaningFee={summary.cleaningFee}
                serviceFee={summary.serviceFee}
                taxes={summary.taxes}
                total={summary.total}
                guestEmail={guestEmail}
                guestFormValid={guestFormValid}
                paymentFormValid={paymentFormValid}
                paymentMethod={paymentMethod}
                cardNumber={cardNumber}
                guestFirstName={guestName.firstName}
                guestLastName={guestName.lastName}
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default CheckoutPage;
