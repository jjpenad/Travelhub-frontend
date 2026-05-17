import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HotelRoomCalendarTable from "../../../src/components/hotel-portal/HotelRoomCalendarTable";
import { Suspense } from "react";

function renderComponent(props = {}) {
  const defaultProps = {
    items: [],
    loading: false,
    startDate: "",
    endDate: "",
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
    onSearch: vi.fn(),
    page: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    onEdit: vi.fn()
  };
  return render(
    <Suspense fallback="loading">
      <HotelRoomCalendarTable {...defaultProps} {...props} />
    </Suspense>
  );
}

describe("HotelRoomCalendarTable", () => {
  it("renders empty state", () => {
    renderComponent();
    expect(screen.getByText(/Calendario de Disponibilidad y Precios/i)).toBeInTheDocument();
  });

  it("calls onSearch when search button is clicked", () => {
    const onSearch = vi.fn();
    renderComponent({ onSearch, startDate: "2026-05-10", endDate: "2026-05-12" });
    const button = screen.getByRole("button", { name: /Buscar/i });
    fireEvent.click(button);
    expect(onSearch).toHaveBeenCalled();
  });

  it("renders items and handles edit click", () => {
    const onEdit = vi.fn();
    const items = [
      { id: "1", available_units: 5, price_per_night: 100, currency_code: "USD", date: "2099-05-10" }
    ];
    renderComponent({ items, onEdit });
    const editButton = screen.getByRole("button", { name: /Editar tarifa/i });
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(items[0]);
  });
});
