/**
 * Datos de demostración del dashboard hotelero (sustituir por API).
 */

export const dashboardMetrics = [
  {
    id: "bookings",
    label: "Reservas del mes",
    value: "38",
    hint: "+4 vs mes anterior",
    trend: "+12%",
    trendUp: true,
    tone: "purple",
  },
  {
    id: "revenue-month",
    label: "Total de ingresos del mes",
    value: "$124,800",
    hint: "meta: $140,000",
    trend: "+8%",
    trendUp: true,
    tone: "green",
  },
  {
    id: "guests",
    label: "Total huéspedes",
    value: "32",
    hint: "activos hoy",
    trend: "+8%",
    trendUp: true,
    tone: "blue",
  },
];

/** Ingresos por día (1–31) para gráfico de barras — valores demo */
export const revenueBarsJanuary = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const base = 1200 + (i % 7) * 180 + (i % 5) * 95;
  return { day, value: base + (day === 9 ? 800 : 0) };
});

export const reservationStatusSegments = [
  { key: "confirmed", label: "Confirmadas", percent: 55, count: 6, color: "#5b21b6" },
  { key: "pending", label: "Pendientes", percent: 25, count: 3, color: "#ea580c" },
  { key: "cancelled", label: "Canceladas", percent: 12, count: 1, color: "#dc2626" },
  { key: "checkout", label: "Check-out hoy", percent: 8, count: 0, color: "#16a34a" },
];

export const upcomingArrivalsRows = [
  {
    id: "1",
    guestName: "Javier Román",
    guestEmail: "javier.r@email.com",
    initials: "JR",
    avatarTone: "#5b21b6",
    room: "Hab. 112 - Suite",
    arrival: "Hoy 15:00",
    status: "confirmed",
    statusLabel: "Confirmada",
  },
  {
    id: "2",
    guestName: "María López",
    guestEmail: "maria.l@email.com",
    initials: "ML",
    avatarTone: "#0d9488",
    room: "Hab. 204 - Deluxe",
    arrival: "Hoy 18:30",
    status: "pending",
    statusLabel: "Pendiente",
  },
  {
    id: "3",
    guestName: "Thomas Weber",
    guestEmail: "t.weber@email.com",
    initials: "TW",
    avatarTone: "#2563eb",
    room: "Hab. 301 - Estándar",
    arrival: "Mañana 11:00",
    status: "confirmed",
    statusLabel: "Confirmada",
  },
];
