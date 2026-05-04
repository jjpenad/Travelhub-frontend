import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useSearchParams } from "react-router-dom";
import BookingWidget from "../components/hotel/BookingWidget";
import GuestReviews from "../components/hotel/GuestReviews";
import HotelDescription from "../components/hotel/HotelDescription";
import HotelGallery from "../components/hotel/HotelGallery";
import HotelHeader from "../components/hotel/HotelHeader";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { getHotelAvailability } from "../services/api";
import { useTravelerDisplayCurrency } from "../context/TravelerDisplayCurrencyContext";
import { parseBookingFromSearchParams } from "../utils/searchUrlParams";
import "./HotelDetailPage.css";

const showGuestReviewsSection = false;

function HotelDetailContent({ hotel, bookingFromSearch, searchSuffix }) {
  const { t } = useTranslation();
  const { formatPaymentInDisplayCurrency } = useTravelerDisplayCurrency();
  const roomObjects = hotel.availableRoomObjects || [];
  const roomNames = roomObjects.length > 0
    ? roomObjects.map((r) => r.name)
    : hotel.availableRooms || [];

  const [selectedRoom, setSelectedRoom] = useState(() => roomNames[0] ?? "");

  const selectedRoomObj = roomObjects.find((r) => r.name === selectedRoom);
  const pricePerNight = selectedRoomObj?.pricePerNight ?? hotel.price ?? 0;

  return (
    <div className="hotel-detail-page">
      <Navbar />
      <PageContainer>
        <div className="hotel-detail" data-selected-room={selectedRoom}>
          <nav className="hotel-detail__breadcrumb" aria-label={t("hotelDetail.breadcrumbAria")}>
            <ol className="hotel-detail__breadcrumb-list">
              <li className="hotel-detail__breadcrumb-item">
                <Link className="hotel-detail__breadcrumb-link" to={PATH_TRAVELERS_HOME}>
                  {t("hotelDetail.home")}
                </Link>
              </li>
              <li className="hotel-detail__breadcrumb-item">
                <Link className="hotel-detail__breadcrumb-link" to={`/search${searchSuffix}`}>
                  {hotel.city || t("hotelDetail.search")}
                </Link>
              </li>
              <li className="hotel-detail__breadcrumb-item hotel-detail__breadcrumb-item--current" aria-current="page">
                {hotel.name}
              </li>
            </ol>
          </nav>

          <div className="hotel-detail__layout">
            <div className="hotel-detail__main-content">
              <div className="hotel-detail__main-stack">
                {hotel.image && (
                  <div className="hotel-detail__gallery">
                    <HotelGallery hotel={hotel} totalPhotos={48} />
                  </div>
                )}
                <HotelHeader hotel={hotel} />
                <HotelDescription hotel={hotel} />

                {roomObjects.length > 0 && (
                  <section className="hotel-detail__rooms">
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
                      {t("hotelDetail.roomsHeading")}
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {roomObjects.map((room) => (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoom(room.name)}
                          style={{
                            border: selectedRoom === room.name ? "2px solid #6c63ff" : "1px solid #e5e7eb",
                            borderRadius: "12px", padding: "1rem", cursor: "pointer",
                            background: selectedRoom === room.name ? "#f5f3ff" : "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong>{room.name}</strong>
                            <span style={{ color: "#6c63ff", fontWeight: 700 }}>
                              {t("hotelDetail.perNightShort", {
                                price: formatPaymentInDisplayCurrency(
                                  room.pricePerNight,
                                  room.currencyCode ?? "COP",
                                ),
                              })}
                            </span>
                          </div>
                          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0.25rem 0" }}>{room.description}</p>
                          <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                            <span>{t("hotelDetail.maxGuests", { count: room.maxCapacity })}</span>
                            <span>{room.bedType}</span>
                            {room.sizeSqm > 0 && <span>{room.sizeSqm} m²</span>}
                          </div>
                          {room.amenities.length > 0 && (
                            <p style={{ fontSize: "0.8rem", color: "#6c63ff", marginTop: "0.25rem" }}>
                              {room.amenities.join(" · ")}
                            </p>
                          )}
                          {room.totalPrice > 0 && (
                            <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.25rem" }}>
                              {t("hotelDetail.totalLabel", {
                                amount: formatPaymentInDisplayCurrency(
                                  room.totalPrice,
                                  room.currencyCode ?? "COP",
                                ),
                              })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {roomObjects.length === 0 && (
                  <div style={{ padding: "1.5rem", background: "#fff7ed", borderRadius: "12px", textAlign: "center" }}>
                    <p style={{ color: "#c2410c", fontWeight: 500 }}>{t("hotelDetail.noRoomsForDates")}</p>
                  </div>
                )}

                {showGuestReviewsSection && <GuestReviews hotel={hotel} />}
              </div>
            </div>

            <aside className="hotel-detail__booking-sidebar" aria-label={t("hotelDetail.bookingAsideAria")}>
              <BookingWidget
                hotel={hotel}
                pricePerNight={pricePerNight}
                nights={bookingFromSearch.nights}
                defaultCheckIn={bookingFromSearch.checkIn}
                defaultCheckOut={bookingFromSearch.checkOut}
                defaultGuests={bookingFromSearch.guestsStr}
                selectedRoom={selectedRoom}
                onSelectedRoomChange={setSelectedRoom}
                availableRooms={roomNames}
                roomTypeId={selectedRoomObj?.id || ""}
              />
            </aside>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

function HotelDetailPage() {
  const { t } = useTranslation();
  const { hotelId: hotelIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const hotelId = hotelIdParam ? decodeURIComponent(hotelIdParam) : "";

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  const [state, dispatch] = useReducer(
    (prev, action) => {
      switch (action.type) {
        case "loading": return { hotel: null, loading: true, error: null };
        case "success": return { hotel: action.hotel, loading: false, error: null };
        case "error": return { hotel: null, loading: false, error: action.error };
        default: return prev;
      }
    },
    { hotel: null, loading: true, error: null },
  );

  const searchSuffix = useMemo(() => {
    const s = searchParams.toString();
    return s ? `?${s}` : "";
  }, [searchParams]);

  const bookingFromSearch = useMemo(
    () => parseBookingFromSearchParams(searchParams),
    [searchParams],
  );

  const fetchHotel = useCallback(async (id, ci, co, signal) => {
    if (!id) return;
    dispatch({ type: "loading" });
    if (!ci || !co) {
      dispatch({ type: "error", error: t("hotelDetail.datesRequired") });
      return;
    }
    try {
      const data = await getHotelAvailability(id, ci, co);
      if (!signal.aborted) dispatch({ type: "success", hotel: data });
    } catch (err) {
      if (!signal.aborted) dispatch({ type: "error", error: err.message });
    }
  }, [t]);

  useEffect(() => {
    const ac = new AbortController();
    fetchHotel(hotelId, checkIn, checkOut, ac.signal);
    return () => ac.abort();
  }, [hotelId, checkIn, checkOut, fetchHotel]);

  const { hotel, loading, error } = state;

  if (loading) {
    return (
      <div className="hotel-detail-page"><Navbar /><PageContainer>
        <p style={{ padding: "3rem", textAlign: "center" }}>{t("hotelDetail.loadingHotel")}</p>
      </PageContainer></div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-detail-page"><Navbar /><PageContainer>
        <div className="hotel-detail hotel-detail--not-found">
          <h1 className="hotel-detail__not-found-title">{error || "Hotel no encontrado"}</h1>
          <p className="hotel-detail__not-found-text">{t("hotelDetail.tryAgainSearch")}</p>
          <Link className="hotel-detail__not-found-link" to={`/search${searchSuffix}`}>{t("hotelDetail.backResults")}</Link>
        </div>
      </PageContainer></div>
    );
  }

  return <HotelDetailContent key={hotel.id} hotel={hotel} bookingFromSearch={bookingFromSearch} searchSuffix={searchSuffix} />;
}

export default HotelDetailPage;
