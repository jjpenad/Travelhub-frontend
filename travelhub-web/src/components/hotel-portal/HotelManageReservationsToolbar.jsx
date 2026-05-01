import { useMemo } from "react";
import { useTranslation } from "react-i18next";

function HotelManageReservationsToolbar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  filterCounts,
}) {
  const { t } = useTranslation();

  const filters = useMemo(
    () => [
      { id: "all", label: t("hotelManage.filterAll"), countKey: "all" },
      { id: "confirmed", label: t("hotelManage.filterConfirmed"), countKey: "confirmed" },
      { id: "pending", label: t("hotelManage.filterPending"), countKey: "pending" },
      { id: "cancelled", label: t("hotelManage.filterCancelled"), countKey: "cancelled" },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "recent", label: t("hotelManage.sortRecent") },
      { value: "oldest", label: t("hotelManage.sortOldest") },
      { value: "amount_high", label: t("hotelManage.sortAmountHigh") },
      { value: "amount_low", label: t("hotelManage.sortAmountLow") },
    ],
    [t],
  );

  return (
    <div className="hp-mres-toolbar">
      <label className="hp-mres-toolbar__search">
        <span className="visually-hidden">{t("hotelManage.searchAria")}</span>
        <input
          type="search"
          className="hp-mres-toolbar__input"
          placeholder={t("hotelManage.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </label>
      <div className="hp-mres-toolbar__filters" role="group" aria-label={t("hotelManage.filtersGroupAria")}>
        {filters.map((f) => {
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
        <span className="hp-mres-toolbar__sort-label">{t("hotelManage.sortLabel")}</span>
        <select
          className="hp-mres-toolbar__select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label={t("hotelManage.sortListAria")}
        >
          {sortOptions.map((o) => (
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
