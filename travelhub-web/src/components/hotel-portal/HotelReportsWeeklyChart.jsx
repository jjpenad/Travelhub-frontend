import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./HotelReportsWeeklyChart.css";

const Y_TICKS = [45, 30, 15, 0];

/**
 * Gráfico semanal de reservaciones (barras agrupadas o líneas).
 * @param {{ periodLabel: string, series: object[], chartView?: 'bar' | 'line' }} props
 */
function HotelReportsWeeklyChart({ periodLabel, series = [], chartView = "bar" }) {
  const { t } = useTranslation();
  const isLine = chartView === "line";

  const maxVal = useMemo(() => {
    let m = 1;
    for (const w of series) {
      m = Math.max(m, w.newBookings, w.cancellations, w.checkouts);
    }
    return m;
  }, [series]);

  const scale = (v) => Math.max(4, Math.round((v / maxVal) * 100));

  return (
    <section className="hp-reports-chart" aria-labelledby="hp-reports-chart-title">
      <div className="hp-reports-chart__head">
        <h2 id="hp-reports-chart-title" className="hp-reports-chart__title">
          {t("hotelReports.chartTitle")}
        </h2>
        <span className="hp-reports-chart__period">{periodLabel}</span>
      </div>

      <div className="hp-reports-chart__legend">
        <span className="hp-reports-chart__legend-item hp-reports-chart__legend-item--new">
          {t("hotelReports.legendNew")}
        </span>
        <span className="hp-reports-chart__legend-item hp-reports-chart__legend-item--cancel">
          {t("hotelReports.legendCancel")}
        </span>
        <span className="hp-reports-chart__legend-item hp-reports-chart__legend-item--checkout">
          {t("hotelReports.legendCheckout")}
        </span>
      </div>

      <div
        className={
          "hp-reports-chart__body" + (isLine ? " hp-reports-chart__body--line" : "")
        }
        role="img"
        aria-label={t("hotelReports.chartAria")}
      >
        <div className="hp-reports-chart__y-axis" aria-hidden="true">
          {Y_TICKS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <div className="hp-reports-chart__plot">
          {series.map((w, idx) => {
            const projected = Boolean(w.projected);
            const showDivider = projected && idx === 3;
            const weekLabel = t(`hotelReports.${w.labelKey}`);
            const values = [
              { key: "new", val: w.newBookings, cls: "hp-reports-chart__bar--new" },
              { key: "cancel", val: w.cancellations, cls: "hp-reports-chart__bar--cancel" },
              { key: "checkout", val: w.checkouts, cls: "hp-reports-chart__bar--checkout" },
            ];

            return (
              <div
                key={w.week}
                className={
                  "hp-reports-chart__week" + (projected ? " hp-reports-chart__week--projected" : "")
                }
              >
                {showDivider ? (
                  <span className="hp-reports-chart__proj-line" aria-hidden="true">
                    <span className="hp-reports-chart__proj-label">{t("hotelReports.projected")}</span>
                  </span>
                ) : null}
                {isLine ? (
                  <div className="hp-reports-chart__line-group">
                    {values.map((v) => (
                      <span
                        key={v.key}
                        className={`hp-reports-chart__line-dot ${v.cls}`}
                        style={{ bottom: `${scale(v.val)}%` }}
                        title={`${v.val}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="hp-reports-chart__bar-group">
                    {values.map((v) => (
                      <span
                        key={v.key}
                        className={`hp-reports-chart__bar ${v.cls}`}
                        style={{ height: `${scale(v.val)}%` }}
                        title={`${v.val}`}
                      />
                    ))}
                  </div>
                )}
                <span className="hp-reports-chart__week-label">{weekLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HotelReportsWeeklyChart;
