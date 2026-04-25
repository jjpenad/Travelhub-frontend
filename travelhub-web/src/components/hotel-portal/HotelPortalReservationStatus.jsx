import { useMemo } from "react";
import "./HotelPortalReservationStatus.css";

/**
 * Anillo de estado de reservaciones + leyenda.
 */
function HotelPortalReservationStatus({
  title = "Estado reservaciones",
  centerLine1 = "10",
  centerLine2 = "reservas hoy",
  segments = [],
}) {
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

  return (
    <section className="hp-status" aria-labelledby="hp-status-title">
      <h2 id="hp-status-title" className="hp-status__title">
        {title}
      </h2>
      <div className="hp-status__body">
        <div className="hp-status__donut-wrap">
          <div className="hp-status__donut" style={{ background: gradient }} aria-hidden="true" />
          <div className="hp-status__donut-hole">
            <span className="hp-status__donut-value">{centerLine1}</span>
            <span className="hp-status__donut-label">{centerLine2}</span>
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
