import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import HotelCard from "../components/search/HotelCard";
import ResultsToolbar from "../components/search/ResultsToolbar";
import SearchSummary from "../components/search/SearchSummary";
import { searchAccommodations } from "../services/api";
import { searchResultsCopy } from "../data/searchResultsCopy";
import "./SearchResults.css";

/** MVP: oculta la columna de filtros; pon en true para mostrar el sidebar */
const showFiltersSidebar = false;

function SearchResultsPage() {
  const {
    sidebarTitle,
    sidebarPlaceholder,
    resultsRegionLabel,
    toolbar: toolbarCopy,
  } = searchResultsCopy;
  const cardCopy = searchResultsCopy.hotelCard;

  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  useEffect(() => {
    if (!destination || !checkIn || !checkOut) {
      setHotels([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    searchAccommodations(destination, checkIn, checkOut)
      .then((results) => {
        if (!cancelled) {
          setHotels(results);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Search failed:", err);
          setError(err.message);
          setHotels([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [destination, checkIn, checkOut]);

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
            {showFiltersSidebar ? (
              <aside
                className="results__sidebar"
                aria-labelledby="results-sidebar-heading"
              >
                <h2 id="results-sidebar-heading" className="results__sidebar-title">
                  {sidebarTitle}
                </h2>
                <p className="results__sidebar-placeholder">{sidebarPlaceholder}</p>
              </aside>
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
