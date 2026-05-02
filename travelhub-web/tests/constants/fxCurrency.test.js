import { describe, expect, it } from "vitest";
import { normalizeFxCurrencyCode } from "../../src/constants/fxCurrency";

describe("normalizeFxCurrencyCode", () => {
  it("acepta ISO 4217 en mayúsculas", () => {
    expect(normalizeFxCurrencyCode("cop")).toBe("COP");
    expect(normalizeFxCurrencyCode(" eur \n")).toBe("EUR");
  });
  it("acepta USDC para el mismo contrato que service-external", () => {
    expect(normalizeFxCurrencyCode("usdc")).toBe("USDC");
  });
  it("valor inválido cae en USD", () => {
    expect(normalizeFxCurrencyCode("NOTACODE")).toBe("USD");
    expect(normalizeFxCurrencyCode("")).toBe("USD");
  });
  it("null y undefined se tratan como vacío → USD", () => {
    expect(normalizeFxCurrencyCode(null)).toBe("USD");
    expect(normalizeFxCurrencyCode(undefined)).toBe("USD");
  });
});
