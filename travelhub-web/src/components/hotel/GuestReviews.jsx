import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./GuestReviews.css";

function GuestReviews({
  hotel,
  overallRating: overallRatingProp,
  maxRating = 5,
  scores: scoresProp,
  reviews: reviewsProp,
}) {
  const { t } = useTranslation();

  const defaultScores = useMemo(
    () => [
      { id: "cleanliness", label: t("hotelDetail.guestReviewScore_cleanliness"), percent: 96 },
      { id: "location", label: t("hotelDetail.guestReviewScore_location"), percent: 98 },
      { id: "service", label: t("hotelDetail.guestReviewScore_service"), percent: 94 },
      { id: "value", label: t("hotelDetail.guestReviewScore_value"), percent: 91 },
    ],
    [t],
  );

  const defaultReviews = useMemo(
    () => [
      {
        id: "1",
        name: "Sarah M.",
        initials: "SM",
        text: t("hotelDetail.guestReviewText1"),
      },
      {
        id: "2",
        name: "James R.",
        initials: "JR",
        text: t("hotelDetail.guestReviewText2"),
      },
    ],
    [t],
  );

  const scores = scoresProp ?? defaultScores;
  const reviews = reviewsProp ?? defaultReviews;

  const overallRating = overallRatingProp ?? hotel?.rating ?? 4.9;
  const summary = `${Number(overallRating).toFixed(1)}/${maxRating}`;

  return (
    <section className="guest-reviews" aria-labelledby="guest-reviews-heading">
      <h2 id="guest-reviews-heading" className="guest-reviews__title">
        {t("hotelDetail.guestReviewsTitle")}
      </h2>

      <p className="guest-reviews__summary">
        <span className="guest-reviews__summary-value">{summary}</span>
      </p>

      <ul className="guest-reviews__scores" aria-label={t("hotelDetail.guestReviewsScoresAria")}>
        {scores.map(({ id, label, percent }) => (
          <li key={id} className="guest-reviews__score-row">
            <span className="guest-reviews__score-label">{label}</span>
            <div className="guest-reviews__bar" role="presentation" aria-hidden="true">
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
              <span className="guest-reviews__avatar" aria-hidden="true">
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
