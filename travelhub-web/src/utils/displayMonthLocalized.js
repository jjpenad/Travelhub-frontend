import { MONTHS_ES } from "./hotelPortalMonthRange";
import i18n from "../i18n";

/** Mes del portal hotelero almacenado en español (`MONTHS_ES`). */
export function displayMonthLocalized(monthSpanish) {
  const idx = MONTHS_ES.indexOf(String(monthSpanish).trim());
  if (idx < 0) return String(monthSpanish);
  const arr = i18n.t("hotelPortal.monthsList", { returnObjects: true });
  return Array.isArray(arr) && arr[idx] ? arr[idx] : String(monthSpanish);
}
