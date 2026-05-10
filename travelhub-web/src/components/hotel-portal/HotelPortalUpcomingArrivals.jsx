import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./HotelPortalUpcomingArrivals.css";

const PAGE_SIZE = 10;

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
  /** Cambia al filtrar por periodo (ej. mes+año) para volver a la página 1. */
  arrivalsResetKey,
  viewAllTo,
  viewAllHref = "#",
  viewAllState,
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [arrivalsResetKey]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  const showPagination = total > PAGE_SIZE;
  const rangeFrom = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(currentPage * PAGE_SIZE, total);

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
            {pageRows.map((r) => (
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
      {showPagination ? (
        <nav
          className="hp-arrivals__pagination"
          aria-label={t("hotelPortal.arrivalsPaginationAria")}
        >
          <p className="hp-arrivals__pagination-meta">
            {t("hotelPortal.arrivalsPaginationRange", {
              from: rangeFrom,
              to: rangeTo,
              total,
            })}
            <span className="hp-arrivals__pagination-pages">
              {t("hotelPortal.arrivalsPaginationPageStatus", {
                current: currentPage,
                totalPages,
              })}
            </span>
          </p>
          <div className="hp-arrivals__pagination-actions">
            <button
              type="button"
              className="hp-arrivals__page-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("hotelPortal.arrivalsPaginationPrev")}
            </button>
            <button
              type="button"
              className="hp-arrivals__page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("hotelPortal.arrivalsPaginationNext")}
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}

export default HotelPortalUpcomingArrivals;
