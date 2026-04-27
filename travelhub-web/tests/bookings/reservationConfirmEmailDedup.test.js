import { describe, it, expect } from "vitest";
import {
  hasSentReservationConfirmEmail,
  markSentReservationConfirmEmail,
} from "../../src/bookings/reservationConfirmEmailDedup";

describe("reservationConfirmEmailDedup (in-memory)", () => {
  it("defaults to false then becomes true after marking", () => {
    const id = `test-${Date.now()}`;
    expect(hasSentReservationConfirmEmail(id)).toBe(false);
    markSentReservationConfirmEmail(id);
    expect(hasSentReservationConfirmEmail(id)).toBe(true);
  });

  it("coerces ids to string consistently", () => {
    const idNum = 12345;
    expect(hasSentReservationConfirmEmail(idNum)).toBe(false);
    markSentReservationConfirmEmail(idNum);
    expect(hasSentReservationConfirmEmail("12345")).toBe(true);
  });
});

