import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchResultsPage from "./pages/SearchResultsPage";
import HotelDetailPage from "./pages/HotelDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/hotel/:hotelId" element={<HotelDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
