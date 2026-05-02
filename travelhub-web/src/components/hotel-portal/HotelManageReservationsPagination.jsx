import { useTranslation } from "react-i18next";

function buildVisiblePages(current, total) {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const s = new Set([1, total, current, current - 1, current + 1]);
  for (const x of [...s]) {
    if (typeof x === "number" && (x < 1 || x > total)) s.delete(x);
  }
  const sorted = [...s].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

function HotelManageReservationsPagination({ page, pageSize, total, onPageChange }) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const visible = buildVisiblePages(page, totalPages);

  return (
    <div className="hp-mres-pagination">
      <p className="hp-mres-pagination__summary">
        {t("hotelManage.paginationSummary", { from, to, total })}
      </p>
      <nav className="hp-mres-pagination__nav" aria-label={t("hotelManage.paginationNavAria")}>
        <button
          type="button"
          className="hp-mres-page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("hotelManage.pagePrevAria")}
        >
          ‹
        </button>
        {visible.map((p, idx) =>
          p === "…" ? (
            <span key={`e-${idx}`} className="hp-mres-page-ellipsis" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={"hp-mres-page-num" + (p === page ? " hp-mres-page-num--active" : "")}
              onClick={() => onPageChange(p)}
              aria-label={t("hotelManage.pageNumberAria", { n: p })}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="hp-mres-page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label={t("hotelManage.pageNextAria")}
        >
          ›
        </button>
      </nav>
    </div>
  );
}

export default HotelManageReservationsPagination;
