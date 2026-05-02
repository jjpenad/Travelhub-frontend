import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTravelerDisplayCurrency } from "../../context/TravelerDisplayCurrencyContext";
import DestinationCard from "./DestinationCard";
import "./FeaturedDestinations.css";

/** Montos base en USD (promo / noche); el selector COP|USD del viajero formatea vía `formatUsdBaseAmount`. */
const FEATURED_USD_PER_NIGHT = {
  Santorini: 112,
  Kioto: 95,
  Marrakech: 78,
  Reikiavik: 134,
};

function FeaturedDestinations() {
  const { t } = useTranslation();
  const { formatUsdBaseAmount } = useTravelerDisplayCurrency();

  const featured = useMemo(
    () => [
      {
        name: "Santorini",
        country: t("homeFeatured.santoriniCountry"),
        priceFrom: t("hotelDetail.perNightShort", {
          price: formatUsdBaseAmount(FEATURED_USD_PER_NIGHT.Santorini),
        }),
        rating: 4.9,
        background: "linear-gradient(145deg, #0369a1 0%, #0d9488 50%, #5eead4 100%)",
      },
      {
        name: "Kioto",
        country: t("homeFeatured.kyotoCountry"),
        priceFrom: t("hotelDetail.perNightShort", {
          price: formatUsdBaseAmount(FEATURED_USD_PER_NIGHT.Kioto),
        }),
        rating: 4.8,
        background: "linear-gradient(145deg, #0e7490 0%, #06b6d4 45%, #67e8f9 100%)",
      },
      {
        name: "Marrakech",
        country: t("homeFeatured.marrakechCountry"),
        priceFrom: t("hotelDetail.perNightShort", {
          price: formatUsdBaseAmount(FEATURED_USD_PER_NIGHT.Marrakech),
        }),
        rating: 4.7,
        background: "linear-gradient(145deg, #ea580c 0%, #f97316 40%, #fbbf24 100%)",
      },
      {
        name: "Reikiavik",
        country: t("homeFeatured.reykjavikCountry"),
        priceFrom: t("hotelDetail.perNightShort", {
          price: formatUsdBaseAmount(FEATURED_USD_PER_NIGHT.Reikiavik),
        }),
        rating: 4.8,
        background: "linear-gradient(145deg, #1d4ed8 0%, #3b82f6 42%, #818cf8 100%)",
      },
    ],
    [t, formatUsdBaseAmount],
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
