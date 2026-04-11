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

const AMENITIES = [
  { id: "pool", label: "Pool", Icon: IconAmenityPool },
  { id: "breakfast", label: "Breakfast", Icon: IconAmenityBreakfast },
  { id: "wifi", label: "WiFi", Icon: IconAmenityWifi },
  { id: "spa", label: "Spa", Icon: IconAmenitySpa },
  { id: "parking", label: "Parking", Icon: IconAmenityParking },
  { id: "bar", label: "Bar", Icon: IconAmenityBar },
];

function HotelHeader({ hotel }) {
  if (!hotel) {
    return null;
  }

  const title = hotel.name ?? "";
  const location = hotel.location ?? "Santorini, Greece";
  const rating = hotel.rating ?? 4.9;
  const ratingNum =
    typeof rating === "number" ? rating.toFixed(1) : String(rating ?? "");

  return (
    <header className="hotel-header">
      <div className="hotel-header__title-row">
        <h1 className="hotel-header__title">{title}</h1>
        <div className="hotel-header__badges" aria-label="Tipo de alojamiento">
          <span className="hotel-header__badge">Hotel</span>
          <span className="hotel-header__badge hotel-header__badge--verified">
            Verified
          </span>
        </div>
      </div>

      <p className="hotel-header__location">
        <IconMapMarker className="hotel-header__location-icon" aria-hidden />
        <span>{location}</span>
      </p>

      <div
        className="hotel-header__rating-row"
        aria-label={`Valoración ${ratingNum} de 5`}
      >
        <span className="hotel-header__stars" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <IconStar key={i} className="hotel-header__star" />
          ))}
        </span>
        <span className="hotel-header__rating-value">{ratingNum}</span>
      </div>

      <ul className="hotel-header__amenities" aria-label="Servicios destacados">
        {AMENITIES.map(({ id, label, Icon }) => (
          <li key={id} className="hotel-header__amenity">
            <Icon className="hotel-header__amenity-icon" />
            <span className="hotel-header__amenity-label">{label}</span>
          </li>
        ))}
      </ul>
    </header>
  );
}

export default HotelHeader;
