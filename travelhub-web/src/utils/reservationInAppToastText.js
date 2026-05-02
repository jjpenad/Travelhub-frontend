import i18n from "../i18n";

/**
 * Rango de fechas para el cuerpo del toast (idioma actual).
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {string}
 */
function formatDateRangeForConfirmToast(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "";
  const a = new Date(`${String(checkIn).slice(0, 10)}T12:00:00`);
  const b = new Date(`${String(checkOut).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";

  const en = String(i18n.language ?? "").toLowerCase().startsWith("en");
  const sameMonth =
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

  if (sameMonth) {
    if (en) {
      const mo = a.toLocaleDateString("en-US", { month: "long" });
      return `${mo} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
    }
    const month = a.toLocaleDateString("es-ES", { month: "long" });
    return `${a.getDate()} al ${b.getDate()} de ${month}`;
  }

  const o = { day: "numeric", month: "long" };
  if (en) {
    return `${a.toLocaleDateString("en-US", o)} – ${b.toLocaleDateString("en-US", { ...o, year: "numeric" })}`;
  }
  return `${a.toLocaleDateString("es-ES", o)} al ${b.toLocaleDateString("es-ES", { ...o, year: "numeric" })}`;
}

/**
 * Texto de cuerpo del toast in-app (sin número de reserva: va en el correo y en Mis viajes).
 * @param {{ hotelName: string, checkIn: string, checkOut: string, reservationRef?: string }} p
 * @returns {string}
 */
export function buildTravelerConfirmToastBody(p) {
  const hotel =
    (p.hotelName && String(p.hotelName).trim()) ||
    i18n.t("toast.bodyHotelFallback");
  const range = formatDateRangeForConfirmToast(p.checkIn, p.checkOut);

  if (range) {
    return i18n.t("toast.bodyWithRange", { hotel, range });
  }
  return i18n.t("toast.bodyNoRange", { hotel });
}

/**
 * Cuerpo enviado a `send-email` (service-soport). Sin ID interno; solo texto del toast + línea explícita con el número visible para el huésped.
 * @param {{ toastBody: string, confirmationCode?: string }} p
 * @returns {string}
 */
export function buildTravelerConfirmEmailMessage(p) {
  const lines = [
    i18n.t("toast.emailHeader"),
    "",
    i18n.t("toast.emailTitle"),
    "",
    p.toastBody,
  ];
  const code = p.confirmationCode && String(p.confirmationCode).trim();
  if (code) {
    lines.push("", i18n.t("toast.emailRef", { code }));
  }
  lines.push("", i18n.t("toast.emailFooter"));
  return lines.join("\n");
}
