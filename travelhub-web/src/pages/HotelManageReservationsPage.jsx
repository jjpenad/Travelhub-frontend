import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelManageReservationsHeader from "../components/hotel-portal/HotelManageReservationsHeader";
import HotelManageReservationsPagination from "../components/hotel-portal/HotelManageReservationsPagination";
import HotelManageReservationsTable from "../components/hotel-portal/HotelManageReservationsTable";
import HotelManageReservationsToolbar from "../components/hotel-portal/HotelManageReservationsToolbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import "../components/hotel-portal/HotelManageReservations.css";
import { getHotelManageReservationsDemo } from "../data/hotelPortalManageReservationsData";
import { getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { displayNameFromEmail } from "../utils/hotelPortalFormat";
import "./HotelPortalPage.css";

const PAGE_SIZE = 6;

function HotelManageReservationsPage() {
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const allRows = useMemo(() => getHotelManageReservationsDemo(), []);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

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

  const sidebarDisplayName = useMemo(() => displayNameFromEmail(email), [email]);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar
          activeId="bookings"
          displayName={sidebarDisplayName}
          propertyLabel="Establecimiento asociado"
        />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          <HotelManageReservationsHeader />
          <HotelManageReservationsToolbar
            searchQuery={search}
            onSearchChange={handleSearchChange}
            filter={filter}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
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
