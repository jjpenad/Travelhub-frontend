import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalDashboardHeader from "../components/hotel-portal/HotelPortalDashboardHeader";
import HotelPortalMetricCards from "../components/hotel-portal/HotelPortalMetricCards";
import HotelPortalMonthSelect from "../components/hotel-portal/HotelPortalMonthSelect";
import HotelPortalReservationStatus from "../components/hotel-portal/HotelPortalReservationStatus";
import HotelPortalRevenueChart from "../components/hotel-portal/HotelPortalRevenueChart";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import HotelPortalUpcomingArrivals from "../components/hotel-portal/HotelPortalUpcomingArrivals";
import {
  clearSessionUser,
  getSessionEmail,
  getSessionRole,
  ROLE_HOTEL,
} from "../auth/sessionAuth";
import { PATH_HOTEL_MANAGE_RESERVATIONS, PATH_TRAVELERS_HOME } from "../constants/routes";
import { getDashboardAnalytics } from "../services/api";
import { buildDashboardViewModel } from "../utils/hotelPortalAnalyticsMap";
import { getCalendarMonthBounds } from "../utils/hotelPortalMonthRange";
import { displayNameFromEmail, welcomeNameFromEmail } from "../utils/hotelPortalFormat";
import "./HotelPortalPage.css";

const LOADING_SEGMENTS = [
  { key: "placeholder", label: "Cargando…", percent: 100, count: 0, color: "#e2e8f0" },
];

const EMPTY_SEGMENTS = [
  { key: "none", label: "Sin datos", percent: 100, count: 0, color: "#e2e8f0" },
];

/** Solo etiquetas/tonos para KPIs antes de recibir datos del API (sin valores demo). */
const METRIC_CARD_SLOTS = [
  { id: "bookings", label: "Reservas del mes", tone: "purple", trendUp: true },
  { id: "revenue-month", label: "Total de ingresos del mes", tone: "green", trendUp: true },
  { id: "guests", label: "Total huéspedes", tone: "blue", trendUp: true },
];

function HotelPortalPage() {
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";
  const [periodMonth, setPeriodMonth] = useState("Enero");
  const [periodYear, setPeriodYear] = useState("2026");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModel, setViewModel] = useState(null);
  const [dashboardReservations, setDashboardReservations] = useState([]);

  const periodRange = useMemo(
    () => getCalendarMonthBounds(periodMonth, periodYear),
    [periodMonth, periodYear],
  );

  const emptyBarsForPeriod = useMemo(
    () =>
      Array.from({ length: periodRange.daysInMonth }, (_, i) => ({
        day: i + 1,
        value: 0,
      })),
    [periodRange.daysInMonth],
  );

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) return undefined;

    let cancelled = false;
    const { startDate, endDate, daysInMonth } = periodRange;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dto = await getDashboardAnalytics({ startDate, endDate });
        if (!cancelled) {
          setViewModel(buildDashboardViewModel(dto, { daysInMonth }));
          setDashboardReservations(Array.isArray(dto?.reservations) ? dto.reservations : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "No se pudo cargar el panel.");
          if (e?.status === 401 || e?.status === 403) {
            clearSessionUser();
            navigate("/login", { replace: true });
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, periodRange]);

  const firstName = useMemo(() => welcomeNameFromEmail(email), [email]);
  const sidebarDisplayName = useMemo(() => displayNameFromEmail(email), [email]);

  const metrics = useMemo(() => {
    if (viewModel?.metrics) return viewModel.metrics;
    if (loading) {
      return METRIC_CARD_SLOTS.map((m) => ({
        ...m,
        value: "…",
        hint: "Cargando…",
        trend: null,
      }));
    }
    if (error) {
      return METRIC_CARD_SLOTS.map((m) => ({
        ...m,
        value: "—",
        hint: "",
        trend: null,
      }));
    }
    return METRIC_CARD_SLOTS.map((m) => ({
      ...m,
      value: "—",
      hint: "",
      trend: null,
    }));
  }, [viewModel, loading, error]);

  const chartTitle = `Ingresos mes ${periodMonth}`;
  const bars = viewModel?.bars ?? emptyBarsForPeriod;
  const segments =
    viewModel?.segments ?? (loading ? LOADING_SEGMENTS : EMPTY_SEGMENTS);
  const arrivalRows = viewModel?.arrivalRows ?? [];

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
        <main className="hotel-portal-dashboard__main" aria-busy={loading}>
          {error ? (
            <p
              role="alert"
              style={{
                color: "var(--error)",
                fontSize: "0.875rem",
                fontWeight: 600,
                margin: "0 0 1rem",
              }}
            >
              {error}
            </p>
          ) : null}
          <div className="hotel-portal-dashboard__top">
            <HotelPortalDashboardHeader firstName={firstName} />
            <div className="hotel-portal-dashboard__month-wrap">
              <HotelPortalMonthSelect
                month={periodMonth}
                year={periodYear}
                onChange={({ month, year }) => {
                  setPeriodMonth(month);
                  setPeriodYear(year);
                }}
              />
            </div>
          </div>
          <HotelPortalMetricCards items={metrics} />
          <div className="hotel-portal-dashboard__mid">
            <HotelPortalRevenueChart title={chartTitle} bars={bars} />
            <HotelPortalReservationStatus
              segments={segments}
              centerLine1={viewModel?.statusCenterLine1 ?? "—"}
              centerLine2={viewModel?.statusCenterLine2 ?? "reservas"}
            />
          </div>
          <div className="hotel-portal-dashboard__arrivals">
            <HotelPortalUpcomingArrivals
              rows={arrivalRows}
              viewAllTo={PATH_HOTEL_MANAGE_RESERVATIONS}
              viewAllState={{ reservations: dashboardReservations }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default HotelPortalPage;
