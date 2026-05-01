import "./HotelPortalMonthSelect.css";
import { useTranslation } from "react-i18next";
import { MONTHS_ES } from "../../utils/hotelPortalMonthRange";
import { displayMonthLocalized } from "../../utils/displayMonthLocalized";

const DEFAULT_YEARS = ["2024", "2025", "2026", "2027"];

/**
 * Selectores de mes y año para el dashboard hotelero.
 */
function HotelPortalMonthSelect({
  month = "Enero",
  year = "2026",
  yearOptions = DEFAULT_YEARS,
  onChange,
}) {
  const { t } = useTranslation();
  const yearStr = String(year);
  return (
    <div className="hp-month-select" role="group" aria-label={t("hotelPortal.periodAria")}>
      <label className="hp-month-select__field">
        <span className="visually-hidden">{t("hotelPortal.monthHidden")}</span>
        <select
          className="hp-month-select__control hp-month-select__control--month"
          value={month}
          onChange={(e) => onChange?.({ month: e.target.value, year: yearStr })}
          aria-label={t("hotelPortal.monthHidden")}
        >
          {MONTHS_ES.map((m) => (
            <option key={m} value={m}>
              {displayMonthLocalized(m)}
            </option>
          ))}
        </select>
      </label>
      <label className="hp-month-select__field">
        <span className="visually-hidden">{t("hotelPortal.yearHidden")}</span>
        <select
          className="hp-month-select__control hp-month-select__control--year"
          value={yearStr}
          onChange={(e) => onChange?.({ month, year: e.target.value })}
          aria-label={t("hotelPortal.yearHidden")}
        >
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default HotelPortalMonthSelect;
