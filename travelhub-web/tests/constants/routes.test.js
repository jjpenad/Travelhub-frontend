import { describe, it, expect } from "vitest";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  pathHotelReservationDetail,
  PATH_HOTEL_MANAGE_RATES,
  pathHotelRoomDetail
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

describe("pathHotelRoomDetail", () => {
  it("appends the encoded id to the manage-rates base path", () => {
    expect(pathHotelRoomDetail("room-42")).toBe(
      `${PATH_HOTEL_MANAGE_RATES}/room-42`,
    );
  });

  it("encodes unsafe characters", () => {
    expect(pathHotelRoomDetail("a b")).toBe(
      `${PATH_HOTEL_MANAGE_RATES}/${encodeURIComponent("a b")}`,
    );
  });
});
