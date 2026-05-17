/**
 * Normaliza el estado de una reserva del API a `pending` | `confirmed` | `cancelled`.
 * @param {object | string | null | undefined} raw
 * @returns {"pending"|"confirmed"|"cancelled"}
 */
export function normalizeReservationStatus(raw) {
  const statusStr =
    typeof raw === "string"
      ? raw
      : String(raw?.status ?? raw?.booking_status ?? raw?.state ?? "pending");

  const s = statusStr.toLowerCase().trim();
  if (!s) return "pending";

  if (
    s.includes("confirm") ||
    s === "ok" ||
    s === "active" ||
    s === "completed" ||
    s === "completada" ||
    s === "completado"
  ) {
    return "confirmed";
  }
  if (s.includes("cancel") || s.includes("anulad") || s.includes("rechaz") || s === "rejected") {
    return "cancelled";
  }
  if (s.includes("pend") || s === "processing" || s === "awaiting" || s === "new") {
    return "pending";
  }

  return "pending";
}

/** Estados terminales: no admiten confirmar/rechazar en próximas llegadas. */
export function isTerminalReservationStatus(status) {
  return status === "cancelled";
}

/**
 * @param {object} r
 * @returns {string}
 */
export function reservationIdFromApiRow(r) {
  if (!r || typeof r !== "object") return "";
  const nested =
    r.reservation && typeof r.reservation === "object" ? r.reservation : null;
  const id =
    r.id ??
    r.reservation_id ??
    r.reservationId ??
    nested?.id ??
    nested?.reservation_id;
  if (id != null && String(id).trim() !== "") return String(id).trim();
  const code =
    r.confirmation_code ?? r.confirmationCode ?? nested?.confirmation_code;
  if (code != null && String(code).trim() !== "") return String(code).trim();
  return "";
}

/** @param {string | null | undefined} isoDate */
function checkInSortKey(isoDate) {
  if (!isoDate) return Number.MAX_SAFE_INTEGER;
  const d = new Date(`${String(isoDate).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getTime();
}

/**
 * Prioridad de fila en «Próximas llegadas»: pendientes → confirmadas → resto.
 * @param {"pending"|"confirmed"|"cancelled"} status
 */
function arrivalListTier(status) {
  if (status === "pending") return 0;
  if (status === "confirmed") return 1;
  return 2;
}

/**
 * Orden: 1) pendientes por confirmar, 2) llegadas más cercanas (check-in), 3) demás estados.
 * @param {object[]} reservations
 * @returns {object[]}
 */
export function sortReservationsForUpcomingArrivals(reservations) {
  if (!Array.isArray(reservations) || reservations.length === 0) return [];

  return [...reservations].sort((a, b) => {
    const statusA = normalizeReservationStatus(a);
    const statusB = normalizeReservationStatus(b);
    const tierDiff = arrivalListTier(statusA) - arrivalListTier(statusB);
    if (tierDiff !== 0) return tierDiff;

    const dateDiff = checkInSortKey(a.check_in) - checkInSortKey(b.check_in);
    if (dateDiff !== 0) return dateDiff;

    const idA = reservationIdFromApiRow(a);
    const idB = reservationIdFromApiRow(b);
    return idA.localeCompare(idB);
  });
}
