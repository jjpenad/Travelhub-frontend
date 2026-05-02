import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  fetchFrankfurterRatePayload,
  frankfurterConvertPayload,
} from "../../src/utils/fxFrankfurterFallback";

describe("fxFrankfurterFallback", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchFrankfurterRatePayload mapea la respuesta v2/rate hacia extractRateFromFxResponse", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({ date: "2026-05-01", base: "USD", quote: "COP", rate: 3632.63 })),
    });

    const out = await fetchFrankfurterRatePayload("USD", "COP");
    expect(out.rate).toBeCloseTo(3632.63, 2);
    expect(out.fx_fallback_source).toBe("frankfurter");
    expect(String(globalThis.fetch.mock.calls[0][0])).toContain("/v2/rate/USD/COP");
  });

  it("frankfurterConvertPayload multiplica amount por la tasa", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(JSON.stringify({ date: "2026-05-01", base: "USD", quote: "COP", rate: 10 })),
    });

    const out = await frankfurterConvertPayload({
      amount: 5,
      from_currency: "USD",
      to_currency: "COP",
    });
    expect(out.converted_amount).toBe(50);
    expect(out.rate).toBe(10);
    expect(out.fx_fallback_source).toBe("frankfurter");
  });
});
