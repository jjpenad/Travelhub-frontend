import { describe, expect, it } from "vitest";
import { normalizeHotelCurrencyCode } from "../../src/constants/hotelCurrency";
import {
  formatFlexibleMoney,
  formatFlexibleMoneyWithIsoSuffix,
  formatHotelPortalMoney,
} from "../../src/utils/formatHotelPortalMoney";

describe("normalizeHotelCurrencyCode", () => {
  it("admite COP", () => {
    expect(normalizeHotelCurrencyCode("cop")).toBe("COP");
  });
  it("cualquier otro valor cae en USD", () => {
    expect(normalizeHotelCurrencyCode("MXN")).toBe("USD");
    expect(normalizeHotelCurrencyCode(null)).toBe("USD");
  });
});

describe("formatHotelPortalMoney", () => {
  it("formatea USD en en-US (detail con 2 decimales)", () => {
    const s = formatHotelPortalMoney(1234.5, "USD", { variant: "detail" });
    expect(s).toMatch(/1,234\.50/);
    expect(s).toMatch(/\$/);
  });

  it("formatea COP en es-CO sin decimales (compact)", () => {
    const s = formatHotelPortalMoney(1234567, "COP", { variant: "compact" });
    expect(s).toContain("1");
    expect(s).toMatch(/234/);
  });

  it("devuelve em dash para NaN", () => {
    expect(formatHotelPortalMoney(Number.NaN, "USD")).toBe("—");
  });
});

describe("formatFlexibleMoney", () => {
  it("delega COP/USD igual que portal hotelero", () => {
    const cop = formatFlexibleMoney(8300, "COP");
    expect(cop).not.toContain("USD");
    const usd = formatFlexibleMoney(12.34, "USD");
    expect(usd).toMatch(/\$|USD/);
  });

  it("muestra USDC con sufijo", () => {
    const s = formatFlexibleMoney(2, "USDC");
    expect(s).toContain("USDC");
  });
});

describe("formatFlexibleMoneyWithIsoSuffix", () => {
  it("añade COP al final", () => {
    const s = formatFlexibleMoneyWithIsoSuffix(1000, "COP");
    expect(s.endsWith(" COP")).toBe(true);
  });
  it("añade USD al final", () => {
    const s = formatFlexibleMoneyWithIsoSuffix(10, "USD");
    expect(s.endsWith(" USD")).toBe(true);
  });
  it("no duplica USDC", () => {
    const s = formatFlexibleMoneyWithIsoSuffix(2, "USDC");
    expect(s.match(/USDC/g)?.length).toBe(1);
  });
});
