/**
 * TravelHub API service layer.
 * VITE_API_URL debe ser la raíz del API (incluye `/service-core` si el backend lo usa así).
 * VITE_ANALYTICS_API_URL: raíz del microservicio de analytics (ej. …/service-soport).
 */

import { getAuthToken, isAuthenticated } from "../auth/sessionAuth";
import { mapApiReservationToTripDetail } from "../utils/mapApiReservationToTripDetail";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://k8s-travelhubdev-3d982ad1bb-1106876598.us-east-2.elb.amazonaws.com/service-core";

const ANALYTICS_BASE_URL =
  import.meta.env.VITE_ANALYTICS_API_URL ||
  "http://k8s-travelhubdev-3d982ad1bb-1106876598.us-east-2.elb.amazonaws.com/service-soport";

/** Registro de usuario. Sobrescribir con VITE_REGISTER_PATH en .env si el backend usa otra ruta. */
const REGISTER_PATH = import.meta.env.VITE_REGISTER_PATH || "/auth/register";

/** Inicio de sesión. Sobrescribir con VITE_LOGIN_PATH en .env si el backend usa otra ruta. */
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/auth/login";

/**
 * Panel analítico portal hotelero (ruta real del servicio; typos preservados).
 * Query: start_date, end_date (YYYY-MM-DD).
 */
const ANALYTICS_DASHBOARD_PATH =
  import.meta.env.VITE_ANALYTICS_DASHBOARD_PATH || "/analitycs/dahsboard";

/** GET detalle de reserva (service-core). Sobrescribir con VITE_RESERVATION_DETAIL_PATH si la ruta difiere. */
const RESERVATION_DETAIL_PATH =
  import.meta.env.VITE_RESERVATION_DETAIL_PATH || "/reservations";

/**
 * Listado de reservas del viajero (OpenAPI: GET `/reservations/user` con JWT).
 * Detección in-app: transición a confirmada. Sobrescribir con
 * VITE_TRAVELER_RESERVATIONS_LIST_PATH si el backend difiere.
 */
const TRAVELER_RESERVATIONS_LIST_PATH =
  import.meta.env.VITE_TRAVELER_RESERVATIONS_LIST_PATH || "/reservations/user";

/**
 * GET listado JWT-only de reservas del usuario autenticado. El backend lee el
 * `user_id` del Bearer token (el path no recibe id de usuario). Si tu deploy
 * usa otra ruta, sobrescribir con VITE_USER_RESERVATIONS_PATH.
 */
const USER_RESERVATIONS_PATH =
  import.meta.env.VITE_USER_RESERVATIONS_PATH || "/reservations/user";

/**
 * service-soport: `POST …/notification/send-email` exige el mismo Bearer que `API_BEARER_TOKEN` /
 * `settings.TOKEN_SOPORT_SERVICES` (HTTPBearer, no el JWT de login del viajero).
 * Ver `notification_router.py` → `verify_bearer_token`.
 */
const NOTIFICATION_SEND_EMAIL_PATH =
  import.meta.env.VITE_NOTIFICATION_SEND_EMAIL_PATH || "/notification/send-email";

/**
 * Mismo secret que `TOKEN_SOPORT_SERVICES` en el backend. `VITE_SOPORT_SEND_EMAIL_BEARER` es alias.
 */
const TOKEN_SOPORT_SERVICES = (
  import.meta.env.VITE_TOKEN_SOPORT_SERVICES ||
  import.meta.env.VITE_SOPORT_SEND_EMAIL_BEARER ||
  ""
).trim();

/** `user_type` por defecto en POST /auth/register si el cliente no lo envía. */
const REGISTER_DEFAULT_USER_TYPE = "traveler";

const CITY_COUNTRY_MAP = {
  "Bogotá": "Colombia",
  "Lima": "Perú",
  "Quito": "Ecuador",
  "Santiago": "Chile",
  "Buenos Aires": "Argentina",
  "Ciudad de México": "México",
};

export const AVAILABLE_CITIES = Object.keys(CITY_COUNTRY_MAP);

function countryForCity(city) {
  return CITY_COUNTRY_MAP[city] || "";
}

/**
 * Retrieves or generates a unique guest ID for the session to identify the user
 * even if they are not logged in.
 */
/**
 * Limpia el valor guardado (sin prefijo "Bearer " duplicado).
 * @param {string | null | undefined} raw
 * @returns {string}
 */
function normalizeBearerValue(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s.replace(/^Bearer\s+/i, "").trim();
}

/**
 * @returns {string} Token de servicio (debe coincidir con `TOKEN_SOPORT_SERVICES` en el API).
 */
function bearerTokenForSoportSendEmail() {
  return normalizeBearerValue(TOKEN_SOPORT_SERVICES);
}

function getGuestId() {
  let guestId = localStorage.getItem("travelhub_guest_id");
  if (!guestId) {
    guestId = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
    localStorage.setItem("travelhub_guest_id", guestId);
  }
  return guestId;
}

function joinApiUrl(path) {
  const base = BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function joinAnalyticsUrl(path) {
  const base = ANALYTICS_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Headers para endpoints públicos (sin Authorization). */
function buildPublicHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Guest-Id": getGuestId(),
  };
}

/**
 * Igual que público + Bearer solo si existe token. Cuando estamos
 * autenticados forzamos `X-Guest-Id` a string vacío: el JWT es la identidad
 * autoritativa y un id de invitado heredado de búsquedas anónimas previas
 * puede contaminar el scope del usuario en el backend (mismo contrato del
 * cliente Android `GuestSessionInterceptor`).
 */
function buildAuthHeaders() {
  const headers = buildPublicHeaders();
  const token = getAuthToken()?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Guest-Id"] = "";
  }
  return headers;
}

/**
 * GET/POST… a `BASE_URL` sin enviar Authorization (búsqueda, catálogo, etc.).
 */
export async function publicFetch(path, options = {}) {
  const url = joinApiUrl(path);
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...buildPublicHeaders(),
      ...extraHeaders,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * GET/POST… a `BASE_URL` con Authorization Bearer si hay token; si no, mismo comportamiento que público.
 * Usar en flujos de reserva/pago y cualquier ruta que deba asociarse al usuario logueado.
 */
export async function authFetch(path, options = {}) {
  const url = joinApiUrl(path);
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...buildAuthHeaders(),
      ...extraHeaders,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Fetch autenticado opcional contra una URL absoluta (p. ej. microservicio de analíticas).
 */
export async function authFetchAbsolute(url, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...buildAuthHeaders(),
      ...extraHeaders,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`API error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return parseJsonSafe(text);
}

function parseJsonSafe(text) {
  if (!text || !String(text).trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: String(text).trim() };
  }
}

function messageFromApiErrorBody(data) {
  if (!data || typeof data !== "object") return "";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => (typeof item === "object" && item !== null ? item.msg || item.message : item))
      .filter(Boolean)
      .join(" ");
  }
  if (data.message) return typeof data.message === "string" ? data.message : "";
  if (typeof data.error === "string") return data.error;
  return "";
}

function registerErrorMessage(data, status) {
  const fromBody = messageFromApiErrorBody(data);
  if (fromBody) return fromBody;
  if (status === 409) return "Este correo ya está registrado. Puedes iniciar sesión.";
  if (status === 422) return "Algunos datos no son válidos. Revisa el formulario e inténtalo de nuevo.";
  return "No se pudo completar el registro.";
}

function loginErrorMessage(data, status) {
  const fromBody = messageFromApiErrorBody(data);
  if (fromBody) return fromBody;
  if (status === 401 || status === 403) {
    return "Correo o contraseña incorrectos.";
  }
  if (status === 422) return "Revisa los datos e inténtalo de nuevo.";
  return "No se pudo iniciar sesión.";
}

// ─── Hotels ──────────────────────────────────────────────

/**
 * GET …/accommodations/hotels (base = …/service-core)
 * Returns all hotels. Used on Home page.
 */
export async function listHotels() {
  const data = await publicFetch("/accommodations/hotels");
  return data.map(mapHotelDto);
}

/** Mapea claves del sidebar → valor `amenities` en query (aire acond. → room_service). */
function mapAmenityKeyForApi(uiKey) {
  const k = String(uiKey || "").trim();
  if (!k) return "";
  if (k === "air_conditioning") return "room_service";
  return k;
}

/**
 * Parámetros `amenities` en la URL que el backend usa pero el sidebar identifica con otra clave.
 */
export const SEARCH_AMENITY_QUERY_TO_UI = Object.freeze({
  room_service: "air_conditioning",
  private_pool: "pool",
});

function appendSearchParam(sp, key, value) {
  if (value === undefined || value === null) return;
  const s = typeof value === "string" ? value.trim() : String(value).trim();
  if (s === "") return;
  sp.append(key, s);
}

/**
 * Construye el query string para GET /accommodations/search.
 * Omite valores vacíos/undefined. Repite `amenities` por cada ítem del array.
 *
 * @param {{
 *   city: string,
 *   check_in: string,
 *   check_out: string,
 *   guests?: string | number,
 *   price_min?: string | number,
 *   price_max?: string | number,
 *   min_stars?: string | number,
 *   amenities?: string[],
 *   page?: string | number,
 *   page_size?: string | number,
 * }} params
 * @returns {string}
 */
export function buildAccommodationSearchQueryString(params) {
  if (!params || typeof params !== "object") return "";
  const sp = new URLSearchParams();
  appendSearchParam(sp, "city", params.city);
  appendSearchParam(sp, "check_in", params.check_in);
  appendSearchParam(sp, "check_out", params.check_out);
  appendSearchParam(sp, "guests", params.guests);
  appendSearchParam(sp, "price_min", params.price_min);
  appendSearchParam(sp, "price_max", params.price_max);
  if (params.min_stars != null && Number(params.min_stars) >= 1) {
    appendSearchParam(sp, "min_stars", params.min_stars);
  }
  appendSearchParam(sp, "page", params.page);
  appendSearchParam(sp, "page_size", params.page_size);

  const amenities = params.amenities;
  if (Array.isArray(amenities)) {
    for (const raw of amenities) {
      const apiKey = mapAmenityKeyForApi(String(raw || "").trim());
      if (apiKey) sp.append("amenities", apiKey);
    }
  }

  return sp.toString();
}

/**
 * GET …/accommodations/search con query dinámico (ciudad, fechas, huéspedes, precio, estrellas, amenities, paginación).
 * @param {Parameters<typeof buildAccommodationSearchQueryString>[0]} params
 * @returns {Promise<Array<ReturnType<typeof mapSearchResultDto>>>}
 */
export async function searchAccommodations(params) {
  const qs = buildAccommodationSearchQueryString(params);
  if (!qs) {
    throw new Error("Parámetros de búsqueda incompletos.");
  }
  const data = await publicFetch(`/accommodations/search?${qs}`);
  const resultsArray = data.result || [];
  return resultsArray.map(mapSearchResultDto);
}

/**
 * GET …/accommodations/hotels/{id}/availability?check_in=&check_out=
 * Get hotel detail with available room types for given dates.
 */
export async function getHotelAvailability(hotelId, checkIn, checkOut) {
  const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut });
  const data = await publicFetch(
    `/accommodations/hotels/${hotelId}/availability?${params}`
  );
  return mapAvailabilityDto(data);
}

// ─── Reservations ────────────────────────────────────────

export async function createBooking(bookingInfo) {
  return authFetch("/reservation-flow/create", {
    method: "POST",
    body: JSON.stringify(bookingInfo),
  });
}

export async function processPayment(paymentInfo) {
  return authFetch("/reservation-flow/payment", {
    method: "POST",
    body: JSON.stringify(paymentInfo),
  });
}

/**
 * GET …/reservations/user?limit=&offset= (Bearer).
 *
 * Mismo endpoint que el cliente Android. El backend deriva el `user_id`
 * del JWT, así que la ruta NO recibe ningún id en el path. Lanza si no hay
 * sesión activa para evitar disparar 401 silenciosos desde la UI.
 *
 * @param {{ limit?: number, offset?: number }} [opts]
 * @returns {Promise<{ items: object[], total: number, limit: number, offset: number }>}
 */
export async function listUserReservations(opts = {}) {
  if (!isAuthenticated()) {
    const err = new Error("No hay sesión activa. Inicia sesión de nuevo.");
    err.status = 401;
    throw err;
  }
  const limit = Number.isFinite(opts.limit) ? opts.limit : 20;
  const offset = Number.isFinite(opts.offset) ? opts.offset : 0;
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const path = `${USER_RESERVATIONS_PATH}?${qs.toString()}`;
  const data = await authFetch(path, { method: "GET" });
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  const total = Number.isFinite(data?.total) ? data.total : items.length;
  return {
    items,
    total,
    limit,
    offset,
  };
}

/**
 * Normaliza un item del listado backend (`/reservations/user`) al shape
 * que renderiza `MyTripsPage` (`r.hotel.{name,location,image,rating}`,
 * `r.checkIn`, `r.checkOut`, `r.total`, `r.reference`, …). Acepta una
 * `hotelsById` opcional (mapa de id → hotel del catálogo público) para
 * resolver nombre/ciudad cuando el backend no los devuelve en el listado.
 *
 * @param {Record<string, unknown>} dto
 * @param {Map<string, ReturnType<typeof mapHotelDto>>} [hotelsById]
 */
export function mapUserReservationDto(dto, hotelsById) {
  const hotelId = dto?.hotel_id ?? dto?.hotelId ?? null;
  const hotel = hotelId && hotelsById?.get?.(hotelId);
  const totalRaw = dto?.total_price ?? dto?.totalPrice ?? 0;
  const totalNum = Number(totalRaw);
  const guestsRaw = dto?.guests;
  const guests = Number.isFinite(Number(guestsRaw)) ? Number(guestsRaw) : 1;
  const checkIn = String(dto?.check_in ?? dto?.checkIn ?? "");
  const checkOut = String(dto?.check_out ?? dto?.checkOut ?? "");
  const nights = (() => {
    const a = checkIn && new Date(`${checkIn}T12:00:00`);
    const b = checkOut && new Date(`${checkOut}T12:00:00`);
    if (!(a instanceof Date) || !(b instanceof Date)) return null;
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    const ms = b.getTime() - a.getTime();
    return ms > 0 ? Math.round(ms / 86400000) : null;
  })();
  const reservationId = dto?.id ?? dto?.reservation_id ?? null;
  return {
    id: reservationId,
    // `apiReservationId` activa el slug `t:"api"` en MyTripsPage al armar
    // el link del card. Sin esto, la ruta cae al `encodeBookingDetailSlug`
    // (forma local con `savedAt`), TripDetailPage no encuentra la reserva
    // en el storage local porque vino solo del backend, y el detalle
    // queda muerto. Con el id presente, TripDetailPage hace
    // `getHotelReservationDetailFromApi(id)` y renderiza correctamente.
    apiReservationId:
      reservationId != null && String(reservationId).trim() !== ""
        ? String(reservationId)
        : null,
    reference: dto?.confirmation_code ?? dto?.confirmationCode ?? "",
    hotel: {
      id: hotelId,
      name: hotel?.name ?? "Alojamiento",
      location: hotel?.location ?? "—",
      image: null,
      rating: hotel?.rating ?? null,
    },
    checkIn,
    checkOut,
    nights,
    guests,
    total: Number.isFinite(totalNum) ? totalNum : 0,
    roomType: typeof dto?.room_type_name === "string" ? dto.room_type_name : null,
    paymentLabel: "Tarjeta",
    status: typeof dto?.status === "string" ? dto.status : null,
    source: "backend",
  };
}

/**
 * POST /auth/register (configurable con VITE_REGISTER_PATH)
 * Crea usuario. Respuesta 201: id, email, first_name, last_name, user_type (+ token opcional).
 *
 * @param {{
 *   email: string,
 *   password: string,
 *   first_name: string,
 *   last_name: string,
 *   user_type?: string,
 *   phone?: string | null,
 *   country_id?: string | null,
 * }} payload — `user_type`, `country_id` y `phone` son opcionales; si faltan: viajero, `country_id` null, `phone` null.
 * @returns {Promise<{
 *   id: string,
 *   email: string,
 *   first_name: string,
 *   last_name: string,
 *   user_type: string,
 *   token: string | null,
 * }>}
 */
export async function registerUser(payload) {
  const body = {
    email: payload.email,
    password: payload.password,
    first_name: payload.first_name,
    last_name: payload.last_name,
    user_type: payload.user_type ?? REGISTER_DEFAULT_USER_TYPE,
    phone: payload.phone ?? null,
    country_id: payload.country_id ?? null,
  };

  const url = joinApiUrl(REGISTER_PATH);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Id": getGuestId(),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const data = parseJsonSafe(text);

  if (!res.ok) {
    const err = new Error(registerErrorMessage(data, res.status));
    err.status = res.status;
    err.body = data;
    throw err;
  }

  const token =
    data.token ||
    data.access_token ||
    data.accessToken ||
    null;

  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    user_type: data.user_type,
    token,
  };
}

/**
 * POST /auth/login (configurable con VITE_LOGIN_PATH).
 *
 * Además del token, el backend devuelve los datos del usuario que la UI
 * necesita para pre-rellenar formularios (`first_name`, `last_name`,
 * `email`). Los exponemos junto al token; `persistSessionFromLogin` los
 * guarda en storage para que cualquier pantalla pueda leerlos sin tener
 * que decodificar el JWT.
 *
 * @returns {Promise<{
 *   access_token: string,
 *   token_type: string,
 *   user_type: string,
 *   first_name: string | null,
 *   last_name: string | null,
 *   email: string | null,
 * }>}
 */
export async function loginUser({ email, password }) {
  try {
    const emailNorm = String(email ?? "").trim().toLowerCase();
    const url = joinApiUrl(LOGIN_PATH);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Guest-Id": getGuestId(),
      },
      body: JSON.stringify({ email: emailNorm, password }),
    });

    const text = await res.text();
    const data = parseJsonSafe(text);

    if (!res.ok) {
      const err = new Error(loginErrorMessage(data, res.status));
      err.status = res.status;
      err.body = data;
      throw err;
    }

    const access_token = normalizeBearerValue(
      data.access_token ?? data.token ?? data.accessToken,
    );
    return {
      access_token,
      token_type: data.token_type,
      user_type: data.user_type,
      first_name: typeof data.first_name === "string" ? data.first_name : null,
      last_name: typeof data.last_name === "string" ? data.last_name : null,
      email: typeof data.email === "string" ? data.email : emailNorm,
    };
  } catch (err) {
    if (err && typeof err.status === "number") {
      throw err;
    }
    if (err instanceof TypeError) {
      throw new Error("No hay conexión o el servidor no respondió. Inténtalo más tarde.");
    }
    throw err instanceof Error ? err : new Error("No se pudo iniciar sesión.");
  }
}

/**
 * GET …/analitycs/dahsboard?start_date=&end_date= (Bearer token).
 * @param {{ startDate: string, endDate: string }} range - Fechas inclusivas YYYY-MM-DD (primer y último día del mes).
 * @returns {Promise<object>} Cuerpo JSON del panel (reservas, ingresos, reservas detalle, etc.).
 */
export async function getDashboardAnalytics({ startDate, endDate }) {
  if (!isAuthenticated()) {
    const err = new Error("No hay sesión activa. Inicia sesión de nuevo.");
    err.status = 401;
    throw err;
  }
  if (!startDate || !endDate || typeof startDate !== "string" || typeof endDate !== "string") {
    const err = new Error("Rango de fechas inválido para el panel.");
    err.status = 400;
    throw err;
  }
  try {
    const base = joinAnalyticsUrl(ANALYTICS_DASHBOARD_PATH);
    const qs = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    const url = `${base}?${qs.toString()}`;
    const data = await authFetchAbsolute(url, { method: "GET" });

    return data;
  } catch (err) {
    if (err && typeof err.status === "number") {
      if (err.status === 401 || err.status === 403) {
        const friendly = new Error(
          "Tu sesión expiró o no tienes permiso para ver el panel. Inicia sesión de nuevo.",
        );
        friendly.status = err.status;
        throw friendly;
      }
      throw err;
    }
    if (err instanceof TypeError) {
      throw new Error("No hay conexión o el servidor no respondió. Inténtalo más tarde.");
    }
    throw err instanceof Error ? err : new Error("No se pudo cargar el panel de analíticas.");
  }
}

/**
 * GET …/reservations/:id (Bearer). Cuerpo esperado: objeto reserva o `{ reservation }`.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getHotelReservationDetailFromApi(id) {
  if (!isAuthenticated()) {
    const err = new Error("No hay sesión activa. Inicia sesión de nuevo.");
    err.status = 401;
    throw err;
  }
  const rid = String(id || "").trim();
  if (!rid) {
    const err = new Error("Identificador de reserva no válido.");
    err.status = 400;
    throw err;
  }
  try {
    const base = RESERVATION_DETAIL_PATH.replace(/\/+$/, "");
    const path = `${base}/${encodeURIComponent(rid)}`;
    const data = await authFetch(path, { method: "GET" });
    const raw = data?.reservation && typeof data.reservation === "object" ? data.reservation : data;
    return raw;
  } catch (err) {
    if (err && typeof err.status === "number") {
      if (err.status === 401 || err.status === 403) {
        const friendly = new Error(
          "Tu sesión expiró o no tienes permiso para ver esta reserva. Inicia sesión de nuevo.",
        );
        friendly.status = err.status;
        throw friendly;
      }
      throw err;
    }
    if (err instanceof TypeError) {
      throw new Error("No hay conexión o el servidor no respondió. Inténtalo más tarde.");
    }
    throw err instanceof Error ? err : new Error("No se pudo cargar el detalle de la reserva.");
  }
}

/**
 * Normaliza un documento de reserva (listado, GET por id) para el sondeo in-app.
 * @param {object} r
 * @returns {null | { id: string, statusNorm: string, hotelName: string, checkIn: string, checkOut: string, raw: object }}
 */
function mapRawReservationToPollItem(r) {
  if (!r || typeof r !== "object") return null;
  const id =
    (r.id != null && String(r.id).trim() !== "" ? String(r.id).trim() : null) ||
    (r.reservation_id != null && String(r.reservation_id).trim() !== ""
      ? String(r.reservation_id).trim()
      : null) ||
    (r.confirmation_code != null && String(r.confirmation_code).trim() !== ""
      ? String(r.confirmation_code).trim()
      : null);
  if (!id) return null;
  const statusStr = String(r.status || r.booking_status || r.state || "").toLowerCase();
  let statusNorm = "other";
  if (
    statusStr.includes("confirm") ||
    statusStr === "ok" ||
    statusStr === "active"
  ) {
    statusNorm = "confirmed";
  } else if (statusStr.includes("cancel") || statusStr.includes("anulad")) {
    statusNorm = "cancelled";
  } else if (
    statusStr.includes("pend") ||
    statusStr === "pending" ||
    statusStr === "processing"
  ) {
    statusNorm = "pending";
  }
  const h = r.hotel && typeof r.hotel === "object" ? r.hotel : {};
  const hotelName = String(
    h.name || r.hotel_name || r.hotelName || "Alojamiento",
  );
  return {
    id,
    statusNorm,
    hotelName,
    checkIn: String(r.check_in || r.checkIn || "").slice(0, 10),
    checkOut: String(r.check_out || r.checkOut || "").slice(0, 10),
    raw: r,
  };
}

/**
 * Listado de reservas del viajero (GET `/reservations/user`) mapeado a la forma de Mis viajes / detalle.
 * @returns {Promise<object[]>}
 */
export async function getTravelerReservationsListForUI() {
  const rows = await listTravelerReservationsForStatusPoll();
  const out = [];
  for (const row of rows) {
    if (!row.raw || typeof row.raw !== "object") continue;
    const mapped = mapApiReservationToTripDetail(row.raw);
    if (mapped) out.push(mapped);
  }
  return out;
}

/**
 * Convierte distintas formas de respuesta del listado a un array de reservas.
 * @param {object} data
 * @returns {object[]}
 */
function pickReservationsArrayFromListBody(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.reservations)) return data.reservations;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.result)) return data.result;
  return [];
}

/**
 * Reservas del viajero (GET con Bearer) para comprobar cambios de estado. Errores o rutas
 * inexistentes devuelven lista vacía para no interrumpir la app.
 * @returns {Promise<Array<{
 *   id: string,
 *   statusNorm: "confirmed"|"pending"|"cancelled"|"other",
 *   hotelName: string,
 *   checkIn: string,
 *   checkOut: string,
 *   raw: object,
 * }>>}
 */
export async function listTravelerReservationsForStatusPoll() {
  const token = getAuthToken();
  if (!token) return [];
  const path = String(
    TRAVELER_RESERVATIONS_LIST_PATH || "/reservations/user",
  ).replace(/^\//, "");
  const qs = new URLSearchParams({
    limit: "100",
    offset: "0",
  });
  const url = `${joinApiUrl(`/${path}`)}?${qs.toString()}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Guest-Id": getGuestId(),
      },
    });
    if (res.status === 401 || res.status === 403) return [];
    if (!res.ok) return [];
    const text = await res.text();
    const data = parseJsonSafe(text);
    const list = pickReservationsArrayFromListBody(data);
    return list
      .map((item) => {
        const row = item && typeof item === "object" ? item : {};
        return mapRawReservationToPollItem(row);
      })
      .filter((x) => x != null && x.id);
  } catch {
    return [];
  }
}

/**
 * GET `/reservations/{reservation_id}` (OpenAPI) para un solo id; no lanza, útil en sondeo.
 * @param {string} reservationId
 * @returns {Promise<object | null>} mismo shape que el listado, o null
 */
export async function getTravelerReservationByIdForPoll(reservationId) {
  if (!getAuthToken()) return null;
  const id = String(reservationId || "").trim();
  if (!id) return null;
  try {
    const raw = await getHotelReservationDetailFromApi(id);
    return mapRawReservationToPollItem(raw);
  } catch {
    return null;
  }
}

/**
 * Listado (GET /reservations/user) + para cada reserva local con `apiReservationId`
 * cuyo id aún no vino en el listado, GET `/reservations/{reservation_id}`.
 * @returns {Promise<object[]>} ítems normalizados para el toast de confirmación
 */
export async function getTravelerReservationsForStatusPollMerged() {
  return listTravelerReservationsForStatusPoll();
}

/**
 * POST al microservicio de notificaciones (misma base que VITE_ANALYTICS_API_URL / service-soport).
 * Cuerpo: `{ email, message }` según el contrato de `/notification/send-email`.
 * @param {{ email: string, message: string }} p
 * @returns {Promise<boolean>} true si la respuesta HTTP es 2xx
 */
export async function sendEmailNotification({ email, message }) {
  const em = String(email || "").trim();
  if (!em) return false;
  const path = String(NOTIFICATION_SEND_EMAIL_PATH || "/notification/send-email")
    .replace(/^\//, "");
  const url = joinAnalyticsUrl(`/${path}`);
  const body = { email: em, message: String(message || "") };
  const token = bearerTokenForSoportSendEmail();
  if (!token) {
    return false;
  }
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST …/reservation-flow/create
 * Create a new reservation.
 */
export async function createReservation({
  hotelId,
  roomTypeId,
  checkIn,
  checkOut,
  guests,
  totalPrice,
  pricePerNight,
  nights,
  guestFirstName,
  guestLastName,
  // guestEmail — not sent to API, only used in confirmation UI
  cardNumber,
}) {
  const body = {
    hotel_id: hotelId,
    room_type_id: roomTypeId,
    check_in: checkIn,
    check_out: checkOut,
    guests,
    base_price: (pricePerNight * nights).toFixed(2),
    taxes: "0.00",
    discounts: "0.00",
    total_price: Number(totalPrice).toFixed(2),
    currency_code: "USD",
    primary_guest: {
      first_name: guestFirstName || "Guest",
      last_name: guestLastName || "",
      document_type: "CC",
      document_number: "0000000000",
      nationality: "COL",
    },
    payment: {
      amount: Number(totalPrice).toFixed(2),
      currency_code: "USD",
      payment_token: `tok_visa_${(cardNumber || "4242424242424242").replace(/\D/g, "")}`,
    },
    special_requests: "",
  };

  const data = await authFetch("/reservation-flow/create", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return data;
}

// ─── Mappers ─────────────────────────────────────────────

/** Map GET /hotels response item → app hotel shape */
function mapHotelDto(dto) {
  return {
    id: dto.id,
    name: dto.name,
    location: `${dto.city}, ${countryForCity(dto.city)}`,
    city: dto.city,
    rating: parseFloat(dto.rating) || 0,
    reviewsCount: dto.total_reviews || 0,
    price: 0, // No price without dates
    image: null,
    amenities: [],
    availableRooms: [],
    stars: dto.stars,
    description: dto.description,
    address: dto.address,
    isRefundable: true,
  };
}

/** Map GET /search response item → app hotel shape */
function mapSearchResultDto(dto) {
  const rooms = (dto.available_room_types || []).map(mapRoomType);
  const minPrice = rooms.length > 0
    ? Math.min(...rooms.map((r) => r.pricePerNight))
    : 0;
  const amenities = [
    ...new Set(rooms.flatMap((r) => r.amenities)),
  ];

  const starsNum = Number(dto.stars);
  const stars = Number.isFinite(starsNum) ? starsNum : 0;

  return {
    id: dto.hotel_id ?? dto.id,
    name: dto.hotel_name ?? dto.name,
    location: `${dto.city}, ${countryForCity(dto.city)}`,
    city: dto.city,
    rating: parseFloat(dto.rating) || 0,
    reviewsCount: 0,
    price: minPrice,
    image: null,
    amenities,
    availableRooms: rooms.map((r) => r.name),
    availableRoomObjects: rooms,
    stars,
    description: dto.description,
    address: dto.address,
    checkInTime: dto.check_in_time,
    checkOutTime: dto.check_out_time,
    isRefundable: true,
  };
}

/** Map GET /availability response → app hotel shape */
function mapAvailabilityDto(dto) {
  const rooms = (dto.available_room_types || []).map(mapRoomType);
  const minPrice = rooms.length > 0
    ? Math.min(...rooms.map((r) => r.pricePerNight))
    : 0;
  const amenities = [
    ...new Set(rooms.flatMap((r) => r.amenities)),
  ];

  const starsNum = Number(dto.stars);
  const stars = Number.isFinite(starsNum) ? starsNum : 0;

  return {
    id: dto.hotel_id ?? dto.id,
    name: dto.hotel_name ?? dto.name,
    location: `${dto.city}, ${countryForCity(dto.city)}`,
    city: dto.city,
    rating: parseFloat(dto.rating) || 0,
    reviewsCount: 0,
    price: minPrice,
    image: null,
    amenities,
    availableRooms: rooms.map((r) => r.name),
    availableRoomObjects: rooms,
    stars,
    description: dto.description,
    nights: dto.nights,
    checkInTime: dto.check_in_time,
    checkOutTime: dto.check_out_time,
    isRefundable: true,
  };
}

function mapRoomAmenityName(a) {
  if (a == null) return "";
  if (typeof a === "string") return a.trim();
  if (typeof a === "object" && typeof a.name === "string") return a.name.trim();
  return "";
}

/** Map a room type DTO → app room shape */
function mapRoomType(dto) {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    maxCapacity: dto.max_capacity,
    bedType: dto.bed_type,
    sizeSqm: parseFloat(dto.size_sqm) || 0,
    pricePerNight: parseFloat(dto.price_per_night) || 0,
    totalPrice: parseFloat(dto.total_price) || 0,
    currencyCode: dto.currency_code || "USD",
    minimumStay: dto.minimum_stay || 1,
    amenities: (dto.amenities || []).map(mapRoomAmenityName).filter(Boolean),
  };
}
