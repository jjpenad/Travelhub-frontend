import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import {
  PATH_MY_TRIPS,
  PATH_MY_TRIPS_RESERVATION,
  PATH_TRAVELERS_HOME,
} from "./constants/routes";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import Home from "./pages/Home";
import HotelDetailPage from "./pages/HotelDetailPage";
import HotelPortalPage from "./pages/HotelPortalPage";
import HotelReservationDetailPage from "./pages/HotelReservationDetailPage";
import HotelReservationsPage from "./pages/HotelReservationsPage";
import LoginPage from "./pages/LoginPage";
import MyTripsPage from "./pages/MyTripsPage";
import TripDetailPage from "./pages/TripDetailPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={PATH_TRAVELERS_HOME} replace />} />
        <Route path={PATH_TRAVELERS_HOME} element={<Home />} />
        <Route
          path={`${PATH_MY_TRIPS_RESERVATION}/:bookingSlug`}
          element={<TripDetailPage />}
        />
        <Route path={PATH_MY_TRIPS} element={<MyTripsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portal-hoteles" element={<HotelPortalPage />} />
        <Route path="/portal-hoteles/reservas" element={<HotelReservationsPage />} />
        <Route
          path="/portal-hoteles/reservas/:reservationId"
          element={<HotelReservationDetailPage />}
        />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/hotel/:hotelId" element={<HotelDetailPage />} />
        <Route path="/checkout/:hotelId" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
