import "./HotelPortalMonthSelect.css";
import { MONTHS_ES } from "../../utils/hotelPortalMonthRange";

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
  const yearStr = String(year);
  return (
    <div className="hp-month-select" role="group" aria-label="Período">
      <label className="hp-month-select__field">
        <span className="visually-hidden">Mes</span>
        <select
          className="hp-month-select__control hp-month-select__control--month"
          value={month}
          onChange={(e) => onChange?.({ month: e.target.value, year: yearStr })}
          aria-label="Mes"
        >
          {MONTHS_ES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="hp-month-select__field">
        <span className="visually-hidden">Año</span>
        <select
          className="hp-month-select__control hp-month-select__control--year"
          value={yearStr}
          onChange={(e) => onChange?.({ month, year: e.target.value })}
          aria-label="Año"
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
