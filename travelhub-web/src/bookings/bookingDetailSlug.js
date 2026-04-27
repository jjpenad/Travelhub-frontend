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

/** Navegación a detalle desde listados/API: identificador de reserva en el backend. */
export function encodeApiReservationDetailSlug(reservationId) {
  return encodeURIComponent(
    JSON.stringify({ t: "api", i: String(reservationId) }),
  );
}

/**
 * @returns {{ kind: "local", r: string, s: string } | { kind: "api", id: string } | null}
 */
export function parseTripBookingSlug(rawSlug) {
  if (!rawSlug || typeof rawSlug !== "string") return null;
  let o;
  try {
    o = JSON.parse(rawSlug);
  } catch {
    try {
      o = JSON.parse(decodeURIComponent(rawSlug));
    } catch {
      return null;
    }
  }
  if (!o || typeof o !== "object") return null;
  if (o.t === "api" && o.i != null && String(o.i).trim() !== "") {
    return { kind: "api", id: String(o.i).trim() };
  }
  if (typeof o.r === "string" && typeof o.s === "string") {
    return { kind: "local", r: o.r, s: o.s };
  }
  return null;
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
