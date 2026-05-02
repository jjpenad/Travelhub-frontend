import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelManageReservationsHeader from "../components/hotel-portal/HotelManageReservationsHeader";
import HotelManageReservationsPagination from "../components/hotel-portal/HotelManageReservationsPagination";
import HotelManageReservationsTable from "../components/hotel-portal/HotelManageReservationsTable";
import HotelManageReservationsToolbar from "../components/hotel-portal/HotelManageReservationsToolbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import "../components/hotel-portal/HotelManageReservations.css";
import {
  pickHotelCurrencyFromApiPayload,
  syncHotelPortalCurrencyFromAnalyticsDto,
} from "../auth/hotelPortalCurrency";
import { clearSessionUser, getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { getDashboardAnalytics } from "../services/api";
import { getCalendarMonthBounds, MONTHS_ES } from "../utils/hotelPortalMonthRange";
import { mapAnalyticsReservationsToManageRows } from "../utils/mapAnalyticsReservationsToManageRows";
import { displayNameFromEmail } from "../utils/hotelPortalFormat";
import "./HotelPortalPage.css";

const PAGE_SIZE = 6;

function HotelManageReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = getSessionEmail() ?? "";
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  /** Reservas crudas de analytics; `currencyCode` alinea filas con el dashboard si el JSON trae moneda. */
  const [remotePayload, setRemotePayload] = useState(null);
  const { i18n } = useTranslation();
  const sidebarDisplayName = useMemo(() => {
    void i18n.resolvedLanguage;
    return displayNameFromEmail(email);
  }, [email, i18n.resolvedLanguage]);

  const rowsFromNavigate = useMemo(() => {
    void i18n.resolvedLanguage;
    const raw = location.state?.reservations;
    if (!Array.isArray(raw)) return null;
    return mapAnalyticsReservationsToManageRows(raw);
  }, [location.state?.reservations, i18n.resolvedLanguage]);

  const allRows = useMemo(() => {
    void i18n.resolvedLanguage;
    if (rowsFromNavigate != null) return rowsFromNavigate;
    if (remotePayload && remotePayload.key === location.key) {
      const raw = remotePayload.reservations;
      return mapAnalyticsReservationsToManageRows(Array.isArray(raw) ? raw : [], remotePayload.currencyCode);
    }
    return [];
  }, [rowsFromNavigate, remotePayload, location.key, i18n.resolvedLanguage]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) return undefined;
    if (rowsFromNavigate != null) return undefined;

    const targetKey = location.key;
    let cancelled = false;
    const now = new Date();
    const bounds = getCalendarMonthBounds(MONTHS_ES[now.getMonth()], now.getFullYear());

    (async () => {
      try {
        const dto = await getDashboardAnalytics({
          startDate: bounds.startDate,
          endDate: bounds.endDate,
        });
        if (cancelled) return;
        syncHotelPortalCurrencyFromAnalyticsDto(dto);
        const currencyCode = pickHotelCurrencyFromApiPayload(dto);
        setRemotePayload({
          key: targetKey,
          reservations: Array.isArray(dto?.reservations) ? dto.reservations : [],
          currencyCode: currencyCode ?? undefined,
        });
      } catch (e) {
        if (cancelled) return;
        setRemotePayload({ key: targetKey, reservations: [] });
        if (e?.status === 401 || e?.status === 403) {
          clearSessionUser();
          navigate("/login", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.key, navigate, rowsFromNavigate]);

  const filtered = useMemo(() => {
    let rows = allRows;
    if (filter !== "all") {
      rows = rows.filter((r) => r.status === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.reference.toLowerCase().includes(q) ||
          r.guestName.toLowerCase().includes(q) ||
          r.guestEmail.toLowerCase().includes(q),
      );
    }
    const copy = [...rows];
    if (sort === "oldest") {
      copy.reverse();
    } else if (sort === "amount_high") {
      copy.sort((a, b) => (b.amountValue ?? 0) - (a.amountValue ?? 0));
    } else if (sort === "amount_low") {
      copy.sort((a, b) => (a.amountValue ?? 0) - (b.amountValue ?? 0));
    }
    return copy;
  }, [allRows, filter, search, sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  const displaySelectedId = useMemo(() => {
    if (selectedId != null && filtered.some((r) => r.id === selectedId)) {
      return selectedId;
    }
    return filtered[0]?.id ?? null;
  }, [filtered, selectedId]);

  const filterCounts = useMemo(
    () => ({
      all: allRows.length,
      confirmed: allRows.filter((r) => r.status === "confirmed").length,
      pending: allRows.filter((r) => r.status === "pending").length,
      cancelled: allRows.filter((r) => r.status === "cancelled").length,
    }),
    [allRows],
  );

  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
  };

  const handleSearchChange = (v) => {
    setSearch(v);
    setPage(1);
  };

  const handleSortChange = (v) => {
    setSort(v);
    setPage(1);
  };

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="bookings" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          <HotelManageReservationsHeader />
          <HotelManageReservationsToolbar
            searchQuery={search}
            onSearchChange={handleSearchChange}
            filter={filter}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
            filterCounts={filterCounts}
          />
          <HotelManageReservationsTable
            rows={pageRows}
            selectedId={displaySelectedId}
            onSelectRow={setSelectedId}
          />
          <HotelManageReservationsPagination
            page={pageSafe}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </main>
      </div>
    </div>
  );
}

export default HotelManageReservationsPage;
