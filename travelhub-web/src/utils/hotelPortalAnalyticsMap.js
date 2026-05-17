import i18n from "../i18n";
import {
  getHotelPortalCurrencyCode,
  pickHotelCurrencyFromApiPayload,
} from "../auth/hotelPortalCurrency";
import { currentLocaleTag } from "./currentLocaleTag";
import { formatHotelPortalMoney } from "./formatHotelPortalMoney";
import {
  normalizeReservationStatus,
  reservationIdFromApiRow,
  sortReservationsForUpcomingArrivals,
} from "./reservationStatus";

const AVATAR_TONES = ["#5b21b6", "#0d9488", "#2563eb", "#c2410c", "#7c3aed"];

const PCT_COLORS = {
  pending: "#ea580c",
  confirmed: "#5b21b6",
  cancelled: "#dc2626",
};

function simpleHash(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initialsFromName(name) {
  const t = String(name ?? "").trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function segmentLabelForKey(key) {
  if (key === "pending" || key === "confirmed" || key === "cancelled") {
    return i18n.t(`reservationData.segment.${key}`);
  }
  return String(key);
}

function statusLabelShort(statusKey) {
  if (
    statusKey === "confirmed" ||
    statusKey === "pending" ||
    statusKey === "cancelled"
  ) {
    return i18n.t(`reservationData.status.${statusKey}`);
  }
  return String(statusKey);
}

function formatArrivalDate(isoDate) {
  const dash = i18n.t("reservationData.dash");
  if (!isoDate) return dash;
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return d.toLocaleDateString(currentLocaleTag(), { day: "numeric", month: "short", year: "numeric" });
}

function mapRevenuePerDayToBars(revenuePerDay, fallbackDaysInMonth) {
  const emptyLen =
    typeof fallbackDaysInMonth === "number" &&
    fallbackDaysInMonth >= 28 &&
    fallbackDaysInMonth <= 31
      ? fallbackDaysInMonth
      : 31;
  if (!Array.isArray(revenuePerDay) || revenuePerDay.length === 0) {
    return Array.from({ length: emptyLen }, (_, i) => ({ day: i + 1, value: 0 }));
  }
  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  const byDay = new Map();
  for (const row of revenuePerDay) {
    if (!row?.date) continue;
    const d = new Date(`${row.date}T12:00:00`);
    if (Number.isNaN(d.getTime())) continue;
    year = d.getFullYear();
    month = d.getMonth();
    byDay.set(d.getDate(), Number(row.revenue) || 0);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    value: byDay.get(i + 1) ?? 0,
  }));
}

function mapPercentStatusToSegments(percentStatus, reservations) {
  const counts = {};
  for (const r of reservations) {
    const k = String(r.status || "").toLowerCase();
    if (k) counts[k] = (counts[k] || 0) + 1;
  }
  const entries = Object.entries(percentStatus || {});
  if (!entries.length) {
    return [
      {
        key: "none",
        label: i18n.t("reservationData.noDataSegment"),
        percent: 100,
        count: 0,
        color: "#e2e8f0",
      },
    ];
  }
  return entries.map(([key, pctStr]) => {
    const pct = parseFloat(String(pctStr).replace("%", "").replace(",", ".")) || 0;
    return {
      key,
      label: segmentLabelForKey(key),
      percent: Math.round(pct),
      count: counts[key] ?? 0,
      color: PCT_COLORS[key] || "#64748b",
    };
  });
}

function mapReservationsToArrivalRows(reservations) {
  const dash = i18n.t("reservationData.dash");
  const guestFb = i18n.t("reservationData.guestFallback");
  return sortReservationsForUpcomingArrivals(reservations).map((r) => {
    const name = r.user_name?.trim() || guestFb;
    const id = reservationIdFromApiRow(r);
    const statusNormalized = normalizeReservationStatus(r);
    return {
      id,
      guestName: name,
      guestEmail: dash,
      initials: initialsFromName(name),
      avatarTone: AVATAR_TONES[simpleHash(id || name) % AVATAR_TONES.length],
      room: r.room_type?.name || dash,
      arrival: formatArrivalDate(r.check_in),
      status: statusNormalized,
      statusLabel: statusLabelShort(statusNormalized),
    };
  });
}

/**
 * Adapta la respuesta del panel de analíticas a las props del dashboard hotelero.
 * @param {object} dto - JSON del backend.
 * @param {{ daysInMonth?: number }} [options] - Días del mes seleccionado (para barras vacías).
 */
export function buildDashboardViewModel(dto, options = {}) {
  const totalRes = Number(dto?.total_reservas ?? 0);
  const totalGuests = Number(dto?.total_personas ?? 0);
  const totalRev = Number(dto?.total_ganancias ?? 0);

  const currencyCode =
    pickHotelCurrencyFromApiPayload(dto) ?? getHotelPortalCurrencyCode();

  const fmtMoney = (n) =>
    formatHotelPortalMoney(n, currencyCode, { variant: "compact" });

  const metrics = [
    {
      id: "bookings",
      value: String(totalRes),
      hint: "",
      trend: null,
    },
    {
      id: "revenue-month",
      value: fmtMoney(totalRev),
      hint: "",
      trend: null,
    },
    {
      id: "guests",
      value: String(totalGuests),
      hint: "",
      trend: null,
    },
  ];

  const reservations = Array.isArray(dto?.reservations) ? dto.reservations : [];

  return {
    metrics,
    bars: mapRevenuePerDayToBars(dto?.revenue_per_day, options.daysInMonth),
    segments: mapPercentStatusToSegments(dto?.percent_status, reservations),
    arrivalRows: mapReservationsToArrivalRows(reservations),
    bookingRingCount: totalRes,
    currencyCode,
  };
}
