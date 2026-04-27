/**
 * Stub para integración (develop / CI): no incluye reservas de demostración.
 *
 * Con `USE_MOCK_MY_TRIPS` en false, Mis viajes carga el listado desde el API
 * (`GET …/reservations/user`).
 *
 * Para probar la UI con lista mock en tu máquina, cambia temporalmente a true
 * en una rama local o amplía este archivo solo en feature (sin mergear datos a develop).
 */
export const USE_MOCK_MY_TRIPS = false;

export const mockMyTripsReservations = [];
