/**
 * Descarga un CSV con las filas de detalle de reservas del reporte hotelero.
 * @param {object[]} rows
 * @param {string} filename
 */
export function downloadReservationsCsv(rows, filename = "reservaciones.csv") {
  const headers = [
    "numero_reserva",
    "huesped",
    "habitacion",
    "entrada",
    "salida",
    "monto",
    "estado",
  ];

  const escape = (v) => {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.reference,
        r.guestName,
        r.roomLabel,
        r.checkIn,
        r.checkOut,
        r.amount,
        r.statusLabel,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
