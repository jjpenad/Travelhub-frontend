import i18n from "../i18n";
import {
  getHotelPortalCurrencyCode,
  pickHotelCurrencyFromApiPayload,
} from "../auth/hotelPortalCurrency";
import { currentLocaleTag } from "./currentLocaleTag";
import { formatHotelPortalMoney } from "./formatHotelPortalMoney";
import {
  AVATAR_TONES,
  formatShortDate,
  initialsFromName,
  nightsBetween,
  paymentLabelForStatus,
  simpleHash,
  statusLabel,
} from "./mapAnalyticsReservationsToManageRows";

function formatBookedAt(iso) {
  const dash = i18n.t("reservationData.dash");
  if (!iso) return dash;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(currentLocaleTag(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bedTypeLabel(bedType) {
  const dash = i18n.t("reservationData.dash");
  const t = String(bedType || "").trim();
  if (!t) return dash;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function paymentMethodFromStatus(status) {
  if (status === "cancelled") return i18n.t("reservationData.paymentMethod.refundToSource");
  if (status === "pending") return i18n.t("reservationData.paymentMethod.pendingCollection");
  return i18n.t("reservationData.paymentMethod.card");
}

/**
 * Objeto de detalle compatible con {@link HotelReservationDetailPage} (misma forma que el demo).
 * @param {object} r - Reserva tal como viene en analytics o en GET por id.
 * @param {string | null | undefined} [hotelCurrencyCode] - moneda del establecimiento cuando el documento no la trae
 * @returns {object | null}
 */
export function mapApiReservationToDetailView(r, hotelCurrencyCode) {
  if (!r || typeof r !== "object") return null;

  const statusRaw = String(r.status || "pending").toLowerCase();
  const status =
    statusRaw === "confirmed"
      ? "confirmed"
      : statusRaw === "cancelled"
        ? "cancelled"
        : "pending";
  const dash = i18n.t("reservationData.dash");
  const guestName =
    (r.user_name && String(r.user_name).trim()) || i18n.t("reservationData.guestFallback");
  const id = String(r.id ?? "");
  const amountValue = Number.parseFloat(r.total_price) || 0;
  const ccy =
    pickHotelCurrencyFromApiPayload(r) ??
    (hotelCurrencyCode != null && String(hotelCurrencyCode).trim() !== ""
      ? String(hotelCurrencyCode).trim()
      : getHotelPortalCurrencyCode());
  const code = r.confirmation_code ? String(r.confirmation_code) : "";
  const reference = code ? `#${code}` : id ? `#${id.slice(0, 8)}` : dash;
  const roomLabel = r.room_type?.name ? String(r.room_type.name) : dash;
  const paymentLabel = paymentLabelForStatus(status);

  return {
    id,
    reference,
    bookedAt: formatBookedAt(r.created_at),
    guestName,
    guestEmail: dash,
    guestPhone: dash,
    initials: initialsFromName(guestName),
    avatarTone: AVATAR_TONES[simpleHash(id || reference) % AVATAR_TONES.length],
    roomHab: roomLabel,
    roomTipo: roomLabel,
    roomCamas: bedTypeLabel(r.room_type?.bed_type),
    dateFrom: formatShortDate(r.check_in),
    dateTo: formatShortDate(r.check_out),
    nights: nightsBetween(r.check_in, r.check_out),
    guestCount: Number(r.guests) || 0,
    amount: formatHotelPortalMoney(amountValue, ccy, { variant: "detail" }),
    amountValue,
    paymentLabel,
    status,
    statusLabel: statusLabel(status),
    secondaryAction: null,
    bookedVia: "TravelHub",
    paymentMethod: paymentMethodFromStatus(status),
    specialRequests:
      r.special_requests != null && String(r.special_requests).trim()
        ? String(r.special_requests).trim()
        : i18n.t("reservationData.noSpecialRequests"),
    documentId: dash,
  };
}
