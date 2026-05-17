import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./CancelReservationDialog.css";

/**
 * Confirmación antes de cancelar una reserva desde Mis viajes.
 */
function CancelReservationDialog({
  open,
  hotelName,
  reference,
  loading = false,
  error = null,
  onConfirm,
  onKeep,
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const keepBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    keepBtnRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === "Escape" && !loading) onKeep?.();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, loading, onKeep]);

  if (!open) return null;

  const refLine =
    reference && String(reference).trim() !== ""
      ? t("trips.cancelModalRef", { ref: String(reference).trim() })
      : "";

  return (
    <div
      className="cancel-res-dialog__overlay"
      role="presentation"
      onClick={loading ? undefined : onKeep}
    >
      <div
        className="cancel-res-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="cancel-res-dialog__title">
          {t("trips.cancelModalTitle")}
        </h2>
        <p id={descId} className="cancel-res-dialog__message">
          {t("trips.cancelModalMessage", {
            hotel: hotelName || t("trips.accommodation"),
          })}
          {refLine ? (
            <>
              {" "}
              <span className="cancel-res-dialog__ref">{refLine}</span>
            </>
          ) : null}
        </p>
        <p className="cancel-res-dialog__hint">{t("trips.cancelModalHint")}</p>
        {error ? (
          <p className="cancel-res-dialog__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="cancel-res-dialog__actions">
          <button
            type="button"
            className="cancel-res-dialog__btn cancel-res-dialog__btn--confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("trips.cancelModalProcessing") : t("trips.cancelModalConfirm")}
          </button>
          <button
            ref={keepBtnRef}
            type="button"
            className="cancel-res-dialog__btn cancel-res-dialog__btn--keep"
            onClick={onKeep}
            disabled={loading}
          >
            {t("trips.cancelModalKeep")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelReservationDialog;
