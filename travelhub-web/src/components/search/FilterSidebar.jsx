import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { localeTagForI18n } from "../../utils/locale";
import { IconStar } from "../home/HeroIcons";
import "./FilterSidebar.css";

export const FILTER_PRICE_FLOOR = 10;
export const FILTER_PRICE_CEILING = 500;
const PRICE_STEP = 10;

function normalizeAmenitiesRecord(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value };
}

/**
 * @param {{
 *   copy: object,
 *   initialPriceMin?: number,
 *   initialPriceMax?: number,
 *   initialMinStars?: number | null,
 *   initialAmenities?: Record<string, boolean>,
 *   onApply: (snapshot: { priceMin: number, priceMax: number, minStars: number | null, amenityKeys: string[] }) => void,
 *   onResetFilters: () => void,
 * }} props
 */
function FilterSidebar({
  copy,
  initialPriceMin = FILTER_PRICE_FLOOR,
  initialPriceMax = FILTER_PRICE_CEILING,
  initialMinStars = null,
  initialAmenities = {},
  onApply,
  onResetFilters,
}) {
  const { t, i18n } = useTranslation();
  const formatPrice = (value) =>
    `$${value.toLocaleString(localeTagForI18n(i18n.language))}`;

  const headingId = useId();
  const priceMinId = useId();
  const priceMaxId = useId();

  const [priceMin, setPriceMin] = useState(() => initialPriceMin);
  const [priceMax, setPriceMax] = useState(() => initialPriceMax);
  const [minStars, setMinStars] = useState(() => initialMinStars ?? null);
  const [amenities, setAmenities] = useState(() => normalizeAmenitiesRecord(initialAmenities));

  const amenityOptions = useMemo(
    () => (Array.isArray(copy?.amenityOptions) ? copy.amenityOptions : []),
    [copy],
  );

  const activeFiltersCount = useMemo(() => {
    const am = normalizeAmenitiesRecord(amenities);
    let count = 0;
    if (priceMin !== FILTER_PRICE_FLOOR || priceMax !== FILTER_PRICE_CEILING) count += 1;
    if (minStars != null) count += 1;
    if (Object.values(am).some(Boolean)) count += 1;
    return count;
  }, [priceMin, priceMax, minStars, amenities]);

  const rangeLeftPct =
    ((priceMin - FILTER_PRICE_FLOOR) / (FILTER_PRICE_CEILING - FILTER_PRICE_FLOOR)) * 100;
  const rangeRightPct =
    100 -
    ((priceMax - FILTER_PRICE_FLOOR) / (FILTER_PRICE_CEILING - FILTER_PRICE_FLOOR)) * 100;

  const handleMinChange = (event) => {
    const next = Math.min(Number(event.target.value), priceMax - PRICE_STEP);
    setPriceMin(next);
  };
  const handleMaxChange = (event) => {
    const next = Math.max(Number(event.target.value), priceMin + PRICE_STEP);
    setPriceMax(next);
  };

  const toggleAmenity = (key) => {
    setAmenities((prev) => {
      const base = normalizeAmenitiesRecord(prev);
      return { ...base, [key]: !base[key] };
    });
  };

  const handleReset = () => {
    setPriceMin(FILTER_PRICE_FLOOR);
    setPriceMax(FILTER_PRICE_CEILING);
    setMinStars(null);
    setAmenities({});
    onResetFilters();
  };

  const handleApply = () => {
    const am = normalizeAmenitiesRecord(amenities);
    const amenityKeys = amenityOptions.map((o) => o.key).filter((k) => Boolean(am[k]));
    onApply({
      priceMin,
      priceMax,
      minStars,
      amenityKeys,
    });
  };

  return (
    <aside
      className="filter-sidebar"
      aria-labelledby={headingId}
    >
      <header className="filter-sidebar__header">
        <h2 id={headingId} className="filter-sidebar__title">
          {copy?.title ?? t("search.filters.title")}
        </h2>
        <button
          type="button"
          className="filter-sidebar__reset"
          onClick={handleReset}
        >
          {copy?.resetAll ?? t("search.filters.resetAll")}
        </button>
      </header>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy?.priceRange ?? t("search.filters.priceRange")}</h3>

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
            {copy?.priceMinLabel ?? t("search.filters.priceMinLabel")}
          </label>
          <input
            id={priceMinId}
            type="range"
            className="filter-sidebar__range-input filter-sidebar__range-input--min"
            min={FILTER_PRICE_FLOOR}
            max={FILTER_PRICE_CEILING}
            step={PRICE_STEP}
            value={priceMin}
            onChange={handleMinChange}
            aria-valuetext={formatPrice(priceMin)}
          />
          <label htmlFor={priceMaxId} className="filter-sidebar__visually-hidden">
            {copy?.priceMaxLabel ?? t("search.filters.priceMaxLabel")}
          </label>
          <input
            id={priceMaxId}
            type="range"
            className="filter-sidebar__range-input filter-sidebar__range-input--max"
            min={FILTER_PRICE_FLOOR}
            max={FILTER_PRICE_CEILING}
            step={PRICE_STEP}
            value={priceMax}
            onChange={handleMaxChange}
            aria-valuetext={formatPrice(priceMax)}
          />
        </div>

        <div className="filter-sidebar__range-legend">
          <span>{formatPrice(FILTER_PRICE_FLOOR)}</span>
          <span className="filter-sidebar__range-current">
            {formatPrice(priceMin)} – {formatPrice(priceMax)}
          </span>
          <span>{formatPrice(FILTER_PRICE_CEILING)}+</span>
        </div>
      </section>

      <section className="filter-sidebar__section">
        <h3 className="filter-sidebar__section-title">{copy?.starRating ?? t("search.filters.starRating")}</h3>
        <ul
          className="filter-sidebar__stars"
          role="radiogroup"
          aria-label={copy?.starRating ?? t("search.filters.starRating")}
        >
          {(Array.isArray(copy?.starOptions) ? copy.starOptions : []).map(({ value, label }) => {
            const isActive = minStars === value;
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
                  onClick={() => setMinStars(isActive ? null : value)}
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
        <h3 className="filter-sidebar__section-title">{copy?.amenities ?? t("search.filters.amenities")}</h3>
        <ul className="filter-sidebar__checklist">
          {amenityOptions.map(({ key, label, icon }) => {
            const am = normalizeAmenitiesRecord(amenities);
            return (
              <li key={key}>
                <label className="filter-sidebar__check">
                  <input
                    type="checkbox"
                    className="filter-sidebar__check-input"
                    checked={Boolean(am[key])}
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
            );
          })}
        </ul>
      </section>

      <div className="filter-sidebar__apply">
        <button type="button" className="filter-sidebar__apply-button" onClick={handleApply}>
          {copy?.applyFilters ?? t("search.filters.applyFilters")}
        </button>
        <p className="filter-sidebar__active-count" aria-live="polite">
          {typeof copy?.activeFilters === "function"
            ? copy.activeFilters(activeFiltersCount)
            : t("search.filters.activeFilters", { count: activeFiltersCount })}
        </p>
      </div>
    </aside>
  );
}

export default FilterSidebar;
