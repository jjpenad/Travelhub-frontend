import i18n from "../i18n";
import {
  getHotelPortalCurrencyCode,
  pickHotelCurrencyFromApiPayload,
} from "../auth/hotelPortalCurrency";
import { currentLocaleTag } from "./currentLocaleTag";
import { formatHotelPortalMoney } from "./formatHotelPortalMoney";
import { nightsBetween } from "./mapAnalyticsReservationsToManageRows";

const OCCUPANCY_BAR_COLORS = [
  "#5b21b6",
  "#6d28d9",
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
];

function parseIsoDay(iso) {
  if (!iso) return null;
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayInMonthIndex(iso, year, monthIndex) {
  const d = parseIsoDay(iso);
  if (!d || d.getFullYear() !== year || d.getMonth() !== monthIndex) return -1;
  return d.getDate() - 1;
}

function weekIndexForDay(dayIndex) {
  if (dayIndex < 0) return -1;
  const w = Math.floor(dayIndex / 7);
  return Math.min(3, w);
}

function formatReportDate(isoDate) {
  const dash = i18n.t("reservationData.dash");
  if (!isoDate) return dash;
  const d = parseIsoDay(isoDate);
  if (!d) return String(isoDate);
  return d.toLocaleDateString(currentLocaleTag(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabelShort(statusKey) {
  if (statusKey === "confirmed" || statusKey === "pending" || statusKey === "cancelled") {
    return i18n.t(`reservationData.status.${statusKey}`);
  }
  return String(statusKey);
}

function computeOccupancyPercent(reservations, daysInMonth, year, monthIndex) {
  if (!daysInMonth || !Array.isArray(reservations) || reservations.length === 0) return 0;

  const daily = new Array(daysInMonth).fill(0);
  for (const r of reservations) {
    const status = String(r.status || "").toLowerCase();
    if (status === "cancelled") continue;
    const ci = parseIsoDay(r.check_in);
    const co = parseIsoDay(r.check_out);
    if (!ci || !co) continue;
    for (let d = 0; d < daysInMonth; d += 1) {
      const day = new Date(year, monthIndex, d + 1, 12, 0, 0);
      if (ci <= day && day < co) daily[d] += 1;
    }
  }

  const peak = Math.max(...daily, 0);
  if (peak === 0) return 0;
  const avg = daily.reduce((a, b) => a + b, 0) / daysInMonth;
  const capacity = Math.max(peak, Math.ceil(peak * 1.15));
  return Math.min(100, Math.round((avg / capacity) * 1000) / 10);
}

function computeWeeklyBuckets(reservations, daysInMonth, year, monthIndex, today = new Date()) {
  const weeks = Array.from({ length: 4 }, (_, i) => ({
    week: i + 1,
    labelKey: i === 3 ? "week4proj" : `week${i + 1}`,
    newBookings: 0,
    cancellations: 0,
    checkouts: 0,
    projected: false,
  }));

  for (const r of reservations) {
    const status = String(r.status || "").toLowerCase();
    const createdIdx = dayInMonthIndex(r.created_at, year, monthIndex);
    const checkInIdx = dayInMonthIndex(r.check_in, year, monthIndex);
    const checkOutIdx = dayInMonthIndex(r.check_out, year, monthIndex);

    const bookingIdx = createdIdx >= 0 ? createdIdx : checkInIdx;
    if (bookingIdx >= 0) {
      weeks[weekIndexForDay(bookingIdx)].newBookings += 1;
    }
    if (status === "cancelled") {
      const cancelIdx = checkInIdx >= 0 ? checkInIdx : bookingIdx;
      if (cancelIdx >= 0) {
        weeks[weekIndexForDay(cancelIdx)].cancellations += 1;
      }
    }
    if (checkOutIdx >= 0) {
      weeks[weekIndexForDay(checkOutIdx)].checkouts += 1;
    }
  }

  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === monthIndex;
  const lastDayOfMonth = daysInMonth;
  const todayDay = isCurrentMonth ? today.getDate() : lastDayOfMonth;
  const week4Start = 22;

  if (isCurrentMonth && todayDay < week4Start) {
    const w3 = weeks[2];
    const factor = (lastDayOfMonth - week4Start + 1) / 7;
    weeks[3] = {
      ...weeks[3],
      newBookings: Math.round(w3.newBookings * factor),
      cancellations: Math.round(w3.cancellations * factor),
      checkouts: Math.round(w3.checkouts * factor),
      projected: true,
    };
  }

  return weeks;
}

function computeOccupancyByRoomType(reservations) {
  const nightsByType = new Map();
  for (const r of reservations) {
    const status = String(r.status || "").toLowerCase();
    if (status === "cancelled") continue;
    const name = r.room_type?.name?.trim() || i18n.t("hotelReports.roomTypeOther");
    const n = nightsBetween(r.check_in, r.check_out);
    nightsByType.set(name, (nightsByType.get(name) || 0) + n);
  }
  const entries = [...nightsByType.entries()].sort((a, b) => b[1] - a[1]);
  if (!entries.length) return [];
  const maxNights = entries[0][1] || 1;
  return entries.map(([name, nights], i) => ({
    name,
    percent: Math.min(100, Math.round((nights / maxNights) * 100)),
    barColor: OCCUPANCY_BAR_COLORS[Math.min(i, OCCUPANCY_BAR_COLORS.length - 1)],
  }));
}

function mapReservationTableRows(reservations, currencyCode) {
  const dash = i18n.t("reservationData.dash");
  const guestFb = i18n.t("reservationData.guestFallback");
  const defaultCcy = currencyCode || getHotelPortalCurrencyCode();

  return reservations.map((r) => {
    const statusRaw = String(r.status || "pending").toLowerCase();
    const status =
      statusRaw === "confirmed"
        ? "confirmed"
        : statusRaw === "cancelled"
          ? "cancelled"
          : "pending";
    const guestName = r.user_name?.trim() || guestFb;
    const id = String(r.id ?? "");
    const code = r.confirmation_code ? String(r.confirmation_code) : "";
    const reference = code ? `#${code}` : id ? `#${id.slice(0, 8)}` : dash;
    const roomName = r.room_type?.name ? String(r.room_type.name) : dash;
    const roomNum = r.room_number ? String(r.room_number) : "";
    const roomLabel = roomNum
      ? i18n.t("hotelReports.roomLabel", { number: roomNum, type: roomName })
      : roomName;
    const amountValue = Number.parseFloat(r.total_price) || 0;
    const rowCcy = pickHotelCurrencyFromApiPayload(r) ?? defaultCcy;

    return {
      id,
      reference,
      guestName,
      roomLabel,
      checkIn: formatReportDate(r.check_in),
      checkOut: formatReportDate(r.check_out),
      amount: formatHotelPortalMoney(amountValue, rowCcy, { variant: "detail" }),
      status,
      statusLabel: statusLabelShort(status),
    };
  });
}

function formatTrend(current, previous) {
  if (previous == null || previous === 0) {
    if (current === 0) return null;
    return { value: "+ 100%", up: true };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded >= 0 ? "+ " : "";
  return {
    value: `${sign}${rounded}%`,
    up: rounded >= 0,
  };
}

function formatCountTrend(current, previous) {
  if (previous == null || previous === 0) {
    if (current === 0) return null;
    return { value: "+ 100%", up: true };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct);
  const sign = rounded >= 0 ? "+ " : "";
  return {
    value: `${sign}${rounded}%`,
    up: rounded >= 0,
  };
}

/**
 * Adapta analytics del portal a la vista de reportes.
 * @param {object} dto
 * @param {{ daysInMonth: number, monthIndex: number, year: number }} period
 * @param {object | null} [prevDto] - Mes anterior para tendencias.
 */
export function buildReportsViewModel(dto, period, prevDto = null) {
  const reservations = Array.isArray(dto?.reservations) ? dto.reservations : [];
  const totalRes = Number(dto?.total_reservas ?? 0);
  const totalRev = Number(dto?.total_ganancias ?? 0);
  const { daysInMonth, monthIndex, year } = period;

  const currencyCode =
    pickHotelCurrencyFromApiPayload(dto) ?? getHotelPortalCurrencyCode();
  const fmtMoney = (n) =>
    formatHotelPortalMoney(n, currencyCode, { variant: "compact" });

  const occupancy = computeOccupancyPercent(reservations, daysInMonth, year, monthIndex);
  const prevRes = prevDto ? Number(prevDto.total_reservas ?? 0) : null;
  const prevRev = prevDto ? Number(prevDto.total_ganancias ?? 0) : null;
  const prevOcc = prevDto
    ? computeOccupancyPercent(
        Array.isArray(prevDto.reservations) ? prevDto.reservations : [],
        daysInMonth,
        monthIndex > 0 ? year : year - 1,
        monthIndex > 0 ? monthIndex - 1 : 11,
      )
    : null;

  const metrics = [
    {
      id: "revenue",
      labelKey: "metricRevenue",
      value: fmtMoney(totalRev),
      trend: formatTrend(totalRev, prevRev),
    },
    {
      id: "bookings",
      labelKey: "metricBookings",
      value: totalRes.toLocaleString(currentLocaleTag()),
      trend: formatCountTrend(totalRes, prevRes),
    },
    {
      id: "occupancy",
      labelKey: "metricOccupancy",
      value: `${occupancy}%`,
      trend: formatTrend(occupancy, prevOcc),
    },
  ];

  return {
    metrics,
    weeklySeries: computeWeeklyBuckets(reservations, daysInMonth, year, monthIndex),
    occupancyByType: computeOccupancyByRoomType(reservations),
    tableRows: mapReservationTableRows(reservations, currencyCode),
    currencyCode,
  };
}

/**
 * Límites del mes anterior respecto al período actual.
 */
export function getPreviousMonthBounds(monthIndex, year) {
  const prevMonthIndex = monthIndex > 0 ? monthIndex - 1 : 11;
  const prevYear = monthIndex > 0 ? year : year - 1;
  const daysInMonth = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
  const ymdMonth = String(prevMonthIndex + 1).padStart(2, "0");
  return {
    startDate: `${prevYear}-${ymdMonth}-01`,
    endDate: `${prevYear}-${ymdMonth}-${String(daysInMonth).padStart(2, "0")}`,
    monthIndex: prevMonthIndex,
    year: prevYear,
    daysInMonth,
  };
}
