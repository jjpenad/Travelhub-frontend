import { useLayoutEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { PATH_CONFIRMATION, PATH_TRAVELERS_HOME } from "../constants/routes";
import { useTravelerDisplayCurrency } from "../context/TravelerDisplayCurrencyContext";
import { localeTagForI18n } from "../utils/locale";
import "./PaymentVoucherPage.css";

function IconSuccess({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="56"
      height="56"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1.5" />
      <path
        fill="var(--accent)"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      />
    </svg>
  );
}

function generateTransactionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
    return `TH-${id}`;
  }
  return `TH-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function PaymentVoucherPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPaymentInDisplayCurrency } = useTravelerDisplayCurrency();
  const loc = localeTagForI18n(i18n.language);

  const state = location.state;
  const reservationData = state?.reservationData;
  const selectedPaymentMethod = state?.selectedPaymentMethod ?? null;
  const totalPrice = state?.totalPrice;

  const transactionId = useRef(generateTransactionId()).current;
  const pageRootRef = useRef(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    pageRootRef.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [location.key]);

  const currencyCode =
    typeof reservationData?.totalCurrencyCode === "string"
      ? reservationData.totalCurrencyCode
      : "COP";

  const paymentMethodLabel = useMemo(() => {
    if (!selectedPaymentMethod) return "—";
    const key = `paymentForm.wallet.${selectedPaymentMethod}.name`;
    const label = t(key);
    return label === key ? String(selectedPaymentMethod) : label;
  }, [selectedPaymentMethod, t]);

  const formattedTotal = useMemo(() => {
    const n = Number(totalPrice);
    if (!Number.isFinite(n)) return "—";
    return formatPaymentInDisplayCurrency(n, currencyCode);
  }, [totalPrice, currencyCode, formatPaymentInDisplayCurrency]);

  const formattedDateTime = useMemo(() => {
    return new Date().toLocaleString(loc, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [loc]);

  if (!state || !reservationData) {
    return <Navigate to={PATH_TRAVELERS_HOME} replace />;
  }

  function handleFinishReservation() {
    const rid =
      reservationData.apiReservationId != null &&
      String(reservationData.apiReservationId).trim() !== ""
        ? String(reservationData.apiReservationId).trim()
        : "";
    navigate(
      {
        pathname: PATH_CONFIRMATION,
        search: rid ? `?rid=${encodeURIComponent(rid)}` : "",
      },
      { replace: true, state: reservationData },
    );
  }

  return (
    <div
      ref={pageRootRef}
      className="payment-voucher-page"
      tabIndex={-1}
    >
      <Navbar />
      <PageContainer>
        <div className="payment-voucher">
          <header className="payment-voucher__hero">
            <IconSuccess className="payment-voucher__hero-icon" />
            <h1 className="payment-voucher__title">{t("paymentVoucher.title")}</h1>
            <p className="payment-voucher__subtitle">{t("paymentVoucher.subtitle")}</p>
          </header>

          <article className="payment-voucher__ticket" aria-label={t("paymentVoucher.ticketAria")}>
            <div className="payment-voucher__ticket-top">
              <span className="payment-voucher__badge">{t("paymentVoucher.statusApproved")}</span>
              <p className="payment-voucher__brand">TravelHub Pay</p>
            </div>

            <div className="payment-voucher__perforation" aria-hidden="true" />

            <dl className="payment-voucher__rows">
              <div className="payment-voucher__row">
                <dt>{t("paymentVoucher.method")}</dt>
                <dd>{paymentMethodLabel}</dd>
              </div>
              <div className="payment-voucher__row">
                <dt>{t("paymentVoucher.statusLabel")}</dt>
                <dd>
                  <span className="payment-voucher__pill">{t("paymentVoucher.statusApproved")}</span>
                </dd>
              </div>
              <div className="payment-voucher__row">
                <dt>{t("paymentVoucher.transactionId")}</dt>
                <dd className="payment-voucher__mono">{transactionId}</dd>
              </div>
              <div className="payment-voucher__row">
                <dt>{t("paymentVoucher.date")}</dt>
                <dd>{formattedDateTime}</dd>
              </div>
            </dl>

            <div className="payment-voucher__perforation payment-voucher__perforation--flip" aria-hidden="true" />

            <div className="payment-voucher__total-block">
              <span className="payment-voucher__total-label">{t("paymentVoucher.totalPaid")}</span>
              <span className="payment-voucher__total-value">{formattedTotal}</span>
            </div>
          </article>

          <button
            type="button"
            className="payment-voucher__finish"
            onClick={handleFinishReservation}
          >
            {t("paymentVoucher.finishBooking")}
          </button>
        </div>
      </PageContainer>
    </div>
  );
}

export default PaymentVoucherPage;
