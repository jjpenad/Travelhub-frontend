import { useTranslation } from "react-i18next";

/**
 * @param {{ 
 *   items: Array<object>, 
 *   loading: boolean, 
 *   startDate: string, 
 *   endDate: string, 
 *   onStartDateChange: (v: string) => void, 
 *   onEndDateChange: (v: string) => void, 
 *   onSearch: () => void,
 *   page: number,
 *   totalPages: number,
 *   onPageChange: (p: number) => void,
 *   onEdit: (day: object) => void
 * }} props
 */
function HotelRoomCalendarTable({ 
  items, 
  loading, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onSearch,
  page,
  totalPages,
  onPageChange,
  onEdit
}) {
  const { t } = useTranslation();

  return (
    <section className="hp-resd-card" style={{ marginTop: '1.25rem' }}>
      <h2 className="hp-resd-card__title">{t("hotelRoomCalendar.title")}</h2>
      
      <div className="hp-mres-toolbar" style={{ marginTop: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t("hero.checkIn")}</label>
            <input 
              type="date" 
              className="hp-mres-toolbar__input" 
              value={startDate} 
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t("hero.checkOut")}</label>
            <input 
              type="date" 
              className="hp-mres-toolbar__input" 
              value={endDate} 
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
          <button 
            type="button" 
            className="hp-mres-pill hp-mres-pill--active" 
            style={{ height: '38px', padding: '0 1.5rem' }}
            onClick={onSearch}
            disabled={loading || !startDate || !endDate}
          >
            {t("hero.searchAction")}
          </button>
        </div>
      </div>

      <div className="hp-mres-table-wrap" style={{ marginTop: '1rem' }}>
        <table className="hp-mres-table">
          <thead>
            <tr>
              <th scope="col">{t("hotelRoomCalendar.tableColAvailable")}</th>
              <th scope="col">{t("hotelRoomCalendar.tableColPrice")}</th>
              <th scope="col" style={{ textAlign: 'right' }}>{t("hotelRoomCalendar.tableColDate")}</th>
              <th scope="col" style={{ textAlign: 'center' }}>{t("hotelManageRates.tableColAction")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="hp-mres-empty">{t("hotelPortal.loadingSeg")}</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="hp-mres-empty">{t("hotelRoomCalendar.tableEmpty")}</td>
              </tr>
            ) : (
              items.map((day) => {
                const isSoldOut = day.available_units <= 0;
                // Format YYYY-MM-DD to DD/MM/YYYY
                const parts = day.date.split("-");
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : day.date;
                
                // Compare with today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const itemDate = new Date(day.date + 'T00:00:00');
                const isFuture = itemDate > today;

                return (
                  <tr key={day.id} className="hp-mres-table__row">
                    <td>
                      <span className={`hp-mres-badge ${isSoldOut ? 'hp-mres-badge--cancelled' : 'hp-mres-badge--confirmed'}`}>
                        {isSoldOut ? t("hotelRoomCalendar.statusSoldOut") : day.available_units}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--primary-700)" }}>
                      {new Intl.NumberFormat().format(day.price_per_night)} {day.currency_code}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formattedDate}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isFuture && (
                        <button 
                          type="button" 
                          className="hp-mres-actions__detail"
                          onClick={() => onEdit(day)}
                        >
                          {t("hotelManageRates.actionEdit")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="hp-mres-pagination" style={{ marginTop: '1rem', padding: '0 0.5rem' }}>
          <div className="hp-mres-pagination__nav" style={{ marginLeft: 'auto' }}>
            <button 
              className="hp-mres-page-btn" 
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              &lt;
            </button>
            <span className="hp-mres-page-num hp-mres-page-num--active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {page}
            </span>
            <button 
              className="hp-mres-page-btn" 
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default HotelRoomCalendarTable;
