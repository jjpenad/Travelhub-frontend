import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { IconStar } from "../components/home/HeroIcons";
import {
  getLocalReservations,
  LOCAL_RESERVATIONS_KEY,
} from "../bookings/localReservations";
import {
  AUTH_EMAIL_KEY,
  AUTH_ROLE_KEY,
  isTravelerLoggedIn,
} from "../auth/sessionAuth";
import {
  mockMyTripsReservations,
  USE_MOCK_MY_TRIPS,
} from "../data/mockReservations";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import "./MyTripsPage.css";

function parseISODate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function stripCalendarDate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday() {
  const t = new Date();
  return stripCalendarDate(t);
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

function getTripCaption(r, past) {
  if (past) return "";
  const ci = parseISODate(r.checkIn);
  const co = parseISODate(r.checkOut);
  if (!ci || !co) return "";
  const today = startOfToday();
  const ciDay = stripCalendarDate(ci);
  const coDay = stripCalendarDate(co);
  if (today > coDay) return "";
  if (today >= ciDay && today <= coDay) return "En curso";
  const msPerDay = 86400000;
  const days = Math.round((ciDay - today) / msPerDay);
  if (days <= 0) return "En curso";
  if (days === 1) return "¡Mañana!";
  return `En ${days} días`;
}

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `$${Number(n).toLocaleString("es-ES")}`;
}

function fmtMoneyCompact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const num = Number(n);
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return fmtMoney(num);
}

function useTripStats(reservations) {
  return useMemo(() => {
    const year = new Date().getFullYear();
    let upcoming = 0;
    let past = 0;
    const destinations = new Set();
    let ratingSum = 0;
    let ratingCount = 0;
    let totalYear = 0;
    let bookingsThisYear = 0;

    for (const r of reservations) {
      if (isReservationPast(r)) past += 1;
      else upcoming += 1;

      const loc = r.hotel && typeof r.hotel.location === "string" ? r.hotel.location.trim() : "";
      if (loc) destinations.add(loc);

      const rt =
        r.hotel && typeof r.hotel.rating === "number" && !Number.isNaN(r.hotel.rating)
          ? r.hotel.rating
          : null;
      if (rt != null) {
        ratingSum += rt;
        ratingCount += 1;
      }

      const ci = parseISODate(r.checkIn);
      if (ci && ci.getFullYear() === year && typeof r.total === "number" && !Number.isNaN(r.total)) {
        totalYear += r.total;
        bookingsThisYear += 1;
      }
    }

    const avgRating = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null;
    const avgPerTrip =
      bookingsThisYear > 0 ? Math.round(totalYear / bookingsThisYear) : null;

    return {
      upcoming,
      past,
      distinctDestinations: destinations.size,
      avgRating,
      totalSpentYear: totalYear,
      year,
      bookingsThisYear,
      avgPerTrip,
    };
  }, [reservations]);
}

function IconSuitcase({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 18h4v-2h-4v2zm-7-12v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-4V3c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v1H5c-1.1 0-2 .9-2 2zm2 0h14v14H5V6zm8-2V4H11v2h2z"
      />
    </svg>
  );
}

function IconGlobe({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.45 2.1 1.17 2.83l1.07-1.07-1.24-1.24zm6.9-1.08c-.31-.11-.65-.17-1-.17h-1.5v-2h2.34l1.39-1.39C18.4 14.55 19 13.33 19 12c0-1.88-.73-3.59-1.91-4.89L15.5 9H14V7.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V9h-2V6.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V9H7.5L6.11 7.61C7.27 5.73 9.46 4.5 12 4.5c2.17 0 4.11.94 5.47 2.43L16.5 8H15v4h3.32l.91.91c.12.57.21 1.16.21 1.79 0 2.41-.97 4.59-2.53 6.17l-1.2-1.2z"
      />
    </svg>
  );
}

function IconMoneyBag({ className }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2h2.09c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.1c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
      />
    </svg>
  );
}

function IconMapPinMuted({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
      />
    </svg>
  );
}

function IconCalendarMuted({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"
      />
    </svg>
  );
}

function IconTicket({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-2 .89-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-4v12H4V6h16zm-2 6h-2v2h2v-2zm0-4h-2v2h2V8z"
      />
    </svg>
  );
}

function IconWallet({ className }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8h-10v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
      />
    </svg>
  );
}

function IconPlane({ className }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
    </svg>
  );
}

function IconSearchMuted({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M16 16l5 5" />
    </svg>
  );
}

function StarRow({ value }) {
  const v = Number(value);
  const full =
    Number.isFinite(v) ? Math.min(5, Math.max(0, Math.round(v))) : 0;
  return (
    <span className="my-trips-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          className={
            "my-trips-stars__icon" +
            (i <= full ? " my-trips-stars__icon--fill" : "")
          }
        />
      ))}
    </span>
  );
}

function TripCard({ r, index, hotelId }) {
  const past = isReservationPast(r);
  const hotel = r.hotel && typeof r.hotel === "object" ? r.hotel : null;
  const name = hotel?.name ?? "Alojamiento";
  const locationText =
    typeof hotel?.location === "string" ? hotel.location : "—";
  const imageSrc = typeof hotel?.image === "string" ? hotel.image : null;
  const ref = r.reference != null ? String(r.reference) : "";
  const checkIn = typeof r.checkIn === "string" ? r.checkIn : "";
  const checkOut = typeof r.checkOut === "string" ? r.checkOut : "";
  const roomType =
    typeof r.roomType === "string" && r.roomType.trim() !== ""
      ? r.roomType
      : null;
  const nights =
    typeof r.nights === "number" && Number.isFinite(r.nights)
      ? r.nights
      : null;
  const guests =
    typeof r.guests === "number" && Number.isFinite(r.guests) ? r.guests : 2;
  const paymentLabel =
    typeof r.paymentLabel === "string" && r.paymentLabel.trim() !== ""
      ? r.paymentLabel
      : "Tarjeta";
  const rating =
    typeof hotel?.rating === "number" && !Number.isNaN(hotel.rating)
      ? hotel.rating
      : null;
  const caption = getTripCaption(r, past);
  const toneClass = `my-trips-card__visual--tone-${(index % 3) + 1}`;

  return (
    <li className="my-trips-card">
      <div className={`my-trips-card__visual ${imageSrc ? "" : toneClass}`}>
        {imageSrc ? (
          <img
            className="my-trips-card__visual-img"
            src={imageSrc}
            alt={name}
            width={200}
            height={200}
            loading="lazy"
          />
        ) : (
          <div className="my-trips-card__visual-decor" aria-hidden="true" />
        )}
        <span className="my-trips-card__badge my-trips-card__badge--ok">
          ✓ Confirmada
        </span>
        {caption ? (
          <span className="my-trips-card__visual-caption">{caption}</span>
        ) : null}
      </div>

      <div className="my-trips-card__main">
        <h2 className="my-trips-card__title">{name}</h2>
        <p className="my-trips-card__row my-trips-card__row--muted">
          <IconMapPinMuted className="my-trips-card__row-icon" />
          <span>
            {locationText}
            {roomType ? ` · ${roomType}` : ""}
          </span>
        </p>
        <p className="my-trips-card__row">
          <IconCalendarMuted className="my-trips-card__row-icon" />
          <span>
            {formatDateRangeShort(checkIn, checkOut)}
            {nights != null
              ? ` · ${nights} ${nights === 1 ? "noche" : "noches"}`
              : ""}
            {" · "}
            {guests}{" "}
            {guests === 1 ? "huésped" : "huéspedes"}
          </span>
        </p>
        <p className="my-trips-card__row my-trips-card__row--ref">
          <IconTicket className="my-trips-card__row-icon my-trips-card__row-icon--ticket" />
          <span>#{ref || "—"}</span>
        </p>
        <p className="my-trips-card__row my-trips-card__row--payment">
          <IconWallet className="my-trips-card__row-icon my-trips-card__row-icon--wallet" />
          <span>
            {fmtMoney(r.total)} pagado · {paymentLabel}
          </span>
        </p>

        <div className="my-trips-card__actions">
          {hotelId ? (
            <Link
              className="my-trips-card__btn my-trips-card__btn--primary"
              to={`/hotel/${encodeURIComponent(hotelId)}`}
            >
              Ver detalles
              <span className="my-trips-card__btn-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ) : null}
          <button
            type="button"
            className="my-trips-card__btn my-trips-card__btn--ghost"
            disabled
            title="Próximamente"
          >
            QR check-in
          </button>
          <button
            type="button"
            className="my-trips-card__btn my-trips-card__btn--ghost"
            disabled
            title="Próximamente"
          >
            Modificar
          </button>
          <button
            type="button"
            className="my-trips-card__btn my-trips-card__btn--ghost"
            disabled
            title="Próximamente"
          >
            Calendario
          </button>
          <button
            type="button"
            className="my-trips-card__btn my-trips-card__btn--danger"
            disabled
            title="Próximamente"
          >
            Cancelar
          </button>
        </div>
      </div>

      <aside className="my-trips-card__aside" aria-label="Resumen de pago">
        <p className="my-trips-card__price">{fmtMoney(r.total)}</p>
        <p className="my-trips-card__price-label">Total pagado</p>
        {rating != null ? (
          <div className="my-trips-card__rating-block">
            <span className="my-trips-card__rating-num">{rating.toFixed(1)}</span>
            <StarRow value={rating} />
          </div>
        ) : null}
        <p className="my-trips-card__note my-trips-card__note--ok">
          ✓ Cancelación gratuita
        </p>
      </aside>
    </li>
  );
}

function MyTripsPage() {
  const navigate = useNavigate();
  const [storedReservations, setStoredReservations] = useState(() =>
    getLocalReservations(),
  );
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("checkin-asc");

  useEffect(() => {
    if (!isTravelerLoggedIn()) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

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
        e.key === null
      ) {
        if (!isTravelerLoggedIn()) {
          navigate(PATH_TRAVELERS_HOME, { replace: true });
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate]);

  const stats = useTripStats(reservations);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      const past = isReservationPast(r);
      if (tab === "upcoming" && past) return false;
      if (tab === "past" && !past) return false;
      if (!q) return true;
      const hotel = r.hotel && typeof r.hotel === "object" ? r.hotel : null;
      const name = (hotel?.name ?? "").toLowerCase();
      const loc = (typeof hotel?.location === "string" ? hotel.location : "").toLowerCase();
      const ref = (r.reference != null ? String(r.reference) : "").toLowerCase();
      return name.includes(q) || loc.includes(q) || ref.includes(q);
    });
  }, [reservations, tab, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const da = parseISODate(a.checkIn)?.getTime() ?? 0;
      const db = parseISODate(b.checkIn)?.getTime() ?? 0;
      return sort === "checkin-asc" ? da - db : db - da;
    });
    return arr;
  }, [filtered, sort]);

  const hasAny = reservations.length > 0;

  if (!isTravelerLoggedIn()) {
    return null;
  }

  return (
    <div className="my-trips-page">
      <Navbar />
      <PageContainer>
        <div className="my-trips">
          <header className="my-trips__header">
            <h1 className="my-trips__title">Mis viajes</h1>
            <p className="my-trips__lead">
              Administra y consulta todas tus reservas en un solo lugar.
            </p>
          </header>

          {hasAny ? (
            <>
              <section className="my-trips-stats" aria-label="Resumen">
                <article className="my-trips-stat">
                  <span className="my-trips-stat__icon-wrap" aria-hidden="true">
                    <IconSuitcase className="my-trips-stat__icon" />
                  </span>
                  <p className="my-trips-stat__value">{stats.upcoming}</p>
                  <p className="my-trips-stat__label">Próximos viajes</p>
                  <p className="my-trips-stat__meta my-trips-stat__meta--success">
                    {stats.bookingsThisYear > 0
                      ? `${stats.bookingsThisYear} en ${stats.year}`
                      : `Ninguno en ${stats.year}`}
                  </p>
                </article>
                <article className="my-trips-stat">
                  <span className="my-trips-stat__icon-wrap" aria-hidden="true">
                    <IconGlobe className="my-trips-stat__icon" />
                  </span>
                  <p className="my-trips-stat__value">{stats.distinctDestinations}</p>
                  <p className="my-trips-stat__label">Destinos distintos</p>
                  <p className="my-trips-stat__meta">En tus reservas guardadas</p>
                </article>
                <article className="my-trips-stat">
                  <span className="my-trips-stat__icon-wrap" aria-hidden="true">
                    <IconStar className="my-trips-stat__icon" />
                  </span>
                  <p className="my-trips-stat__value">
                    {stats.avgRating != null ? stats.avgRating.toFixed(1) : "—"}
                  </p>
                  <p className="my-trips-stat__label">Valoración media</p>
                  <p className="my-trips-stat__meta">Según alojamientos reservados</p>
                </article>
                <article className="my-trips-stat">
                  <span className="my-trips-stat__icon-wrap" aria-hidden="true">
                    <IconMoneyBag className="my-trips-stat__icon" />
                  </span>
                  <p className="my-trips-stat__value">
                    {fmtMoneyCompact(stats.totalSpentYear)}
                  </p>
                  <p className="my-trips-stat__label">Total gastado ({stats.year})</p>
                  <p className="my-trips-stat__meta">
                    {stats.avgPerTrip != null
                      ? `Prom. ${fmtMoney(stats.avgPerTrip)} / reserva`
                      : "Sin datos del año"}
                  </p>
                </article>
              </section>

              <div className="my-trips-toolbar">
                <div className="my-trips-tabs" role="tablist" aria-label="Filtrar por estado">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "upcoming"}
                    className={
                      "my-trips-tab" +
                      (tab === "upcoming" ? " my-trips-tab--active" : "")
                    }
                    onClick={() => {
                      setTab("upcoming");
                      setSort("checkin-asc");
                    }}
                  >
                    Próximos ({stats.upcoming})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "past"}
                    className={
                      "my-trips-tab" +
                      (tab === "past" ? " my-trips-tab--active" : "")
                    }
                    onClick={() => {
                      setTab("past");
                      setSort("checkin-desc");
                    }}
                  >
                    Pasados ({stats.past})
                  </button>
                </div>
                <div className="my-trips-toolbar__end">
                  <label className="my-trips-search">
                    <IconSearchMuted className="my-trips-search__icon" />
                    <span className="visually-hidden">Buscar en tus viajes</span>
                    <input
                      type="search"
                      className="my-trips-search__input"
                      placeholder="Buscar viajes…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  <div className="my-trips-sort-wrap">
                    <label htmlFor="my-trips-sort" className="visually-hidden">
                      Ordenar
                    </label>
                    <select
                      id="my-trips-sort"
                      className="my-trips-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="checkin-asc">Entrada: más próxima</option>
                      <option value="checkin-desc">Entrada: más reciente</option>
                    </select>
                  </div>
                </div>
              </div>

              {sorted.length === 0 ? (
                <p className="my-trips__empty-list">
                  No hay reservas en esta pestaña con los filtros actuales.
                </p>
              ) : (
                <ul className="my-trips__list" aria-label="Reservas">
                  {sorted.map((r, index) => {
                    const hotel = r.hotel && typeof r.hotel === "object" ? r.hotel : null;
                    const hotelId =
                      hotel?.id != null && String(hotel.id).trim() !== ""
                        ? String(hotel.id)
                        : "";
                    const ref = r.reference != null ? String(r.reference) : "";
                    const key = `${ref}-${r.savedAt ?? index}`;
                    return (
                      <TripCard
                        key={key}
                        r={r}
                        index={index}
                        hotelId={hotelId}
                      />
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <div className="my-trips__empty">
              <p className="my-trips__empty-text">
                Aún no tienes reservas guardadas. Cuando completes un pago, la
                verás en esta lista.
              </p>
              <Link className="my-trips__empty-cta" to={PATH_TRAVELERS_HOME}>
                Explorar alojamientos
              </Link>
            </div>
          )}

          <section className="my-trips-cta" aria-labelledby="my-trips-cta-title">
            <IconPlane className="my-trips-cta__plane" aria-hidden="true" />
            <div className="my-trips-cta__text">
              <h2 id="my-trips-cta-title" className="my-trips-cta__title">
                ¿Listo para tu próxima aventura?
              </h2>
              <p className="my-trips-cta__lead">
                Miles de alojamientos te esperan: encuentra tu estancia ideal.
              </p>
            </div>
            <Link className="my-trips-cta__btn" to={PATH_TRAVELERS_HOME}>
              Explorar destinos
              <span aria-hidden="true"> →</span>
            </Link>
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

export default MyTripsPage;
