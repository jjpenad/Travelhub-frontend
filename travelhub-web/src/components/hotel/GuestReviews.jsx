import "./GuestReviews.css";

const DEFAULT_SCORES = [
  { id: "cleanliness", label: "Cleanliness", percent: 96 },
  { id: "location", label: "Location", percent: 98 },
  { id: "service", label: "Service", percent: 94 },
  { id: "value", label: "Value", percent: 91 },
];

const DEFAULT_REVIEWS = [
  {
    id: "1",
    name: "Sarah M.",
    initials: "SM",
    text: "Absolutely stunning views and impeccable service. The infinity pool at sunset was unforgettable. We will definitely return.",
  },
  {
    id: "2",
    name: "James R.",
    initials: "JR",
    text: "Great location in Oia, quiet but close to everything. Breakfast was delicious. Only minor issue was the Wi‑Fi speed in the room.",
  },
];

function GuestReviews({
  hotel,
  overallRating: overallRatingProp,
  maxRating = 5,
  scores = DEFAULT_SCORES,
  reviews = DEFAULT_REVIEWS,
}) {
  const overallRating =
    overallRatingProp ?? hotel?.rating ?? 4.9;

  const summary = `${Number(overallRating).toFixed(1)}/${maxRating}`;

  return (
    <section
      className="guest-reviews"
      aria-labelledby="guest-reviews-heading"
    >
      <h2 id="guest-reviews-heading" className="guest-reviews__title">
        Guest Reviews
      </h2>

      <p className="guest-reviews__summary">
        <span className="guest-reviews__summary-value">{summary}</span>
      </p>

      <ul className="guest-reviews__scores" aria-label="Scores by category">
        {scores.map(({ id, label, percent }) => (
          <li key={id} className="guest-reviews__score-row">
            <span className="guest-reviews__score-label">{label}</span>
            <div
              className="guest-reviews__bar"
              role="presentation"
              aria-hidden="true"
            >
              <div
                className="guest-reviews__bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
            <span className="guest-reviews__score-num">{percent}%</span>
          </li>
        ))}
      </ul>

      <ul className="guest-reviews__cards">
        {reviews.map(({ id, name, initials, text }) => (
          <li key={id} className="guest-reviews__card">
            <div className="guest-reviews__card-head">
              <span
                className="guest-reviews__avatar"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="guest-reviews__name">{name}</span>
            </div>
            <p className="guest-reviews__quote">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default GuestReviews;
