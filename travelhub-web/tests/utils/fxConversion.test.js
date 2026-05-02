import { describe, expect, it } from "vitest";
import {
  extractConvertedAmountFromResponse,
  extractRateFromFxResponse,
} from "../../src/utils/fxConversion";

describe("extractRateFromFxResponse", () => {
  it("lee rate directo", () => {
    expect(extractRateFromFxResponse({ rate: 4200 })).toBe(4200);
  });
  it("parsea rate como string (Decimal JSON)", () => {
    expect(extractRateFromFxResponse({ rate: "4150.75" })).toBeCloseTo(4150.75, 4);
  });
  it("deriva de base_amount / quote_amount", () => {
    expect(extractRateFromFxResponse({ base_amount: 1, quote_amount: 3950.5 })).toBeCloseTo(
      3950.5,
      4,
    );
  });
  it("sin datos devuelve null", () => {
    expect(extractRateFromFxResponse({})).toBeNull();
  });
});

describe("extractConvertedAmountFromResponse", () => {
  it("lee converted_amount", () => {
    const { value, currencyHints } = extractConvertedAmountFromResponse({
      converted_amount: 1_500_000,
      quote_currency: "COP",
    });
    expect(value).toBe(1_500_000);
    expect(currencyHints).toContain("COP");
  });
  it("prioriza to_currency en hints y parsea Decimal string", () => {
    const { value, currencyHints } = extractConvertedAmountFromResponse({
      converted_amount: "8300.00",
      from_currency: "USDC",
      to_currency: "COP",
    });
    expect(value).toBe(8300);
    expect(currencyHints[0]).toBe("COP");
  });
});
