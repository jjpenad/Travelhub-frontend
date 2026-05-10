import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { syncHotelPortalCurrencyFromAnalyticsDto } from "../auth/hotelPortalCurrency";
import { getDashboardAnalytics } from "../services/api";
import { formatApiUserError } from "../utils/formatApiUserError";
import { buildDashboardViewModel } from "../utils/hotelPortalAnalyticsMap";
import { getCalendarMonthBounds } from "../utils/hotelPortalMonthRange";
import { displayMonthLocalized } from "../utils/displayMonthLocalized";
import { displayNameFromEmail, welcomeNameFromEmail } from "../utils/hotelPortalFormat";
import "./HotelPortalPage.css";

function HotelPortalPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";

  const loadingSegments = useMemo(
    () => [{ key: "placeholder", label: t("hotelPortal.loadingSeg"), percent: 100, count: 0, color: "#e2e8f0" }],
    [t],
  );
  const emptySegments = useMemo(
    () => [{ key: "none", label: t("hotelPortal.emptySeg"), percent: 100, count: 0, color: "#e2e8f0" }],
    [t],
  );
  const metricCardSlots = useMemo(
    () => [
      { id: "bookings", label: t("hotelPortal.metricBookings"), tone: "purple", trendUp: true },
      { id: "revenue-month", label: t("hotelPortal.metricRevenue"), tone: "green", trendUp: true },
      { id: "guests", label: t("hotelPortal.metricGuests"), tone: "blue", trendUp: true },
    ],
    [t],
  );

  const [periodMonth, setPeriodMonth] = useState("Enero");
  const [periodYear, setPeriodYear] = useState("2026");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** JSON crudo de analíticas; el view model depende del idioma. */
  const [analyticsDto, setAnalyticsDto] = useState(null);
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

  const viewModel = useMemo(() => {
    void i18n.resolvedLanguage;
    if (!analyticsDto) return null;
    return buildDashboardViewModel(analyticsDto, {
      daysInMonth: periodRange.daysInMonth,
    });
  }, [analyticsDto, periodRange.daysInMonth, i18n.resolvedLanguage]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) return undefined;

    let cancelled = false;
    const { startDate, endDate } = periodRange;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dto = await getDashboardAnalytics({ startDate, endDate });
        if (!cancelled) {
          syncHotelPortalCurrencyFromAnalyticsDto(dto);
          setAnalyticsDto(dto ?? null);
          setDashboardReservations(Array.isArray(dto?.reservations) ? dto.reservations : []);
        }
      } catch (e) {
        if (!cancelled) {
          setAnalyticsDto(null);
          setError(formatApiUserError(e, "hotelPortal.loadError"));
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
  }, [navigate, periodRange, t]);

  const firstName = useMemo(() => {
    void i18n.resolvedLanguage;
    return welcomeNameFromEmail(email);
  }, [email, i18n.resolvedLanguage]);

  const sidebarDisplayName = useMemo(() => {
    void i18n.resolvedLanguage;
    return displayNameFromEmail(email);
  }, [email, i18n.resolvedLanguage]);

  const metrics = useMemo(() => {
    const mergeSlots = (apiMetrics) =>
      metricCardSlots.map((slot) => {
        const vm = apiMetrics.find((x) => x.id === slot.id);
        return {
          ...slot,
          value: vm?.value ?? "—",
          hint: vm?.hint ?? "",
          trend: vm?.trend ?? null,
        };
      });

    if (viewModel?.metrics) return mergeSlots(viewModel.metrics);
    if (loading) {
      return metricCardSlots.map((m) => ({
        ...m,
        value: "…",
        hint: t("hotelPortal.metricLoading"),
        trend: null,
      }));
    }
    if (error) {
      return metricCardSlots.map((m) => ({
        ...m,
        value: "—",
        hint: "",
        trend: null,
      }));
    }
    return metricCardSlots.map((m) => ({
      ...m,
      value: "—",
      hint: "",
      trend: null,
    }));
  }, [viewModel, loading, error, metricCardSlots, t]);

  const chartTitle = t("hotelPortal.chartTitle", {
    month: displayMonthLocalized(periodMonth),
  });
  const bars = viewModel?.bars ?? emptyBarsForPeriod;
  const segments =
    viewModel?.segments ?? (loading ? loadingSegments : emptySegments);
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
            <HotelPortalRevenueChart
              title={chartTitle}
              bars={bars}
              currencyCode={viewModel?.currencyCode}
            />
            <HotelPortalReservationStatus
              title={t("hotelPortal.statusChartTitle")}
              bookingCount={viewModel != null ? Number(viewModel.bookingRingCount ?? 0) : null}
              segments={segments}
            />
          </div>
          <div className="hotel-portal-dashboard__arrivals">
            <HotelPortalUpcomingArrivals
              key={`${periodMonth}|${periodYear}`}
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
