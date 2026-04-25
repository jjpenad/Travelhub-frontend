import "./HotelPortalMetricCards.css";

function Trend({ value, up }) {
  if (value == null) return null;
  return (
    <span className={"hp-metric-card__trend" + (up ? " hp-metric-card__trend--up" : " hp-metric-card__trend--down")}>
      {up ? "▲" : "▼"} {value}
    </span>
  );
}

/**
 * Fila de tarjetas KPI (reservas, ocupación, huéspedes, ingresos).
 * @param {{ items: Array<{ id: string, label: string, value: string, hint?: string, trend?: string, trendUp?: boolean, tone: string }> }} props
 */
function HotelPortalMetricCards({ items = [] }) {
  return (
    <ul className="hp-metric-cards" role="list">
      {items.map((m) => (
        <li key={m.id} className={`hp-metric-card hp-metric-card--${m.tone}`} role="listitem">
          <span className="hp-metric-card__label">{m.label}</span>
          <span className="hp-metric-card__value">{m.value}</span>
          <div className="hp-metric-card__meta">
            {m.hint ? <span className="hp-metric-card__hint">{m.hint}</span> : null}
            <Trend value={m.trend} up={m.trendUp} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default HotelPortalMetricCards;
