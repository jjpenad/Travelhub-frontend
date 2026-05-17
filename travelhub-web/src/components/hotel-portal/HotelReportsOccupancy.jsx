import { useTranslation } from "react-i18next";
import "./HotelReportsOccupancy.css";

/**
 * Ocupación relativa por tipo de habitación.
 * @param {{ items: Array<{ name: string, percent: number, barColor: string }> }} props
 */
function HotelReportsOccupancy({ items = [] }) {
  const { t } = useTranslation();

  return (
    <section className="hp-reports-occ" aria-labelledby="hp-reports-occ-title">
      <h2 id="hp-reports-occ-title" className="hp-reports-occ__title">
        {t("hotelReports.occupancyTitle")}
      </h2>
      {items.length === 0 ? (
        <p className="hp-reports-occ__empty">{t("hotelReports.occupancyEmpty")}</p>
      ) : (
        <ul className="hp-reports-occ__list" role="list">
          {items.map((item) => (
            <li key={item.name} className="hp-reports-occ__row" role="listitem">
              <div className="hp-reports-occ__row-head">
                <span className="hp-reports-occ__name">{item.name}</span>
                <span className="hp-reports-occ__pct">{item.percent}%</span>
              </div>
              <div className="hp-reports-occ__track" aria-hidden="true">
                <span
                  className="hp-reports-occ__fill"
                  style={{ width: `${item.percent}%`, background: item.barColor }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default HotelReportsOccupancy;
