/**
 * Reservas demo para la vista "Gestionar reservas" (portal hotelero).
 * 10 filas con estados mezclados para simular la tabla y filtros.
 */

const AVATAR_TONES = ["#5b21b6", "#0d9488", "#2563eb", "#c2410c", "#7c3aed", "#dc2626"];

const GUEST_POOL = [
  { name: "Javier Román", email: "javier.r@email.com", phone: "+57 300 111 2233" },
  { name: "María López", email: "maria.l@email.com", phone: "+57 301 222 3344" },
  { name: "Thomas Weber", email: "t.weber@email.com", phone: "+49 170 8899001" },
  { name: "Ana Martínez", email: "ana.m@email.com", phone: "+34 611 445 566" },
  { name: "Carlos Ruiz", email: "carlos.r@email.com", phone: "+57 310 333 4455" },
  { name: "Laura Gómez", email: "laura.g@email.com", phone: "+57 320 444 5566" },
];

const ROOM_POOL = [
  { hab: "Hab. 112", tipo: "Suite Premier", camas: "1 cama king" },
  { hab: "Hab. 204", tipo: "Deluxe", camas: "2 camas queen" },
  { hab: "Hab. 301", tipo: "Estándar", camas: "2 camas dobles" },
  { hab: "Hab. 108", tipo: "Junior Suite", camas: "1 king + sofá" },
  { hab: "Hab. 415", tipo: "Suite familiar", camas: "2 dobles + 1 individual" },
];

/** Orden de estados para 10 filas: 4 confirmadas, 3 pendientes, 3 canceladas */
const DEMO_STATUS_ORDER = [
  "confirmed",
  "pending",
  "cancelled",
  "confirmed",
  "pending",
  "confirmed",
  "cancelled",
  "pending",
  "confirmed",
  "cancelled",
];

function initialsFrom(name) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function statusLabel(st) {
  if (st === "confirmed") return "Confirmada";
  if (st === "pending") return "Pendiente";
  return "Cancelada";
}

function paymentFor(index, st) {
  if (st === "cancelled") return { key: "refunded", label: "Reembolsado" };
  const cycle = ["paid", "pending_pay", "paid", "paid"];
  const k = cycle[index % cycle.length];
  if (k === "paid") return { key: "paid", label: "Pagado" };
  return { key: "pending_pay", label: "Pago pend." };
}

function secondaryAction(st, index) {
  if (st === "cancelled") return null;
  if (st === "pending") return "confirm";
  return index % 3 === 0 ? "checkin" : null;
}

export const hotelManageReservationsFilterCounts = {
  all: DEMO_STATUS_ORDER.length,
  confirmed: DEMO_STATUS_ORDER.filter((s) => s === "confirmed").length,
  pending: DEMO_STATUS_ORDER.filter((s) => s === "pending").length,
  cancelled: DEMO_STATUS_ORDER.filter((s) => s === "cancelled").length,
};

/**
 * @param {string} id
 * @returns {object | null}
 */
export function getHotelReservationById(id) {
  return getHotelManageReservationsDemo().find((r) => r.id === id) ?? null;
}

/**
 * Fila demo + campos extra para la vista de detalle (demo).
 * @param {string} id
 * @returns {object | null}
 */
export function getHotelReservationDetailById(id) {
  const row = getHotelReservationById(id);
  if (!row) return null;
  const rows = getHotelManageReservationsDemo();
  const idx = rows.findIndex((r) => r.id === id);
  return {
    ...row,
    bookedVia: "TravelHub",
    paymentMethod:
      row.paymentLabel === "Pagado"
        ? "Tarjeta terminada en 4242"
        : row.paymentLabel === "Reembolsado"
          ? "Reembolso a tarjeta original"
          : "Pendiente de cobro",
    specialRequests: idx % 2 === 0 ? "Check-in tardío (después de 20:00)." : "Sin solicitudes especiales.",
    documentId: `${10_000_000 + idx * 91_237}`,
  };
}

/**
 * Lista demo de reservas (10 filas).
 * @returns {Array<object>}
 */
export function getHotelManageReservationsDemo() {
  return DEMO_STATUS_ORDER.map((status, i) => {
    const guest = GUEST_POOL[i % GUEST_POOL.length];
    const room = ROOM_POOL[i % ROOM_POOL.length];
    const { label: paymentLabel } = paymentFor(i, status);
    const nights = 2 + (i % 5);
    const guestCount = 1 + (i % 5);
    const amountNum = 420 + i * 137 + (status === "cancelled" ? 0 : 200);
    const refNum = 982300 + i;
    const day = 1 + (i % 28);
    const months = ["Ene", "Feb", "Mar"];
    const mo = months[i % months.length];
    return {
      id: `r-${i + 1}`,
      reference: `#${refNum}`,
      bookedAt: `${day} ${mo} 2026`,
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      initials: initialsFrom(guest.name),
      avatarTone: AVATAR_TONES[i % AVATAR_TONES.length],
      roomHab: room.hab,
      roomTipo: room.tipo,
      roomCamas: room.camas,
      dateFrom: `${10 + (i % 18)} ${mo}`,
      dateTo: `${10 + (i % 18) + nights} ${mo}`,
      nights,
      guestCount,
      amount: `$${amountNum.toLocaleString("es-ES")}`,
      amountValue: amountNum,
      paymentLabel,
      status,
      statusLabel: statusLabel(status),
      secondaryAction: secondaryAction(status, i),
    };
  });
}
