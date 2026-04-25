import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalDashboardHeader from "../components/hotel-portal/HotelPortalDashboardHeader";
import HotelPortalMetricCards from "../components/hotel-portal/HotelPortalMetricCards";
import HotelPortalMonthSelect from "../components/hotel-portal/HotelPortalMonthSelect";
import HotelPortalReservationStatus from "../components/hotel-portal/HotelPortalReservationStatus";
import HotelPortalRevenueChart from "../components/hotel-portal/HotelPortalRevenueChart";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import HotelPortalUpcomingArrivals from "../components/hotel-portal/HotelPortalUpcomingArrivals";
import { getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import {
  dashboardMetrics,
  reservationStatusSegments,
  revenueBarsJanuary,
  upcomingArrivalsRows,
} from "../data/hotelPortalDashboardData";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { displayNameFromEmail, welcomeNameFromEmail } from "../utils/hotelPortalFormat";
import "./HotelPortalPage.css";

function HotelPortalPage() {
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  const firstName = useMemo(() => welcomeNameFromEmail(email), [email]);
  const sidebarDisplayName = useMemo(() => displayNameFromEmail(email), [email]);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar
          activeId="dashboard"
          displayName={sidebarDisplayName}
          propertyLabel="Establecimiento asociado"
        />
        <main className="hotel-portal-dashboard__main">
          <div className="hotel-portal-dashboard__top">
            <HotelPortalDashboardHeader firstName={firstName} />
            <div className="hotel-portal-dashboard__month-wrap">
              <HotelPortalMonthSelect defaultMonth="Enero" defaultYear="2026" />
            </div>
          </div>
          <HotelPortalMetricCards items={dashboardMetrics} />
          <div className="hotel-portal-dashboard__mid">
            <HotelPortalRevenueChart title="Ingresos mes Enero" bars={revenueBarsJanuary} />
            <HotelPortalReservationStatus segments={reservationStatusSegments} />
          </div>
          <div className="hotel-portal-dashboard__arrivals">
            <HotelPortalUpcomingArrivals rows={upcomingArrivalsRows} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default HotelPortalPage;
