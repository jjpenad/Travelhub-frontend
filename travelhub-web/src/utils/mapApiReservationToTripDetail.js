import i18n from "../i18n";
import { nightsBetween } from "./mapAnalyticsReservationsToManageRows";

/**
 * Mapea la reserva de GET /reservations/:id a la forma usada en {@link TripDetailPage}.
 * @param {object} r
 * @returns {object | null}
 */
export function mapApiReservationToTripDetail(r) {
  if (!r || typeof r !== "object") return null;
  const dash = i18n.t("reservationData.dash");
  const code = r.confirmation_code != null ? String(r.confirmation_code) : "";
  const id = r.id != null ? String(r.id) : "";
  const reference = code || id || dash;
  const h = r.hotel && typeof r.hotel === "object" ? r.hotel : {};
  const total = Number.parseFloat(r.total_price) || 0;
  const checkIn = String(r.check_in || r.checkIn || "").slice(0, 10);
  const checkOut = String(r.check_out || r.checkOut || "").slice(0, 10);
  const n = nightsBetween(
    r.check_in || r.checkIn,
    r.check_out || r.checkOut,
  );
  return {
    /** Id de reserva en el backend; enlaces a detalle vía `encodeApiReservationDetailSlug`. */
    apiReservationId: id || null,
    reference,
    total,
    hotel: {
      id: h.id,
      name:
        h.name != null && String(h.name).trim() !== ""
          ? String(h.name)
          : i18n.t("tripDetail.accommodationFallback"),
      location: typeof h.location === "string" && h.location.trim() !== "" ? h.location : dash,
      image: typeof h.image === "string" ? h.image : h.image_url,
      rating: typeof h.rating === "number" ? h.rating : undefined,
      amenities: Array.isArray(h.amenities) ? h.amenities : undefined,
      isRefundable: typeof h.isRefundable === "boolean" ? h.isRefundable : false,
    },
    roomType: r.room_type?.name ? String(r.room_type.name) : null,
    checkIn,
    checkOut,
    guests: Number(r.guests) || 2,
    nights: n,
    pricePerNight:
      n > 0 && Number.isFinite(total)
        ? total / n
        : null,
    cleaningFee: 0,
    serviceFee: 0,
    taxes: 0,
    guestEmail: r.guest_email != null ? String(r.guest_email) : null,
    paymentMethod: "card",
    paymentLabel: i18n.t("trips.card"),
    checkInTime: "15:00",
    checkOutTime: "11:00",
    savedAt: r.created_at != null ? String(r.created_at) : new Date().toISOString(),
  };
}
