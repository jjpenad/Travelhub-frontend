import { createElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IconStar } from "../home/HeroIcons";
import {
  IconAmenityBar,
  IconAmenityBreakfast,
  IconAmenityParking,
  IconAmenityPool,
  IconAmenitySpa,
  IconAmenityWifi,
  IconMapMarker,
} from "./hotelAmenityIcons";
import "./HotelHeader.css";

function HotelHeader({ hotel }) {
  const { t } = useTranslation();

  const amenities = useMemo(
    () => [
      { id: "pool", labelKey: "hotelDetail.headerAmenityPool", Icon: IconAmenityPool },
      { id: "breakfast", labelKey: "hotelDetail.headerAmenityBreakfast", Icon: IconAmenityBreakfast },
      { id: "wifi", labelKey: "hotelDetail.headerAmenityWifi", Icon: IconAmenityWifi },
      { id: "spa", labelKey: "hotelDetail.headerAmenitySpa", Icon: IconAmenitySpa },
      { id: "parking", labelKey: "hotelDetail.headerAmenityParking", Icon: IconAmenityParking },
      { id: "bar", labelKey: "hotelDetail.headerAmenityBar", Icon: IconAmenityBar },
    ],
    [],
  );

  if (!hotel) {
    return null;
  }

  const title = hotel.name ?? "";
  const location = hotel.location ?? t("hotelDetail.headerLocationFallback");
  const rating = hotel.rating ?? 4.9;
  const ratingNum = typeof rating === "number" ? rating.toFixed(1) : String(rating ?? "");

  return (
    <header className="hotel-header">
      <div className="hotel-header__title-row">
        <h1 className="hotel-header__title">{title}</h1>
        <div className="hotel-header__badges" aria-label={t("hotelDetail.headerBadgesAria")}>
          <span className="hotel-header__badge">{t("hotelDetail.propertyTypeHotel")}</span>
          <span className="hotel-header__badge hotel-header__badge--verified">
            {t("hotelDetail.verifiedBadge")}
          </span>
        </div>
      </div>

      <p className="hotel-header__location">
        <IconMapMarker className="hotel-header__location-icon" aria-hidden />
        <span>{location}</span>
      </p>

      <div className="hotel-header__rating-row" aria-label={t("hotelDetail.headerRatingAria", { rating: ratingNum })}>
        <span className="hotel-header__stars" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <IconStar key={i} className="hotel-header__star" />
          ))}
        </span>
        <span className="hotel-header__rating-value">{ratingNum}</span>
      </div>

      <ul className="hotel-header__amenities" aria-label={t("hotelDetail.headerAmenitiesAria")}>
        {amenities.map(({ id, labelKey, Icon }) => (
          <li key={id} className="hotel-header__amenity">
            {createElement(Icon, {
              className: "hotel-header__amenity-icon",
            })}
            <span className="hotel-header__amenity-label">{t(labelKey)}</span>
          </li>
        ))}
      </ul>
    </header>
  );
}

export default HotelHeader;
