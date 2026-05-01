import i18n from "../i18n";

/**
 * Mensaje para mostrar cuando falla una llamada al API.
 *
 * - Si el backend devuelve `error.message` no vacío, se muestra **tal cual** (idioma y redacción
 *   definidos por el servidor; el front no intenta traducirlo).
 * - Si no hay mensaje, se usa la clave i18n `fallbackKey` (y `fallbackOptions` si aplica).
 *
 * @param {unknown} error
 * @param {string} fallbackKey - clave en `translation.json`
 * @param {object} [fallbackOptions] - interpolación para i18n.t
 * @returns {string}
 */
export function formatApiUserError(error, fallbackKey, fallbackOptions) {
  const raw =
    error != null &&
    typeof error === "object" &&
    typeof error.message === "string" &&
    error.message.trim() !== ""
      ? error.message.trim()
      : "";
  if (raw.length > 0) {
    return raw;
  }
  return i18n.t(fallbackKey, fallbackOptions);
}
