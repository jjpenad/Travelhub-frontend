import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { getAuthToken } from "../auth/sessionAuth";
import CheckoutStepper from "../components/checkout/CheckoutStepper";
import ConfirmationTicket from "../components/confirmation/ConfirmationTicket";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { PATH_LOGIN, PATH_TRAVELERS_HOME } from "../constants/routes";
import { getTravelerReservationByIdForPoll } from "../services/api";
import "./ConfirmationPage.css";

/** MVP: en `false` oculta «Ver detalles del viaje», «Explorar más destinos» (fila de acciones) y la nota del QR asociada. */
const showConfirmationTripActions = true;

const PATH_TRAVELERS_EXPLORE = `${PATH_TRAVELERS_HOME}#explore`;

function IconCheckCelebration({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="32"
      height="32"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      />
    </svg>
  );
}

function IconArrowRight({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
      />
    </svg>
  );
}

function IconQrSmall({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm6-2h2v2h-2v-2zm4 0h2v4h-2v-4zm-4 4h2v2h4v2h-2v2h-2v-2h-2v-2h2v-2zm8-4h2v8h-2v-4h-2v-2h2v-2z"
      />
    </svg>
  );
}

function labelForReservationStatusNorm(tr, norm) {
  if (norm === "confirmed") return tr("confirmation.statusConfirmed");
  if (norm === "pending") return tr("confirmation.statusPending");
  if (norm === "cancelled") return tr("confirmation.statusCancelled");
  return tr("confirmation.statusProcessing");
}

function ConfirmationPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const data = location.state;
  const [reservationStatusQuery, setReservationStatusQuery] = useState("idle");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const apiReservationId = data?.apiReservationId;
  useEffect(() => {
    const schedule = (next) => {
      queueMicrotask(() => {
        setReservationStatusQuery(next);
      });
    };
    if (!apiReservationId || String(apiReservationId).trim() === "") {
      schedule("idle");
      return undefined;
    }
    if (!getAuthToken()) {
      schedule("idle");
      return undefined;
    }
    let cancel = false;
    schedule("loading");
    const id = String(apiReservationId).trim();
    (async () => {
      const item = await getTravelerReservationByIdForPoll(id);
      if (cancel) return;
      if (!item) {
        schedule({ ok: false });
        return;
      }
      const raw = String(
        (item.raw && item.raw.status) != null ? item.raw.status : "",
      ).trim();
      schedule({
        ok: true,
        label: labelForReservationStatusNorm(t, item.statusNorm),
        raw: raw || "—",
      });
    })();
    return () => {
      cancel = true;
    };
  }, [apiReservationId, t]);

  const hotel = data?.hotel;
  const reference = data?.reference;
  const total = data?.total;
  const totalCurrencyCode =
    typeof data?.totalCurrencyCode === "string" ? data.totalCurrencyCode : "COP";
  const checkIn = data?.checkIn;
  const checkOut = data?.checkOut;
  const roomType = data?.roomType;
  const paymentLabel =
    typeof data?.paymentLabel === "string" ? data.paymentLabel : "Visa ···· 4242";
  const checkInTime = data?.checkInTime ?? "15:00";
  const checkOutTime = data?.checkOutTime ?? "11:00";
  const guestEmail =
    typeof data?.guestEmail === "string" && data.guestEmail.trim() !== ""
      ? data.guestEmail.trim()
      : t("confirmation.guestEmailFallback");

  const hasBooking = Boolean(hotel && reference);
  const canQueryReservationApi =
    Boolean(apiReservationId && String(apiReservationId).trim() !== "") &&
    Boolean(getAuthToken());

  return (
    <div className="confirmation-page">
      <Navbar />
      <PageContainer>
        <div className="confirmation">
          <div className="confirmation-card">
            <div className="confirmation-card__stepper">
              <CheckoutStepper variant="confirmation" />
            </div>

            {hasBooking ? (
              <div className="confirmation-card__body">
                <section
                  className="confirmation-header"
                  aria-labelledby="confirmation-header-title"
                >
                  <div className="confirmation-header__visual">
                    <span className="confirmation-header__ring confirmation-header__ring--outer" />
                    <span className="confirmation-header__ring confirmation-header__ring--mid" />
                    <span className="confirmation-header__ring confirmation-header__ring--inner" />
                    <span className="confirmation-header__check">
                      <IconCheckCelebration className="confirmation-header__check-icon" />
                    </span>
                  </div>

                  <div className="confirmation-header__text-group">
                    <h1
                      id="confirmation-header-title"
                      className="confirmation-header__title"
                    >
                      {t("confirmation.titleCelebration")}
                    </h1>
                    <p className="confirmation-header__text">
                      {t("confirmation.leadBefore")}
                      <strong className="confirmation-header__email">
                        {guestEmail}
                      </strong>
                      {t("confirmation.leadAfter")}
                    </p>
                    <p className="confirmation-header__ref">
                      {t("confirmation.refLine", { ref: reference })}
                    </p>
                    {apiReservationId && String(apiReservationId).trim() !== "" ? (
                      <p
                        className="confirmation-header__api-status"
                        role="status"
                        aria-live="polite"
                      >
                        {!canQueryReservationApi ? (
                          <>{t("confirmation.loginPrompt")}</>
                        ) : null}
                        {canQueryReservationApi && reservationStatusQuery === "loading" ? (
                          <>{t("confirmation.polling")}</>
                        ) : null}
                        {canQueryReservationApi &&
                        typeof reservationStatusQuery === "object" &&
                        reservationStatusQuery.ok === true ? (
                          <>
                            <span className="confirmation-header__api-status-label">
                              {t("confirmation.statusSystemShort")}{" "}
                            </span>
                            <strong>{reservationStatusQuery.label}</strong>
                            {reservationStatusQuery.raw &&
                            reservationStatusQuery.raw !== "—" ? (
                              <span className="confirmation-header__api-raw">
                                {" "}
                                ({reservationStatusQuery.raw})
                              </span>
                            ) : null}
                          </>
                        ) : null}
                        {canQueryReservationApi &&
                        typeof reservationStatusQuery === "object" &&
                        reservationStatusQuery.ok === false ? (
                          <>{t("confirmation.pollingFail")}</>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </section>

                <ConfirmationTicket
                  hotel={hotel}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  checkInTime={checkInTime}
                  checkOutTime={checkOutTime}
                  total={total}
                  totalCurrencyCode={totalCurrencyCode}
                  paymentLabel={paymentLabel}
                  paymentStatus={t("confirmation.paymentPaid")}
                />

                {roomType ? (
                  <p className="confirmation-card__room-type-note">
                    <strong>{t("confirmation.roomTypeStrong")}</strong> {roomType}
                  </p>
                ) : null}

                {showConfirmationTripActions ? (
                  <div className="confirmation-actions">
                    <div className="confirmation-actions__buttons">
                      <Link
                        className="confirmation-actions__btn confirmation-actions__btn--secondary"
                        to={PATH_LOGIN}
                      >
                        {t("confirmation.tripDetailsOpen")}
                      </Link>
                      <Link
                        className="confirmation-actions__btn confirmation-actions__btn--primary"
                        to={PATH_TRAVELERS_EXPLORE}
                      >
                        {t("confirmation.exploreMoreDestinations")}
                        <IconArrowRight className="confirmation-actions__btn-icon" />
                      </Link>
                    </div>
                    <p className="confirmation-actions__qr-note">
                      <IconQrSmall className="confirmation-actions__qr-icon" />
                      {t("confirmation.qrNote")}
                    </p>
                  </div>
                ) : null}

                {showConfirmationTripActions ? null : (
                  <Link className="confirmation-card__cta" to={PATH_TRAVELERS_EXPLORE}>
                    {t("confirmation.exploreMoreDestinations")}
                  </Link>
                )}
              </div>
            ) : (
              <div className="confirmation-card__body confirmation-card__body--empty">
                <h1 className="confirmation-card__title">{t("confirmation.emptyTitle")}</h1>
                <p className="confirmation-card__lead">
                  {t("confirmation.emptyLead")}
                </p>
                <Link className="confirmation-card__cta" to={PATH_TRAVELERS_HOME}>
                  {t("confirmation.goHome")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default ConfirmationPage;
