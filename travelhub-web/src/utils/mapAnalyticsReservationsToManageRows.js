import i18n from "../i18n";
import {
  getHotelPortalCurrencyCode,
  pickHotelCurrencyFromApiPayload,
} from "../auth/hotelPortalCurrency";
import { currentLocaleTag } from "./currentLocaleTag";
import { formatHotelPortalMoney } from "./formatHotelPortalMoney";
import { normalizeReservationStatus } from "./reservationStatus";

export const AVATAR_TONES = ["#5b21b6", "#0d9488", "#2563eb", "#c2410c", "#7c3aed", "#dc2626"];

export function simpleHash(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function initialsFromName(name) {
  const t = String(name ?? "").trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

export function formatShortDate(isoDate) {
  if (!isoDate) return i18n.t("reservationData.dash");
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return d.toLocaleDateString(currentLocaleTag(), { day: "numeric", month: "short" });
}

export function nightsBetween(checkInIso, checkOutIso) {
  const a = new Date(`${checkInIso}T12:00:00`);
  const b = new Date(`${checkOutIso}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const n = Math.round((b - a) / 86400000);
  return Math.max(1, n);
}

export function statusLabel(st) {
  if (st === "confirmed" || st === "pending" || st === "cancelled") {
    return i18n.t(`reservationData.status.${st}`);
  }
  return String(st);
}

export function paymentLabelForStatus(st) {
  if (st === "cancelled") return i18n.t("reservationData.paymentShort.refunded");
  if (st === "pending") return i18n.t("reservationData.paymentShort.pending");
  return i18n.t("reservationData.paymentShort.paid");
}

/**
 * Convierte reservas del JSON de analytics a filas de {@link HotelManageReservationsTable}.
 * @param {unknown} reservations
 * @param {string | null | undefined} [hotelCurrencyCode] - prioridad sobre storage; por reserva se usa `pickHotelCurrencyFromApiPayload(r)` si existe
 * @returns {object[]}
 */
export function mapAnalyticsReservationsToManageRows(reservations, hotelCurrencyCode) {
  if (!Array.isArray(reservations)) return [];

  const defaultCcy =
    hotelCurrencyCode != null && String(hotelCurrencyCode).trim() !== ""
      ? String(hotelCurrencyCode).trim()
      : getHotelPortalCurrencyCode();

  const rows = reservations.map((r) => {
    const status = normalizeReservationStatus(r);
    const guestName =
      (r.user_name && String(r.user_name).trim()) || i18n.t("reservationData.guestFallback");
    const id = String(r.id ?? "");
    const amountValue = Number.parseFloat(r.total_price) || 0;
    const rowCcy = pickHotelCurrencyFromApiPayload(r) ?? defaultCcy;
    const dash = i18n.t("reservationData.dash");
    const code = r.confirmation_code ? String(r.confirmation_code) : "";
    const reference = code ? `#${code}` : id ? `#${id.slice(0, 8)}` : dash;
    const roomLabel = r.room_type?.name ? String(r.room_type.name) : dash;

    return {
      id,
      reference,
      bookedAt: r.created_at ? String(r.created_at) : dash,
      guestName,
      guestEmail: dash,
      guestPhone: dash,
      initials: initialsFromName(guestName),
      avatarTone: AVATAR_TONES[simpleHash(id || reference) % AVATAR_TONES.length],
      roomHab: roomLabel,
      roomTipo: roomLabel,
      roomCamas: dash,
      dateFrom: formatShortDate(r.check_in),
      dateTo: formatShortDate(r.check_out),
      nights: nightsBetween(r.check_in, r.check_out),
      guestCount: Number(r.guests) || 0,
      amount: formatHotelPortalMoney(amountValue, rowCcy, { variant: "detail" }),
      amountValue,
      paymentLabel: paymentLabelForStatus(status),
      status,
      statusLabel: statusLabel(status),
      secondaryAction: null,
      _apiReservation: r,
      _createdAt: r.created_at ? new Date(r.created_at).getTime() : 0,
    };
  });

  rows.sort((a, b) => (b._createdAt || 0) - (a._createdAt || 0));
  return rows.map(({ _createdAt, ...rest }) => rest);
}
