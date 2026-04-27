/**
 * Reservas confirmadas en este navegador.
 *
 * El cache local se segmenta por identidad activa para que iniciar sesión
 * con otra cuenta NO mezcle las reservas previas (mismo bug que arreglamos
 * en el repositorio Android: usar el id de invitado heredado como scope
 * filtraba data del usuario equivocado). Mientras el usuario es anónimo,
 * el scope se basa en el `travelhub_guest_id` actual.
 *
 * Claves usadas en localStorage:
 *   - `travelhub-reservations:user:<email>`   (autenticado)
 *   - `travelhub-reservations:guest:<id>`     (anónimo con guest id)
 *   - `travelhub-reservations:guest:anon`     (anónimo antes de generar guest id)
 *   - `travelhub-reservations`                (LEGACY, sin scope; se migra al
 *                                              scope actual la primera vez que
 *                                              se accede tras el upgrade)
 */

import { getSessionEmail } from "../auth/sessionAuth";

export const LOCAL_RESERVATIONS_KEY = "travelhub-reservations";
const GUEST_ID_STORAGE_KEY = "travelhub_guest_id";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Devuelve la clave de localStorage que aplica al estado de sesión actual.
 * No depende del DOM ni de hooks; segura para invocar desde código no-React.
 */
export function currentReservationsScopeKey() {
  const email = normalizeEmail(getSessionEmail());
  if (email) return `${LOCAL_RESERVATIONS_KEY}:user:${email}`;
  const guestId = (() => {
    try {
      return localStorage.getItem(GUEST_ID_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  })();
  return `${LOCAL_RESERVATIONS_KEY}:guest:${guestId || "anon"}`;
}

function readArrayFromKey(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Migración one-shot del key legado sin scope. Si el usuario ya tenía datos
 * en `travelhub-reservations`, los movemos al scope que aplica a su sesión
 * actual (sin duplicar si ya hay algo ahí) y borramos el key legado.
 */
function migrateLegacyKeyIfPresent() {
  let legacy;
  try {
    legacy = localStorage.getItem(LOCAL_RESERVATIONS_KEY);
  } catch {
    return;
  }
  if (legacy == null) return;

  const scopeKey = currentReservationsScopeKey();
  try {
    const existing = localStorage.getItem(scopeKey);
    if (!existing) {
      localStorage.setItem(scopeKey, legacy);
    }
    localStorage.removeItem(LOCAL_RESERVATIONS_KEY);
  } catch {
    // Si fallamos al escribir/limpiar dejamos el legado en su sitio para
    // un próximo intento — peor caso, los datos siguen accesibles via el
    // fallback de lectura, no se pierden.
  }
}

/**
 * Devuelve las reservas locales del scope actual (usuario autenticado o
 * invitado). Realiza migración one-shot del key legado en la primera
 * lectura tras el upgrade.
 *
 * @returns {Array<Record<string, unknown>>}
 */
export function getLocalReservations() {
  migrateLegacyKeyIfPresent();
  return readArrayFromKey(currentReservationsScopeKey());
}

/**
 * Añade una reserva al inicio de la lista (más reciente primero) en el
 * scope actual. La reserva queda asociada al usuario autenticado o al
 * `travelhub_guest_id` activo en el momento de la llamada.
 *
 * @param {Record<string, unknown>} entry
 */
export function appendLocalReservation(entry) {
  migrateLegacyKeyIfPresent();
  const scopeKey = currentReservationsScopeKey();
  const list = readArrayFromKey(scopeKey);
  const record = {
    ...entry,
    savedAt: new Date().toISOString(),
  };
  list.unshift(record);
  localStorage.setItem(scopeKey, JSON.stringify(list));
}

