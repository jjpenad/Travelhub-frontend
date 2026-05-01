import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import DestinationCard from "./DestinationCard";
import "./FeaturedDestinations.css";

function FeaturedDestinations() {
  const { t } = useTranslation();

  const featured = useMemo(
    () => [
      {
        name: "Santorini",
        country: t("homeFeatured.santoriniCountry"),
        priceFrom: t("homeFeatured.santoriniPrice"),
        rating: 4.9,
        background: "linear-gradient(145deg, #0369a1 0%, #0d9488 50%, #5eead4 100%)",
      },
      {
        name: "Kioto",
        country: t("homeFeatured.kyotoCountry"),
        priceFrom: t("homeFeatured.kyotoPrice"),
        rating: 4.8,
        background: "linear-gradient(145deg, #0e7490 0%, #06b6d4 45%, #67e8f9 100%)",
      },
      {
        name: "Marrakech",
        country: t("homeFeatured.marrakechCountry"),
        priceFrom: t("homeFeatured.marrakechPrice"),
        rating: 4.7,
        background: "linear-gradient(145deg, #ea580c 0%, #f97316 40%, #fbbf24 100%)",
      },
      {
        name: "Reikiavik",
        country: t("homeFeatured.reykjavikCountry"),
        priceFrom: t("homeFeatured.reykjavikPrice"),
        rating: 4.8,
        background: "linear-gradient(145deg, #1d4ed8 0%, #3b82f6 42%, #818cf8 100%)",
      },
    ],
    [t],
  );

  return (
    <section
      className="featured-destinations"
      aria-labelledby="featured-destinations-heading"
    >
      <div className="featured-destinations__intro">
        <p className="featured-destinations__eyebrow">{t("homeFeatured.eyebrow")}</p>
        <h2 id="featured-destinations-heading" className="featured-destinations__title">
          {t("homeFeatured.title")}
        </h2>
        <p className="featured-destinations__subtitle">{t("homeFeatured.subtitle")}</p>
      </div>
      <div className="featured-destinations__grid">
        {featured.map((item) => (
          <DestinationCard
            key={item.name}
            name={item.name}
            country={item.country}
            priceFrom={item.priceFrom}
            rating={item.rating}
            background={item.background}
          />
        ))}
      </div>
    </section>
  );
}

export default FeaturedDestinations;
