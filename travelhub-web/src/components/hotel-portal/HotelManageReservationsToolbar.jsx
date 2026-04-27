const FILTERS = [
  { id: "all", label: "Todas", countKey: "all" },
  { id: "confirmed", label: "Confirmadas", countKey: "confirmed" },
  { id: "pending", label: "Pendientes", countKey: "pending" },
  { id: "cancelled", label: "Canceladas", countKey: "cancelled" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "amount_high", label: "Mayor monto" },
  { value: "amount_low", label: "Menor monto" },
];

function HotelManageReservationsToolbar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  filterCounts,
}) {
  return (
    <div className="hp-mres-toolbar">
      <label className="hp-mres-toolbar__search">
        <span className="visually-hidden">Buscar reserva o cliente</span>
        <input
          type="search"
          className="hp-mres-toolbar__input"
          placeholder="Nº Reserva o nombre cliente…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </label>
      <div className="hp-mres-toolbar__filters" role="group" aria-label="Filtrar por estado">
        {FILTERS.map((f) => {
          const count = filterCounts[f.countKey] ?? 0;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={"hp-mres-pill" + (active ? " hp-mres-pill--active" : "")}
              onClick={() => onFilterChange(f.id)}
              aria-pressed={active}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>
      <label className="hp-mres-toolbar__sort">
        <span className="hp-mres-toolbar__sort-label">Ordenar:</span>
        <select
          className="hp-mres-toolbar__select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Ordenar lista"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default HotelManageReservationsToolbar;
