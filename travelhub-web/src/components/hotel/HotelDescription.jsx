import { buildDescriptionText } from "../../utils/hotelDetailHelpers";
import "./HotelDescription.css";

function HotelDescription({ hotel }) {
  if (!hotel) {
    return null;
  }

  const text = buildDescriptionText(
    hotel.name ?? "Este alojamiento",
    hotel.location,
  );

  return (
    <section className="hotel-description" aria-labelledby="hotel-description-heading">
      <h2 id="hotel-description-heading" className="hotel-description__title">
        Sobre este alojamiento
      </h2>
      <p className="hotel-description__text">{text}</p>
    </section>
  );
}

export default HotelDescription;
