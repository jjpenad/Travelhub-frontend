import "./HotelPortalMonthSelect.css";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DEFAULT_YEARS = ["2024", "2025", "2026", "2027"];

/**
 * Selectores de mes y año (demo) para el dashboard hotelero.
 */
function HotelPortalMonthSelect({
  defaultMonth = "Enero",
  defaultYear = "2026",
  yearOptions = DEFAULT_YEARS,
}) {
  return (
    <div className="hp-month-select" role="group" aria-label="Período">
      <label className="hp-month-select__field">
        <span className="visually-hidden">Mes</span>
        <select className="hp-month-select__control hp-month-select__control--month" defaultValue={defaultMonth} aria-label="Mes">
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
          defaultValue={String(defaultYear)}
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
