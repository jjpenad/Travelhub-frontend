import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import HotelManageReservationsPagination from "./HotelManageReservationsPagination";
import "./HotelReportsTable.css";

const PAGE_SIZE = 10;

function badgeClass(status) {
  if (status === "confirmed") return "hp-reports-table__badge hp-reports-table__badge--confirmed";
  if (status === "pending") return "hp-reports-table__badge hp-reports-table__badge--pending";
  if (status === "cancelled") return "hp-reports-table__badge hp-reports-table__badge--cancelled";
  return "hp-reports-table__badge";
}

/**
 * @param {{ periodLabel: string, rows: object[], onExport: () => void }} props
 */
function HotelReportsTable({ periodLabel, rows = [], onExport }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, pageSafe]);

  return (
    <section className="hp-reports-table-card" aria-labelledby="hp-reports-table-title">
      <div className="hp-reports-table-card__head">
        <h2 id="hp-reports-table-title" className="hp-reports-table-card__title">
          {t("hotelReports.tableTitle", { period: periodLabel })}
        </h2>
        <button type="button" className="hp-reports-table-card__export" onClick={onExport}>
          {t("hotelReports.exportCsv")}
        </button>
      </div>
      <div className="hp-reports-table-wrap">
        <table className="hp-reports-table">
          <thead>
            <tr>
              <th scope="col">{t("hotelReports.colRef")}</th>
              <th scope="col">{t("hotelReports.colGuest")}</th>
              <th scope="col">{t("hotelReports.colRoom")}</th>
              <th scope="col">{t("hotelReports.colCheckIn")}</th>
              <th scope="col">{t("hotelReports.colCheckOut")}</th>
              <th scope="col">{t("hotelReports.colAmount")}</th>
              <th scope="col">{t("hotelReports.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="hp-reports-table__empty">
                  {t("hotelReports.tableEmpty")}
                </td>
              </tr>
            ) : null}
            {pageRows.map((r) => (
              <tr key={r.id || r.reference}>
                <td>
                  <span className="hp-reports-table__ref">{r.reference}</span>
                </td>
                <td>{r.guestName}</td>
                <td>{r.roomLabel}</td>
                <td>{r.checkIn}</td>
                <td>{r.checkOut}</td>
                <td className="hp-reports-table__amount">{r.amount}</td>
                <td>
                  <span className={badgeClass(r.status)}>{r.statusLabel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 ? (
        <HotelManageReservationsPagination
          page={pageSafe}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}

export default HotelReportsTable;
