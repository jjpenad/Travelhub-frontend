/**
 * Normalización y formato de parámetros de búsqueda en la URL
 * (destino, fechas ISO, huéspedes) — mismo criterio que Hero y SearchSummary.
 */

import i18n from "../i18n";
import { localeTagForI18n } from "./locale";

export function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** @param {string} yyyyMmDd */
function parseLocalDate(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  const parts = yyyyMmDd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/** @param {Date} date */
function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysYmd(yyyyMmDd, days) {
  const base = parseLocalDate(yyyyMmDd);
  if (!base) return "";
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + days);
  return formatYmd(next);
}

/**
 * Normaliza a YYYY-MM-DD (ISO fecha) para URL y para `<input type="date" />`.
 * Acepta YYYY-MM-DD o DD/MM/YYYY (p. ej. pegado manualmente).
 */
export function ensureIsoYmd(value) {
  if (value == null || value === "") return "";
  const v = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = parseLocalDate(v);
    return d ? formatYmd(d) : "";
  }
  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    const dt = new Date(year, month - 1, day);
    if (
      dt.getFullYear() === year &&
      dt.getMonth() === month - 1 &&
      dt.getDate() === day
    ) {
      return formatYmd(dt);
    }
  }
  return "";
}

export function parseIsoToLocalDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/** ISO YYYY-MM-DD → texto legible según idioma actual de i18n */
export function formatFriendlyDate(iso) {
  const dt = parseIsoToLocalDate(iso);
  if (!dt) return "—";
  return new Intl.DateTimeFormat(localeTagForI18n(i18n.language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dt);
}

export function formatGuestsLabel(n) {
  const num = parseInt(String(n), 10);
  if (!Number.isFinite(num) || num < 1) return "—";
  return i18n.t(num === 1 ? "formats.guests_one" : "formats.guests_other", {
    count: num,
  });
}

export function formatRoomsLabel(n) {
  const num = parseInt(String(n), 10);
  if (!Number.isFinite(num) || num < 1) return "—";
  return i18n.t(num === 1 ? "formats.rooms_one" : "formats.rooms_other", {
    count: num,
  });
}

export function diffNightsBetween(checkInIso, checkOutIso) {
  const a = parseIsoToLocalDate(checkInIso);
  const b = parseIsoToLocalDate(checkOutIso);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  const days = Math.round(ms / 86400000);
  return days > 0 ? days : null;
}

/** Valores 1–8 para el `<select>` de huéspedes en el widget de reserva */
export function normalizeGuestsForWidget(g) {
  if (g == null || g === "") return "2";
  const n = parseInt(String(g), 10);
  if (!Number.isFinite(n)) return "2";
  return String(Math.min(8, Math.max(1, n)));
}

/**
 * Lee `destination`, `checkIn`, `checkOut`, `guests` de la URL (mismo esquema que Hero → /search).
 * Si hay entrada pero no salida, la salida por defecto es el día siguiente a la entrada.
 *
 * @param {URLSearchParams} searchParams
 */
export function parseBookingFromSearchParams(searchParams) {
  const destRaw = searchParams.get("destination")?.trim() ?? "";
  const checkIn = ensureIsoYmd(searchParams.get("checkIn") ?? "");
  let checkOut = ensureIsoYmd(searchParams.get("checkOut") ?? "");
  if (checkIn && !checkOut) {
    checkOut = addDaysYmd(checkIn, 1);
  }
  const guestsStr = normalizeGuestsForWidget(searchParams.get("guests"));

  const destinationDisplay = destRaw ? safeDecode(destRaw) : "";

  const nights = diffNightsBetween(checkIn, checkOut) ?? 5;

  return {
    destinationDisplay,
    checkIn,
    checkOut,
    guestsStr,
    guestsLabel: formatGuestsLabel(guestsStr),
    nights,
    checkInDisplay: formatFriendlyDate(checkIn),
    checkOutDisplay: formatFriendlyDate(checkOut),
  };
}
