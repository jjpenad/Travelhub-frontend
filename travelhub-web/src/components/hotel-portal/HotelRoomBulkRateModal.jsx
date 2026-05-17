import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * @param {{ 
 *   isOpen: boolean, 
 *   onClose: () => void, 
 *   roomTypeId: string,
 *   onSave: (payload: object) => Promise<void>
 * }} props
 */
function HotelRoomBulkRateModal({ isOpen, onClose, roomTypeId, onSave }) {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availableUnits, setAvailableUnits] = useState(1);
  const [pricePerNight, setPricePerNight] = useState("");
  const [minStay, setMinStay] = useState(1);
  const [currencyCode, setCurrencyCode] = useState("USD");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        room_type_id: roomTypeId,
        start_date: startDate,
        end_date: endDate,
        available_units: Number(availableUnits),
        price_per_night: String(pricePerNight),
        currency_code: currencyCode,
        minimum_stay: Number(minStay)
      });
      onClose();
    } catch (err) {
      if (err.status === 409) {
        setError(t("hotelRoomBulkRateModal.conflictError"));
      } else {
        setError(t("hotelRoomRateModal.saveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hp-modal-overlay" onClick={onClose}>
      <div className="hp-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <header className="hp-modal-header">
          <h2 className="hp-modal-title">{t("hotelRoomBulkRateModal.title")}</h2>
          <button className="hp-modal-close" onClick={onClose}>&times;</button>
        </header>

        <form onSubmit={handleSave} className="hp-modal-body">
          <div className="hp-resd-stay-dates-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="hp-resd-field" style={{ flex: 1 }}>
              <label className="hp-resd-label">{t("hotelRoomBulkRateModal.labelStartDate")}</label>
              <input 
                type="date" 
                className="hp-mres-toolbar__input" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="hp-resd-field" style={{ flex: 1 }}>
              <label className="hp-resd-label">{t("hotelRoomBulkRateModal.labelEndDate")}</label>
              <input 
                type="date" 
                className="hp-mres-toolbar__input" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="hp-resd-stay-secondary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="hp-resd-field">
              <label className="hp-resd-label">{t("hotelRoomRateModal.labelUnits")}</label>
              <input 
                type="number" 
                className="hp-mres-toolbar__input" 
                value={availableUnits}
                onChange={(e) => setAvailableUnits(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="hp-resd-field">
              <label className="hp-resd-label">{t("hotelRoomRateModal.labelPrice")}</label>
              <input 
                type="number" 
                step="0.01"
                className="hp-mres-toolbar__input" 
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                required
              />
            </div>
            <div className="hp-resd-field">
              <label className="hp-resd-label">{t("hotelRoomBulkRateModal.labelMinStay")}</label>
              <input 
                type="number" 
                className="hp-mres-toolbar__input" 
                value={minStay}
                onChange={(e) => setMinStay(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="hp-resd-field">
              <label className="hp-resd-label">{t("hotelRoomBulkRateModal.labelCurrency")}</label>
              <select 
                className="hp-mres-toolbar__select" 
                style={{ width: '100%', height: '38px' }}
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </select>
            </div>
          </div>

          {error && <p style={{ color: 'var(--error)', marginTop: '1.5rem', fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>}

          <footer className="hp-modal-footer">
            <button 
              type="button" 
              className="hp-mres-actions__secondary" 
              onClick={onClose}
              disabled={saving}
            >
              {t("hotelRoomRateModal.btnCancel")}
            </button>
            <button 
              type="submit" 
              className="hp-mres-pill hp-mres-pill--active"
              style={{ height: '38px', padding: '0 1.5rem' }}
              disabled={saving}
            >
              {saving ? t("hotelRoomDetail.loading") : t("hotelRoomBulkRateModal.btnCreate")}
            </button>
          </footer>
        </form>
      </div>

      <style jsx>{`
        .hp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .hp-modal-content {
          background: var(--bg);
          width: 90%;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }
        .hp-modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .hp-modal-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-h);
        }
        .hp-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-muted);
        }
        .hp-modal-body {
          padding: 1.5rem;
        }
        .hp-resd-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
        }
        .hp-modal-footer {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}

export default HotelRoomBulkRateModal;
