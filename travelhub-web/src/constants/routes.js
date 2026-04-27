/** Inicio de sesión (viajeros y hoteles) */
export const PATH_LOGIN = "/login";

/** Home del portal de viajeros (exploración y búsqueda pública) */
export const PATH_TRAVELERS_HOME = "/travelers";

/** Inicio / dashboard del administrador hotelero (tras login rol hotel) */
export const PATH_HOTEL_PORTAL_HOME = "/hoteles/inicio";

/** Listado y gestión de reservas (portal hotelero) */
export const PATH_HOTEL_MANAGE_RESERVATIONS = "/hoteles/reservas";

/** Detalle de una reserva (portal hotelero). `id` ej. r-1 */
export function pathHotelReservationDetail(id) {
  return `${PATH_HOTEL_MANAGE_RESERVATIONS}/${encodeURIComponent(id)}`;
}

/** Ruta histórica: redirige a {@link PATH_HOTEL_PORTAL_HOME} */
export const PATH_HOTEL_PORTAL_LEGACY = "/portal-hoteles";

/** Reservas guardadas en el navegador del viajero */
export const PATH_MY_TRIPS = "/mis-viajes";

/** Detalle de una reserva: `${PATH_MY_TRIPS_RESERVATION}/:bookingSlug` */
export const PATH_MY_TRIPS_RESERVATION = `${PATH_MY_TRIPS}/reserva`;
