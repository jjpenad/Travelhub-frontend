import { useTranslation } from "react-i18next";
import { MONTHS_ES } from "../../utils/hotelPortalMonthRange";
import { displayMonthLocalized } from "../../utils/displayMonthLocalized";
import "./HotelReportsFilters.css";

const DEFAULT_YEARS = ["2024", "2025", "2026", "2027"];
const CHART_VIEWS = ["bar", "line"];

/**
 * Filtros de reportes: mes, año y tipo de gráfico.
 */
function HotelReportsFilters({
  month,
  year,
  chartView = "bar",
  yearOptions = DEFAULT_YEARS,
  onPeriodChange,
  onChartViewChange,
}) {
  const { t } = useTranslation();
  const yearStr = String(year);

  return (
    <section className="hp-reports-filters" aria-label={t("hotelReports.filtersAria")}>
      <div className="hp-reports-filters__fields">
        <label className="hp-reports-filters__field">
          <span className="hp-reports-filters__label">{t("hotelReports.filterMonth")}</span>
          <select
            className="hp-reports-filters__control"
            value={month}
            onChange={(e) => onPeriodChange?.({ month: e.target.value, year: yearStr })}
            aria-label={t("hotelPortal.monthHidden")}
          >
            {MONTHS_ES.map((m) => (
              <option key={m} value={m}>
                {displayMonthLocalized(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="hp-reports-filters__field">
          <span className="hp-reports-filters__label">{t("hotelReports.filterYear")}</span>
          <select
            className="hp-reports-filters__control"
            value={yearStr}
            onChange={(e) => onPeriodChange?.({ month, year: e.target.value })}
            aria-label={t("hotelPortal.yearHidden")}
          >
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="hp-reports-filters__field">
          <span className="hp-reports-filters__label">{t("hotelReports.filterView")}</span>
          <select
            className="hp-reports-filters__control"
            value={chartView}
            onChange={(e) => onChartViewChange?.(e.target.value)}
            aria-label={t("hotelReports.filterView")}
          >
            {CHART_VIEWS.map((v) => (
              <option key={v} value={v}>
                {t(`hotelReports.chartView.${v}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export default HotelReportsFilters;
