import { describe, it, expect } from "vitest";
import { RESET_HOME_SEARCH_EVENT } from "../../src/constants/homeSearchEvents";
import { WALLET_PAYMENT_METHOD_IDS } from "../../src/constants/paymentWalletConstants";

describe("constants included in coverage scope", () => {
  it("exports home search reset event name", () => {
    expect(RESET_HOME_SEARCH_EVENT).toBe("travelhub-reset-home-search");
  });

  it("exports wallet payment method ids", () => {
    expect(WALLET_PAYMENT_METHOD_IDS).toHaveLength(4);
    expect(WALLET_PAYMENT_METHOD_IDS).toEqual(
      expect.arrayContaining(["paypal", "apple_pay", "google_pay", "mercado_pago"]),
    );
  });
});
