/**
 * Claves de sesión mock hasta integrar API de autenticación
 */

import { PATH_HOTEL_PORTAL_HOME, PATH_TRAVELERS_HOME } from "../constants/routes";

export const AUTH_ROLE_KEY = "travelhub-role";
export const AUTH_EMAIL_KEY = "travelhub-email";
/** Valor crudo de `user_type` devuelto por el backend (opcional) */
export const AUTH_USER_TYPE_KEY = "travelhub-user-type";
/** Token JWT u otro bearer devuelto por el backend (solo localStorage) */
export const AUTH_TOKEN_KEY = "travelhub-auth-token";
/** Nombre del usuario (`first_name` del response de /auth/login). */
export const AUTH_FIRST_NAME_KEY = "travelhub-first-name";
/** Apellidos del usuario (`last_name` del response de /auth/login). */
export const AUTH_LAST_NAME_KEY = "travelhub-last-name";

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
  for (const key of [
    AUTH_ROLE_KEY,
    AUTH_EMAIL_KEY,
    AUTH_USER_TYPE_KEY,
    AUTH_FIRST_NAME_KEY,
    AUTH_LAST_NAME_KEY,
  ]) {
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
 * Identidad del usuario actual leída desde el storage local. Estos valores
 * se persistieron al login (vienen del response de `/auth/login` o
 * `/auth/register`, no del JWT — el cliente nunca decodifica el token).
 *
 * Devuelve `null` si no hay token activo. Si hay token pero faltan datos
 * de usuario (sesión vieja, registro fallido a mitad de camino), devuelve
 * el shape con strings vacíos para que la UI pueda hacer pre-fill parcial
 * sin romperse.
 *
 * @returns {{ email: string | null, firstName: string, lastName: string } | null}
 */
export function getCurrentUserClaims() {
  const token = getAuthToken()?.trim();
  if (!token) return null;
  return {
    email: getSessionEmail(),
    firstName: getSessionFirstName() ?? "",
    lastName: getSessionLastName() ?? "",
  };
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Guarda token y sesión tras login (o registro + login). No borra el token que acabas de guardar.
 *
 * `firstName` / `lastName` vienen del response de `/auth/login` (o
 * `/auth/register`); los persistimos para que la UI pueda pre-rellenar
 * formularios sin tener que decodificar el JWT ni hacer un round-trip
 * extra al backend. Si el caller no los pasa, simplemente no se guarda
 * el campo (los formularios arrancarán vacíos en esos campos).
 */
export function persistSessionFromLogin({
  email,
  accessToken,
  userType,
  firstName,
  lastName,
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
  if (typeof firstName === "string" && firstName.trim() !== "") {
    storage.setItem(AUTH_FIRST_NAME_KEY, firstName);
  }
  if (typeof lastName === "string" && lastName.trim() !== "") {
    storage.setItem(AUTH_LAST_NAME_KEY, lastName);
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

export function getSessionFirstName() {
  return (
    localStorage.getItem(AUTH_FIRST_NAME_KEY) ||
    sessionStorage.getItem(AUTH_FIRST_NAME_KEY)
  );
}

export function getSessionLastName() {
  return (
    localStorage.getItem(AUTH_LAST_NAME_KEY) ||
    sessionStorage.getItem(AUTH_LAST_NAME_KEY)
  );
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
