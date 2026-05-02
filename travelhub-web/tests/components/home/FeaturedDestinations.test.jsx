import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import FeaturedDestinations from "../../../src/components/home/FeaturedDestinations.jsx";
import { TravelerDisplayCurrencyProvider } from "../../../src/context/TravelerDisplayCurrencyContext.jsx";
import { clearFxRateCache } from "../../../src/utils/fxRateCache.js";

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function renderFeatured() {
  return render(
    <TravelerDisplayCurrencyProvider>
      <FeaturedDestinations />
    </TravelerDisplayCurrencyProvider>,
  );
}

describe("FeaturedDestinations (moneda viajero)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearFxRateCache();
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ rate: 4000 }));
  });

  it("con selector COP muestra importes convertidos desde USD base (Santorini 112 → COP)", async () => {
    renderFeatured();
    const heading = await screen.findByRole("heading", { name: "Santorini" });
    const card = heading.closest("article");
    expect(card).toBeTruthy();
    await waitFor(() => {
      expect(within(card).getByText(/448\.000 COP/)).toBeInTheDocument();
    });
    expect(within(card).getByText(/noche/i)).toBeInTheDocument();
  });

  it("con selector USD muestra el monto base con sufijo ISO", async () => {
    localStorage.setItem("travelhub-traveler-display-currency", "USD");
    renderFeatured();
    const heading = await screen.findByRole("heading", { name: "Santorini" });
    const card = heading.closest("article");
    expect(card).toBeTruthy();
    await waitFor(() => {
      expect(within(card).getByText(/\$112\.00 USD/)).toBeInTheDocument();
    });
  });
});
