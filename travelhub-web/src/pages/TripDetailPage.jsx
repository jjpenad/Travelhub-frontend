import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import {
  IconCalendar,
  IconMapPin,
  IconStar,
  IconTicket,
  IconWallet,
} from "../components/home/HeroIcons";
import { findReservationBySlug } from "../bookings/bookingDetailSlug";
import {
  getLocalReservations,
  LOCAL_RESERVATIONS_KEY,
} from "../bookings/localReservations";
import {
  AUTH_EMAIL_KEY,
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  canAccessTravelerAccountRoutes,
} from "../auth/sessionAuth";
import {
  mockMyTripsReservations,
  USE_MOCK_MY_TRIPS,
} from "../data/mockReservations";
import { mockHotels } from "../data/mockHotels";
import { PATH_LOGIN, PATH_MY_TRIPS } from "../constants/routes";
import "./TripDetailPage.css";

function parseISODate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function stripCalendarDate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday() {
  return stripCalendarDate(new Date());
}

function isReservationPast(r) {
  const co = parseISODate(r.checkOut);
  if (!co) return false;
  return stripCalendarDate(co) < startOfToday();
}

function formatDateRangeShort(checkIn, checkOut) {
  const a = parseISODate(checkIn);
  const b = parseISODate(checkOut);
  if (!a || !b) return "—";
  const opts = { day: "numeric", month: "short", year: "numeric" };
  return `${a.toLocaleDateString("es-ES", opts)} – ${b.toLocaleDateString("es-ES", opts)}`;
}

function formatTimeLabel(t) {
  if (!t || typeof t !== "string") return "—";
  const [h, m] = t.split(":");
  const hr = Number(h);
  const min = Number(m);
  if (!Number.isFinite(hr) || !Number.isFinite(min)) return t;
  const d = new Date();
  d.setHours(hr, min, 0, 0);
  return d.toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit" });
}

function getTripUrgencyLabel(r, past) {
  if (past) return null;
  const ci = parseISODate(r.checkIn);
  const co = parseISODate(r.checkOut);
  if (!ci || !co) return null;
  const today = startOfToday();
  const ciDay = stripCalendarDate(ci);
  const coDay = stripCalendarDate(co);
  if (today > coDay) return null;
  if (today >= ciDay && today <= coDay) return "Estancia en curso";
  const msPerDay = 86400000;
  const days = Math.round((ciDay - today) / msPerDay);
  if (days <= 0) return "Check-in hoy";
  if (days === 1) return "Check-in ¡mañana!";
  return `Check-in en ${days} días`;
}

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toLocaleString("es-ES")}`;
}

function StarRow({ value }) {
  const v = Number(value);
  const full =
    Number.isFinite(v) ? Math.min(5, Math.max(0, Math.round(v))) : 0;
  return (
    <span className="trip-detail-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          className={
            "trip-detail-stars__icon" +
            (i <= full ? " trip-detail-stars__icon--fill" : "")
          }
        />
      ))}
    </span>
  );
}

function normalizeAmenityLabel(label) {
  return String(label)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u2011|-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapAmenityKind(label) {
  const n = normalizeAmenityLabel(label);
  if (n.includes("wifi") || n.includes("wi fi")) return "wifi";
  if (n.includes("piscina")) return "pool";
  if (n.includes("desayuno")) return "breakfast";
  if (n.includes("spa")) return "spa";
  if (
    n.includes("estacionamiento") ||
    n.includes("parking") ||
    n.includes("aparcamiento")
  ) {
    return "parking";
  }
  if (/\bbar\b/.test(n) || n.startsWith("bar ")) return "bar";
  if (n.includes("restaurante")) return "restaurant";
  if (n.includes("gimnasio") || /\bgym\b/.test(n)) return "gym";
  if (n.includes("traslado")) return "transfer";
  if (n.includes("concierge")) return "concierge";
  if (
    n.includes("servicio de habit") ||
    n.includes("room service") ||
    (n.includes("servicio") && n.includes("habitac"))
  ) {
    return "roomservice";
  }
  return "generic";
}

function AmenityGlyph({ kind }) {
  const cls = "trip-detail-included__glyph";
  switch (kind) {
    case "wifi":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"
          />
        </svg>
      );
    case "pool":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M2 17c2.08 1.26 4.65 1.65 7 1 2.35.65 4.92.26 7-1-2.08-1.26-4.65-1.65-7-1-2.35-.65-4.92-.26-7 1zm0-4c2.08 1.26 4.65 1.65 7 1 2.35.65 4.92.26 7-1-2.08-1.26-4.65-1.65-7-1-2.35-.65-4.92-.26-7 1zm22 4c-2.08 1.26-4.65 1.65-7 1-2.35.65-4.92.26-7-1 2.08-1.26 4.65-1.65 7-1 2.35-.65 4.92-.26 7 1zm0-4c-2.08 1.26-4.65 1.65-7 1-2.35.65-4.92.26-7-1 2.08-1.26 4.65-1.65 7-1 2.35-.65 4.92-.26 7 1zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
          />
        </svg>
      );
    case "breakfast":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18 3H6v10c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4V3zm-2 10c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V5h8v8zm4-8h-2v8h2V5zm0 10v2h-2v-2h2z"
          />
        </svg>
      );
    case "spa":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 3c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5zm-6 8c-.55 0-1 .45-1 1v1h14v-1c0-.55-.45-1-1-1H6zm-1 4v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7H5z"
          />
        </svg>
      );
    case "parking":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6 0-3.32-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z"
          />
        </svg>
      );
    case "bar":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 3l6 8v9H8v-4H6v4H4v-9L6 3zm2 0h8l-1 4H9L8 3zm-2 8h10v2H6v-2z"
          />
        </svg>
      );
    case "restaurant":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm8-1v8c0 2.21-1.79 4-4 4s-4-1.79-4-4V8c0-2.21 1.79-4 4-4s4 1.79 4 4z"
          />
        </svg>
      );
    case "gym":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2.29 6.29 3.71 4.86 2.29 3.43 3.71 2 5.14 3.43 6.57 2 8 3.43 9.43 2 10.86 3.43 12.29 2l1.43 1.43L12.71 4.29 14.12 2.88 15.54 4.29 17 5.71 15.57 7.14 17 8.57 15.57 10 17l-8.57 8.57L2 18.43 3.43 17 2 15.57 3.43 14.14 2 12.71 3.43 11.29 2 9.86 3.43 8.43 2 7 3.43 5.57 2 4.14 3.43 2.71 2.29 4.12 3.71 5.54 2.29 6.96 3.71 8.43 2 9.86 3.43 11.29 2l8.57 8.57L22 15.43 20.57 14z"
          />
        </svg>
      );
    case "transfer":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"
          />
        </svg>
      );
    case "concierge":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
          />
        </svg>
      );
    case "roomservice":
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M2 17h20v2H2v-2zm11.84-9.21c.1-.24.16-.51.16-.79 0-1.1-.9-2-2-2s-2 .9-2 2c0 .28.06.55.16.79-2.14.63-3.66 2.54-3.66 4.79h10c0-2.25-1.52-4.16-3.66-4.79zM4 19h16v2H4v-2z"
          />
        </svg>
      );
    default:
      return (
        <svg className={cls} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
          />
        </svg>
      );
  }
}

function mergeHotelMeta(hotel) {
  if (!hotel || typeof hotel !== "object" || hotel.id == null) return hotel;
  const full = mockHotels.find((h) => h.id === hotel.id);
  if (!full) return hotel;
  return {
    ...hotel,
    reviewsCount:
      typeof hotel.reviewsCount === "number"
        ? hotel.reviewsCount
        : full.reviewsCount,
    isRefundable:
      typeof hotel.isRefundable === "boolean"
        ? hotel.isRefundable
        : full.isRefundable,
    amenities: Array.isArray(hotel.amenities) ? hotel.amenities : full.amenities,
  };
}

function TripDetailPage() {
  const navigate = useNavigate();
  const { bookingSlug } = useParams();
  const [storedReservations, setStoredReservations] = useState(() =>
    getLocalReservations(),
  );

  const reservations = useMemo(() => {
    if (USE_MOCK_MY_TRIPS) {
      return [...mockMyTripsReservations, ...storedReservations];
    }
    return storedReservations;
  }, [storedReservations]);

  useEffect(() => {
    function refresh() {
      setStoredReservations(getLocalReservations());
    }
    refresh();
    function onStorage(e) {
      if (e.key === LOCAL_RESERVATIONS_KEY || e.key === null) {
        refresh();
      }
      if (
        e.key === AUTH_ROLE_KEY ||
        e.key === AUTH_EMAIL_KEY ||
        e.key === AUTH_TOKEN_KEY ||
        e.key === null
      ) {
        if (!canAccessTravelerAccountRoutes()) {
          navigate(PATH_LOGIN, { replace: true });
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  const reservation = useMemo(
    () => findReservationBySlug(bookingSlug ?? "", reservations),
    [bookingSlug, reservations],
  );

  if (!reservation) {
    return (
      <div className="trip-detail-page">
        <Navbar />
        <PageContainer>
          <div className="trip-detail trip-detail--narrow">
            <p className="trip-detail__not-found">
              No encontramos esta reserva o el enlace ya no es válido.
            </p>
            <Link className="trip-detail__back-cta" to={PATH_MY_TRIPS}>
              Volver a Mis viajes
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  const past = isReservationPast(reservation);
  const rawHotel =
    reservation.hotel && typeof reservation.hotel === "object"
      ? reservation.hotel
      : null;
  const hotel = mergeHotelMeta(rawHotel);
  const name = hotel?.name ?? "Alojamiento";
  const locationText =
    typeof hotel?.location === "string" ? hotel.location : "—";
  const imageSrc = typeof hotel?.image === "string" ? hotel.image : null;
  const ref = reservation.reference != null ? String(reservation.reference) : "";
  const checkIn = typeof reservation.checkIn === "string" ? reservation.checkIn : "";
  const checkOut =
    typeof reservation.checkOut === "string" ? reservation.checkOut : "";
  const roomType =
    typeof reservation.roomType === "string" && reservation.roomType.trim() !== ""
      ? reservation.roomType
      : null;
  const nights =
    typeof reservation.nights === "number" && Number.isFinite(reservation.nights)
      ? reservation.nights
      : null;
  const guests =
    typeof reservation.guests === "number" && Number.isFinite(reservation.guests)
      ? reservation.guests
      : 2;
  const paymentLabel =
    typeof reservation.paymentLabel === "string" &&
    reservation.paymentLabel.trim() !== ""
      ? reservation.paymentLabel
      : "Tarjeta";
  const rating =
    typeof hotel?.rating === "number" && !Number.isNaN(hotel.rating)
      ? hotel.rating
      : null;
  const checkInTime =
    typeof reservation.checkInTime === "string" ? reservation.checkInTime : "15:00";
  const checkOutTime =
    typeof reservation.checkOutTime === "string"
      ? reservation.checkOutTime
      : "11:00";
  const urgency = getTripUrgencyLabel(reservation, past);
  const toneClass = "trip-detail-hero__placeholder--tone-1";

  const amenitiesList = Array.isArray(hotel?.amenities)
    ? hotel.amenities.filter((x) => typeof x === "string" && x.trim() !== "")
    : [];

  const line = (key, label, value) =>
    value != null && value !== "" ? (
      <div key={key} className="trip-detail-payment__line">
        <span className="trip-detail-payment__line-label">{label}</span>
        <span className="trip-detail-payment__line-value">{value}</span>
      </div>
    ) : null;

  return (
    <div className="trip-detail-page">
      <Navbar />
      <PageContainer>
        <div className="trip-detail">
          <Link className="trip-detail__back" to={PATH_MY_TRIPS}>
            ← Volver a Mis viajes
          </Link>

          <header className="trip-detail__header">
            <div className="trip-detail__header-titles">
              <h1 className="trip-detail__title">Detalle del viaje</h1>
              <span className="trip-detail__badge trip-detail__badge--ok">
                ✓ Confirmada
              </span>
            </div>
            {urgency ? (
              <p className="trip-detail__urgency" role="status">
                {urgency}
              </p>
            ) : null}
          </header>

          <div className="trip-detail__columns">
            <article className="trip-detail__card" aria-label="Alojamiento y reserva">
              <div className="trip-detail-hero">
                {imageSrc ? (
                  <img
                    className="trip-detail-hero__img"
                    src={imageSrc}
                    alt={name}
                    width={1200}
                    height={480}
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div
                    className={`trip-detail-hero__placeholder ${toneClass}`}
                    role="img"
                    aria-label={name}
                  />
                )}
              </div>

              <div className="trip-detail__main">
                <h2 className="trip-detail__hotel-name">{name}</h2>

                <div className="trip-detail__meta-rows">
                  <p className="trip-detail__row trip-detail__row--muted">
                    <IconMapPin className="trip-detail__row-icon" aria-hidden="true" />
                    <span>
                      {locationText}
                      {roomType ? ` · ${roomType}` : ""}
                    </span>
                  </p>
                  <p className="trip-detail__row">
                    <IconCalendar className="trip-detail__row-icon" aria-hidden="true" />
                    <span>
                      {formatDateRangeShort(checkIn, checkOut)}
                      {nights != null
                        ? ` · ${nights} ${nights === 1 ? "noche" : "noches"}`
                        : ""}
                      {" · "}
                      {guests} {guests === 1 ? "huésped" : "huéspedes"}
                    </span>
                  </p>
                  <p className="trip-detail__row trip-detail__row--ref">
                    <IconTicket className="trip-detail__row-icon" aria-hidden="true" />
                    <span>Ref. #{ref || "—"}</span>
                  </p>
                </div>

                <p className="trip-detail__times">
                  Entrada desde las {formatTimeLabel(checkInTime)} · Salida hasta las{" "}
                  {formatTimeLabel(checkOutTime)}
                </p>

                {rating != null ? (
                  <div className="trip-detail__rating-block">
                    <StarRow value={rating} />
                    <span className="trip-detail__rating-num">{rating.toFixed(1)}</span>
                  </div>
                ) : null}

                {amenitiesList.length > 0 ? (
                  <section
                    className="trip-detail-included"
                    aria-labelledby="trip-detail-included-title"
                  >
                    <h3
                      id="trip-detail-included-title"
                      className="trip-detail-included__title"
                    >
                      Qué incluye tu estancia
                    </h3>
                    <ul className="trip-detail-included__chips" role="list">
                      {amenitiesList.map((label, i) => (
                        <li
                          key={`${label}-${i}`}
                          className="trip-detail-included__chip"
                        >
                          <AmenityGlyph kind={mapAmenityKind(label)} />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {hotel?.isRefundable ? (
                  <p className="trip-detail__note trip-detail__note--ok">
                    ✓ Cancelación gratuita según política del alojamiento
                  </p>
                ) : null}
              </div>
            </article>

            <aside
              className="trip-detail-payment"
              aria-label="Pago y desglose de la reserva"
            >
              <h3 className="trip-detail-payment__title">Pago</h3>
              <p className="trip-detail-payment__method">
                <IconWallet
                  className="trip-detail-payment__method-icon"
                  aria-hidden="true"
                />
                <span>
                  {fmtMoney(reservation.total)} pagado · {paymentLabel}
                </span>
              </p>

              <div className="trip-detail-payment__total">
                <p className="trip-detail-payment__total-label">Total de la reserva</p>
                <p className="trip-detail-payment__total-amount">
                  {fmtMoney(reservation.total)}
                </p>
              </div>

              {typeof reservation.pricePerNight === "number" &&
              Number.isFinite(reservation.pricePerNight) ? (
                <div
                  className="trip-detail-payment__breakdown"
                  aria-label="Desglose de precio"
                >
                  <h4 className="trip-detail-payment__breakdown-title">Desglose</h4>
                  {line(
                    "ppn",
                    "Precio por noche",
                    `${fmtMoney(reservation.pricePerNight)} × ${nights ?? "—"} noches`,
                  )}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default TripDetailPage;
