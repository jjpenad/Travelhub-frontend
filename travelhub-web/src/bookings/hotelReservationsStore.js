import { mockHotelReservations } from "../data/mockHotelReservations";

export const HOTEL_RESERVATIONS_KEY = "travelhub-hotel-reservations";

/**
 * @returns {Array<Record<string, unknown>>}
 */
export function getHotelReservations() {
  try {
    const raw = localStorage.getItem(HOTEL_RESERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Reemplaza la lista completa.
 * @param {Array<Record<string, unknown>>} list
 */
export function setHotelReservations(list) {
  localStorage.setItem(HOTEL_RESERVATIONS_KEY, JSON.stringify(list));
}

/**
 * Seed inicial para demo: solo si no existe data en storage.
 * @returns {Array<Record<string, unknown>>}
 */
export function ensureSeedHotelReservations() {
  const current = getHotelReservations();
  if (current.length > 0) return current;
  setHotelReservations(mockHotelReservations);
  return getHotelReservations();
}

/**
 * Actualiza una reserva por id.
 * @param {string} id
 * @param {(current: Record<string, unknown>) => Record<string, unknown>} updater
 * @returns {Array<Record<string, unknown>>} lista resultante
 */
export function updateHotelReservationById(id, updater) {
  const list = getHotelReservations();
  const next = list.map((r) => {
    if (!r || typeof r !== "object") return r;
    if (String(r.id ?? "") !== String(id)) return r;
    return updater(r);
  });
  setHotelReservations(next);
  return next;
}

