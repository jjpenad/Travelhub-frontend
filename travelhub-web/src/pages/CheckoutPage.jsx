import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import BookingSummaryCard from "../components/checkout/BookingSummaryCard";
import CheckoutStepper from "../components/checkout/CheckoutStepper";
import GuestForm from "../components/checkout/GuestForm";
import PaymentForm from "../components/checkout/PaymentForm";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { mockHotels } from "../data/mockHotels";
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
  const nav =
    locationState != null && typeof locationState === "object"
      ? locationState
      : {};

  const nightsRaw = nav.nights;
  const nights =
    nightsRaw != null && Number.isFinite(Number(nightsRaw))
      ? Number(nightsRaw)
      : DEFAULT_NIGHTS;

  const guestsRaw = nav.guests;
  const guests =
    guestsRaw != null && Number.isFinite(Number(guestsRaw))
      ? Number(guestsRaw)
      : DEFAULT_GUESTS;

  const pricePerNight =
    nav.pricePerNight != null && Number.isFinite(Number(nav.pricePerNight))
      ? Number(nav.pricePerNight)
      : hotelFromMock?.price ?? 0;

  const cleaningFee =
    nav.cleaningFee != null && Number.isFinite(Number(nav.cleaningFee))
      ? Number(nav.cleaningFee)
      : DEFAULT_CLEANING;

  const serviceFee =
    nav.serviceFee != null && Number.isFinite(Number(nav.serviceFee))
      ? Number(nav.serviceFee)
      : DEFAULT_SERVICE;

  const taxes =
    nav.taxes != null && Number.isFinite(Number(nav.taxes))
      ? Number(nav.taxes)
      : DEFAULT_TAXES;

  const checkIn =
    typeof nav.checkIn === "string" ? nav.checkIn : "";
  const checkOut =
    typeof nav.checkOut === "string" ? nav.checkOut : "";

  const roomTypeFromNav = nav.roomType;
  const roomType =
    typeof roomTypeFromNav === "string" && roomTypeFromNav.trim() !== ""
      ? roomTypeFromNav
      : hotelFromMock?.availableRooms?.[0] ?? "";

  const roomSubtotal = pricePerNight * nights;
  const totalFromNav = nav.total;
  const total =
    totalFromNav != null && Number.isFinite(Number(totalFromNav))
      ? Number(totalFromNav)
      : roomSubtotal + cleaningFee + serviceFee + taxes;

  return {
    hotel: hotelFromMock,
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
  const [guestFormValid, setGuestFormValid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const { hotelId } = useParams();
  const location = useLocation();
  /** Datos enviados desde BookingWidget al navegar a /checkout/:hotelId */
  const detailState = location.state;

  const hotelFromMock = mockHotels.find((h) => h.id === hotelId) ?? null;

  const summary = buildBookingSummaryData(detailState, hotelFromMock);

  const hotel = summary.hotel;

  return (
    <div className="checkout-page">
      <Navbar />
      <PageContainer>
        <div className="checkout">
          <nav className="checkout__breadcrumb" aria-label="Migas de pan">
            <Link className="checkout__breadcrumb-link" to="/">
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
                onValidityChange={setGuestFormValid}
              />
              <PaymentForm
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                cardNumber={cardNumber}
                onCardNumberChange={setCardNumber}
              />
            </div>
            <div className="checkout__aside">
              <BookingSummaryCard
                hotel={hotel}
                roomType={summary.roomType}
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
                paymentMethod={paymentMethod}
                cardNumber={cardNumber}
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default CheckoutPage;
