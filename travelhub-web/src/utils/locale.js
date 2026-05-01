/**
 * Helpers de locale para Intl e i18n (solo idiomas es / en).
 * @param {string | undefined} lng
 * @returns {"es-ES" | "en-US"}
 */
export function localeTagForI18n(lng) {
  return lng && String(lng).toLowerCase().startsWith("en") ? "en-US" : "es-ES";
}
