import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./HotelPortalReservationStatus.css";

/**
 * Anillo de estado de reservaciones + leyenda.
 */
function HotelPortalReservationStatus({
  title,
  bookingCount,
  segments = [],
}) {
  const { t } = useTranslation();

  const bookingUnitLine = useMemo(() => {
    if (bookingCount == null) return t("hotelPortal.reservationsWord");
    return t("hotelPortal.bookingUnit", { count: Number(bookingCount) });
  }, [bookingCount, t]);

  const resolvedTitle =
    typeof title === "string" ? title : t("hotelPortal.statusChartTitle");

  const gradient = useMemo(() => {
    if (!segments.length) return "conic-gradient(#e2e8f0 0deg 360deg)";
    let acc = 0;
    const parts = segments.map((s) => {
      const deg = (s.percent / 100) * 360;
      const start = acc;
      acc += deg;
      return `${s.color} ${start}deg ${acc}deg`;
    });
    return `conic-gradient(from -90deg at 50% 50%, ${parts.join(", ")})`;
  }, [segments]);

  const centerValue =
    bookingCount == null
      ? "—"
      : bookingCount > 999
        ? "999+"
        : String(bookingCount);

  return (
    <section className="hp-status" aria-labelledby="hp-status-title">
      <h2 id="hp-status-title" className="hp-status__title">
        {resolvedTitle}
      </h2>
      <div className="hp-status__body">
        <div className="hp-status__donut-wrap">
          <div className="hp-status__donut" style={{ background: gradient }} aria-hidden="true" />
          <div className="hp-status__donut-hole">
            <span className="hp-status__donut-value">{centerValue}</span>
            <span className="hp-status__donut-label">{bookingUnitLine}</span>
          </div>
        </div>
        <ul className="hp-status__legend">
          {segments.map((s) => (
            <li key={s.key} className="hp-status__legend-row">
              <span className="hp-status__dot" style={{ background: s.color }} aria-hidden="true" />
              <span className="hp-status__legend-label">{s.label}</span>
              <span className="hp-status__legend-pct">{s.percent}%</span>
              <span className="hp-status__legend-count">({s.count})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default HotelPortalReservationStatus;
