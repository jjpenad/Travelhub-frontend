import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearHotelPortalCurrency,
  getHotelPortalCurrencyCode,
  pickHotelCurrencyFromApiPayload,
  setHotelPortalCurrencyCode,
  syncHotelPortalCurrencyFromAnalyticsDto,
} from "../../src/auth/hotelPortalCurrency";

const STORAGE_KEY = "travelhub-hotel-portal-currency";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("getHotelPortalCurrencyCode / setHotelPortalCurrencyCode", () => {
  it("defaults to COP when storage is empty", () => {
    expect(getHotelPortalCurrencyCode()).toBe("COP");
  });

  it("reads localStorage before sessionStorage", () => {
    sessionStorage.setItem(STORAGE_KEY, "USD");
    localStorage.setItem(STORAGE_KEY, "COP");
    expect(getHotelPortalCurrencyCode()).toBe("COP");
  });

  it("falls back to sessionStorage when localStorage has no key", () => {
    sessionStorage.setItem(STORAGE_KEY, "USD");
    expect(getHotelPortalCurrencyCode()).toBe("USD");
  });

  it("ignores blank stored values", () => {
    localStorage.setItem(STORAGE_KEY, "   ");
    expect(getHotelPortalCurrencyCode()).toBe("COP");
  });

  it("persists normalized code to both storages", () => {
    setHotelPortalCurrencyCode("usd");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("USD");
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("USD");
    expect(getHotelPortalCurrencyCode()).toBe("USD");
  });

  it("clearHotelPortalCurrency removes the key from both storages", () => {
    setHotelPortalCurrencyCode("COP");
    clearHotelPortalCurrency();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("setHotelPortalCurrencyCode swallows storage errors", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });
    expect(() => setHotelPortalCurrencyCode("USD")).not.toThrow();
    spy.mockRestore();
  });

  it("clearHotelPortalCurrency swallows storage errors", () => {
    localStorage.setItem(STORAGE_KEY, "USD");
    const spy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    expect(() => clearHotelPortalCurrency()).not.toThrow();
    spy.mockRestore();
  });
});

describe("pickHotelCurrencyFromApiPayload", () => {
  it("returns null for non-objects", () => {
    expect(pickHotelCurrencyFromApiPayload(null)).toBeNull();
    expect(pickHotelCurrencyFromApiPayload("x")).toBeNull();
  });

  it("reads top-level currency fields", () => {
    expect(pickHotelCurrencyFromApiPayload({ currency_code: "usd" })).toBe(
      "USD",
    );
    expect(pickHotelCurrencyFromApiPayload({ currency: " COP " })).toBe(
      "COP",
    );
  });

  it("reads nested hotel currency when top-level is missing", () => {
    expect(
      pickHotelCurrencyFromApiPayload({
        hotel: { hotel_currency: "USD" },
      }),
    ).toBe("USD");
  });

  it("returns null when no currency is present", () => {
    expect(pickHotelCurrencyFromApiPayload({ hotel: {} })).toBeNull();
  });
});

describe("syncHotelPortalCurrencyFromAnalyticsDto", () => {
  it("persists currency when the DTO includes one", () => {
    syncHotelPortalCurrencyFromAnalyticsDto({ currency: "USD" });
    expect(getHotelPortalCurrencyCode()).toBe("USD");
  });

  it("does nothing when the DTO has no currency", () => {
    setHotelPortalCurrencyCode("USD");
    syncHotelPortalCurrencyFromAnalyticsDto({});
    expect(getHotelPortalCurrencyCode()).toBe("USD");
  });
});

describe("SSR / no window", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("getHotelPortalCurrencyCode returns COP when window is undefined", async () => {
    vi.stubGlobal("window", undefined);
    vi.resetModules();
    const { getHotelPortalCurrencyCode: getCode } = await import(
      "../../src/auth/hotelPortalCurrency.js"
    );
    expect(getCode()).toBe("COP");
  });

  it("setHotelPortalCurrencyCode and clearHotelPortalCurrency are no-ops without window", async () => {
    vi.stubGlobal("window", undefined);
    vi.resetModules();
    const {
      setHotelPortalCurrencyCode: setCode,
      clearHotelPortalCurrency: clear,
    } = await import("../../src/auth/hotelPortalCurrency.js");
    expect(() => setCode("USD")).not.toThrow();
    expect(() => clear()).not.toThrow();
  });
});
