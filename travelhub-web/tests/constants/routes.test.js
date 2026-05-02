import { describe, it, expect } from "vitest";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  pathHotelReservationDetail,
} from "../../src/constants/routes";

describe("pathHotelReservationDetail", () => {
  it("appends the encoded id to the manage-reservations base path", () => {
    expect(pathHotelReservationDetail("r-42")).toBe(
      `${PATH_HOTEL_MANAGE_RESERVATIONS}/r-42`,
    );
  });

  it("encodes characters that are not safe in a single path segment", () => {
    expect(pathHotelReservationDetail("a/b")).toBe(
      `${PATH_HOTEL_MANAGE_RESERVATIONS}/${encodeURIComponent("a/b")}`,
    );
  });
});
