import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { pathHotelRoomDetail } from "../../constants/routes";

/**
 * @param {{ rows: object[] }} props
 */
function HotelManageRatesTable({ rows }) {
  const { t } = useTranslation();

  return (
    <div className="hp-mres-table-card">
      <div className="hp-mres-table-wrap">
        <table className="hp-mres-table">
          <thead>
            <tr>
              <th scope="col">{t("hotelManageRates.tableColRoomType")}</th>
              <th scope="col">{t("hotelManageRates.tableColDescription")}</th>
              <th scope="col">{t("hotelManageRates.tableColAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="hp-mres-empty">
                  {t("hotelManageRates.tableEmpty")}
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr key={r.id} className="hp-mres-table__row">
                <td>
                  <span className="hp-mres-ref" style={{ color: "var(--primary-600)", fontWeight: 600 }}>
                    {r.name}
                  </span>
                </td>
                <td style={{ maxWidth: "450px", fontSize: "0.8125rem", color: "var(--slate-500)" }}>
                  {r.description}
                </td>
                <td>
                  <div className="hp-mres-actions">
                    <Link
                      className="hp-mres-actions__detail"
                      to={pathHotelRoomDetail(r.id)}
                    >
                      {t("hotelManageRates.actionEdit")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HotelManageRatesTable;
