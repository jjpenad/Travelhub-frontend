import { useCallback, useEffect, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import FilterSidebar from "../components/search/FilterSidebar";
import HotelCard from "../components/search/HotelCard";
import ResultsToolbar from "../components/search/ResultsToolbar";
import SearchSummary from "../components/search/SearchSummary";
import { searchAccommodations } from "../services/api";
import { searchResultsCopy } from "../data/searchResultsCopy";
import "./SearchResults.css";

/** MVP: oculta la columna de filtros; pon en true para mostrar el sidebar */
const showFiltersSidebar = true;

function SearchResultsPage() {
  const {
    resultsRegionLabel,
    toolbar: toolbarCopy,
    filters: filtersCopy,
  } = searchResultsCopy;
  const cardCopy = searchResultsCopy.hotelCard;

  const [searchParams] = useSearchParams();

  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

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

  const fetchHotels = useCallback(async (dest, ci, co, signal) => {
    if (!dest || !ci || !co) { dispatch({ type: "empty" }); return; }
    dispatch({ type: "loading" });
    try {
      const results = await searchAccommodations(dest, ci, co);
      if (!signal.aborted) dispatch({ type: "success", hotels: results });
    } catch (err) {
      if (!signal.aborted) dispatch({ type: "error", error: err.message });
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchHotels(destination, checkIn, checkOut, ac.signal);
    return () => ac.abort();
  }, [destination, checkIn, checkOut, fetchHotels]);

  const { hotels, loading, error } = state;

  return (
    <div className="search-results-page">
      <Navbar />
      <PageContainer>
        <SearchSummary />
        <div className="results">
          <ResultsToolbar copy={toolbarCopy} />

          <div
            className={
              "results__grid" +
              (showFiltersSidebar ? "" : " results__grid--no-sidebar")
            }
          >
            {showFiltersSidebar ? <FilterSidebar copy={filtersCopy} /> : null}

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
