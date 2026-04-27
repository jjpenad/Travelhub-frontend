/**
 * Texto de cuerpo del toast: "Tu reserva en {hotel} del 15 al 18 de mayo está confirmada."
 * @param {{ hotelName: string, checkIn: string, checkOut: string, reservationId?: string, reservationRef?: string }} p
 * @returns {string}
 */
export function buildTravelerConfirmToastBody(p) {
  const hotel = (p.hotelName && String(p.hotelName).trim()) || "tu alojamiento";
  const range = formatDateRangeForConfirmToastES(p.checkIn, p.checkOut);
  const id =
    p.reservationId != null && String(p.reservationId).trim() !== ""
      ? String(p.reservationId).trim()
      : "";
  const refRaw =
    p.reservationRef != null && String(p.reservationRef).trim() !== ""
      ? String(p.reservationRef).trim()
      : "";
  const ref = refRaw ? (refRaw.startsWith("#") ? refRaw : `#${refRaw}`) : "";

  const suffixParts = [];
  if (ref) suffixParts.push(`Ref. de reserva: ${ref}`);
  if (id && (!refRaw || refRaw !== id)) suffixParts.push(`Id: ${id}`);
  const suffix = suffixParts.length ? ` (${suffixParts.join(" · ")})` : "";
  if (range) {
    return `Tu reserva en ${hotel} del ${range} está confirmada.${suffix}`;
  }
  return `Tu reserva en ${hotel} está confirmada.${suffix}`;
}

/**
 * "15 al 18 de mayo" o fechas en meses distintos.
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {string}
 */
function formatDateRangeForConfirmToastES(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "";
  const a = new Date(`${String(checkIn).slice(0, 10)}T12:00:00`);
  const b = new Date(`${String(checkOut).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";

  const sameMonth =
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  if (sameMonth) {
    const month = a.toLocaleDateString("es-ES", { month: "long" });
    return `${a.getDate()} al ${b.getDate()} de ${month}`;
  }
  const o = { day: "numeric", month: "long" };
  return `${a.toLocaleDateString("es-ES", o)} al ${b.toLocaleDateString("es-ES", { ...o, year: "numeric" })}`;
}

/**
 * Cuerpo del email (service-soport) alineado con el toast in-app.
 * @param {{ toastBody: string, confirmationCode?: string, reservationId?: string }} p
 * @returns {string}
 */
export function buildTravelerConfirmEmailMessage(p) {
  const lines = [
    "TravelHub",
    "",
    "¡Reserva confirmada!",
    "",
    p.toastBody,
  ];
  const code = p.confirmationCode && String(p.confirmationCode).trim();
  if (code) {
    lines.push("", `Referencia: ${code}`);
  }
  if (p.reservationId && String(p.reservationId).trim() !== "") {
    lines.push(`Id. reserva: ${String(p.reservationId).trim()}`);
  }
  lines.push(
    "",
    "Puedes abrir el detalle en la app de TravelHub en tu navegador (Mis viajes).",
  );
  return lines.join("\n");
}
