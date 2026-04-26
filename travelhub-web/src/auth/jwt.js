/**
 * JWT helpers (lectura del payload — sin verificación de firma).
 *
 * El cliente no firma ni valida JWTs; eso lo hace el backend en cada
 * request. Aquí solo decodificamos el payload para leer claims que el
 * backend ya emitió (email, nombre del usuario, sub) y poder pre-rellenar
 * UI cuando el usuario ya está autenticado.
 *
 * Estructura JWT: `header.payload.signature`, cada segmento es Base64URL.
 */

/** Pad + reemplazar al alfabeto Base64 estándar antes de pasar a `atob`. */
function base64UrlToBase64(input) {
  const safe = input.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = safe.length % 4;
  if (remainder === 0) return safe;
  return safe + "=".repeat(4 - remainder);
}

/**
 * Decodifica un string Base64URL (ASCII de la red) a UTF-8.
 * `atob` solo soporta ASCII; los nombres con tildes vienen en UTF-8 dentro
 * del JWT, así que necesitamos pasar por bytes y `TextDecoder`.
 */
function decodeBase64UrlAsUtf8(input) {
  const binary = atob(base64UrlToBase64(input));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder("utf-8").decode(bytes);
  }
  // Fallback (entornos sin TextDecoder): asume ASCII.
  return binary;
}

/**
 * Decodifica el payload de un JWT compacto. Devuelve el objeto de claims
 * o `null` si el token no es válido. NO verifica firma ni expiración.
 *
 * @param {unknown} token
 * @returns {Record<string, unknown> | null}
 */
export function decodeJwtPayload(token) {
  if (typeof token !== "string" || token.length === 0) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = decodeBase64UrlAsUtf8(parts[1]);
    const parsed = JSON.parse(json);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Devuelve el claim si existe y es un string no-vacío, si no `null`. */
function readStringClaim(obj, key) {
  const v = obj[key];
  if (typeof v === "string" && v.trim() !== "") return v;
  return null;
}

/**
 * Reduce el payload a la identidad mínima que consume la UI:
 * `{ userId, email, firstName, lastName }`. El backend emite los claims
 * `sub`, `email`, `first_name`, `last_name`, así que esos son los únicos
 * nombres que leemos. Si más adelante cambian, se actualizan aquí.
 *
 * @param {Record<string, unknown> | null | undefined} payload
 */
export function claimsFromJwtPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return {
    userId: readStringClaim(payload, "sub"),
    email: readStringClaim(payload, "email"),
    firstName: readStringClaim(payload, "first_name") ?? "",
    lastName: readStringClaim(payload, "last_name") ?? "",
  };
}
