import "./GuestReviews.css";

const DEFAULT_SCORES = [
  { id: "cleanliness", label: "Limpieza", percent: 96 },
  { id: "location", label: "Ubicación", percent: 98 },
  { id: "service", label: "Servicio", percent: 94 },
  { id: "value", label: "Relación calidad-precio", percent: 91 },
];

const DEFAULT_REVIEWS = [
  {
    id: "1",
    name: "Sarah M.",
    initials: "SM",
    text: "Vistas absolutamente espectaculares y un servicio impecable. La piscina infinita al atardecer fue inolvidable. Sin duda volveremos.",
  },
  {
    id: "2",
    name: "James R.",
    initials: "JR",
    text: "Excelente ubicación en Oia, tranquilo pero cerca de todo. El desayuno estaba delicioso. Como único detalle, la velocidad del Wi‑Fi en la habitación.",
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
        Opiniones de huéspedes
      </h2>

      <p className="guest-reviews__summary">
        <span className="guest-reviews__summary-value">{summary}</span>
      </p>

      <ul className="guest-reviews__scores" aria-label="Puntuaciones por categoría">
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
