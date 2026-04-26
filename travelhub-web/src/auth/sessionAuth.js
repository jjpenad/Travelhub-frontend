/** Claves de sesión mock hasta integrar API de autenticación */

export const AUTH_ROLE_KEY = "travelhub-role";
export const AUTH_EMAIL_KEY = "travelhub-email";
/** Valor crudo de `user_type` devuelto por el backend (opcional) */
export const AUTH_USER_TYPE_KEY = "travelhub-user-type";
/** Token JWT u otro bearer devuelto por el backend (solo localStorage) */
export const AUTH_TOKEN_KEY = "travelhub-auth-token";

export const ROLE_HOTEL = "hotel";
export const ROLE_TRAVELER = "traveler";

function clearSessionRoleEmail() {
  for (const key of [AUTH_ROLE_KEY, AUTH_EMAIL_KEY, AUTH_USER_TYPE_KEY]) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}

/** Mapea `user_type` del API al rol de la app. */
export function roleFromApiUserType(userType) {
  const t = String(userType || "").toLowerCase();
  if (t === "hotel" || t === "admin_hotel") return ROLE_HOTEL;
  return ROLE_TRAVELER;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
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
}

export function setSessionUser({ role, email, remember, userType }) {
  const storage = remember ? localStorage : sessionStorage;
  clearSessionRoleEmail();
  storage.setItem(AUTH_ROLE_KEY, role);
  storage.setItem(AUTH_EMAIL_KEY, email.trim().toLowerCase());
  if (userType != null && String(userType).trim() !== "") {
    storage.setItem(AUTH_USER_TYPE_KEY, String(userType));
  }
}

export function clearSessionUser() {
  clearAuthToken();
  clearSessionRoleEmail();
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
