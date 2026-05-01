import { useTranslation } from "react-i18next";

function HotelManageReservationsHeader() {
  const { t } = useTranslation();
  return (
    <header className="hp-mres-head">
      <div className="hp-mres-head__text">
        <h1 className="hp-mres-head__title">{t("hotelManage.pageTitle")}</h1>
        <p className="hp-mres-head__subtitle">{t("hotelManage.pageSubtitle")}</p>
      </div>
    </header>
  );
}

export default HotelManageReservationsHeader;
