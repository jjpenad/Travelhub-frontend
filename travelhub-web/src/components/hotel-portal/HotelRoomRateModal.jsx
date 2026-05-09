import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * @param {{ 
 *   isOpen: boolean, 
 *   onClose: () => void, 
 *   roomName: string, 
 *   dayData: object,
 *   onSave: (payload: object) => Promise<void>
 * }} props
 */
function HotelRoomRateModal({ isOpen, onClose, roomName, dayData, onSave }) {
  const { t } = useTranslation();
  const [availableUnits, setAvailableUnits] = useState(dayData?.available_units || 0);
  const [pricePerNight, setPricePerNight] = useState(dayData?.price_per_night || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        available_units: Number(availableUnits),
        price_per_night: String(pricePerNight)
      });
      onClose();
    } catch {
      setError(t("hotelRoomRateModal.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hp-modal-overlay" onClick={onClose}>
      <div className="hp-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="hp-modal-header">
          <h2 className="hp-modal-title">{t("hotelRoomRateModal.title")}</h2>
          <button className="hp-modal-close" onClick={onClose}>&times;</button>
        </header>

        <form onSubmit={handleSave} className="hp-modal-body">
          <div className="hp-modal-info-row">
            <div className="hp-modal-info-item">
              <strong>{t("hotelRoomRateModal.infoRoom")}:</strong> {roomName}
            </div>
            <div className="hp-modal-info-item">
              <strong>{t("hotelRoomRateModal.infoDate")}:</strong> {dayData?.date}
            </div>
          </div>

          <div className="hp-resd-fields" style={{ marginTop: '1.5rem' }}>
            <div className="hp-resd-field">
              <label className="hp-resd-label">{t("hotelRoomRateModal.labelUnits")}</label>
              <input 
                type="number" 
                className="hp-mres-toolbar__input" 
                value={availableUnits}
                onChange={(e) => setAvailableUnits(e.target.value)}
                min="0"
                required
              />
            </div>
            <div className="hp-resd-field" style={{ marginTop: '1rem' }}>
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
          </div>

          {error && <p style={{ color: 'var(--error)', marginTop: '1rem', fontSize: '0.85rem' }}>{error}</p>}

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
              {saving ? t("hotelRoomDetail.loading") : t("hotelRoomRateModal.btnSave")}
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
          width: 100%;
          max-width: 500px;
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
        .hp-modal-info-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        .hp-modal-info-item {
          font-size: 0.9rem;
          color: var(--text-h);
        }
        .hp-modal-footer {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .hp-resd-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}

export default HotelRoomRateModal;
