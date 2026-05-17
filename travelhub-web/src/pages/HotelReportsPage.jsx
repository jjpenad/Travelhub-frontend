import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import HotelReportsFilters from "../components/hotel-portal/HotelReportsFilters";
import HotelReportsKpiCards from "../components/hotel-portal/HotelReportsKpiCards";
import HotelReportsOccupancy from "../components/hotel-portal/HotelReportsOccupancy";
import HotelReportsTable from "../components/hotel-portal/HotelReportsTable";
import HotelReportsWeeklyChart from "../components/hotel-portal/HotelReportsWeeklyChart";
import {
  clearSessionUser,
  getSessionEmail,
  getSessionRole,
  ROLE_HOTEL,
} from "../auth/sessionAuth";
import { syncHotelPortalCurrencyFromAnalyticsDto } from "../auth/hotelPortalCurrency";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { getDashboardAnalytics } from "../services/api";
import { displayMonthLocalized } from "../utils/displayMonthLocalized";
import { downloadReservationsCsv } from "../utils/exportReservationsCsv";
import { formatApiUserError } from "../utils/formatApiUserError";
import { displayNameFromEmail } from "../utils/hotelPortalFormat";
import {
  buildReportsViewModel,
  getPreviousMonthBounds,
} from "../utils/hotelPortalReportsMap";
import { getCalendarMonthBounds, MONTHS_ES } from "../utils/hotelPortalMonthRange";
import "./HotelPortalPage.css";
import "./HotelReportsPage.css";

function defaultPeriod() {
  const now = new Date();
  return {
    month: MONTHS_ES[now.getMonth()],
    year: String(now.getFullYear()),
  };
}

function HotelReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";

  const initial = useMemo(() => defaultPeriod(), []);

  const [periodMonth, setPeriodMonth] = useState(initial.month);
  const [periodYear, setPeriodYear] = useState(initial.year);
  const [chartView, setChartView] = useState("bar");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsDto, setAnalyticsDto] = useState(null);
  const [prevAnalyticsDto, setPrevAnalyticsDto] = useState(null);

  const periodRange = useMemo(
    () => getCalendarMonthBounds(periodMonth, periodYear),
    [periodMonth, periodYear],
  );

  const periodLabel = useMemo(() => {
    void i18n.resolvedLanguage;
    return `${displayMonthLocalized(periodMonth)} ${periodYear}`;
  }, [periodMonth, periodYear, i18n.resolvedLanguage]);

  const viewModel = useMemo(() => {
    void i18n.resolvedLanguage;
    if (!analyticsDto) return null;
    return buildReportsViewModel(
      analyticsDto,
      {
        daysInMonth: periodRange.daysInMonth,
        monthIndex: periodRange.monthIndex,
        year: periodRange.year,
      },
      prevAnalyticsDto,
    );
  }, [analyticsDto, prevAnalyticsDto, periodRange, i18n.resolvedLanguage]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) return undefined;

    let cancelled = false;
    const { startDate, endDate, monthIndex, year } = periodRange;
    const prev = getPreviousMonthBounds(monthIndex, year);

    (async () => {
      setLoading(true);
      setError(null);
      setAnalyticsDto(null);
      setPrevAnalyticsDto(null);
      try {
        const [dto, prevDto] = await Promise.all([
          getDashboardAnalytics({ startDate, endDate }),
          getDashboardAnalytics({ startDate: prev.startDate, endDate: prev.endDate }),
        ]);
        if (cancelled) return;
        syncHotelPortalCurrencyFromAnalyticsDto(dto);
        setAnalyticsDto(dto ?? null);
        setPrevAnalyticsDto(prevDto ?? null);
      } catch (e) {
        if (cancelled) return;
        setAnalyticsDto(null);
        setPrevAnalyticsDto(null);
        setError(formatApiUserError(e, "hotelReports.loadError"));
        if (e?.status === 401 || e?.status === 403) {
          clearSessionUser();
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [periodRange, navigate]);

  const handleExport = () => {
    const rows = viewModel?.tableRows ?? [];
    if (!rows.length) return;
    const safeMonth = periodMonth.replace(/\s+/g, "-").toLowerCase();
    downloadReservationsCsv(rows, `reservaciones-${safeMonth}-${periodYear}.csv`);
  };

  const sidebarDisplayName = useMemo(() => {
    void i18n.resolvedLanguage;
    return displayNameFromEmail(email);
  }, [email, i18n.resolvedLanguage]);

  const metrics = useMemo(() => {
    if (viewModel?.metrics) return viewModel.metrics;
    if (loading) {
      return [
        { id: "revenue", labelKey: "metricRevenue", value: "…", trend: null },
        { id: "bookings", labelKey: "metricBookings", value: "…", trend: null },
        { id: "occupancy", labelKey: "metricOccupancy", value: "…", trend: null },
      ];
    }
    return [
      { id: "revenue", labelKey: "metricRevenue", value: "—", trend: null },
      { id: "bookings", labelKey: "metricBookings", value: "—", trend: null },
      { id: "occupancy", labelKey: "metricOccupancy", value: "—", trend: null },
    ];
  }, [viewModel, loading]);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="reports" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-reports-page" aria-busy={loading}>
          {error ? (
            <p className="hp-reports-page__error" role="alert">
              {error}
            </p>
          ) : null}

          <header className="hp-reports-page__head">
            <h1 className="hp-reports-page__title">{t("hotelReports.pageTitle")}</h1>
            <p className="hp-reports-page__subtitle">{t("hotelReports.pageSubtitle")}</p>
          </header>

          <HotelReportsFilters
            month={periodMonth}
            year={periodYear}
            chartView={chartView}
            onPeriodChange={({ month, year }) => {
              setPeriodMonth(month);
              setPeriodYear(year);
            }}
            onChartViewChange={setChartView}
          />

          <HotelReportsKpiCards items={metrics} />

          <div className="hp-reports-page__charts">
            <HotelReportsWeeklyChart
              periodLabel={periodLabel}
              series={viewModel?.weeklySeries ?? []}
              chartView={chartView}
            />
            <HotelReportsOccupancy items={viewModel?.occupancyByType ?? []} />
          </div>

          <HotelReportsTable
            key={periodLabel}
            periodLabel={periodLabel}
            rows={viewModel?.tableRows ?? []}
            onExport={handleExport}
          />
        </main>
      </div>
    </div>
  );
}

export default HotelReportsPage;
