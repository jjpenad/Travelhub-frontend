import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import HotelPortalSidebar from "../components/hotel-portal/HotelPortalSidebar";
import { clearSessionUser, getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import { PATH_HOTEL_MANAGE_RATES, PATH_TRAVELERS_HOME } from "../constants/routes";
import { getHotelRoomDetail, getHotelRoomCalendar, updateHotelRoomInventory, createHotelInventoryBulk } from "../services/api";
import { formatApiUserError } from "../utils/formatApiUserError";
import { displayNameFromEmail } from "../utils/hotelPortalFormat";
import { getCalendarMonthBounds, MONTHS_ES } from "../utils/hotelPortalMonthRange";
import HotelRoomCalendarTable from "../components/hotel-portal/HotelRoomCalendarTable";
import HotelRoomRateModal from "../components/hotel-portal/HotelRoomRateModal";
import HotelRoomBulkRateModal from "../components/hotel-portal/HotelRoomBulkRateModal";
import "../components/hotel-portal/HotelManageReservations.css";
import "../components/hotel-portal/HotelReservationDetail.css";
import "./HotelPortalPage.css";

function Field({ label, children, className = "" }) {
  return (
    <div className={`hp-resd-field${className ? ` ${className}` : ""}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function HotelRoomDetailPage() {
  const { t, i18n } = useTranslation();
  const { roomTypeId } = useParams();
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);

  const [calendarItems, setCalendarItems] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  const [calStartDate, setCalStartDate] = useState("");
  const [calEndDate, setCalEndDate] = useState("");
  const [calPage, setCalPage] = useState(1);
  const CAL_PAGE_SIZE = 15;

  const [editingDay, setEditingDay] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

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
    if (!roomTypeId) return;

    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getHotelRoomDetail(roomTypeId);
        if (!cancelled) {
          setRoom(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatApiUserError(err, "hotelRoomDetail.notFound"));
          if (err?.status === 401 || err?.status === 403) {
            clearSessionUser();
            navigate("/login", { replace: true });
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => { cancelled = true; };
  }, [roomTypeId, navigate]);

  const handleSearchCalendar = async () => {
    if (!calStartDate || !calEndDate) return;
    
    setLoadingCalendar(true);
    setCalPage(1);
    try {
      const data = await getHotelRoomCalendar(roomTypeId, {
        startDate: calStartDate,
        endDate: calEndDate,
      });
      setCalendarItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Error fetching room calendar:", err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleSaveRate = async (payload) => {
    if (!editingDay?.id) return;
    try {
      await updateHotelRoomInventory(editingDay.id, payload);
      // Refresh calendar after successful save
      await handleSearchCalendar();
    } catch (err) {
      throw err; // Let the modal handle the error display
    }
  };

  const handleSaveBulkRate = async (payload) => {
    try {
      await createHotelInventoryBulk(payload);
      // Refresh calendar after successful bulk create
      await handleSearchCalendar();
    } catch (err) {
      throw err; // Let the modal handle the error display
    }
  };

  const pagedCalendarItems = useMemo(() => {
    const start = (calPage - 1) * CAL_PAGE_SIZE;
    return calendarItems.slice(start, start + CAL_PAGE_SIZE);
  }, [calendarItems, calPage]);

  const totalCalPages = Math.ceil(calendarItems.length / CAL_PAGE_SIZE);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  const backLink = (
    <Link className="hp-resd-back" to={PATH_HOTEL_MANAGE_RATES}>
      {t("hotelRoomDetail.backToManage")}
    </Link>
  );

  const shell = (children) => (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="rates" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          {children}
        </main>
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="hp-resd">
        <p className="hp-resd-notfound">{t("hotelRoomDetail.loading")}</p>
        {backLink}
      </div>
    );
  }

  if (error || !room) {
    return shell(
      <div className="hp-resd">
        <p className="hp-resd-notfound">{error || t("hotelRoomDetail.notFound")}</p>
        {backLink}
      </div>
    );
  }

  return (
    <div className="hotel-portal-dashboard">
      <Navbar />
      <div className="hotel-portal-dashboard__shell">
        <HotelPortalSidebar activeId="rates" displayName={sidebarDisplayName} />
        <main className="hotel-portal-dashboard__main hp-manage-reservations">
          <div className="hp-resd">
            <header className="hp-resd-head">
              {backLink}
              <div className="hp-resd-head__title-row">
                <h1 className="hp-resd-head__title">
                  {t("hotelRoomDetail.titleDetail", { name: room.name })}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button 
                    className="hp-mres-pill hp-mres-pill--active"
                    style={{ height: '36px', padding: '0 1rem', fontSize: '0.8rem' }}
                    onClick={() => setShowBulkModal(true)}
                  >
                    + {t("hotelRoomBulkRateModal.btnCreate")}
                  </button>
                  <span className={`hp-mres-badge ${room.active ? 'hp-mres-badge--confirmed' : 'hp-mres-badge--cancelled'}`}>
                    {room.active ? t("hotelRoomDetail.statusActive") : t("hotelRoomDetail.statusInactive")}
                  </span>
                </div>
              </div>
            </header>

            <div className="hp-resd-body">
              <div className="hp-resd-split">
                <div className="hp-resd-split__left">
                  <section className="hp-resd-card">
                    <h2 className="hp-resd-card__title">{t("hotelRoomDetail.sectionBasic")}</h2>
                    <dl className="hp-resd-fields">
                      <Field label={t("hotelRoomDetail.labelName")}>{room.name}</Field>
                      <Field label={t("hotelRoomDetail.labelDescription")}>{room.description}</Field>
                      <Field label={t("hotelRoomDetail.labelMaxCapacity")}>{room.max_capacity}</Field>
                      <Field label={t("hotelRoomDetail.labelBedType")}>{room.bed_type}</Field>
                      <Field label={t("hotelRoomDetail.labelSize")}>{room.size_sqm}</Field>
                      <Field label={t("hotelRoomDetail.labelTotalUnits")}>{room.total_units}</Field>
                    </dl>
                  </section>
                </div>

                <div className="hp-resd-split__right">
                  <section className="hp-resd-card">
                    <h2 className="hp-resd-card__title">{t("hotelRoomDetail.sectionPrice")}</h2>
                    <dl className="hp-resd-fields">
                      <Field label={t("hotelRoomDetail.labelBasePrice")}>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-700)" }}>
                          {new Intl.NumberFormat().format(room.base_price)}
                        </span>
                      </Field>
                      <Field label={t("hotelRoomDetail.labelCurrency")}>{"COP"}</Field>
                    </dl>
                    <hr className="hp-resd-divider" />
                    <dl className="hp-resd-fields">
                      <Field label={t("hotelRoomDetail.labelCreatedAt")}>{new Date(room.created_at).toLocaleDateString()}</Field>
                      <Field label={t("hotelRoomDetail.labelUpdatedAt")}>{new Date(room.updated_at).toLocaleDateString()}</Field>
                    </dl>
                  </section>

                  <section className="hp-resd-card" style={{ marginTop: '1.25rem' }}>
                    <h2 className="hp-resd-card__title">{t("hotelRoomDetail.sectionAmenities")}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
                      {room.amenities?.map(amenity => (
                        <span 
                          key={amenity.id} 
                          className="hp-mres-badge hp-mres-badge--upcoming"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {amenity.name}
                        </span>
                      ))}
                      {(!room.amenities || room.amenities.length === 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t("reservationData.dash")}</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <HotelRoomCalendarTable 
                items={pagedCalendarItems} 
                loading={loadingCalendar}
                startDate={calStartDate}
                endDate={calEndDate}
                onStartDateChange={setCalStartDate}
                onEndDateChange={setCalEndDate}
                onSearch={handleSearchCalendar}
                page={calPage}
                totalPages={totalCalPages}
                onPageChange={setCalPage}
                onEdit={setEditingDay}
              />
            </div>
          </div>

          <HotelRoomRateModal 
            key={editingDay?.id || 'none'}
            isOpen={Boolean(editingDay)}
            onClose={() => setEditingDay(null)}
            roomName={room?.name}
            dayData={editingDay}
            onSave={handleSaveRate}
          />

          <HotelRoomBulkRateModal 
            isOpen={showBulkModal}
            onClose={() => setShowBulkModal(false)}
            roomTypeId={roomTypeId}
            onSave={handleSaveBulkRate}
          />
        </main>
      </div>
    </div>
  );
}

export default HotelRoomDetailPage;
