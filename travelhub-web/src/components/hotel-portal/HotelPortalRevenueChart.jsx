import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getHotelPortalCurrencyCode } from "../../auth/hotelPortalCurrency";
import { formatHotelPortalMoney } from "../../utils/formatHotelPortalMoney";
import "./HotelPortalRevenueChart.css";

/**
 * Gráfico de barras de ingresos por día del mes.
 * @param {{ title: string, bars?: { day: number, value: number }[], currencyCode?: string }} props
 */
function HotelPortalRevenueChart({ title, bars = [], currencyCode }) {
  const { t } = useTranslation();
  const ccy = currencyCode ?? getHotelPortalCurrencyCode();
  const fmtMoney = (n) => formatHotelPortalMoney(n, ccy, { variant: "compact" });

  const max = useMemo(() => Math.max(1, ...bars.map((b) => b.value)), [bars]);
  const [hover, setHover] = useState(null);

  const chartAria = useMemo(() => t("hotelPortal.chartDailyAria", { count: bars.length }), [bars.length, t]);

  return (
    <section className="hp-revenue" aria-labelledby="hp-revenue-title">
      <div className="hp-revenue__head">
        <h2 id="hp-revenue-title" className="hp-revenue__title">
          {title}
        </h2>
      </div>
      <div className="hp-revenue__chart-wrap">
        <div className="hp-revenue__chart" role="img" aria-label={chartAria} onMouseLeave={() => setHover(null)}>
          {bars.map((b) => {
            const h = Math.round((b.value / max) * 100);
            const isHover = hover === b.day;
            return (
              <button
                key={b.day}
                type="button"
                className={"hp-revenue__bar-wrap" + (isHover ? " hp-revenue__bar-wrap--hover" : "")}
                onMouseEnter={() => setHover(b.day)}
                onFocus={() => setHover(b.day)}
                onBlur={() => setHover(null)}
                aria-label={t("hotelPortal.chartDayAria", { day: b.day, amount: fmtMoney(b.value) })}
              >
                <span className="hp-revenue__bar" style={{ height: `${Math.max(8, h)}%` }} />
                {isHover ? (
                  <span className="hp-revenue__tooltip" role="tooltip">
                    {t("hotelPortal.chartDayTooltipDay", { day: b.day })}
                    <strong>{fmtMoney(b.value)}</strong>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="hp-revenue__axis">
          {bars.map((b) => (
            <span key={b.day} className="hp-revenue__tick">
              {b.day % 5 === 0 || b.day === 1 || b.day === bars.length ? b.day : ""}
            </span>
          ))}
        </div>
        <div className="hp-revenue__legend">
          <span className="hp-revenue__legend-item hp-revenue__legend-item--real">
            {t("hotelPortal.chartLegendActual")}
          </span>
        </div>
      </div>
    </section>
  );
}

export default HotelPortalRevenueChart;
