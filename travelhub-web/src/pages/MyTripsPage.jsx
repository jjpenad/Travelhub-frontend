import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import {
  IconCalendar,
  IconMapPin,
  IconStar,
  IconTicket,
  IconWallet,
} from "../components/home/HeroIcons";
import { encodeBookingDetailSlug } from "../bookings/bookingDetailSlug";
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
  listHotels,
  listUserReservations,
  mapUserReservationDto,
} from "../services/api";
import {
  mockMyTripsReservations,
  USE_MOCK_MY_TRIPS,
} from "../data/mockReservations";
import {
  PATH_LOGIN,
  PATH_MY_TRIPS_RESERVATION,
  PATH_TRAVELERS_HOME,
} from "../constants/routes";
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

function useUpcomingPastCounts(reservations) {
  return useMemo(() => {
    let upcoming = 0;
    let past = 0;
    for (const r of reservations) {
      if (isReservationPast(r)) past += 1;
      else upcoming += 1;
    }
    return { upcoming, past };
  }, [reservations]);
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

function TripCard({ r, index }) {
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
          <IconMapPin className="my-trips-card__row-icon" aria-hidden="true" />
          <span>
            {locationText}
            {roomType ? ` · ${roomType}` : ""}
          </span>
        </p>
        <p className="my-trips-card__row">
          <IconCalendar className="my-trips-card__row-icon" aria-hidden="true" />
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
          <IconTicket className="my-trips-card__row-icon" aria-hidden="true" />
          <span>#{ref || "—"}</span>
        </p>
        <p className="my-trips-card__row my-trips-card__row--payment">
          <IconWallet className="my-trips-card__row-icon" aria-hidden="true" />
          <span>
            {fmtMoney(r.total)} pagado · {paymentLabel}
          </span>
        </p>

        <div className="my-trips-card__actions">
          <Link
            className="my-trips-card__btn my-trips-card__btn--primary"
            to={`${PATH_MY_TRIPS_RESERVATION}/${encodeBookingDetailSlug(r)}`}
          >
            Ver detalles
            <span className="my-trips-card__btn-arrow" aria-hidden="true">
              →
            </span>
          </Link>
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
  const [remoteReservations, setRemoteReservations] = useState([]);
  const [tab, setTab] = useState("upcoming");
  const [sort, setSort] = useState("checkin-asc");

  /**
   * Las reservas backend son la fuente autoritativa para usuarios
   * autenticados; las locales pueden tener entradas que aún no han
   * sincronizado con el servidor (offline / fallo intermitente).
   * Mergemos por id evitando duplicados — el backend gana cuando coincide.
   */
  const reservations = useMemo(() => {
    const remoteIds = new Set(
      remoteReservations.map((r) => r.id).filter(Boolean),
    );
    const localOnly = storedReservations.filter(
      (r) => !r.id || !remoteIds.has(r.id),
    );
    const base = [...remoteReservations, ...localOnly];
    if (USE_MOCK_MY_TRIPS) {
      return [...mockMyTripsReservations, ...base];
    }
    return base;
  }, [storedReservations, remoteReservations]);

  useEffect(() => {
    function refresh() {
      setStoredReservations(getLocalReservations());
    }
    refresh();
    function onStorage(e) {
      // Cualquier cambio en LOCAL_RESERVATIONS_KEY o sus variantes
      // segmentadas por usuario invalida el snapshot local.
      if (
        e.key == null ||
        (typeof e.key === "string" && e.key.startsWith(LOCAL_RESERVATIONS_KEY))
      ) {
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

  // Trae las reservas desde el backend al montar (y cuando vuelve la
  // pestaña al foco). Mismo contrato que el `OnResumeEffect` de Android:
  // la sesión autenticada es la fuente de verdad. Si la red falla, los
  // datos locales siguen visibles vía `storedReservations`.
  useEffect(() => {
    if (!canAccessTravelerAccountRoutes()) return;
    let cancelled = false;

    async function loadFromBackend() {
      try {
        const [hotels, page] = await Promise.all([
          listHotels().catch(() => []),
          listUserReservations({ limit: 50, offset: 0 }),
        ]);
        if (cancelled) return;
        const hotelsById = new Map(hotels.map((h) => [h.id, h]));
        const mapped = page.items.map((dto) =>
          mapUserReservationDto(dto, hotelsById),
        );
        setRemoteReservations(mapped);
      } catch {
        // Silenciamos: si fallamos online, dejamos visible lo local.
        if (!cancelled) setRemoteReservations([]);
      }
    }

    loadFromBackend();
    function onFocus() {
      loadFromBackend();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const { upcoming: upcomingCount, past: pastCount } =
    useUpcomingPastCounts(reservations);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const past = isReservationPast(r);
      if (tab === "upcoming" && past) return false;
      if (tab === "past" && !past) return false;
      return true;
    });
  }, [reservations, tab]);

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
                    Próximos ({upcomingCount})
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
                    Pasados ({pastCount})
                  </button>
                </div>
                <div className="my-trips-toolbar__end">
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
                  No hay reservas en esta pestaña.
                </p>
              ) : (
                <ul className="my-trips__list" aria-label="Reservas">
                  {sorted.map((r, index) => {
                    const ref = r.reference != null ? String(r.reference) : "";
                    const key = `${ref}-${r.savedAt ?? index}`;
                    return <TripCard key={key} r={r} index={index} />;
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
