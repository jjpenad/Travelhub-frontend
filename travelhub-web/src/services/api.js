/**
 * TravelHub API service layer.
 * Centralizes all backend calls. Replace VITE_API_URL in .env to point to a different backend.
 */

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

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

/**
 * Generic fetch wrapper with JSON parsing and error handling.
 */
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
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

// ─── Hotels ──────────────────────────────────────────────

/**
 * GET /service-core/accommodations/hotels
 * Returns all hotels. Used on Home page.
 */
export async function listHotels() {
  const data = await apiFetch("/service-core/accommodations/hotels");
  return data.map(mapHotelDto);
}

/**
 * GET /service-core/accommodations/search?city=&check_in=&check_out=
 * Search hotels with availability for given city and dates.
 */
export async function searchAccommodations(city, checkIn, checkOut) {
  const params = new URLSearchParams({ city, check_in: checkIn, check_out: checkOut });
  const data = await apiFetch(`/service-core/accommodations/search?${params}`);
  // The API now returns an object with a 'result' array
  const resultsArray = data.result || [];
  return resultsArray.map(mapSearchResultDto);
}

/**
 * GET /service-core/accommodations/hotels/{id}/availability?check_in=&check_out=
 * Get hotel detail with available room types for given dates.
 */
export async function getHotelAvailability(hotelId, checkIn, checkOut) {
  const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut });
  const data = await apiFetch(
    `/service-core/accommodations/hotels/${hotelId}/availability?${params}`
  );
  return mapAvailabilityDto(data);
}

// ─── Reservations ────────────────────────────────────────

export async function createBooking(bookingInfo) {
  return apiFetch("/service-core/reservation-flow/create", {
    method: "POST",
    body: JSON.stringify(bookingInfo),
  });
}

export async function processPayment(paymentInfo) {
  return apiFetch("/service-core/reservation-flow/payment", {
    method: "POST",
    body: JSON.stringify(paymentInfo),
  });
}

export async function registerUser(userData) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * POST /service-core/reservation-flow/create
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

  const data = await apiFetch("/service-core/reservation-flow/create", {
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
