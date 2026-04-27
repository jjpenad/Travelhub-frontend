// Unit tests for src/auth/sessionAuth.js
//
// Covers token storage, role mapping, persistence + clearing of the
// authenticated session, and the post-auth redirect helper. Together
// with the api.js tests these pin down the contract that the X-Guest-Id
// / Bearer-token fixes will need to preserve.

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AUTH_EMAIL_KEY,
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_TYPE_KEY,
  ROLE_HOTEL,
  ROLE_TRAVELER,
  SESSION_CHANGED_EVENT,
  canAccessTravelerAccountRoutes,
  clearAuthToken,
  clearSessionUser,
  getAuthToken,
  getCurrentUserClaims,
  getPostAuthDestination,
  getSessionEmail,
  getSessionRole,
  getSessionUserType,
  getUser,
  isAuthenticated,
  isLoggedIn,
  isTravelerLoggedIn,
  pathAfterAuthForUserType,
  persistSessionFromLogin,
  roleFromApiUserType,
  setAuthToken,
  setSessionUser,
} from "../../src/auth/sessionAuth";
import {
  PATH_HOTEL_PORTAL_HOME,
  PATH_TRAVELERS_HOME,
} from "../../src/constants/routes";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("token storage", () => {
  it("persists and retrieves the JWT in localStorage", () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken("abc.def.ghi");
    expect(getAuthToken()).toBe("abc.def.ghi");
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("abc.def.ghi");
  });

  it("setAuthToken is a no-op for falsy input (so we never wipe a real token by mistake)", () => {
    setAuthToken("real.jwt");
    setAuthToken("");
    setAuthToken(null);
    setAuthToken(undefined);
    expect(getAuthToken()).toBe("real.jwt");
  });

  it("clearAuthToken removes the JWT", () => {
    setAuthToken("abc");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it("isAuthenticated tracks token presence and ignores blank values", () => {
    expect(isAuthenticated()).toBe(false);
    setAuthToken("real.jwt");
    expect(isAuthenticated()).toBe(true);
    localStorage.setItem(AUTH_TOKEN_KEY, "   ");
    expect(isAuthenticated()).toBe(false);
  });
});

describe("roleFromApiUserType", () => {
  it.each([
    ["hotel", ROLE_HOTEL],
    ["admin_hotel", ROLE_HOTEL],
    ["hotel_admin", ROLE_HOTEL],
    ["traveler", ROLE_TRAVELER],
    ["", ROLE_TRAVELER],
    [undefined, ROLE_TRAVELER],
    ["something_unknown", ROLE_TRAVELER],
  ])("maps %s → %s", (userType, expected) => {
    expect(roleFromApiUserType(userType)).toBe(expected);
  });
});

describe("pathAfterAuthForUserType", () => {
  it("sends hotel admins to the hotel portal", () => {
    expect(pathAfterAuthForUserType("hotel")).toBe(PATH_HOTEL_PORTAL_HOME);
  });

  it("sends travelers (default) to the travelers home", () => {
    expect(pathAfterAuthForUserType("traveler")).toBe(PATH_TRAVELERS_HOME);
    expect(pathAfterAuthForUserType(undefined)).toBe(PATH_TRAVELERS_HOME);
  });
});

describe("getPostAuthDestination", () => {
  it("returns the requested `from` path for travelers when it's a safe internal path", () => {
    expect(getPostAuthDestination("traveler", "/my-trips")).toBe("/my-trips");
  });

  it("ignores `from` for hotel admins (they always go to the portal)", () => {
    expect(getPostAuthDestination("hotel", "/my-trips")).toBe(
      PATH_HOTEL_PORTAL_HOME,
    );
  });

  it("rejects protocol-relative or external paths and falls back to the home", () => {
    expect(getPostAuthDestination("traveler", "//evil.example/path")).toBe(
      PATH_TRAVELERS_HOME,
    );
    expect(getPostAuthDestination("traveler", "https://x.com")).toBe(
      PATH_TRAVELERS_HOME,
    );
    expect(getPostAuthDestination("traveler", null)).toBe(PATH_TRAVELERS_HOME);
  });
});

describe("persistSessionFromLogin", () => {
  it("stores the token, role, email (lowercased), and user_type in localStorage when remember=true", () => {
    persistSessionFromLogin({
      email: "  Foo@Bar.COM",
      accessToken: "jwt-1",
      userType: "traveler",
      remember: true,
    });

    expect(getAuthToken()).toBe("jwt-1");
    expect(localStorage.getItem(AUTH_ROLE_KEY)).toBe(ROLE_TRAVELER);
    expect(localStorage.getItem(AUTH_EMAIL_KEY)).toBe("foo@bar.com");
    expect(localStorage.getItem(AUTH_USER_TYPE_KEY)).toBe("traveler");
    expect(sessionStorage.getItem(AUTH_ROLE_KEY)).toBeNull();
  });

  it("uses sessionStorage when remember=false", () => {
    persistSessionFromLogin({
      email: "u@x.com",
      accessToken: "jwt-2",
      userType: "hotel",
      remember: false,
    });

    expect(getAuthToken()).toBe("jwt-2");
    expect(sessionStorage.getItem(AUTH_ROLE_KEY)).toBe(ROLE_HOTEL);
    expect(localStorage.getItem(AUTH_ROLE_KEY)).toBeNull();
  });

  it("emits the SESSION_CHANGED_EVENT so listeners (e.g. headers) can refresh", () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_CHANGED_EVENT, listener);
    persistSessionFromLogin({
      email: "x@y.z",
      accessToken: "tok",
      userType: "traveler",
    });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_CHANGED_EVENT, listener);
  });
});

describe("setSessionUser / clearSessionUser", () => {
  it("setSessionUser stores role+email without touching the token", () => {
    setAuthToken("untouched.jwt");
    setSessionUser({
      role: ROLE_TRAVELER,
      email: "a@b.com",
      remember: true,
      userType: "traveler",
    });
    expect(getAuthToken()).toBe("untouched.jwt");
    expect(getSessionRole()).toBe(ROLE_TRAVELER);
    expect(getSessionEmail()).toBe("a@b.com");
  });

  it("clearSessionUser wipes token + role + email + user type", () => {
    persistSessionFromLogin({
      email: "a@b.com",
      accessToken: "tok",
      userType: "traveler",
    });
    expect(isLoggedIn()).toBe(true);

    clearSessionUser();

    expect(getAuthToken()).toBeNull();
    expect(getSessionRole()).toBeNull();
    expect(getSessionEmail()).toBeNull();
    expect(getSessionUserType()).toBeNull();
    expect(isLoggedIn()).toBe(false);
    expect(isAuthenticated()).toBe(false);
  });
});

describe("getUser", () => {
  it("returns null when there's no token, no role and no email", () => {
    expect(getUser()).toBeNull();
  });

  it("returns the merged session shape with hasToken=true after login", () => {
    persistSessionFromLogin({
      email: "x@y.z",
      accessToken: "jwt",
      userType: "traveler",
    });
    expect(getUser()).toEqual({
      email: "x@y.z",
      role: ROLE_TRAVELER,
      userType: "traveler",
      hasToken: true,
    });
  });
});

describe("traveler-only access guards", () => {
  it("canAccessTravelerAccountRoutes requires BOTH a token AND the traveler role", () => {
    expect(canAccessTravelerAccountRoutes()).toBe(false);

    setAuthToken("jwt");
    expect(canAccessTravelerAccountRoutes()).toBe(false); // token but no role

    setSessionUser({
      role: ROLE_HOTEL,
      email: "h@x.com",
      remember: true,
      userType: "hotel",
    });
    expect(canAccessTravelerAccountRoutes()).toBe(false); // wrong role

    setSessionUser({
      role: ROLE_TRAVELER,
      email: "t@x.com",
      remember: true,
      userType: "traveler",
    });
    expect(canAccessTravelerAccountRoutes()).toBe(true);
  });

  it("isTravelerLoggedIn checks role only (no token requirement)", () => {
    setSessionUser({
      role: ROLE_TRAVELER,
      email: "t@x.com",
      remember: true,
      userType: "traveler",
    });
    expect(isTravelerLoggedIn()).toBe(true);
  });
});

describe("getCurrentUserClaims", () => {
  it("returns null when there is no token", () => {
    expect(getCurrentUserClaims()).toBeNull();
  });

  it("returns email + firstName + lastName persisted at login from /auth/login response", () => {
    persistSessionFromLogin({
      email: "ana@example.com",
      accessToken: "any.opaque.token",
      userType: "traveler",
      firstName: "Ana",
      lastName: "Lopez",
    });
    expect(getCurrentUserClaims()).toEqual({
      email: "ana@example.com",
      firstName: "Ana",
      lastName: "Lopez",
    });
  });

  it("returns empty firstName/lastName when login didn't expose them (legacy session)", () => {
    persistSessionFromLogin({
      email: "x@y.z",
      accessToken: "tok",
      userType: "traveler",
    });
    expect(getCurrentUserClaims()).toEqual({
      email: "x@y.z",
      firstName: "",
      lastName: "",
    });
  });

  it("ignores blank firstName/lastName so storage doesn't get polluted with empty strings", () => {
    persistSessionFromLogin({
      email: "x@y.z",
      accessToken: "tok",
      userType: "traveler",
      firstName: "   ",
      lastName: "",
    });
    expect(getCurrentUserClaims()).toEqual({
      email: "x@y.z",
      firstName: "",
      lastName: "",
    });
  });

  it("clearSessionUser wipes firstName/lastName too", () => {
    persistSessionFromLogin({
      email: "x@y.z",
      accessToken: "tok",
      userType: "traveler",
      firstName: "Ana",
      lastName: "Lopez",
    });
    expect(getCurrentUserClaims().firstName).toBe("Ana");

    clearSessionUser();

    expect(getCurrentUserClaims()).toBeNull();
    // Defensive: even if a stale token were re-injected, the names are gone.
    setAuthToken("tok");
    expect(getCurrentUserClaims()).toEqual({
      email: null,
      firstName: "",
      lastName: "",
    });
  });
});
