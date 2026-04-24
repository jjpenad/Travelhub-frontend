/**
 * Slug de ruta para el detalle de una reserva (referencia + fecha de guardado).
 */

export function encodeBookingDetailSlug(r) {
  return encodeURIComponent(
    JSON.stringify({
      r: r.reference != null ? String(r.reference) : "",
      s: typeof r.savedAt === "string" ? r.savedAt : "",
    }),
  );
}

export function findReservationBySlug(slug, reservations) {
  if (!slug || !Array.isArray(reservations)) return null;
  let o;
  try {
    o = JSON.parse(slug);
  } catch {
    try {
      o = JSON.parse(decodeURIComponent(slug));
    } catch {
      return null;
    }
  }
  if (!o || typeof o.r !== "string" || typeof o.s !== "string") return null;
  return (
    reservations.find((x) => {
      const xr = x.reference != null ? String(x.reference) : "";
      const xs = typeof x.savedAt === "string" ? x.savedAt : "";
      return xr === o.r && xs === o.s;
    }) ?? null
  );
}
