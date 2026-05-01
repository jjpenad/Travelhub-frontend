import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import "../components/hotel-portal/HotelManageReservations.css";
import "../components/hotel-portal/HotelReservationDetail.css";
import { clearSessionUser, getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  PATH_TRAVELERS_HOME,
} from "../constants/routes";
import { getHotelReservationDetailFromApi } from "../services/api";
import { formatApiUserError } from "../utils/formatApiUserError";
import { mapApiReservationToDetailView } from "../utils/mapApiReservationToDetailView";
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
  const { t } = useTranslation();
  return (
    <dl className="hp-resd-fields">
      <Field label={t("hotelReservationDetail.labelTotal")}>{detail.amount}</Field>
      <Field label={t("hotelReservationDetail.labelPaymentState")}>{detail.paymentLabel}</Field>
      <Field label={t("hotelReservationDetail.labelPaymentMethod")}>{detail.paymentMethod}</Field>
    </dl>
  );
}

function HotelReservationDetailPage() {
  const { t, i18n: i18nHook } = useTranslation();
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const email = getSessionEmail() ?? "";

  const idDecoded = decodeURIComponent(reservationId ?? "");
  const stateReservation = location.state?.reservation;
  const stateMatches =
    Boolean(stateReservation) &&
    typeof stateReservation === "object" &&
    String(stateReservation.id) === idDecoded;

  const detailFromState = useMemo(() => {
    void i18nHook.resolvedLanguage;
    if (!stateMatches) return null;
    return mapApiReservationToDetailView(stateReservation);
  }, [stateMatches, stateReservation, i18nHook.resolvedLanguage]);

  const [remotePayload, setRemotePayload] = useState(null);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) return undefined;
    if (!idDecoded) return undefined;
    if (stateMatches) return undefined;

    const targetId = idDecoded;
    let cancelled = false;

    (async () => {
      try {
        const raw = await getHotelReservationDetailFromApi(targetId);
        if (cancelled) return;
        setRemotePayload({ id: targetId, raw, error: null });
      } catch (e) {
        if (cancelled) return;
        setRemotePayload({
          id: targetId,
          raw: null,
          error: formatApiUserError(e, "reservationData.loadFailed"),
        });
        if (e?.status === 401 || e?.status === 403) {
          clearSessionUser();
          navigate("/login", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [idDecoded, stateMatches, navigate]);

  const detailFromRemote = useMemo(() => {
    void i18nHook.resolvedLanguage;
    if (stateMatches) return null;
    if (!remotePayload || remotePayload.id !== idDecoded) return null;
    if (remotePayload.error || !remotePayload.raw) return null;
    return mapApiReservationToDetailView(remotePayload.raw);
  }, [remotePayload, idDecoded, stateMatches, i18nHook.resolvedLanguage]);

  const detail = detailFromState ?? detailFromRemote;
  const loading = Boolean(!stateMatches && idDecoded && (!remotePayload || remotePayload.id !== idDecoded));
  const errorMessage =
    !stateMatches && remotePayload?.id === idDecoded && remotePayload?.error ? remotePayload.error : null;

  const sidebarDisplayName = useMemo(() => {
    void i18nHook.resolvedLanguage;
    return displayNameFromEmail(email);
  }, [email, i18nHook.resolvedLanguage]);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  const shell = (mainChildren) => (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="bookings" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">{mainChildren}</main>
      </div>
    </div>
  );

  const backLink = (
    <Link className="hp-resd-back" to={PATH_HOTEL_MANAGE_RESERVATIONS}>
      {t("hotelReservationDetail.backToManage")}
    </Link>
  );

  if (!idDecoded) {
    return shell(
      <div className="hp-resd">
        <p className="hp-resd-notfound">{t("hotelReservationDetail.notFound")}</p>
        {backLink}
      </div>,
    );
  }

  if (loading) {
    return shell(
      <div className="hp-resd">
        <p className="hp-resd-notfound">{t("hotelReservationDetail.loading")}</p>
        {backLink}
      </div>,
    );
  }

  if (errorMessage) {
    return shell(
      <div className="hp-resd">
        <p className="hp-resd-notfound">{errorMessage}</p>
        {backLink}
      </div>,
    );
  }

  if (!detail) {
    return shell(
      <div className="hp-resd">
        <p className="hp-resd-notfound">{t("hotelReservationDetail.notFound")}</p>
        {backLink}
      </div>,
    );
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="bookings" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          <div className="hp-resd">
            <header className="hp-resd-head">
              {backLink}
              <div className="hp-resd-head__title-row">
                <h1 className="hp-resd-head__title">
                  {t("hotelReservationDetail.titleRef", { reference: detail.reference })}
                </h1>
                <span className={badgeClass(detail.status)}>{detail.statusLabel}</span>
              </div>
            </header>

            <div className="hp-resd-body">
              <div className="hp-resd-split">
                <div className="hp-resd-split__left">
                  <section className="hp-resd-card" aria-labelledby="hp-resd-booking">
                    <h2 id="hp-resd-booking" className="hp-resd-card__title">
                      {t("hotelReservationDetail.sectionBooking")}
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
                        <p className="hp-resd-profile-note">{t("hotelReservationDetail.holderNote")}</p>
                      </div>
                    </div>
                    <div
                      className="hp-resd-contact-row"
                      role="group"
                      aria-label={t("hotelReservationDetail.ariaContactGroup")}
                    >
                      <Field label={t("hotelReservationDetail.labelEmail")}>{detail.guestEmail}</Field>
                      <Field label={t("hotelReservationDetail.labelPhone")}>{detail.guestPhone}</Field>
                      <Field label={t("hotelReservationDetail.labelDocument")}>{detail.documentId}</Field>
                    </div>
                    <hr className="hp-resd-divider" />
                    <p className="hp-resd-card__section-label">{t("hotelReservationDetail.sectionBookingDetail")}</p>
                    <dl className="hp-resd-fields">
                      <Field label={t("hotelReservationDetail.labelBookedAt")}>{detail.bookedAt}</Field>
                      <Field label={t("hotelReservationDetail.labelSpecialRequests")}>
                        {detail.specialRequests}
                      </Field>
                    </dl>
                  </section>
                </div>

                <div className="hp-resd-split__right">
                  <section className="hp-resd-card hp-resd-card--payment-tall" aria-labelledby="hp-resd-pay-right">
                    <h2 id="hp-resd-pay-right" className="hp-resd-card__title">
                      {t("hotelReservationDetail.sectionPayment")}
                    </h2>
                    <p className="hp-resd-card__lead">{t("hotelReservationDetail.paymentLead")}</p>
                    <PaymentFields detail={detail} />
                  </section>
                </div>
              </div>

              <section className="hp-resd-card hp-resd-card--stay-full" aria-labelledby="hp-resd-stay">
                <h2 id="hp-resd-stay" className="hp-resd-card__title">
                  {t("hotelReservationDetail.sectionStay")}
                </h2>
                <dl className="hp-resd-stay-fields">
                  <div
                    className="hp-resd-stay-room-row"
                    role="group"
                    aria-label={t("hotelReservationDetail.ariaRoomRow")}
                  >
                    <Field className="hp-resd-field--stay-room" label={t("hotelReservationDetail.labelRoomAssigned")}>
                      {detail.roomHab}
                    </Field>
                    <Field className="hp-resd-field--stay-room" label={t("hotelReservationDetail.labelRoomType")}>
                      {detail.roomTipo}
                    </Field>
                  </div>
                  <div
                    className="hp-resd-stay-dates-row"
                    role="group"
                    aria-label={t("hotelReservationDetail.ariaStayDates")}
                  >
                    <Field label={t("hotelReservationDetail.labelCheckIn")}>{detail.dateFrom}</Field>
                    <Field label={t("hotelReservationDetail.labelCheckOut")}>{detail.dateTo}</Field>
                    <Field label={t("hotelReservationDetail.labelNights")}>
                      {t("hotelManage.night", { count: detail.nights })}
                    </Field>
                  </div>
                  <div className="hp-resd-stay-secondary-grid">
                    <Field label={t("hotelReservationDetail.labelGuestCount")}>
                      {t("hotelReservationDetail.guestSummary", {
                        count: Number(detail.guestCount) || 0,
                      })}
                    </Field>
                    <Field label={t("hotelReservationDetail.labelBeds")}>{detail.roomCamas}</Field>
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
