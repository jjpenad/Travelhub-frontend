/** Inicio de sesión (viajeros y hoteles) */
export const PATH_LOGIN = "/login";

/** Home del portal de viajeros (exploración y búsqueda pública) */
export const PATH_TRAVELERS_HOME = "/travelers";

/** Comprobante simulado del procesador de pago antes del resumen de reserva */
export const PATH_PAYMENT_VOUCHER = "/payment-voucher";

/** Resumen / confirmación de reserva (post-pago) */
export const PATH_CONFIRMATION = "/confirmation";

/** Inicio / dashboard del administrador hotelero (tras login rol hotel) */
export const PATH_HOTEL_PORTAL_HOME = "/hoteles/inicio";

/** Listado y gestión de reservas (portal hotelero) */
export const PATH_HOTEL_MANAGE_RESERVATIONS = "/hoteles/reservas";

/** Gestión de tarifas y habitaciones (portal hotelero) */
export const PATH_HOTEL_MANAGE_RATES = "/hoteles/tarifas";

/** Detalle de una reserva (portal hotelero). `id` ej. r-1 */
export function pathHotelReservationDetail(id) {
  return `${PATH_HOTEL_MANAGE_RESERVATIONS}/${encodeURIComponent(id)}`;
}

/** Detalle de un tipo de habitación / tarifa (portal hotelero) */
export function pathHotelRoomDetail(id) {
  return `${PATH_HOTEL_MANAGE_RATES}/${encodeURIComponent(id)}`;
}

/** Ruta histórica: redirige a {@link PATH_HOTEL_PORTAL_HOME} */
export const PATH_HOTEL_PORTAL_LEGACY = "/portal-hoteles";

/** Reservas guardadas en el navegador del viajero */
export const PATH_MY_TRIPS = "/mis-viajes";

/** Detalle de una reserva: `${PATH_MY_TRIPS_RESERVATION}/:bookingSlug` */
export const PATH_MY_TRIPS_RESERVATION = `${PATH_MY_TRIPS}/reserva`;
