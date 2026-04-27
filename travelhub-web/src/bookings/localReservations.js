/** Reservas confirmadas en este navegador (hasta integrar API de usuario). */

export const LOCAL_RESERVATIONS_KEY = "travelhub-reservations";

/**
 * @returns {Array<Record<string, unknown>>}
 */
export function getLocalReservations() {
  try {
    const raw = localStorage.getItem(LOCAL_RESERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Añade una reserva al inicio de la lista (más reciente primero).
 * @param {Record<string, unknown>} entry
 */
export function appendLocalReservation(entry) {
  const list = getLocalReservations();
  const record = {
    ...entry,
    savedAt: new Date().toISOString(),
  };
  list.unshift(record);
  localStorage.setItem(LOCAL_RESERVATIONS_KEY, JSON.stringify(list));
}

