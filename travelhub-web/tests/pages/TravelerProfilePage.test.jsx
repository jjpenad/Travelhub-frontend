import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import TravelerProfilePage from "../../src/pages/TravelerProfilePage";
import { getUserProfile, deactivateUserAccount } from "../../src/services/api";
import { clearSessionUser } from "../../src/auth/sessionAuth";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key, // mock simple
    i18n: { language: "es" },
  }),
}));

vi.mock("../../src/services/api", () => ({
  getUserProfile: vi.fn(),
  deactivateUserAccount: vi.fn(),
}));

vi.mock("../../src/auth/sessionAuth", () => ({
  clearSessionUser: vi.fn(),
  SESSION_CHANGED_EVENT: "session_changed",
  isAuthenticated: () => true,
  isLoggedIn: () => true,
  canAccessTravelerAccountRoutes: () => true,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("TravelerProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe mostrar el estado de carga inicialmente", async () => {
    getUserProfile.mockImplementation(() => new Promise(() => {})); // Nunca resuelve para simular carga
    render(
      <BrowserRouter>
        <TravelerProfilePage />
      </BrowserRouter>
    );
    expect(screen.getByText("userProfile.loading")).toBeInTheDocument();
  });

  it("debe renderizar los datos del perfil si la llamada es exitosa", async () => {
    const mockProfile = {
      first_name: "Juan",
      last_name: "Pena",
      email: "juanpd.26@gmail.com",
      phone: "123456789",
      country_id: "CO",
      user_type: "traveler",
      email_verified: true,
      active: true,
      past_reservations_count: 4,
      pending_reservations_count: 0
    };
    getUserProfile.mockResolvedValueOnce(mockProfile);

    render(
      <BrowserRouter>
        <TravelerProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText("userProfile.loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Juan Pena")).toBeInTheDocument();
    expect(screen.getByText("juanpd.26@gmail.com ✅")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
    expect(screen.getByText("CO")).toBeInTheDocument();
    expect(screen.getByText("userProfile.statusActive")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("debe mostrar error si falla la carga del perfil", async () => {
    getUserProfile.mockRejectedValueOnce(new Error("API Error"));

    render(
      <BrowserRouter>
        <TravelerProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("userProfile.errorTitle")).toBeInTheDocument();
      expect(screen.getByText("API Error")).toBeInTheDocument();
    });
  });

  it("debe abrir el modal de eliminación y el botón aceptar debe estar deshabilitado hasta aceptar condiciones", async () => {
    getUserProfile.mockResolvedValueOnce({
      first_name: "Juan",
      last_name: "Pena"
    });

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <TravelerProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Juan Pena")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByText("userProfile.deleteAccountBtn");
    await user.click(deleteBtn);

    expect(screen.getByText("userProfile.deleteModalTitle")).toBeInTheDocument();
    
    const acceptBtn = screen.getByText("userProfile.deleteModalAccept");
    expect(acceptBtn).toBeDisabled();

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(acceptBtn).toBeEnabled();
  });

  it("debe llamar al endpoint, limpiar sesión y redirigir tras aceptar eliminación de cuenta", async () => {
    getUserProfile.mockResolvedValueOnce({
      first_name: "Juan"
    });
    deactivateUserAccount.mockResolvedValueOnce({});

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <TravelerProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("userProfile.deleteAccountBtn")).toBeInTheDocument();
    });

    await user.click(screen.getByText("userProfile.deleteAccountBtn"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByText("userProfile.deleteModalAccept"));

    await waitFor(() => {
      expect(deactivateUserAccount).toHaveBeenCalledTimes(1);
    });
    
    expect(clearSessionUser).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/travelers", { replace: true });
  });
});
