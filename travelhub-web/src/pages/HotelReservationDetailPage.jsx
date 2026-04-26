import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { AUTH_EMAIL_KEY, AUTH_ROLE_KEY, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import { getHotelReservations, HOTEL_RESERVATIONS_KEY, updateHotelReservationById } from "../bookings/hotelReservationsStore";
import { PATH_TRAVELERS_HOME } from "../constants/routes";

function fmtMoney(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  const n = Number(amount);
  const prefix = currency === "COP" ? "$" : "";
  return `${prefix}${n.toLocaleString("es-ES")}`;
}

function toText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return fallback;
}

function HotelReservationDetailPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [sessionVersion, setSessionVersion] = useState(0);
  const [reservations, setReservations] = useState(() => getHotelReservations());

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate, sessionVersion]);

  useEffect(() => {
    function refresh() {
      setReservations(getHotelReservations());
    }
    function onStorage(e) {
      if (e.key === HOTEL_RESERVATIONS_KEY || e.key === null) refresh();
      if (e.key === AUTH_ROLE_KEY || e.key === AUTH_EMAIL_KEY || e.key === null) {
        setSessionVersion((v) => v + 1);
      }
    }
    globalThis.addEventListener("storage", onStorage);
    return () => globalThis.removeEventListener("storage", onStorage);
  }, []);

  const reservation = useMemo(() => {
    const id = decodeURIComponent(toText(reservationId, ""));
    return (
      reservations.find((r) => {
        const rid = toText(r?.id, "");
        return rid === id;
      }) ?? null
    );
  }, [reservationId, reservations]);

  function handleConfirm(id) {
    const next = updateHotelReservationById(id, (r) => ({
      ...r,
      bookingStatus: "confirmed",
      total: {
        ...(typeof r.total === "object" && r.total ? r.total : {}),
        cashflowLabel: "Pagado",
        status: "paid",
      },
    }));
    setReservations(next);
  }

  if (getSessionRole() !== ROLE_HOTEL) return null;

  if (!reservation) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--page-bg)" }}>
        <Navbar />
        <PageContainer>
          <div style={{ padding: "1.25rem 0" }}>
            <p style={{ color: "var(--text-muted)" }}>
              No encontramos esta reserva o el enlace ya no es válido.
            </p>
            <Link to="/portal-hoteles/reservas">Volver al listado</Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  const id = toText(reservation?.id, "");
  const bookingNumber = toText(reservation?.bookingNumber, "—");
  const guest = reservation.guest && typeof reservation.guest === "object" ? reservation.guest : {};
  const room = reservation.room && typeof reservation.room === "object" ? reservation.room : {};
  const stay = reservation.stay && typeof reservation.stay === "object" ? reservation.stay : {};
  const bookingStatus = toText(reservation?.bookingStatus, "");

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)" }}>
      <Navbar />
      <PageContainer>
        <div style={{ padding: "1.25rem 0" }}>
          <Link to="/portal-hoteles/reservas">← Volver al listado</Link>
          <h1 style={{ margin: "0.75rem 0 0.25rem", fontFamily: "var(--heading)" }}>
            Reserva {bookingNumber}
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Detalle rápido (demo) — reemplazar por API.
          </p>

          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <strong>Huésped</strong>
                <div style={{ color: "var(--text-muted)" }}>
                  {String(guest.fullName ?? "—")}
                  <br />
                  {String(guest.email ?? "—")}
                  <br />
                  {String(guest.phone ?? "—")}
                </div>
              </div>
              <div>
                <strong>Habitación</strong>
                <div style={{ color: "var(--text-muted)" }}>
                  #{String(room.number ?? "—")} · {String(room.type ?? "—")}
                  <br />
                  {String(room.beds ?? "—")}
                </div>
              </div>
              <div>
                <strong>Estancia</strong>
                <div style={{ color: "var(--text-muted)" }}>
                  {String(stay.checkIn ?? "—")} – {String(stay.checkOut ?? "—")}
                  <br />
                  {Number(stay.nights ?? 0) || "—"} noches
                </div>
              </div>
              <div>
                <strong>Total</strong>
                <div style={{ color: "var(--text-muted)" }}>
                  {fmtMoney(reservation?.total?.amount, String(reservation?.total?.currency ?? "COP"))}
                  <br />
                  {toText(reservation?.total?.cashflowLabel, "—")}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {bookingStatus === "pending" ? (
                <button
                  type="button"
                  onClick={() => handleConfirm(id)}
                  style={{
                    borderRadius: "0.75rem",
                    padding: "0.55rem 0.8rem",
                    border: "1px solid #bbf7d0",
                    background: "#dcfce7",
                    color: "#166534",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Confirmar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate("/portal-hoteles/reservas")}
                style={{
                  borderRadius: "0.75rem",
                  padding: "0.55rem 0.8rem",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default HotelReservationDetailPage;

