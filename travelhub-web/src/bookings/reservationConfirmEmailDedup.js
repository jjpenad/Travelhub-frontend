/** Solo memoria: sin localStorage ni sessionStorage. */
const sentIds = new Set();

/**
 * @param {string} reservationId
 * @returns {boolean}
 */
export function hasSentReservationConfirmEmail(reservationId) {
  return sentIds.has(String(reservationId));
}

/**
 * @param {string} reservationId
 */
export function markSentReservationConfirmEmail(reservationId) {
  sentIds.add(String(reservationId));
}
