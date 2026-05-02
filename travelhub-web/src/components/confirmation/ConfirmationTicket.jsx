import { useTranslation } from "react-i18next";
import { useTravelerDisplayCurrency } from "../../context/TravelerDisplayCurrencyContext";
import { localeTagForI18n } from "../../utils/locale";
import "./ConfirmationTicket.css";

function ConfirmationTicket({
  hotel,
  checkIn = "",
  checkOut = "",
  checkInTime = "15:00",
  checkOutTime = "11:00",
  total = 0,
  totalCurrencyCode = "COP",
  paymentLabel = "",
  paymentStatus = "",
}) {
  const { t, i18n } = useTranslation();
  const loc = localeTagForI18n(i18n.language);
  const { formatPaymentInDisplayCurrency } = useTravelerDisplayCurrency();

  function fmtTotal(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return formatPaymentInDisplayCurrency(n, totalCurrencyCode);
  }

  function formatTicketDate(iso) {
    if (!iso || typeof iso !== "string") return "—";
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(loc, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const name = hotel?.name ?? t("bookingSummary.hotelFallback");
  const locationText = hotel?.location ?? "—";
  const imageSrc = hotel?.image;
  const rating =
    typeof hotel?.rating === "number"
      ? hotel.rating.toFixed(1)
      : String(hotel?.rating ?? "—");

  return (
    <article
      className="confirmation-ticket"
      aria-label={t("confirmation.ticketAria")}
    >
      <div className="confirmation-ticket__header">
        <div className="confirmation-ticket__thumb-wrap">
          {imageSrc ? (
            <img
              className="confirmation-ticket__thumb"
              src={imageSrc}
              alt=""
              loading="lazy"
              width={124}
              height={124}
            />
          ) : (
            <div
              className="confirmation-ticket__thumb confirmation-ticket__thumb--placeholder"
              role="img"
              aria-label={name}
            />
          )}
        </div>
        <div className="confirmation-ticket__header-main">
          <h2 className="confirmation-ticket__hotel-name">{name}</h2>
          <p className="confirmation-ticket__location">{locationText}</p>
        </div>
        <p
          className="confirmation-ticket__rating"
          aria-label={t("confirmation.ticketRatingAria", { value: rating })}
        >
          <span className="confirmation-ticket__rating-value">{rating}</span>
          <span className="confirmation-ticket__rating-max">/5</span>
        </p>
      </div>

      <div className="confirmation-ticket__grid">
        <div className="confirmation-ticket__cell">
          <h3 className="confirmation-ticket__cell-title">{t("confirmation.ticketCheckIn")}</h3>
          <p className="confirmation-ticket__cell-date">
            {formatTicketDate(checkIn)}
          </p>
          <p className="confirmation-ticket__cell-time">
            {t("confirmation.ticketFrom", { time: checkInTime })}
          </p>
        </div>
        <div className="confirmation-ticket__cell">
          <h3 className="confirmation-ticket__cell-title">{t("confirmation.ticketCheckOut")}</h3>
          <p className="confirmation-ticket__cell-date">
            {formatTicketDate(checkOut)}
          </p>
          <p className="confirmation-ticket__cell-time">
            {t("confirmation.ticketUntil", { time: checkOutTime })}
          </p>
        </div>
        <div className="confirmation-ticket__cell confirmation-ticket__cell--payment">
          <h3 className="confirmation-ticket__cell-title">{t("confirmation.ticketTotalPaid")}</h3>
          <p className="confirmation-ticket__cell-amount">{fmtTotal(total)}</p>
          <p className="confirmation-ticket__cell-method">{paymentLabel}</p>
          <p className="confirmation-ticket__cell-status">{paymentStatus}</p>
        </div>
      </div>
    </article>
  );
}

export default ConfirmationTicket;
