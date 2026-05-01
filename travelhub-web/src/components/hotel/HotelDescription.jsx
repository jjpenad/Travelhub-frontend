import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./HotelDescription.css";

function HotelDescription({ hotel }) {
  const { t } = useTranslation();

  const text = useMemo(() => {
    if (!hotel) return "";
    const hotelName = hotel.name ?? t("hotelDetail.aboutHotelFallback");
    const place = hotel.location ?? t("hotelDetail.aboutPlaceFallback");
    return t("hotelDetail.aboutBody", { hotelName, place });
  }, [hotel, t]);

  if (!hotel) {
    return null;
  }

  return (
    <section className="hotel-description" aria-labelledby="hotel-description-heading">
      <h2 id="hotel-description-heading" className="hotel-description__title">
        {t("hotelDetail.aboutTitle")}
      </h2>
      <p className="hotel-description__text">{text}</p>
    </section>
  );
}

export default HotelDescription;
