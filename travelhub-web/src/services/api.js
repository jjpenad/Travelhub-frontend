/**
 * TravelHub API service layer.
 * VITE_API_URL debe ser la raíz del API (incluye `/service-core` si el backend lo usa así).
 */

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://k8s-travelhubdev-3d982ad1bb-1106876598.us-east-2.elb.amazonaws.com/service-core";

/** Registro de usuario. Sobrescribir con VITE_REGISTER_PATH en .env si el backend usa otra ruta. */
const REGISTER_PATH = import.meta.env.VITE_REGISTER_PATH || "/auth/register";

/** Inicio de sesión. Sobrescribir con VITE_LOGIN_PATH en .env si el backend usa otra ruta. */
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/auth/login";

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

/**
 * Generic fetch wrapper with JSON parsing and error handling.
 */
async function apiFetch(path, options = {}) {
  const url = joinApiUrl(path);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Id": getGuestId(),
      ...options.headers
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
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
  const data = await apiFetch("/accommodations/hotels");
  return data.map(mapHotelDto);
}

/**
 * GET …/accommodations/search?city=&check_in=&check_out=
 * Search hotels with availability for given city and dates.
 */
export async function searchAccommodations(city, checkIn, checkOut) {
  const params = new URLSearchParams({ city, check_in: checkIn, check_out: checkOut });
  const data = await apiFetch(`/accommodations/search?${params}`);
  // The API now returns an object with a 'result' array
  const resultsArray = data.result || [];
  return resultsArray.map(mapSearchResultDto);
}

/**
 * GET …/accommodations/hotels/{id}/availability?check_in=&check_out=
 * Get hotel detail with available room types for given dates.
 */
export async function getHotelAvailability(hotelId, checkIn, checkOut) {
  const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut });
  const data = await apiFetch(
    `/accommodations/hotels/${hotelId}/availability?${params}`
  );
  return mapAvailabilityDto(data);
}

// ─── Reservations ────────────────────────────────────────

export async function createBooking(bookingInfo) {
  return apiFetch("/reservation-flow/create", {
    method: "POST",
    body: JSON.stringify(bookingInfo),
  });
}

export async function processPayment(paymentInfo) {
  return apiFetch("/reservation-flow/payment", {
    method: "POST",
    body: JSON.stringify(paymentInfo),
  });
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
 * @returns {Promise<{ access_token: string, token_type: string, user_type: string }>}
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

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      user_type: data.user_type,
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

  const data = await apiFetch("/reservation-flow/create", {
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

  return {
    id: dto.hotel_id,
    name: dto.hotel_name,
    location: `${dto.city}, ${countryForCity(dto.city)}`,
    city: dto.city,
    rating: parseFloat(dto.rating) || 0,
    reviewsCount: 0,
    price: minPrice,
    image: null,
    amenities,
    availableRooms: rooms.map((r) => r.name),
    availableRoomObjects: rooms,
    stars: dto.stars,
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

  return {
    id: dto.hotel_id,
    name: dto.hotel_name,
    location: `${dto.city}, ${countryForCity(dto.city)}`,
    city: dto.city,
    rating: parseFloat(dto.rating) || 0,
    reviewsCount: 0,
    price: minPrice,
    image: null,
    amenities,
    availableRooms: rooms.map((r) => r.name),
    availableRoomObjects: rooms,
    stars: dto.stars,
    description: dto.description,
    nights: dto.nights,
    checkInTime: dto.check_in_time,
    checkOutTime: dto.check_out_time,
    isRefundable: true,
  };
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
    amenities: (dto.amenities || []).map((a) => a.name),
  };
}
