import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./HotelPortalUpcomingArrivals.css";

function badgeClass(status) {
  if (status === "confirmed") return "hp-arrivals__badge hp-arrivals__badge--confirmed";
  if (status === "cancelled") return "hp-arrivals__badge hp-arrivals__badge--cancelled";
  return "hp-arrivals__badge hp-arrivals__badge--pending";
}

/**
 * Tabla de próximas llegadas (check-in).
 */
function HotelPortalUpcomingArrivals({
  rows = [],
  viewAllTo,
  viewAllHref = "#",
  viewAllState,
}) {
  const { t } = useTranslation();

  return (
    <section className="hp-arrivals" aria-labelledby="hp-arrivals-title">
      <div className="hp-arrivals__head">
        <h2 id="hp-arrivals-title" className="hp-arrivals__title">
          {t("hotelPortal.upcomingTitle")}
        </h2>
        {viewAllTo ? (
          <Link className="hp-arrivals__link-all" to={viewAllTo} state={viewAllState}>
            {t("hotelPortal.viewAllBookingsLink")}
          </Link>
        ) : (
          <a className="hp-arrivals__link-all" href={viewAllHref}>
            {t("hotelPortal.viewAllBookingsLink")}
          </a>
        )}
      </div>
      <div className="hp-arrivals__table-wrap">
        <table className="hp-arrivals__table">
          <thead>
            <tr>
              <th scope="col">{t("hotelPortal.arrivalColGuest")}</th>
              <th scope="col">{t("hotelPortal.arrivalColRoom")}</th>
              <th scope="col">{t("hotelPortal.arrivalColArrival")}</th>
              <th scope="col">{t("hotelPortal.arrivalColStatus")}</th>
              <th scope="col">{t("hotelPortal.arrivalColAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="hp-arrivals__guest">
                    <span
                      className="hp-arrivals__guest-avatar"
                      style={{ background: r.avatarTone }}
                      aria-hidden="true"
                    >
                      {r.initials}
                    </span>
                    <span className="hp-arrivals__guest-text">
                      <span className="hp-arrivals__guest-name">{r.guestName}</span>
                      <span className="hp-arrivals__guest-email">{r.guestEmail}</span>
                    </span>
                  </div>
                </td>
                <td className="hp-arrivals__cell-muted">{r.room}</td>
                <td className="hp-arrivals__cell-strong">{r.arrival}</td>
                <td>
                  <span className={badgeClass(r.status)}>
                    {r.statusLabel}
                  </span>
                </td>
                <td>
                  <button type="button" className="hp-arrivals__btn hp-arrivals__btn--primary">
                    {t("hotelPortal.arrivalViewMore")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default HotelPortalUpcomingArrivals;
