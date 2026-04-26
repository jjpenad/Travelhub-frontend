// Unit tests for src/auth/jwt.js
//
// We don't verify signatures on the client (the backend does that on
// every authenticated request), so the helpers here are read-only:
// `decodeJwtPayload` parses the middle segment, `claimsFromJwtPayload`
// reduces it to the small `{ userId, email, firstName, lastName }`
// shape that the checkout form consumes to pre-fill itself.

import { describe, it, expect } from "vitest";
import {
  claimsFromJwtPayload,
  decodeJwtPayload,
} from "../../src/auth/jwt";

/**
 * Helper to build a fake compact JWT (`header.payload.signature`) given
 * a JS payload object. The header/signature parts are placeholders —
 * we only ever decode the payload, so they don't have to be valid.
 */
function makeJwt(payload) {
  const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // {"alg":"HS256","typ":"JWT"}
  // Encode payload as Base64URL (UTF-8 safe, no padding).
  const utf8 = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  utf8.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const b64 = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${header}.${b64}.fakesignature`;
}

describe("decodeJwtPayload", () => {
  it("returns the parsed payload of a valid compact JWT", () => {
    const token = makeJwt({ sub: "u-1", email: "a@b.com", iat: 100 });
    expect(decodeJwtPayload(token)).toEqual({
      sub: "u-1",
      email: "a@b.com",
      iat: 100,
    });
  });

  it("decodes UTF-8 claims (accents, ñ) correctly", () => {
    const token = makeJwt({
      sub: "u-2",
      email: "ana@example.com",
      first_name: "Ánika",
      last_name: "Núñez",
    });
    const out = decodeJwtPayload(token);
    expect(out.first_name).toBe("Ánika");
    expect(out.last_name).toBe("Núñez");
  });

  it("returns null for tokens without three segments", () => {
    expect(decodeJwtPayload("only.two")).toBeNull();
    expect(decodeJwtPayload("a.b.c.d")).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
  });

  it("returns null when the payload segment is not valid JSON", () => {
    expect(
      decodeJwtPayload("header.bm90LWpzb24.sig"), // base64url("not-json")
    ).toBeNull();
  });

  it("returns null when payload decodes to a non-object (array, string, null)", () => {
    // base64url-encoded JSON.stringify([])
    expect(decodeJwtPayload("h.W10.s")).toBeNull(); // []
    expect(decodeJwtPayload("h.bnVsbA.s")).toBeNull(); // null
  });

  it("rejects non-string inputs without throwing", () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload(undefined)).toBeNull();
    expect(decodeJwtPayload(12345)).toBeNull();
    expect(decodeJwtPayload({})).toBeNull();
  });
});

describe("claimsFromJwtPayload", () => {
  it("reads sub / email / first_name / last_name (lo único que emite el backend)", () => {
    expect(
      claimsFromJwtPayload({
        sub: "u-1",
        email: "a@b.com",
        first_name: "Ana",
        last_name: "Lopez",
      }),
    ).toEqual({
      userId: "u-1",
      email: "a@b.com",
      firstName: "Ana",
      lastName: "Lopez",
    });
  });

  it("ignora claims OIDC alternativos (given_name, family_name, name, preferred_username)", () => {
    // Si más adelante el backend cambia el contrato hay que actualizar
    // `claimsFromJwtPayload`; este test documenta que NO leemos esos
    // claims hoy y previene un fallback silencioso accidental.
    expect(
      claimsFromJwtPayload({
        sub: "u-1",
        given_name: "Ana",
        family_name: "Lopez",
        name: "Ana Lopez",
        preferred_username: "ana@example.com",
      }),
    ).toEqual({
      userId: "u-1",
      email: null,
      firstName: "",
      lastName: "",
    });
  });

  it("returns null for a non-object payload", () => {
    expect(claimsFromJwtPayload(null)).toBeNull();
    expect(claimsFromJwtPayload(undefined)).toBeNull();
    expect(claimsFromJwtPayload([])).toBeNull();
  });

  it("returns nullable strings when claims are missing entirely", () => {
    expect(claimsFromJwtPayload({})).toEqual({
      userId: null,
      email: null,
      firstName: "",
      lastName: "",
    });
  });

  it("ignora valores no-string o vacíos en los claims esperados", () => {
    expect(
      claimsFromJwtPayload({
        sub: 12345, // number → ignorado
        email: "   ", // blank → ignorado
        first_name: "Ana",
        last_name: null,
      }),
    ).toEqual({
      userId: null,
      email: null,
      firstName: "Ana",
      lastName: "",
    });
  });
});
