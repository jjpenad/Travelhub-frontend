import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getTravelerDisplayCurrencyCode,
  setTravelerDisplayCurrencyCode,
} from "../../src/auth/travelerDisplayCurrency";

describe("travelerDisplayCurrency", () => {
  beforeEach(() => {
    try {
      localStorage.removeItem("travelhub-traveler-display-currency");
    } catch {
      /* ignore */
    }
  });
  afterEach(() => {
    try {
      localStorage.removeItem("travelhub-traveler-display-currency");
    } catch {
      /* ignore */
    }
  });

  it("por defecto COP sin valor guardado", () => {
    expect(getTravelerDisplayCurrencyCode()).toBe("COP");
  });

  it("respeta valor guardado (USD)", () => {
    setTravelerDisplayCurrencyCode("USD");
    expect(getTravelerDisplayCurrencyCode()).toBe("USD");
  });
});
