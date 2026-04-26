/**
 * Reservas mock para el portal de hoteles (admin propiedad).
 * Nota: esto se reemplaza por API real en integración backend.
 */

function isoDatePlusDays(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * @typedef {Object} HotelReservation
 * @property {string} id
 * @property {string} bookingNumber
 * @property {{ fullName: string, email: string, phone: string }} guest
 * @property {{ number: string, type: string, beds: string }} room
 * @property {{ checkIn: string, checkOut: string, nights: number }} stay
 * @property {number} guestsCount
 * @property {{ amount: number, currency: string, cashflowLabel: string, status: "paid" | "pending" | "refunded" }} total
 * @property {"confirmed" | "pending" | "canceled"} bookingStatus
 * @property {string} createdAt
 */

/** @type {HotelReservation[]} */
export const mockHotelReservations = [
  {
    id: "rsv_1001",
    bookingNumber: "TH-20481",
    guest: {
      fullName: "Camila Rodríguez",
      email: "camila.rodriguez@gmail.com",
      phone: "+57 300 111 2233",
    },
    room: { number: "204", type: "Deluxe", beds: "1 King" },
    stay: { checkIn: isoDatePlusDays(0), checkOut: isoDatePlusDays(2), nights: 2 },
    guestsCount: 2,
    total: { amount: 890000, currency: "COP", cashflowLabel: "Pagado", status: "paid" },
    bookingStatus: "confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "rsv_1002",
    bookingNumber: "TH-20480",
    guest: {
      fullName: "Juan Pablo Mejía",
      email: "juanmejia@email.com",
      phone: "+57 301 444 5566",
    },
    room: { number: "118", type: "Standard", beds: "2 Twin" },
    stay: { checkIn: isoDatePlusDays(1), checkOut: isoDatePlusDays(4), nights: 3 },
    guestsCount: 3,
    total: { amount: 1250000, currency: "COP", cashflowLabel: "Pago pend.", status: "pending" },
    bookingStatus: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "rsv_1003",
    bookingNumber: "TH-20479",
    guest: {
      fullName: "Laura Gómez",
      email: "laura.gomez@outlook.com",
      phone: "+57 315 222 9911",
    },
    room: { number: "502", type: "Suite", beds: "1 King + Sofá cama" },
    stay: { checkIn: isoDatePlusDays(5), checkOut: isoDatePlusDays(8), nights: 3 },
    guestsCount: 4,
    total: { amount: 2490000, currency: "COP", cashflowLabel: "Pagado", status: "paid" },
    bookingStatus: "confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "rsv_1004",
    bookingNumber: "TH-20478",
    guest: {
      fullName: "Andrés Restrepo",
      email: "andres.restrepo@gmail.com",
      phone: "+57 310 777 0000",
    },
    room: { number: "311", type: "Superior", beds: "1 Queen" },
    stay: { checkIn: isoDatePlusDays(-2), checkOut: isoDatePlusDays(1), nights: 3 },
    guestsCount: 2,
    total: { amount: 990000, currency: "COP", cashflowLabel: "Pagado", status: "paid" },
    bookingStatus: "confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "rsv_1005",
    bookingNumber: "TH-20477",
    guest: {
      fullName: "Valentina Pérez",
      email: "valenperez@email.com",
      phone: "+57 318 123 4567",
    },
    room: { number: "420", type: "Standard", beds: "1 Queen" },
    stay: { checkIn: isoDatePlusDays(3), checkOut: isoDatePlusDays(5), nights: 2 },
    guestsCount: 1,
    total: { amount: 540000, currency: "COP", cashflowLabel: "Reembolsado", status: "refunded" },
    bookingStatus: "canceled",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
  // Más registros para paginación (6 por página)
  ...Array.from({ length: 23 }).map((_, i) => {
    const n = 20476 - i;
    const idx = i + 6;
    const status = idx % 7 === 0 ? "canceled" : idx % 3 === 0 ? "pending" : "confirmed";
    const paidStatus =
      status === "canceled"
        ? "refunded"
        : status === "pending"
          ? "pending"
          : "paid";
    const cashflowLabel =
      paidStatus === "paid" ? "Pagado" : paidStatus === "refunded" ? "Reembolsado" : "Pago pend.";
    const createdAt = new Date(Date.now() - 1000 * 60 * 60 * (30 + i * 3)).toISOString();
    const checkInOffset = (i % 12) - 2; // mezcla pasado/futuro
    const nights = (i % 4) + 1;
    const checkIn = isoDatePlusDays(checkInOffset);
    const checkOut = isoDatePlusDays(checkInOffset + nights);
    return {
      id: `rsv_${1005 + i + 1}`,
      bookingNumber: `TH-${n}`,
      guest: {
        fullName: ["Sofía Martínez", "Mateo Sánchez", "Isabella López", "Daniela Castro"][i % 4],
        email: `guest${i + 1}@mail.com`,
        phone: `+57 320 000 ${String(1000 + i).padStart(4, "0")}`,
      },
      room: {
        number: String(100 + ((i * 7) % 420)),
        type: ["Standard", "Superior", "Deluxe", "Suite"][i % 4],
        beds: ["1 Queen", "2 Twin", "1 King", "1 King + Sofá cama"][i % 4],
      },
      stay: { checkIn, checkOut, nights },
      guestsCount: (i % 4) + 1,
      total: {
        amount: 420000 + i * 65000,
        currency: "COP",
        cashflowLabel,
        status: paidStatus,
      },
      bookingStatus: status,
      createdAt,
    };
  }),
];

