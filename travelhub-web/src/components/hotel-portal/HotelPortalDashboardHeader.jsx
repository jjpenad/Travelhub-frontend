import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./HotelPortalDashboardHeader.css";

/** Cabecera del dashboard hotelero */
function HotelPortalDashboardHeader({ firstName }) {
  const { t } = useTranslation();

  const subtitle = useMemo(() => {
    const fn = typeof firstName === "string" && firstName.trim() ? firstName.trim() : t("hotelPortal.dashNameFallback");
    return t("hotelPortal.dashWelcome", { name: fn });
  }, [firstName, t]);

  return (
    <header className="hp-dash-header">
      <div className="hp-dash-header__titles">
        <h1 className="hp-dash-header__title">{t("hotelPortal.dashHeaderTitle")}</h1>
        <p className="hp-dash-header__subtitle">{subtitle}</p>
      </div>
    </header>
  );
}

export default HotelPortalDashboardHeader;
