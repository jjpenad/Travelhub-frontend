/**
 * Sesión en cliente. El `userId` debe venir del backend (login), no inventarse en el front.
 * Mientras no haya login real: VITE_HOTEL_USER_ID o FALLBACK_* (mismo seed que tus datos de prueba).
 */

export const AUTH_ROLE_KEY = "travelhub-role";
export const AUTH_EMAIL_KEY = "travelhub-email";
/** UUID de usuario (backend) — listar reservas: GET /reservations/user/{id} */
export const AUTH_USER_ID_KEY = "travelhub-user-id";

/** Último bloque 12 hex; el seed de demo usa …0001 (no 0000…). */
export const FALLBACK_HOTEL_USER_ID =
  import.meta.env.VITE_HOTEL_USER_ID || "d1000000-0000-0000-0000-000000000001";

/**
 * Saca `user_id` de la respuesta de login; nombres habituales en APIs.
 * @param {unknown} data — JSON de POST /auth/login (o similar)
 * @returns {string | null}
 */
function strField(obj, key) {
  if (!obj || typeof obj !== "object") return null;
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function userIdFromAuthResponse(data) {
  if (!data || typeof data !== "object") return null;
  const nested = data.user;
  if (nested && typeof nested === "object") {
    const id = strField(nested, "id") || strField(nested, "user_id");
    if (id) return id;
  }
  const inner = data.data;
  if (inner && typeof inner === "object") {
    const id = strField(inner, "user_id") || strField(inner, "id");
    if (id) return id;
  }
  return (
    strField(data, "user_id") ||
    strField(data, "userId") ||
    strField(data, "id") ||
    strField(data, "sub")
  );
}

export const ROLE_HOTEL = "hotel";
export const ROLE_TRAVELER = "traveler";

export function setSessionUser({ role, email, remember, userId }) {
  clearSessionUser();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_ROLE_KEY, role);
  storage.setItem(AUTH_EMAIL_KEY, email);
  if (userId) {
    storage.setItem(AUTH_USER_ID_KEY, String(userId));
  }
}

export function clearSessionUser() {
  for (const key of [AUTH_ROLE_KEY, AUTH_EMAIL_KEY, AUTH_USER_ID_KEY]) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}

export function getSessionRole() {
  return localStorage.getItem(AUTH_ROLE_KEY) || sessionStorage.getItem(AUTH_ROLE_KEY);
}

export function getSessionEmail() {
  return localStorage.getItem(AUTH_EMAIL_KEY) || sessionStorage.getItem(AUTH_EMAIL_KEY);
}

export function getSessionUserId() {
  return localStorage.getItem(AUTH_USER_ID_KEY) || sessionStorage.getItem(AUTH_USER_ID_KEY);
}

export function isLoggedIn() {
  const r = getSessionRole();
  return r === ROLE_HOTEL || r === ROLE_TRAVELER;
}

/** Sesión del portal de viajeros (no incluye rol hotel). */
export function isTravelerLoggedIn() {
  return getSessionRole() === ROLE_TRAVELER;
}
