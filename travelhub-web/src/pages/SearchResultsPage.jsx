import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import FilterSidebar, {
  FILTER_PRICE_CEILING,
  FILTER_PRICE_FLOOR,
} from "../components/search/FilterSidebar";
import HotelCard from "../components/search/HotelCard";
import ResultsToolbar from "../components/search/ResultsToolbar";
import SearchSummary from "../components/search/SearchSummary";
import { searchAccommodations, SEARCH_AMENITY_QUERY_TO_UI } from "../services/api";
import { useTravelerDisplayCurrency } from "../context/TravelerDisplayCurrencyContext";
import "./SearchResults.css";

/** MVP: oculta la columna de filtros; pon en true para mostrar el sidebar */
const showFiltersSidebar = true;

const PAGE_SIZE = 10;

function parsePositiveInt(raw, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

function parsePriceFromParams(searchParams, key, fallback) {
  const raw = searchParams.get(key);
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function parseMinStars(searchParams) {
  const raw = searchParams.get("min_stars");
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function amenitiesRecordFromParams(searchParams, knownKeys) {
  const o = {};
  for (const raw of searchParams.getAll("amenities")) {
    const t = String(raw).trim();
    if (!t) continue;
    const uiKey = SEARCH_AMENITY_QUERY_TO_UI[t] ?? t;
    if (knownKeys.includes(uiKey)) o[uiKey] = true;
  }
  return o;
}

function SearchResultsPage() {
  const { t } = useTranslation();
  const { formatPaymentInDisplayCurrency } = useTravelerDisplayCurrency();

  const toolbarCopyBase = useMemo(
    () => ({
      filtersToolbarLabel: t("search.toolbar.filtersToolbarLabel"),
      filterPrice: t("search.toolbar.filterPrice"),
      filterRating: t("search.toolbar.filterRating"),
      sortLabel: t("search.toolbar.sortLabel"),
      sortBestMatch: t("search.toolbar.sortBestMatch"),
      sortPriceLow: t("search.toolbar.sortPriceLow"),
      sortPriceHigh: t("search.toolbar.sortPriceHigh"),
    }),
    [t],
  );

  const filtersCopy = useMemo(
    () => ({
      title: t("search.filters.title"),
      resetAll: t("search.filters.resetAll"),
      sidebarPlaceholder: t("search.filters.sidebarPlaceholder"),
      priceRange: t("search.filters.priceRange"),
      priceMinLabel: t("search.filters.priceMinLabel"),
      priceMaxLabel: t("search.filters.priceMaxLabel"),
      starRating: t("search.filters.starRating"),
      starOptions: [
        { value: 5, label: t("search.filters.stars5") },
        { value: 4, label: t("search.filters.stars4") },
        { value: 3, label: t("search.filters.stars3") },
      ],
      amenities: t("search.filters.amenities"),
      amenityOptions: [
        { key: "pool", label: t("search.filters.pool"), icon: "🏊" },
        { key: "wifi", label: t("search.filters.wifi"), icon: "📶" },
        { key: "breakfast_included", label: t("search.filters.breakfast"), icon: "🍳" },
        { key: "parking", label: t("search.filters.parking"), icon: "🅿️" },
        { key: "air_conditioning", label: t("search.filters.ac"), icon: "❄️" },
        { key: "gym", label: t("search.filters.gym"), icon: "🏋️" },
        { key: "pet_friendly", label: t("search.filters.pets"), icon: "🐾" },
      ],
      applyFilters: t("search.filters.applyFilters"),
      activeFilters: (count) => t(`search.filters.activeFilters_${count === 1 ? "one" : "other"}`, { count }),
    }),
    [t],
  );

  const cardCopy = useMemo(
    () => ({
      imageAlt: (hotelName) => t("hotelCard.imageAlt", { name: hotelName }),
      ratingAria: (value) => t("hotelCard.ratingAria", { value }),
      reviews: (count) =>
        t(count === 1 ? "hotelCard.reviews_one" : "hotelCard.reviews_other", {
          count,
        }),
      priceLabel: (amount, currencyCode) =>
        formatPaymentInDisplayCurrency(amount, currencyCode ?? "COP"),
      perNight: t("hotelCard.perNight"),
      priceTaxNote: t("hotelCard.taxNote"),
      bookNow: t("hotelCard.bookNow"),
      refundable: t("hotelCard.refundable"),
      notRefundable: t("hotelCard.notRefundable"),
      amenitiesMore: (n) => t("hotelCard.amenitiesMore", { n }),
    }),
    [t, formatPaymentInDisplayCurrency],
  );

  const knownAmenityKeys = useMemo(
    () =>
      Array.isArray(filtersCopy?.amenityOptions)
        ? filtersCopy.amenityOptions.map((o) => o.key)
        : [],
    [filtersCopy],
  );

  const [searchParams, setSearchParams] = useSearchParams();

  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "1";

  const page = useMemo(
    () => parsePositiveInt(searchParams.get("page"), 1),
    [searchParams],
  );

  const sidebarInitial = useMemo(() => {
    const priceMin = parsePriceFromParams(
      searchParams,
      "price_min",
      FILTER_PRICE_FLOOR,
    );
    let priceMax = parsePriceFromParams(searchParams, "price_max", FILTER_PRICE_CEILING);
    if (priceMax < priceMin + 10) {
      priceMax = Math.min(FILTER_PRICE_CEILING, priceMin + 10);
    }
    return {
      initialPriceMin: Math.max(FILTER_PRICE_FLOOR, Math.min(priceMin, FILTER_PRICE_CEILING - 10)),
      initialPriceMax: Math.min(FILTER_PRICE_CEILING, Math.max(priceMax, FILTER_PRICE_FLOOR + 10)),
      initialMinStars: parseMinStars(searchParams),
      initialAmenities: amenitiesRecordFromParams(searchParams, knownAmenityKeys),
    };
  }, [searchParams, knownAmenityKeys]);

  const [state, dispatch] = useReducer(
    (prev, action) => {
      switch (action.type) {
        case "loading": return { hotels: [], loading: true, error: null };
        case "success": return { hotels: action.hotels, loading: false, error: null };
        case "error": return { hotels: [], loading: false, error: action.error };
        case "empty": return { hotels: [], loading: false, error: null };
        default: return prev;
      }
    },
    { hotels: [], loading: true, error: null },
  );

  const buildApiParams = useCallback(() => {
    if (!destination || !checkIn || !checkOut) return null;

    const params = {
      // Mismo texto que el Hero (p. ej. "Lima"); el backend suele coincidir con `city` del JSON, no en minúsculas.
      city: destination.trim(),
      check_in: checkIn,
      check_out: checkOut,
      guests: Number(guests) || 1,
      page,
      page_size: PAGE_SIZE,
    };

    const pm = searchParams.get("price_min");
    const px = searchParams.get("price_max");
    if (pm != null && pm !== "") {
      const v = Number(pm);
      if (Number.isFinite(v)) params.price_min = v;
    }
    if (px != null && px !== "") {
      const v = Number(px);
      if (Number.isFinite(v)) params.price_max = v;
    }

    const ms = parseMinStars(searchParams);
    if (ms != null) params.min_stars = ms;

    const am = searchParams
      .getAll("amenities")
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (am.length > 0) params.amenities = am;

    return params;
  }, [destination, checkIn, checkOut, guests, page, searchParams]);

  const fetchHotels = useCallback(
    async (signal) => {
      const params = buildApiParams();
      if (!params) {
        dispatch({ type: "empty" });
        return;
      }
      dispatch({ type: "loading" });
      try {
        const results = await searchAccommodations(params);
        if (!signal.aborted) dispatch({ type: "success", hotels: results });
      } catch (err) {
        if (!signal.aborted) dispatch({ type: "error", error: err.message });
      }
    },
    [buildApiParams],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchHotels(ac.signal);
    return () => ac.abort();
  }, [fetchHotels]);

  const handleApplyFilters = useCallback(
    (snap) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", "1");
          next.set("price_min", String(snap.priceMin));
          next.set("price_max", String(snap.priceMax));
          if (snap.minStars != null) {
            next.set("min_stars", String(snap.minStars));
          } else {
            next.delete("min_stars");
          }
          next.delete("amenities");
          for (const a of snap.amenityKeys) {
            next.append("amenities", a);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("price_min");
        next.delete("price_max");
        next.delete("min_stars");
        next.delete("amenities");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const { hotels, loading, error } = state;

  const toolbarCopyResolved = useMemo(() => {
    const cityLabel = destination.trim() || t("search.toolbar.defaultCity");
    if (loading) {
      return { ...toolbarCopyBase, summaryLead: t("search.toolbar.loading") };
    }
    const n = hotels.length;
    if (n === 0) {
      return {
        ...toolbarCopyBase,
        summaryLead: t("search.toolbar.noneInCity", { city: cityLabel }),
      };
    }
    return {
      ...toolbarCopyBase,
      summaryLead: t(
        n === 1 ? "search.toolbar.count_one" : "search.toolbar.count_other",
        { count: n, city: cityLabel },
      ),
    };
  }, [toolbarCopyBase, loading, hotels.length, destination, t]);

  const filterSidebarKey = searchParams.toString();

  return (
    <div className="search-results-page">
      <Navbar />
      <PageContainer>
        <SearchSummary />
        <div className="results">
          <ResultsToolbar copy={toolbarCopyResolved} />

          <div
            className={
              "results__grid" +
              (showFiltersSidebar ? "" : " results__grid--no-sidebar")
            }
          >
            {showFiltersSidebar ? (
              <FilterSidebar
                key={filterSidebarKey}
                copy={filtersCopy}
                initialPriceMin={sidebarInitial.initialPriceMin}
                initialPriceMax={sidebarInitial.initialPriceMax}
                initialMinStars={sidebarInitial.initialMinStars}
                initialAmenities={sidebarInitial.initialAmenities}
                onApply={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            ) : null}

            <div
              className="results__list"
              role="list"
              aria-label={t("search.resultsRegionAria")}
            >
              {loading ? (
                <p style={{ padding: "2rem", textAlign: "center" }}>{t("search.toolbar.loadingAlt")}</p>
              ) : error ? (
                <p style={{ padding: "2rem", textAlign: "center", color: "#e53935" }}>
                  {t("search.errors.prefix")} {error}
                </p>
              ) : hotels.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <p><strong>{t("search.emptyStrong")}</strong></p>
                  <p>{t("search.emptyLead")}</p>
                </div>
              ) : (
                hotels.map((hotel) => (
                  <div key={hotel.id} className="results__list-item" role="listitem">
                    <HotelCard hotel={hotel} copy={cardCopy} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default SearchResultsPage;
