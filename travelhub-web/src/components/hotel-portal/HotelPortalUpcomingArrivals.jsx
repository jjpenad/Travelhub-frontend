import "./HotelPortalUpcomingArrivals.css";

/**
 * Tabla de próximas llegadas (check-in).
 */
function HotelPortalUpcomingArrivals({
  title = "Próximas llegadas",
  rows = [],
  viewAllHref = "#",
}) {
  return (
    <section className="hp-arrivals" aria-labelledby="hp-arrivals-title">
      <div className="hp-arrivals__head">
        <h2 id="hp-arrivals-title" className="hp-arrivals__title">
          {title}
        </h2>
        <a className="hp-arrivals__link-all" href={viewAllHref}>
          Ver todas →
        </a>
      </div>
      <div className="hp-arrivals__table-wrap">
        <table className="hp-arrivals__table">
          <thead>
            <tr>
              <th scope="col">Huésped</th>
              <th scope="col">Habitación</th>
              <th scope="col">Llegada</th>
              <th scope="col">Estado</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="hp-arrivals__guest">
                    <span
                      className="hp-arrivals__guest-avatar"
                      style={{ background: r.avatarTone }}
                      aria-hidden="true"
                    >
                      {r.initials}
                    </span>
                    <span className="hp-arrivals__guest-text">
                      <span className="hp-arrivals__guest-name">{r.guestName}</span>
                      <span className="hp-arrivals__guest-email">{r.guestEmail}</span>
                    </span>
                  </div>
                </td>
                <td className="hp-arrivals__cell-muted">{r.room}</td>
                <td className="hp-arrivals__cell-strong">{r.arrival}</td>
                <td>
                  <span
                    className={
                      "hp-arrivals__badge" +
                      (r.status === "confirmed"
                        ? " hp-arrivals__badge--confirmed"
                        : " hp-arrivals__badge--pending")
                    }
                  >
                    {r.statusLabel}
                  </span>
                </td>
                <td>
                  <button type="button" className="hp-arrivals__btn hp-arrivals__btn--primary">
                    Ver más
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default HotelPortalUpcomingArrivals;
