import { useTranslation } from "react-i18next";
import "./HotelReportsKpiCards.css";

function Trend({ trend }) {
  if (!trend?.value) return null;
  return (
    <span
      className={
        "hp-reports-kpi__trend" +
        (trend.up ? " hp-reports-kpi__trend--up" : " hp-reports-kpi__trend--down")
      }
    >
      {trend.up ? "▲" : "▼"} {trend.value}
    </span>
  );
}

/**
 * @param {{ items: Array<{ id: string, labelKey: string, value: string, trend?: { value: string, up: boolean } | null }> }} props
 */
function HotelReportsKpiCards({ items = [] }) {
  const { t } = useTranslation();
  return (
    <ul className="hp-reports-kpi" role="list">
      {items.map((m) => (
        <li key={m.id} className="hp-reports-kpi__card" role="listitem">
          <span className="hp-reports-kpi__label">{t(`hotelReports.${m.labelKey}`)}</span>
          <div className="hp-reports-kpi__row">
            <span className="hp-reports-kpi__value">{m.value}</span>
            <Trend trend={m.trend} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default HotelReportsKpiCards;
