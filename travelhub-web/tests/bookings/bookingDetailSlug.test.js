// Unit tests for src/bookings/bookingDetailSlug.js
//
// The slug encodes (reference, savedAt) into a URL-safe string so the
// trip-detail route can locate the right reservation in localStorage
// without leaking guest ids in the URL. Round-tripping must be safe and
// the lookup must be tolerant of mild URL-encoding variations.

import { describe, it, expect } from "vitest";
import {
  encodeBookingDetailSlug,
  findReservationBySlug,
} from "../../src/bookings/bookingDetailSlug";

describe("encodeBookingDetailSlug", () => {
  it("encodes reference + savedAt as a URL-safe JSON blob", () => {
    const slug = encodeBookingDetailSlug({
      reference: "RES-1",
      savedAt: "2026-01-02T10:00:00.000Z",
    });
    expect(slug).not.toContain("/");
    expect(slug).not.toContain(" ");
    const decoded = JSON.parse(decodeURIComponent(slug));
    expect(decoded).toEqual({ r: "RES-1", s: "2026-01-02T10:00:00.000Z" });
  });

  it("coerces non-string references to string and treats missing fields as empty", () => {
    const slug = encodeBookingDetailSlug({ reference: 12345 });
    const decoded = JSON.parse(decodeURIComponent(slug));
    expect(decoded).toEqual({ r: "12345", s: "" });
  });
});

describe("findReservationBySlug", () => {
  const list = [
    { reference: "RES-1", savedAt: "2026-01-02T10:00:00.000Z", id: "a" },
    { reference: "RES-2", savedAt: "2026-01-03T11:00:00.000Z", id: "b" },
  ];

  it("returns the reservation matching the encoded slug", () => {
    const slug = encodeBookingDetailSlug(list[1]);
    expect(findReservationBySlug(slug, list)).toBe(list[1]);
  });

  it("accepts a raw (already-decoded) JSON string too", () => {
    const raw = JSON.stringify({
      r: "RES-1",
      s: "2026-01-02T10:00:00.000Z",
    });
    expect(findReservationBySlug(raw, list)).toBe(list[0]);
  });

  it("returns null for unknown reference/savedAt combos", () => {
    const slug = encodeBookingDetailSlug({
      reference: "RES-99",
      savedAt: "2026-12-31T00:00:00.000Z",
    });
    expect(findReservationBySlug(slug, list)).toBeNull();
  });

  it("returns null when the slug is malformed", () => {
    expect(findReservationBySlug("not-json", list)).toBeNull();
    expect(findReservationBySlug("", list)).toBeNull();
    expect(findReservationBySlug(null, list)).toBeNull();
  });

  it("returns null when reservations is not an array", () => {
    expect(findReservationBySlug("anything", null)).toBeNull();
    expect(findReservationBySlug("anything", undefined)).toBeNull();
  });
});
