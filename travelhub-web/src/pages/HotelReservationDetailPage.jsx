import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import "../components/hotel-portal/HotelManageReservations.css";
import "../components/hotel-portal/HotelReservationDetail.css";
import { getHotelReservationDetailById } from "../data/hotelPortalManageReservationsData";
import { getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  PATH_TRAVELERS_HOME,
} from "../constants/routes";
import { displayNameFromEmail } from "../utils/hotelPortalFormat";
import "./HotelPortalPage.css";

function badgeClass(status) {
  if (status === "confirmed") return "hp-mres-badge hp-mres-badge--confirmed";
  if (status === "pending") return "hp-mres-badge hp-mres-badge--pending";
  if (status === "cancelled") return "hp-mres-badge hp-mres-badge--cancelled";
  return "hp-mres-badge hp-mres-badge--upcoming";
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`hp-resd-field${className ? ` ${className}` : ""}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function PaymentFields({ detail }) {
  return (
    <dl className="hp-resd-fields">
      <Field label="Total">{detail.amount}</Field>
      <Field label="Estado del pago">{detail.paymentLabel}</Field>
      <Field label="Medio de pago">{detail.paymentMethod}</Field>
    </dl>
  );
}

function HotelReservationDetailPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";

  const detail = useMemo(
    () => getHotelReservationDetailById(reservationId ?? ""),
    [reservationId],
  );

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  const sidebarDisplayName = useMemo(() => displayNameFromEmail(email), [email]);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  if (!detail) {
    return (
      <div className="hotel-portal-dashboard">
        <Navbar />
        <div className="hotel-portal-dashboard__shell">
          <HotelPortalSidebar
            activeId="bookings"
            displayName={sidebarDisplayName}
            propertyLabel="Establecimiento asociado"
          />
          <main className="hotel-portal-dashboard__main hp-manage-reservations">
            <div className="hp-resd">
              <p className="hp-resd-notfound">No se encontró esta reserva o el enlace no es válido.</p>
              <Link className="hp-resd-back" to={PATH_HOTEL_MANAGE_RESERVATIONS}>
                ← Volver a gestionar reservas
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar
          activeId="bookings"
          displayName={sidebarDisplayName}
          propertyLabel="Establecimiento asociado"
        />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          <div className="hp-resd">
            <header className="hp-resd-head">
              <Link className="hp-resd-back" to={PATH_HOTEL_MANAGE_RESERVATIONS}>
                ← Volver a gestionar reservas
              </Link>
              <div className="hp-resd-head__title-row">
                <h1 className="hp-resd-head__title">Reserva {detail.reference}</h1>
                <span className={badgeClass(detail.status)}>{detail.statusLabel}</span>
              </div>
              <p className="hp-resd-head__subtitle">
                Consulta los datos de la estancia y de la persona que realizó la reserva.
              </p>
            </header>

            <div className="hp-resd-body">
              <div className="hp-resd-split">
                <div className="hp-resd-split__left">
                  <section className="hp-resd-card" aria-labelledby="hp-resd-booking">
                    <h2 id="hp-resd-booking" className="hp-resd-card__title">
                      Datos de la reserva
                    </h2>
                    <div className="hp-resd-profile">
                      <span
                        className="hp-resd-profile-avatar"
                        style={{ background: detail.avatarTone }}
                        aria-hidden="true"
                      >
                        {detail.initials}
                      </span>
                      <div className="hp-resd-profile-text">
                        <div className="hp-resd-profile-name">{detail.guestName}</div>
                        <p className="hp-resd-profile-note">Titular de la reserva</p>
                      </div>
                    </div>
                    <div
                      className="hp-resd-contact-row"
                      role="group"
                      aria-label="Correo, teléfono y documento del titular"
                    >
                      <Field label="Correo electrónico">{detail.guestEmail}</Field>
                      <Field label="Teléfono">{detail.guestPhone}</Field>
                      <Field label="Documento de identidad">{detail.documentId}</Field>
                    </div>
                    <hr className="hp-resd-divider" />
                    <p className="hp-resd-card__section-label">Detalle de la reserva</p>
                    <dl className="hp-resd-fields">
                      <Field label="Fecha creación de la reserva">{detail.bookedAt}</Field>
                      <Field label="Observaciones / solicitudes">{detail.specialRequests}</Field>
                    </dl>
                  </section>
                </div>

                <div className="hp-resd-split__right">
                  <section className="hp-resd-card hp-resd-card--payment-tall" aria-labelledby="hp-resd-pay-right">
                    <h2 id="hp-resd-pay-right" className="hp-resd-card__title">
                      Información del pago
                    </h2>
                    <p className="hp-resd-card__lead">
                      Resumen del cobro asociado a esta reserva.
                    </p>
                    <PaymentFields detail={detail} />
                  </section>
                </div>
              </div>

              <section className="hp-resd-card hp-resd-card--stay-full" aria-labelledby="hp-resd-stay">
                <h2 id="hp-resd-stay" className="hp-resd-card__title">
                  Estancia y habitación
                </h2>
                <dl className="hp-resd-stay-fields">
                  <div
                    className="hp-resd-stay-room-row"
                    role="group"
                    aria-label="Habitación asignada y tipo"
                  >
                    <Field className="hp-resd-field--stay-room" label="Habitación asignada">
                      {detail.roomHab}
                    </Field>
                    <Field className="hp-resd-field--stay-room" label="Tipo de habitación">
                      {detail.roomTipo}
                    </Field>
                  </div>
                  <div
                    className="hp-resd-stay-dates-row"
                    role="group"
                    aria-label="Entrada, salida y noches"
                  >
                    <Field label="Entrada">{detail.dateFrom}</Field>
                    <Field label="Salida">{detail.dateTo}</Field>
                    <Field label="Noches">
                      {detail.nights} {detail.nights === 1 ? "noche" : "noches"}
                    </Field>
                  </div>
                  <div className="hp-resd-stay-secondary-grid">
                    <Field label="Número de huéspedes">
                      {detail.guestCount} {detail.guestCount === 1 ? "persona" : "personas"}
                    </Field>
                    <Field label="Distribución de camas">{detail.roomCamas}</Field>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default HotelReservationDetailPage;
