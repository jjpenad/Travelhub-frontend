import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HotelRoomBulkRateModal from "../../../src/components/hotel-portal/HotelRoomBulkRateModal";
import { Suspense } from "react";

function renderComponent(props = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    roomTypeId: "room-123",
    onSave: vi.fn().mockResolvedValue({})
  };
  return render(
    <Suspense fallback="loading">
      <HotelRoomBulkRateModal {...defaultProps} {...props} />
    </Suspense>
  );
}

describe("HotelRoomBulkRateModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = renderComponent({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("handles form submission", async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { container } = renderComponent({ onSave });
    
    const dates = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: '2026-06-01' } });
    fireEvent.change(dates[1], { target: { value: '2026-06-10' } });
    
    const numbers = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[1], { target: { value: '200' } }); // Price
    
    const saveButton = screen.getByRole("button", { name: /Crear tarifas/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it("handles conflict error", async () => {
    const onSave = vi.fn().mockRejectedValue({ status: 409 });
    const { container } = renderComponent({ onSave });
    
    const dates = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: '2026-06-01' } });
    fireEvent.change(dates[1], { target: { value: '2026-06-10' } });
    
    const numbers = container.querySelectorAll('input[type="number"]');
    fireEvent.change(numbers[1], { target: { value: '200' } }); // Price
    
    const saveButton = screen.getByRole("button", { name: /Crear tarifas/i });
    fireEvent.click(saveButton);
    
    expect(await screen.findByText(/Ya existen registros en este rango/i)).toBeInTheDocument();
  });
});
