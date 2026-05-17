import { describe, expect, it } from "vitest";
import { sortReservationsForUpcomingArrivals } from "../../src/utils/reservationStatus";

describe("sortReservationsForUpcomingArrivals", () => {
  it("orders pending first, then by nearest check-in, then other statuses", () => {
    const input = [
      { id: "c1", status: "cancelled", check_in: "2026-06-01" },
      { id: "p2", status: "pending", check_in: "2026-05-20" },
      { id: "x1", status: "confirmed", check_in: "2026-05-10" },
      { id: "p1", status: "pending", check_in: "2026-05-05" },
      { id: "x2", status: "confirmed", check_in: "2026-05-15" },
    ];

    const ids = sortReservationsForUpcomingArrivals(input).map((r) => r.id);
    expect(ids).toEqual(["p1", "p2", "x1", "x2", "c1"]);
  });
});
