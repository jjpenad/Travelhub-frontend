import { useCallback, useEffect, useMemo, useReducer } from "react";
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
import { searchResultsCopy } from "../data/searchResultsCopy";
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
  const {
    resultsRegionLabel,
    toolbar: toolbarCopy,
    filters: filtersCopy,
  } = searchResultsCopy;
  const cardCopy = searchResultsCopy.hotelCard;

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
    if (loading) {
      return { ...toolbarCopy, summaryLead: "Buscando alojamientos…" };
    }
    const n = hotels.length;
    const cityLabel = destination.trim() || "tu destino";
    return {
      ...toolbarCopy,
      summaryLead:
        n === 0
          ? `Sin resultados en ${cityLabel}`
          : `${n} ${n === 1 ? "alojamiento" : "alojamientos"} en ${cityLabel}`,
    };
  }, [toolbarCopy, loading, hotels.length, destination]);

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
              aria-label={resultsRegionLabel}
            >
              {loading ? (
                <p style={{ padding: "2rem", textAlign: "center" }}>Buscando hoteles disponibles...</p>
              ) : error ? (
                <p style={{ padding: "2rem", textAlign: "center", color: "#e53935" }}>Error: {error}</p>
              ) : hotels.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <p><strong>No se encontraron hoteles disponibles.</strong></p>
                  <p>Prueba con otras fechas u otra ciudad.</p>
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
