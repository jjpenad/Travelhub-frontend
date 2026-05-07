import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import HotelManageRatesHeader from "../components/hotel-portal/HotelManageRatesHeader";
import HotelManageRatesTable from "../components/hotel-portal/HotelManageRatesTable";
import { getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { displayNameFromEmail } from "../utils/hotelPortalFormat";
import { listHotelRoomsSimple } from "../services/api";
import { formatApiUserError } from "../utils/formatApiUserError";
import "../components/hotel-portal/HotelManageReservations.css";
import "./HotelPortalPage.css";

function HotelManageRatesPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const email = getSessionEmail() ?? "";

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  const sidebarDisplayName = useMemo(() => {
    void i18n.resolvedLanguage;
    return displayNameFromEmail(email);
  }, [email, i18n.resolvedLanguage]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) return;

    let cancelled = false;
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listHotelRoomsSimple();
        if (!cancelled) {
          // El API devuelve { items: [...], total: n }
          setRooms(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiUserError(err, "hotelPortal.loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRooms();
    return () => { cancelled = true; };
  }, [t]);

  const handleEditRate = (id) => {
    console.log("Editing rate for room type:", id);
    // Future implementation for editing rates
  };

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="rates" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          <HotelManageRatesHeader />
          
          {loading ? (
            <div className="hp-mres-empty">{t("hotelPortal.loadingSeg")}</div>
          ) : error ? (
            <div className="hp-mres-empty" style={{ color: "var(--error)" }}>{error}</div>
          ) : (
            <HotelManageRatesTable rows={rooms} onEdit={handleEditRate} />
          )}
        </main>
      </div>
    </div>
  );
}

export default HotelManageRatesPage;
