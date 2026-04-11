import { buildDescriptionText } from "../../utils/hotelDetailHelpers";
import "./HotelDescription.css";

function HotelDescription({ hotel, onShowMore }) {
  if (!hotel) {
    return null;
  }

  const text = buildDescriptionText(
    hotel.name ?? "This property",
    hotel.location,
  );

  return (
    <section className="hotel-description" aria-labelledby="hotel-description-heading">
      <h2 id="hotel-description-heading" className="hotel-description__title">
        About this property
      </h2>
      <p className="hotel-description__text">{text}</p>
      <button
        type="button"
        className="hotel-description__more"
        onClick={onShowMore}
      >
        Show more
      </button>
    </section>
  );
}

export default HotelDescription;
