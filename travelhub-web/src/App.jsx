import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import ProtectedTravelerRoute from "./auth/ProtectedTravelerRoute";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  PATH_HOTEL_MANAGE_RATES,
  PATH_HOTEL_PORTAL_HOME,
  PATH_HOTEL_REPORTS,
  PATH_HOTEL_PORTAL_LEGACY,
  PATH_LOGIN,
  PATH_MY_TRIPS,
  PATH_MY_TRIPS_RESERVATION,
  PATH_CONFIRMATION,
  PATH_PAYMENT_VOUCHER,
  PATH_TRAVELERS_HOME,
  PATH_USER_PROFILE,
} from "./constants/routes";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import PaymentVoucherPage from "./pages/PaymentVoucherPage";
import Home from "./pages/Home";
import HotelDetailPage from "./pages/HotelDetailPage";
import HotelManageReservationsPage from "./pages/HotelManageReservationsPage";
import HotelManageRatesPage from "./pages/HotelManageRatesPage";
import HotelPortalPage from "./pages/HotelPortalPage";
import HotelReportsPage from "./pages/HotelReportsPage";
import HotelReservationDetailPage from "./pages/HotelReservationDetailPage";
import HotelRoomDetailPage from "./pages/HotelRoomDetailPage";
import LoginPage from "./pages/LoginPage";
import MyTripsPage from "./pages/MyTripsPage";
import TripDetailPage from "./pages/TripDetailPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SignupPage from "./pages/SignupPage";
import TravelerProfilePage from "./pages/TravelerProfilePage";
import TravelerConfirmToastProvider from "./components/notifications/TravelerConfirmToastProvider";
import AppFooter from "./components/layout/AppFooter";
import { TravelerDisplayCurrencyProvider } from "./context/TravelerDisplayCurrencyContext";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
      <TravelerDisplayCurrencyProvider>
      <TravelerConfirmToastProvider>
      <div className="app-shell__main">
      <Routes>
        <Route path="/" element={<Navigate to={PATH_TRAVELERS_HOME} replace />} />
        <Route path={PATH_TRAVELERS_HOME} element={<Home />} />
        <Route
          path={`${PATH_MY_TRIPS_RESERVATION}/:bookingSlug`}
          element={
            <ProtectedTravelerRoute>
              <TripDetailPage />
            </ProtectedTravelerRoute>
          }
        />
        <Route
          path={PATH_MY_TRIPS}
          element={
            <ProtectedTravelerRoute>
              <MyTripsPage />
            </ProtectedTravelerRoute>
          }
        />
        <Route
          path={PATH_USER_PROFILE}
          element={
            <ProtectedTravelerRoute>
              <TravelerProfilePage />
            </ProtectedTravelerRoute>
          }
        />
        <Route path={PATH_LOGIN} element={<LoginPage />} />
        <Route path={PATH_HOTEL_PORTAL_HOME} element={<HotelPortalPage />} />
        <Route path={PATH_HOTEL_REPORTS} element={<HotelReportsPage />} />
        <Route path={`${PATH_HOTEL_MANAGE_RESERVATIONS}/:reservationId`} element={<HotelReservationDetailPage />} />
        <Route path={PATH_HOTEL_MANAGE_RESERVATIONS} element={<HotelManageReservationsPage />} />
        <Route path={`${PATH_HOTEL_MANAGE_RATES}/:roomTypeId`} element={<HotelRoomDetailPage />} />
        <Route path={PATH_HOTEL_MANAGE_RATES} element={<HotelManageRatesPage />} />
        <Route
          path={PATH_HOTEL_PORTAL_LEGACY}
          element={<Navigate to={PATH_HOTEL_PORTAL_HOME} replace />}
        />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/hotel/:hotelId" element={<HotelDetailPage />} />
        <Route path="/checkout/:hotelId" element={<CheckoutPage />} />
        <Route path={PATH_PAYMENT_VOUCHER} element={<PaymentVoucherPage />} />
        <Route path={PATH_CONFIRMATION} element={<ConfirmationPage />} />
      </Routes>
      </div>
      <AppFooter />
      </TravelerConfirmToastProvider>
      </TravelerDisplayCurrencyProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
