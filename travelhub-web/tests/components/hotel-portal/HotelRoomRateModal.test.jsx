import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HotelRoomRateModal from "../../../src/components/hotel-portal/HotelRoomRateModal";
import { Suspense } from "react";

function renderComponent(props = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    roomName: "Test Room",
    dayData: { available_units: 2, price_per_night: "150" },
    onSave: vi.fn().mockResolvedValue({})
  };
  return render(
    <Suspense fallback="loading">
      <HotelRoomRateModal {...defaultProps} {...props} />
    </Suspense>
  );
}

describe("HotelRoomRateModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = renderComponent({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("submits form with correct payload", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    renderComponent({ onSave });
    
    const saveButton = screen.getByRole("button", { name: /Guardar cambios/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        available_units: 2,
        price_per_night: "150"
      });
    });
  });
  
  it("handles save error", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Fail"));
    renderComponent({ onSave });
    
    const saveButton = screen.getByRole("button", { name: /Guardar cambios/i });
    fireEvent.click(saveButton);
    
    expect(await screen.findByText(/Error al actualizar la tarifa/i)).toBeInTheDocument();
  });
});
