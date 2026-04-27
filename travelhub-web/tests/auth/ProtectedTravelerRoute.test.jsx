import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ProtectedTravelerRoute from "../../src/auth/ProtectedTravelerRoute";
import { PATH_LOGIN } from "../../src/constants/routes";
import { AUTH_ROLE_KEY, AUTH_TOKEN_KEY, ROLE_TRAVELER } from "../../src/auth/sessionAuth";

describe("ProtectedTravelerRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders children when access is allowed", () => {
    localStorage.setItem(AUTH_TOKEN_KEY, "jwt");
    localStorage.setItem(AUTH_ROLE_KEY, ROLE_TRAVELER);

    render(
      <MemoryRouter initialEntries={["/my-trips?q=1"]}>
        <Routes>
          <Route
            path="/my-trips"
            element={
              <ProtectedTravelerRoute>
                <div>OK</div>
              </ProtectedTravelerRoute>
            }
          />
          <Route path={PATH_LOGIN} element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.queryByText("LOGIN")).not.toBeInTheDocument();
  });

  it("redirects to login preserving return url when access is denied", () => {
    // no token/role

    render(
      <MemoryRouter initialEntries={["/my-trips?q=1"]}>
        <Routes>
          <Route
            path="/my-trips"
            element={
              <ProtectedTravelerRoute>
                <div>OK</div>
              </ProtectedTravelerRoute>
            }
          />
          <Route path={PATH_LOGIN} element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.queryByText("OK")).not.toBeInTheDocument();
  });
});

