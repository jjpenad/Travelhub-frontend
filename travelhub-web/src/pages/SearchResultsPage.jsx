import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import HotelCard from "../components/search/HotelCard";
import ResultsToolbar from "../components/search/ResultsToolbar";
import SearchSummary from "../components/search/SearchSummary";
import { mockHotels } from "../data/mockHotels";
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
              {mockHotels.map((hotel) => (
                <div key={hotel.id} className="results__list-item" role="listitem">
                  <HotelCard hotel={hotel} copy={cardCopy} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default SearchResultsPage;
