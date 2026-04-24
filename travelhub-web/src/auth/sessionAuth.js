/** Claves de sesión mock hasta integrar API de autenticación */

export const AUTH_ROLE_KEY = "travelhub-role";
export const AUTH_EMAIL_KEY = "travelhub-email";

export const ROLE_HOTEL = "hotel";
export const ROLE_TRAVELER = "traveler";

export function setSessionUser({ role, email, remember }) {
  clearSessionUser();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_ROLE_KEY, role);
  storage.setItem(AUTH_EMAIL_KEY, email);
}

export function clearSessionUser() {
  for (const key of [AUTH_ROLE_KEY, AUTH_EMAIL_KEY]) {
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

export function isLoggedIn() {
  const r = getSessionRole();
  return r === ROLE_HOTEL || r === ROLE_TRAVELER;
}

/** Sesión del portal de viajeros (no incluye rol hotel). */
export function isTravelerLoggedIn() {
  return getSessionRole() === ROLE_TRAVELER;
}
