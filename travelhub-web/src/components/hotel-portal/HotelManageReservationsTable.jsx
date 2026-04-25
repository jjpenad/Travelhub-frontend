import { Link } from "react-router-dom";
import { pathHotelReservationDetail } from "../../constants/routes";

function badgeClass(status) {
  if (status === "confirmed") return "hp-mres-badge hp-mres-badge--confirmed";
  if (status === "pending") return "hp-mres-badge hp-mres-badge--pending";
  if (status === "cancelled") return "hp-mres-badge hp-mres-badge--cancelled";
  return "hp-mres-badge hp-mres-badge--upcoming";
}

function rowStripeClass(status) {
  if (status === "confirmed") return "hp-mres-table__row--stripe-confirmed";
  if (status === "cancelled") return "hp-mres-table__row--stripe-cancelled";
  if (status === "pending") return "hp-mres-table__row--stripe-pending";
  return "hp-mres-table__row--stripe-confirmed";
}

/** Ej. "Hab. 112" → "112" */
function roomNumberOnly(roomHab) {
  if (!roomHab) return "—";
  const m = String(roomHab).match(/(\d+)/);
  return m ? m[1] : roomHab;
}

/**
 * @param {{ rows: object[], selectedId: string | null, onSelectRow: (id: string) => void }} props
 */
function HotelManageReservationsTable({ rows, selectedId, onSelectRow }) {
  return (
    <div className="hp-mres-table-card">
      <div className="hp-mres-table-wrap">
        <table className="hp-mres-table">
          <thead>
            <tr>
              <th scope="col">Nº reserva</th>
              <th scope="col">Huésped</th>
              <th scope="col">Habitación</th>
              <th scope="col">Fechas</th>
              <th scope="col">Monto</th>
              <th scope="col">Estado</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="hp-mres-empty">
                  No hay reservas que coincidan con tu búsqueda o filtro.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => {
              const selected = r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  className={
                    "hp-mres-table__row " +
                    rowStripeClass(r.status) +
                    (selected ? " hp-mres-table__row--selected" : "")
                  }
                  onClick={(e) => {
                    if (e.target.closest(".hp-mres-actions")) return;
                    onSelectRow(r.id);
                  }}
                >
                  <td>
                    <span className="hp-mres-ref">{r.reference}</span>
                  </td>
                  <td>
                    <div className="hp-mres-guest">
                      <span
                        className="hp-mres-guest-avatar"
                        style={{ background: r.avatarTone }}
                        aria-hidden="true"
                      >
                        {r.initials}
                      </span>
                      <span className="hp-mres-guest-text">
                        <span className="hp-mres-guest-name">{r.guestName}</span>
                        <span className="hp-mres-guest-meta">{r.guestPhone}</span>
                      </span>
                    </div>
                  </td>
                  <td className="hp-mres-room-number">{roomNumberOnly(r.roomHab)}</td>
                  <td>
                    <div className="hp-mres-dates">
                      <span className="hp-mres-dates-range">
                        {r.dateFrom} → {r.dateTo}
                      </span>
                      <span className="hp-mres-dates-nights">
                        {r.nights} {r.nights === 1 ? "noche" : "noches"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="hp-mres-amount">
                      <span className="hp-mres-amount-value">{r.amount}</span>
                      <span className="hp-mres-amount-sub">{r.paymentLabel}</span>
                    </div>
                  </td>
                  <td>
                    <span className={badgeClass(r.status)}>{r.statusLabel}</span>
                  </td>
                  <td>
                    <div className="hp-mres-actions" onClick={(e) => e.stopPropagation()}>
                      <Link
                        className="hp-mres-actions__detail"
                        to={pathHotelReservationDetail(r.id)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver detalle
                      </Link>
                      {r.secondaryAction === "checkin" ? (
                        <button type="button" className="hp-mres-actions__secondary">
                          Check-in
                        </button>
                      ) : null}
                      {r.secondaryAction === "confirm" ? (
                        <button type="button" className="hp-mres-actions__secondary">
                          Confirmar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HotelManageReservationsTable;
