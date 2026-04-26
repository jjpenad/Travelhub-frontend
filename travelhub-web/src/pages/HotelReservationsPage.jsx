import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AUTH_EMAIL_KEY,
  AUTH_ROLE_KEY,
  AUTH_USER_ID_KEY,
  clearSessionUser,
  FALLBACK_HOTEL_USER_ID,
  getSessionEmail,
  getSessionRole,
  getSessionUserId,
  ROLE_HOTEL,
} from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { listReservationsByUserId } from "../services/api";
import "./HotelReservationsPage.css";

function parseISODate(iso) {
  if (!iso || typeof iso !== "string") return null;
  // Fecha calendario YYYY-MM-DD o prefijo de ISO-8601 con hora (p. ej. created_at)
  const datePart = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const d = new Date(`${datePart}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function stripCalendarDate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday() {
  return stripCalendarDate(new Date());
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtMoney(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  const n = Number(amount);
  const prefix = currency === "COP" || currency === "USD" ? "$" : "";
  return `${prefix}${n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function toText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return fallback;
}

/** Acorta un UUID para etiquetas de tabla. */
function shortRef(id) {
  const s = toText(id, "").trim();
  if (!s) return "—";
  if (s.length <= 12) return s;
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function computeDisplayStatus(r) {
  const bookingStatus = toText(r?.bookingStatus, "");
  if (bookingStatus === "canceled") return "Cancelada";
  if (bookingStatus === "pending") return "Pendiente";
  if (bookingStatus !== "confirmed") return "—";
  const ci = parseISODate(r?.stay?.checkIn);
  if (!ci) return "Confirmada";
  const today = startOfToday();
  if (sameDay(stripCalendarDate(ci), today)) return "Confirmada";
  if (stripCalendarDate(ci) > today) return "Próxima";
  return "Confirmada";
}

function statusBadgeTone(label) {
  switch (label) {
    case "Confirmada":
      return "green";
    case "Pendiente":
      return "yellow";
    case "Cancelada":
      return "red";
    case "Próxima":
      return "blue";
    default:
      return "blue";
  }
}

function paymentTone(status) {
  switch (status) {
    case "paid":
      return "green";
    case "pending":
      return "yellow";
    case "refunded":
      return "red";
    default:
      return "blue";
  }
}

function nightsBetween(checkIn, checkOut) {
  const a = parseISODate(checkIn);
  const b = parseISODate(checkOut);
  if (!a || !b) return 0;
  const ms = stripCalendarDate(b).getTime() - stripCalendarDate(a).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function normalizeApiStatus(s) {
  const raw = toText(s, "").toLowerCase();
  if (raw === "cancelled") return "canceled";
  if (raw === "canceled") return "canceled";
  if (raw === "pending") return "pending";
  if (raw === "confirmed") return "confirmed";
  if (raw === "completed") return "confirmed";
  return raw;
}

function paymentFromStatus(status) {
  switch (status) {
    case "pending":
      return { status: "pending", cashflowLabel: "Pago pend." };
    case "canceled":
      return { status: "refunded", cashflowLabel: "Reembolsado" };
    case "confirmed":
      return { status: "paid", cashflowLabel: "Pagado" };
    default:
      return { status: "pending", cashflowLabel: "Pago pend." };
  }
}

/**
 * API GET /reservations/user/{id}: items[] con
 * id, user_id, hotel_id, room_type_id, cart_id, check_in, check_out, guests,
 * base_price, taxes, discounts, total_price, currency_code, status,
 * cancellation_policy, special_requests, confirmation_code, created_at, updated_at
 */
function mapApiReservationToUi(dto) {
  if (!dto || typeof dto !== "object") return null;
  const bookingStatus = normalizeApiStatus(dto.status);
  const payment = paymentFromStatus(bookingStatus);
  const checkIn = toText(dto.check_in, "");
  const checkOut = toText(dto.check_out, "");
  const nights = nightsBetween(checkIn, checkOut);
  const userId = toText(dto.user_id, "");
  const hotelId = toText(dto.hotel_id, "");
  const roomTypeId = toText(dto.room_type_id, "");
  const confirmation = toText(dto.confirmation_code, "");

  return {
    id: toText(dto.id, confirmation || crypto.randomUUID()),
    bookingNumber: confirmation || toText(dto.id, "—"),
    userId: userId || null,
    hotelId: hotelId || null,
    roomTypeId: roomTypeId || null,
    cartId: dto.cart_id == null ? null : toText(dto.cart_id, ""),
    basePrice: Number(toText(dto.base_price, "0")) || 0,
    taxes: Number(toText(dto.taxes, "0")) || 0,
    discounts: Number(toText(dto.discounts, "0")) || 0,
    cancellationPolicy: toText(dto.cancellation_policy, ""),
    specialRequests: dto.special_requests == null ? "" : toText(dto.special_requests, ""),
    guest: {
      fullName: userId ? `Usuario ${shortRef(userId)}` : "Huésped",
      email: "—",
      phone: "—",
    },
    room: {
      number: "—",
      hotelRef: hotelId ? `Hotel ${shortRef(hotelId)}` : "",
      type: roomTypeId ? `Tipo ${shortRef(roomTypeId)}` : "—",
      beds: "—",
    },
    stay: {
      checkIn,
      checkOut,
      nights,
    },
    guestsCount: Number(dto.guests ?? 0) || 0,
    total: {
      amount: Number(toText(dto.total_price, "0")) || 0,
      currency: toText(dto.currency_code, "USD"),
      cashflowLabel: payment.cashflowLabel,
      status: payment.status,
    },
    bookingStatus,
    createdAt: toText(dto.created_at, ""),
    updatedAt: toText(dto.updated_at, ""),
  };
}

function fmtDateShort(iso) {
  const d = parseISODate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function initialsFromEmail(email) {
  const e = toText(email, "").trim();
  if (!e) return "U";
  const first = e[0]?.toUpperCase();
  return first || "U";
}

function PortalSidebar() {
  const active = "bookings";
  const items = [
    { key: "dashboard", label: "Dashboard", href: "/portal-hoteles" },
    { key: "reports", label: "Reportes", href: "/portal-hoteles" },
    { key: "notifications", label: "Notificaciones", href: "/portal-hoteles" },
    { key: "rates", label: "Tarifas", href: "/portal-hoteles" },
    { key: "bookings", label: "Gestionar Reservas", href: "/portal-hoteles/reservas" },
    { key: "rooms", label: "Habitaciones", href: "/portal-hoteles" },
    { key: "guests", label: "Huéspedes", href: "/portal-hoteles" },
  ];

  return (
    <aside className="hotel-shell__sidebar" aria-label="Navegación del portal hotelero">
      <div className="hotel-shell__brand">
        <div className="hotel-shell__brand-mark" aria-hidden="true">
          TH
        </div>
        <div className="hotel-shell__brand-text">
          <strong>TravelHub</strong>
          <span>Portal hotelero</span>
        </div>
      </div>

      <nav className="hotel-shell__nav" aria-label="Secciones">
        {items.map((it) => (
          <Link
            key={it.key}
            to={it.href}
            className={
              "hotel-shell__nav-item" +
              (active === it.key ? " hotel-shell__nav-item--active" : "")
            }
          >
            {it.label}
          </Link>
        ))}
      </nav>

      <div className="hotel-shell__sidebar-footer">
        <button
          type="button"
          className="hotel-shell__logout"
          onClick={() => clearSessionUser()}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function ReservationRow({
  r,
  selectedId,
  setSelectedId,
  handleViewDetail,
  handleCheckIn,
  handleConfirm,
}) {
  const id = toText(r?.id, "");
  const selected = id && selectedId === id;
  const bookingNumber = toText(r?.bookingNumber, "—");
  const createdAt = toText(r?.createdAt, "");
  const guestName = toText(r?.guest?.fullName, "—");
  const guestEmail = toText(r?.guest?.email, "—");
  const guestPhone = toText(r?.guest?.phone, "—");
  const roomNumber = toText(r?.room?.number, "—");
  const roomHotelRef = toText(r?.room?.hotelRef, "");
  const roomType = toText(r?.room?.type, "—");
  const beds = toText(r?.room?.beds, "—");
  const checkIn = toText(r?.stay?.checkIn, "");
  const checkOut = toText(r?.stay?.checkOut, "");
  const nights = Number(r?.stay?.nights ?? 0) || 0;
  const guestsCount = Number(r?.guestsCount ?? 0) || 0;
  const amount = r?.total?.amount;
  const currency = toText(r?.total?.currency, "COP");
  const cashflowLabel = toText(r?.total?.cashflowLabel, "—");
  const payStatus = toText(r?.total?.status, "");
  const bookingStatus = toText(r?.bookingStatus, "");
  const displayStatus = computeDisplayStatus(r);
  const displayTone = statusBadgeTone(displayStatus);
  const stripeTone = displayTone;

  const ci = parseISODate(checkIn);
  const showCheckIn =
    bookingStatus === "confirmed" &&
    ci &&
    sameDay(stripCalendarDate(ci), startOfToday());

  const nightsLabel = (() => {
    if (!nights) return "—";
    const unit = nights === 1 ? "noche" : "noches";
    return `${nights} ${unit}`;
  })();
  const avatarLetter = guestName.trim() ? guestName.trim()[0].toUpperCase() : "H";

  return (
    <tr
      key={id || bookingNumber}
      className={
        "hotel-res__row hotel-res__row--portal" +
        (selected ? " hotel-res__row--selected" : "")
      }
      data-tone={stripeTone}
      onClick={() => setSelectedId((cur) => (cur === id ? "" : id))}
    >
      <td className="hotel-res__cell-check">
        <span
          className={"hotel-res__check" + (selected ? " hotel-res__check--on" : "")}
          aria-hidden="true"
        >
          {selected ? "✓" : ""}
        </span>
      </td>
      <td className="hotel-res__cell-resnum">
        <strong>{bookingNumber}</strong>
        <span className="hotel-res__sub">{createdAt ? fmtDateShort(createdAt) : "—"}</span>
      </td>
      <td className="hotel-res__cell-guest">
        <div className="hotel-res__guest">
          <span className="hotel-res__guest-avatar" aria-hidden="true">
            {avatarLetter}
          </span>
          <div>
            <strong>{guestName}</strong>
            <span className="hotel-res__sub">{guestEmail}</span>
            <span className="hotel-res__sub">{guestPhone}</span>
          </div>
        </div>
      </td>
      <td>
        <strong>{roomHotelRef || `Hab. ${roomNumber}`}</strong>
        <span className="hotel-res__sub">{roomType}</span>
        <span className="hotel-res__sub">{beds}</span>
      </td>
      <td>
        <strong>
          {fmtDateShort(checkIn)} → {fmtDateShort(checkOut)}
        </strong>
        <span className="hotel-res__sub">{nightsLabel}</span>
      </td>
      <td>{guestsCount ? `${guestsCount} huéspedes` : "—"}</td>
      <td>
        <strong>{fmtMoney(amount, currency)}</strong>
        <span className="hotel-res__sub">{cashflowLabel}</span>
      </td>
      <td>
        <span className={`hotel-res-badge hotel-res-badge--${displayTone}`}>{displayStatus}</span>
        <span className="visually-hidden">{payStatus}</span>
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <div className="hotel-res__actions hotel-res__actions--portal">
          <button type="button" className="hotel-res__link" onClick={() => handleViewDetail(id)}>
            Ver detalle
          </button>
          {showCheckIn ? (
            <button
              type="button"
              className="hotel-res__link hotel-res__link--muted"
              onClick={() => handleCheckIn(id)}
            >
              Check-in
            </button>
          ) : null}
          {bookingStatus === "pending" ? (
            <button
              type="button"
              className="hotel-res__link hotel-res__link--success"
              onClick={() => handleConfirm(id)}
            >
              Confirmar
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

ReservationRow.propTypes = {
  r: PropTypes.object,
  selectedId: PropTypes.string,
  setSelectedId: PropTypes.func,
  handleViewDetail: PropTypes.func,
  handleCheckIn: PropTypes.func,
  handleConfirm: PropTypes.func,
};

function HotelReservationsPage() {
  const navigate = useNavigate();
  const [sessionVersion, setSessionVersion] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [pill, setPill] = useState("all"); // all | confirmed | pending | canceled
  const [sort, setSort] = useState("recent"); // recent | checkin-asc
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const sessionEmail = getSessionEmail() ?? "";

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate, sessionVersion]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const userId = (getSessionUserId() || FALLBACK_HOTEL_USER_ID).trim();
    async function run() {
      setLoading(true);
      setLoadError("");
      try {
        // Por usuario: GET /reservations/user/{userId} — encadenar páginas para totales.
        const first = await listReservationsByUserId(userId, { limit: 100, offset: 0 });
        const items = Array.isArray(first?.items) ? first.items : [];
        const total = Number(first?.total ?? items.length);
        const limit = Math.min(100, Number(first?.limit ?? 100) || 100);
        const all = [...items];
        for (let offset = limit; offset < total && all.length < 5000; offset += limit) {
          const page = await listReservationsByUserId(userId, { limit, offset });
          const pageItems = Array.isArray(page?.items) ? page.items : [];
          all.push(...pageItems);
          if (pageItems.length === 0) break;
        }
        if (cancelled) return;
        const mapped = all.map(mapApiReservationToUi).filter(Boolean);
        setReservations(mapped);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : String(e));
        setReservations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionVersion]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === AUTH_ROLE_KEY || e.key === AUTH_EMAIL_KEY || e.key === AUTH_USER_ID_KEY || e.key === null) {
        setSessionVersion((v) => v + 1);
      }
    }
    globalThis.addEventListener("storage", onStorage);
    return () => globalThis.removeEventListener("storage", onStorage);
  }, []);

  const counts = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let canceled = 0;
    for (const r of reservations) {
      const s = toText(r?.bookingStatus, "");
      if (s === "confirmed") confirmed += 1;
      else if (s === "pending") pending += 1;
      else if (s === "canceled") canceled += 1;
    }
    return { all: reservations.length, confirmed, pending, canceled };
  }, [reservations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      if (!r || typeof r !== "object") return false;

      const bookingStatus = toText(r?.bookingStatus, "");
      if (pill !== "all" && bookingStatus !== pill) return false;

      if (!q) return true;
      const number = toText(r?.bookingNumber, "").toLowerCase();
      const guestName = toText(r?.guest?.fullName, "").toLowerCase();
      return number.includes(q) || guestName.includes(q);
    });
  }, [reservations, pill, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sort === "checkin-asc") {
        const da = parseISODate(a?.stay?.checkIn)?.getTime() ?? 0;
        const db = parseISODate(b?.stay?.checkIn)?.getTime() ?? 0;
        return da - db;
      }
      const da = new Date(toText(a?.createdAt, "0")).getTime() || 0;
      const db = new Date(toText(b?.createdAt, "0")).getTime() || 0;
      return db - da;
    });
    return arr;
  }, [filtered, sort]);

  const pageSize = 6;
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(total, startIdx + pageSize);
  const pageSlice = sorted.slice(startIdx, endIdx);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  useEffect(() => {
    setPage(1);
  }, [pill, query, sort]);

  function handleViewDetail(id) {
    navigate(`/portal-hoteles/reservas/${encodeURIComponent(String(id))}`);
  }

  function handleConfirm(id) {
    // Integración backend pendiente: confirmar reserva en API.
    setReservations((cur) =>
      cur.map((r) => {
        if (!r || String(r.id ?? "") !== String(id)) return r;
        return {
          ...r,
          bookingStatus: "confirmed",
          total: { ...r.total, cashflowLabel: "Pagado", status: "paid" },
        };
      }),
    );
  }

  function handleCheckIn(id) {
    // En una integración real, aquí se dispara el flujo de check-in.
    setSelectedId(String(id));
  }

  function handleLogout() {
    clearSessionUser();
    setSessionVersion((v) => v + 1);
    navigate(PATH_TRAVELERS_HOME, { replace: true });
  }

  const pages = useMemo(() => {
    // Layout compacto estilo screenshot: flechas + 1..N con límite
    const max = totalPages;
    const cur = safePage;
    const windowSize = 5;
    const start = Math.max(1, Math.min(cur - 1, max - windowSize + 1));
    const end = Math.min(max, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safePage, totalPages]);

  const tableContent = useMemo(() => {
    if (loading) {
      return <div className="hotel-res__empty">Cargando reservas…</div>;
    }
    if (loadError) {
      return (
        <div className="hotel-res__empty">
          No se pudieron cargar las reservas desde el API.
          <div className="hotel-res__sub" style={{ marginTop: "0.4rem" }}>
            {loadError}
          </div>
        </div>
      );
    }
    if (total === 0) {
      return (
        <div className="hotel-res__empty">No hay reservas que coincidan con los filtros.</div>
      );
    }

    return (
      <table className="hotel-res__table hotel-res__table--portal">
        <thead>
          <tr>
            <th>
              <span className="visually-hidden">Seleccionar</span>
            </th>
            <th>Nº reserva</th>
            <th>Huésped</th>
            <th>Habitación</th>
            <th>Fechas</th>
            <th>Huéspedes</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pageSlice.map((r) => (
            <ReservationRow
              key={toText(r?.id, "") || toText(r?.bookingNumber, "—")}
              r={r}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              handleViewDetail={handleViewDetail}
              handleCheckIn={handleCheckIn}
              handleConfirm={handleConfirm}
            />
          ))}
        </tbody>
      </table>
    );
  }, [loading, loadError, total, pageSlice, selectedId]);

  if (getSessionRole() !== ROLE_HOTEL) return null;

  return (
    <div className="hotel-shell">
      <PortalSidebar />

      <main className="hotel-shell__main">
        <header className="hotel-shell__topbar">
          <div className="hotel-shell__topbar-titles">
            <h1>Gestionar Reservas</h1>
            <p>Administra todas las reservas de tu propiedad</p>
          </div>
          <div className="hotel-shell__topbar-actions">
            <button type="button" className="hotel-shell__new">
              + Nueva Reserva
            </button>
            <button
              type="button"
              className="hotel-shell__avatar"
              aria-label={`Sesión: ${sessionEmail || "usuario"}`}
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              {initialsFromEmail(sessionEmail)}
            </button>
          </div>
        </header>

        <section className="hotel-res__toolbar hotel-res__toolbar--portal" aria-label="Herramientas de reservas">
          <div className="hotel-res__search hotel-res__search--portal">
            <label htmlFor="hotel-res-search" className="visually-hidden">
              Buscar por número de reserva o huésped
            </label>
            <input
              id="hotel-res-search"
              type="search"
              placeholder="N° Reserva o nombre cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="hotel-res__pills" role="tablist" aria-label="Filtrar por estado">
            <button
              type="button"
              role="tab"
              aria-selected={pill === "all"}
              className={"hotel-res-pill" + (pill === "all" ? " hotel-res-pill--active" : "")}
              onClick={() => setPill("all")}
            >
              Todas ({counts.all})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pill === "confirmed"}
              className={"hotel-res-pill" + (pill === "confirmed" ? " hotel-res-pill--active" : "")}
              onClick={() => setPill("confirmed")}
            >
              Confirmadas ({counts.confirmed})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pill === "pending"}
              className={"hotel-res-pill" + (pill === "pending" ? " hotel-res-pill--active" : "")}
              onClick={() => setPill("pending")}
            >
              Pendientes ({counts.pending})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pill === "canceled"}
              className={"hotel-res-pill" + (pill === "canceled" ? " hotel-res-pill--active" : "")}
              onClick={() => setPill("canceled")}
            >
              Canceladas ({counts.canceled})
            </button>
          </div>

          <div className="hotel-res__sort hotel-res__sort--portal">
            <label htmlFor="hotel-res-sort" className="visually-hidden">
              Ordenar por
            </label>
            <select
              id="hotel-res-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordenar por"
            >
              <option value="recent">Ordenar: Recientes</option>
              <option value="checkin-asc">Ordenar: Check-in más próximo</option>
            </select>
          </div>
        </section>

        <section className="hotel-res__table-wrap hotel-res__table-wrap--portal" aria-label="Tabla de reservas">
          {tableContent}

          <footer className="hotel-res__footer hotel-res__footer--portal">
            <span className="hotel-res__range">
              Mostrando {total === 0 ? "0" : `${startIdx + 1}-${endIdx}`} de {total} reservas
            </span>
            <div className="hotel-res__pager hotel-res__pager--portal" aria-label="Paginación">
              <button
                type="button"
                className="hotel-res__page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Anterior"
              >
                ‹
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={"hotel-res__page-num" + (p === safePage ? " hotel-res__page-num--active" : "")}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="hotel-res__page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="Siguiente"
              >
                ›
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default HotelReservationsPage;

