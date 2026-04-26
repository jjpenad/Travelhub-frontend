/**
 * Claves de sesión mock hasta integrar API de autenticación
 */

import { PATH_HOTEL_PORTAL_HOME, PATH_TRAVELERS_HOME } from "../constants/routes";
import { claimsFromJwtPayload, decodeJwtPayload } from "./jwt";

export const AUTH_ROLE_KEY = "travelhub-role";
export const AUTH_EMAIL_KEY = "travelhub-email";
/** Valor crudo de `user_type` devuelto por el backend (opcional) */
export const AUTH_USER_TYPE_KEY = "travelhub-user-type";
/** Token JWT u otro bearer devuelto por el backend (solo localStorage) */
export const AUTH_TOKEN_KEY = "travelhub-auth-token";

export const ROLE_HOTEL = "hotel";
export const ROLE_TRAVELER = "traveler";

/** Evento DOM para sincronizar UI en la misma pestaña tras login/logout/registro. */
export const SESSION_CHANGED_EVENT = "travelhub-session-changed";

function dispatchSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
  }
}

function clearSessionRoleEmail() {
  for (const key of [AUTH_ROLE_KEY, AUTH_EMAIL_KEY, AUTH_USER_TYPE_KEY]) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}

/** Mapea `user_type` del API al rol de la app. */
export function roleFromApiUserType(userType) {
  const t = String(userType || "").toLowerCase();
  if (t === "hotel" || t === "admin_hotel" || t === "hotel_admin") return ROLE_HOTEL;
  return ROLE_TRAVELER;
}

/** Ruta inicial tras login o registro+login según `user_type` del API. */
export function pathAfterAuthForUserType(userType) {
  return roleFromApiUserType(userType) === ROLE_HOTEL
    ? PATH_HOTEL_PORTAL_HOME
    : PATH_TRAVELERS_HOME;
}

/**
 * Ruta de destino tras autenticación: `from` (solo paths internos) para viajeros, si no el home por rol.
 * @param {string | undefined} from - p. ej. `location.state.from` desde ProtectedTravelerRoute
 */
export function getPostAuthDestination(userType, from) {
  const role = roleFromApiUserType(userType);
  if (
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    role === ROLE_TRAVELER
  ) {
    return from;
  }
  return pathAfterAuthForUserType(userType);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Usuario de sesión actual (email, rol y tipo API) leídos del almacenamiento.
 * @returns {{ email: string | null, role: string | null, userType: string | null, hasToken: boolean } | null}
 */
export function getUser() {
  const email = getSessionEmail();
  const role = getSessionRole();
  const userType = getSessionUserType();
  const token = getAuthToken()?.trim() || null;
  if (!token && !email && !role) {
    return null;
  }
  return {
    email: email ?? null,
    role: role ?? null,
    userType: userType ?? null,
    hasToken: Boolean(token),
  };
}

/** Hay token JWT guardado (llamadas autenticadas al API). */
export function isAuthenticated() {
  return Boolean(getAuthToken()?.trim());
}

/**
 * Identidad del usuario actual leída directamente del JWT (claims
 * `sub` / `email` / `given_name` / `family_name` y variantes).
 *
 * Devuelve `null` si no hay token o el token no se puede decodificar.
 * Útil para pre-rellenar formularios (checkout, perfil) sin tener que
 * hacer un round-trip extra al backend, igual que el cliente Android
 * lee `authRepository.getSession().fullName / .email`.
 *
 * @returns {{ userId: string | null, email: string | null, firstName: string, lastName: string } | null}
 */
export function getCurrentUserClaims() {
  const token = getAuthToken()?.trim();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const claims = claimsFromJwtPayload(payload);
  if (!claims) return null;

  // Si el JWT no trajo email pero el storage sí (caso del backend que solo
  // emite `sub` y trae el email aparte en la respuesta de login), usamos
  // el email persistido como respaldo.
  if (!claims.email) {
    const storedEmail = getSessionEmail();
    if (storedEmail) {
      return { ...claims, email: storedEmail };
    }
  }
  return claims;
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Guarda token y sesión tras login (o registro + login). No borra el token que acabas de guardar.
 */
export function persistSessionFromLogin({
  email,
  accessToken,
  userType,
  remember = true,
}) {
  if (accessToken) {
    setAuthToken(accessToken);
  }
  const role = roleFromApiUserType(userType);
  const storage = remember ? localStorage : sessionStorage;
  clearSessionRoleEmail();
  storage.setItem(AUTH_ROLE_KEY, role);
  storage.setItem(AUTH_EMAIL_KEY, email.trim().toLowerCase());
  if (userType != null && String(userType).trim() !== "") {
    storage.setItem(AUTH_USER_TYPE_KEY, String(userType));
  }
  dispatchSessionChanged();
}

export function setSessionUser({ role, email, remember, userType }) {
  const storage = remember ? localStorage : sessionStorage;
  clearSessionRoleEmail();
  storage.setItem(AUTH_ROLE_KEY, role);
  storage.setItem(AUTH_EMAIL_KEY, email.trim().toLowerCase());
  if (userType != null && String(userType).trim() !== "") {
    storage.setItem(AUTH_USER_TYPE_KEY, String(userType));
  }
  dispatchSessionChanged();
}

export function clearSessionUser() {
  clearAuthToken();
  clearSessionRoleEmail();
  dispatchSessionChanged();
}

export function getSessionUserType() {
  return localStorage.getItem(AUTH_USER_TYPE_KEY) || sessionStorage.getItem(AUTH_USER_TYPE_KEY);
}

export function getSessionRole() {
  return localStorage.getItem(AUTH_ROLE_KEY) || sessionStorage.getItem(AUTH_ROLE_KEY);
}

export function getSessionEmail() {
  return localStorage.getItem(AUTH_EMAIL_KEY) || sessionStorage.getItem(AUTH_EMAIL_KEY);
}

export function isLoggedIn() {
  const r = getSessionRole();
  return r === ROLE_HOTEL || r === ROLE_TRAVELER;
}

/** Sesión del portal de viajeros (no incluye rol hotel). */
export function isTravelerLoggedIn() {
  return getSessionRole() === ROLE_TRAVELER;
}

/** Viajero con token: rutas como Mis viajes y detalle de reserva. */
export function canAccessTravelerAccountRoutes() {
  return isAuthenticated() && isTravelerLoggedIn();
}
