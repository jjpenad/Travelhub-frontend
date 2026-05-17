import { describe, expect, it } from "vitest";
import {
  normalizeReservationStatus,
  patchReservationStatusInList,
} from "../../src/utils/reservationStatus";

describe("normalizeReservationStatus", () => {
  it("reads status from nested reservation object", () => {
    expect(
      normalizeReservationStatus({
        id: "r-1",
        reservation: { status: "cancelled" },
      }),
    ).toBe("cancelled");
  });
});

describe("patchReservationStatusInList", () => {
  it("updates top-level and nested status for matching id", () => {
    const list = [
      { id: "a", status: "pending" },
      {
        id: "b",
        status: "pending",
        reservation: { id: "b", status: "pending" },
      },
    ];
    const next = patchReservationStatusInList(list, "b", "cancelled");
    expect(next[1].status).toBe("cancelled");
    expect(next[1].reservation.status).toBe("cancelled");
    expect(next[0].status).toBe("pending");
  });
});
