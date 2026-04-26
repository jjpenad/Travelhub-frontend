export const MONTHS_ES = [
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

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * @param {string} monthName - Nombre del mes en español (ej. "Enero").
 * @param {string|number} yearStr - Año (ej. 2026).
 * @returns {{ startDate: string, endDate: string, daysInMonth: number, monthIndex: number, year: number }}
 */
export function getCalendarMonthBounds(monthName, yearStr) {
  const monthIndex = MONTHS_ES.indexOf(String(monthName).trim());
  const year = Number(yearStr);
  if (monthIndex < 0 || !Number.isFinite(year) || year < 1) {
    const now = new Date();
    return getCalendarMonthBounds(MONTHS_ES[now.getMonth()], now.getFullYear());
  }
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const ymdMonth = pad2(monthIndex + 1);
  return {
    startDate: `${year}-${ymdMonth}-01`,
    endDate: `${year}-${ymdMonth}-${pad2(daysInMonth)}`,
    daysInMonth,
    monthIndex,
    year,
  };
}
