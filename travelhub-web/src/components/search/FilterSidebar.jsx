import { useId, useMemo, useState } from "react";
import { IconChevronDown, IconStar } from "../home/HeroIcons";
import "./FilterSidebar.css";

const PRICE_MIN = 50;
const PRICE_MAX = 600;
const PRICE_STEP = 10;

function formatPrice(value) {
  return `$${value.toLocaleString("es")}`;
}

function FilterSidebar({ copy }) {
  const headingId = useId();
  const priceMinId = useId();
  const priceMaxId = useId();
  const guestRatingId = useId();

  const [priceMin, setPriceMin] = useState(120);
  const [priceMax, setPriceMax] = useState(480);
  const [starRating, setStarRating] = useState(null);
  const [propertyTypes, setPropertyTypes] = useState({
    hotel: true,
    resort: true,
  });
  const [amenities, setAmenities] = useState({
    pool: true,
    breakfast: true,
  });
  const [guestRating, setGuestRating] = useState("any");

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceMin !== PRICE_MIN || priceMax !== PRICE_MAX) count += 1;
    if (starRating) count += 1;
    if (Object.values(propertyTypes).some(Boolean)) count += 1;
    if (Object.values(amenities).some(Boolean)) count += 1;
    if (guestRating && guestRating !== "any") count += 1;
    return count;
  }, [priceMin, priceMax, starRating, propertyTypes, amenities, guestRating]);

  const rangeLeftPct = ((priceMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const rangeRightPct =
    100 - ((priceMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const handleMinChange = (event) => {
    const next = Math.min(Number(event.target.value), priceMax - PRICE_STEP);
    setPriceMin(next);
  };
  const handleMaxChange = (event) => {
    const next = Math.max(Number(event.target.value), priceMin + PRICE_STEP);
    setPriceMax(next);
  };

  const togglePropertyType = (key) =>
    setPropertyTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleAmenity = (key) =>
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleReset = () => {
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
    setStarRating(null);
    setPropertyTypes({});
    setAmenities({});
    setGuestRating("any");
  };

  return (
    <aside
      className="filter-sidebar"
      aria-labelledby={headingId}
    >
      <header className="filter-sidebar__header">
        <h2 id={headingId} className="filter-sidebar__title">
          {copy.title}
        </h2>
        <button
          type="button"
          className="filter-sidebar__reset"
          onClick={handleReset}
        >
          {copy.resetAll}
        </button>
      </header>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy.priceRange}</h3>

        <div
          className="filter-sidebar__range"
          style={{
            "--range-left": `${rangeLeftPct}%`,
            "--range-right": `${rangeRightPct}%`,
          }}
        >
          <div className="filter-sidebar__range-track" aria-hidden="true">
            <div className="filter-sidebar__range-fill" />
          </div>
          <label htmlFor={priceMinId} className="filter-sidebar__visually-hidden">
            {copy.priceMinLabel}
          </label>
          <input
            id={priceMinId}
            type="range"
            className="filter-sidebar__range-input filter-sidebar__range-input--min"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceMin}
            onChange={handleMinChange}
            aria-valuetext={formatPrice(priceMin)}
          />
          <label htmlFor={priceMaxId} className="filter-sidebar__visually-hidden">
            {copy.priceMaxLabel}
          </label>
          <input
            id={priceMaxId}
            type="range"
            className="filter-sidebar__range-input filter-sidebar__range-input--max"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={priceMax}
            onChange={handleMaxChange}
            aria-valuetext={formatPrice(priceMax)}
          />
        </div>

        <div className="filter-sidebar__range-legend">
          <span>{formatPrice(PRICE_MIN)}</span>
          <span className="filter-sidebar__range-current">
            {formatPrice(priceMin)} – {formatPrice(priceMax)}
          </span>
          <span>{formatPrice(PRICE_MAX)}+</span>
        </div>
      </section>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy.starRating}</h3>
        <ul className="filter-sidebar__stars" role="radiogroup" aria-label={copy.starRating}>
          {copy.starOptions.map(({ value, label }) => {
            const isActive = starRating === value;
            return (
              <li key={value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={
                    "filter-sidebar__star-row" +
                    (isActive ? " filter-sidebar__star-row--active" : "")
                  }
                  onClick={() => setStarRating(isActive ? null : value)}
                >
                  <span className="filter-sidebar__star-icons" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar
                        key={i}
                        className={
                          "filter-sidebar__star" +
                          (i < value ? " filter-sidebar__star--filled" : "")
                        }
                      />
                    ))}
                  </span>
                  <span className="filter-sidebar__star-label">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy.propertyType}</h3>
        <ul className="filter-sidebar__checklist">
          {copy.propertyTypeOptions.map(({ key, label }) => (
            <li key={key}>
              <label className="filter-sidebar__check">
                <input
                  type="checkbox"
                  className="filter-sidebar__check-input"
                  checked={Boolean(propertyTypes[key])}
                  onChange={() => togglePropertyType(key)}
                />
                <span className="filter-sidebar__check-box" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="12" height="12">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8.5l3.2 3.2L13 4.8"
                    />
                  </svg>
                </span>
                <span className="filter-sidebar__check-label">{label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy.amenities}</h3>
        <ul className="filter-sidebar__checklist">
          {copy.amenityOptions.map(({ key, label, icon }) => (
            <li key={key}>
              <label className="filter-sidebar__check">
                <input
                  type="checkbox"
                  className="filter-sidebar__check-input"
                  checked={Boolean(amenities[key])}
                  onChange={() => toggleAmenity(key)}
                />
                <span className="filter-sidebar__check-box" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="12" height="12">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8.5l3.2 3.2L13 4.8"
                    />
                  </svg>
                </span>
                <span
                  className="filter-sidebar__amenity-icon"
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <span className="filter-sidebar__check-label">{label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy.guestRating}</h3>
        <div className="filter-sidebar__select-wrap">
          <label
            htmlFor={guestRatingId}
            className="filter-sidebar__visually-hidden"
          >
            {copy.guestRating}
          </label>
          <select
            id={guestRatingId}
            className="filter-sidebar__select"
            value={guestRating}
            onChange={(e) => setGuestRating(e.target.value)}
          >
            {copy.guestRatingOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="filter-sidebar__select-chevron" aria-hidden="true">
            <IconChevronDown className="filter-sidebar__select-chevron-icon" />
          </span>
        </div>
      </section>

      <div className="filter-sidebar__apply">
        <button type="button" className="filter-sidebar__apply-button">
          {copy.applyFilters}
        </button>
        <p className="filter-sidebar__active-count" aria-live="polite">
          {copy.activeFilters(activeFiltersCount)}
        </p>
      </div>
    </aside>
  );
}

export default FilterSidebar;
