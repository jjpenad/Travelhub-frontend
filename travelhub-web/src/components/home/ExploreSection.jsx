import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./ExploreSection.css";

function ExploreSection() {
  const { t } = useTranslation();
  const categories = useMemo(
    () => [
      { id: "flights", labelKey: "homeExplore.catFlights" },
      { id: "hotels", labelKey: "homeExplore.catHotels" },
      { id: "stays", labelKey: "homeExplore.catStays" },
      { id: "villas", labelKey: "homeExplore.catVillas" },
      { id: "resorts", labelKey: "homeExplore.catResorts" },
    ],
    [],
  );

  const [activeId, setActiveId] = useState("stays");

  return (
    <section className="explore-section" id="explore" aria-labelledby="explore-heading">
      <div className="explore-section__header">
        <p className="explore-section__eyebrow">{t("homeExplore.eyebrow")}</p>
        <h2 id="explore-heading" className="explore-section__title">
          {t("homeExplore.title")}
        </h2>
      </div>
      <nav className="explore-section__nav" aria-label={t("homeExplore.navAria")}>
        <div className="explore-section__nav-inner" role="group">
          {categories.map((c) => {
            const label = t(c.labelKey);
            const isActive = activeId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`explore-chip${isActive ? " explore-chip--active" : ""}`}
                aria-pressed={isActive}
                onClick={() => setActiveId(c.id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
}

export default ExploreSection;
