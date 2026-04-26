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
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bedTypeLabel(bedType) {
  const t = String(bedType || "").trim();
  if (!t) return "—";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function paymentMethodFromLabel(paymentLabel) {
  if (paymentLabel === "Pagado") return "Tarjeta / TravelHub";
  if (paymentLabel === "Reembolsado") return "Reembolso a medio original";
  return "Pendiente de cobro";
}

/**
 * Objeto de detalle compatible con {@link HotelReservationDetailPage} (misma forma que el demo).
 * @param {object} r - Reserva tal como viene en analytics o en GET por id.
 * @returns {object | null}
 */
export function mapApiReservationToDetailView(r) {
  if (!r || typeof r !== "object") return null;

  const statusRaw = String(r.status || "pending").toLowerCase();
  const status =
    statusRaw === "confirmed"
      ? "confirmed"
      : statusRaw === "cancelled"
        ? "cancelled"
        : "pending";
  const guestName = (r.user_name && String(r.user_name).trim()) || "Huésped";
  const id = String(r.id ?? "");
  const amountValue = Number.parseFloat(r.total_price) || 0;
  const code = r.confirmation_code ? String(r.confirmation_code) : "";
  const reference = code ? `#${code}` : id ? `#${id.slice(0, 8)}` : "—";
  const roomLabel = r.room_type?.name ? String(r.room_type.name) : "—";
  const paymentLabel = paymentLabelForStatus(status);

  return {
    id,
    reference,
    bookedAt: formatBookedAt(r.created_at),
    guestName,
    guestEmail: "—",
    guestPhone: "—",
    initials: initialsFromName(guestName),
    avatarTone: AVATAR_TONES[simpleHash(id || reference) % AVATAR_TONES.length],
    roomHab: roomLabel,
    roomTipo: roomLabel,
    roomCamas: bedTypeLabel(r.room_type?.bed_type),
    dateFrom: formatShortDate(r.check_in),
    dateTo: formatShortDate(r.check_out),
    nights: nightsBetween(r.check_in, r.check_out),
    guestCount: Number(r.guests) || 0,
    amount: `$${amountValue.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    amountValue,
    paymentLabel,
    status,
    statusLabel: statusLabel(status),
    secondaryAction: null,
    bookedVia: "TravelHub",
    paymentMethod: paymentMethodFromLabel(paymentLabel),
    specialRequests:
      r.special_requests != null && String(r.special_requests).trim()
        ? String(r.special_requests).trim()
        : "Sin solicitudes especiales.",
    documentId: "—",
  };
}
