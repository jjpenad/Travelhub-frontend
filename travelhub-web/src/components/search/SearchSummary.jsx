import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IconBed,
  IconCalendar,
  IconMapPin,
  IconSearch,
  IconUsers,
} from "../home/HeroIcons";
import { PATH_TRAVELERS_HOME } from "../../constants/routes";
import {
  formatFriendlyDate,
  formatGuestsLabel,
  formatRoomsLabel,
  safeDecode,
} from "../../utils/searchUrlParams";
import "./SearchSummary.css";

function SearchSummary() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { destination, checkIn, checkOut, guests, rooms } = useMemo(() => {
    const dest = searchParams.get("destination")?.trim() ?? "";
    return {
      destination: dest ? safeDecode(dest) : "—",
      checkIn: searchParams.get("checkIn") ?? "",
      checkOut: searchParams.get("checkOut") ?? "",
      guests: searchParams.get("guests") ?? "1",
      rooms: searchParams.get("rooms") ?? "1",
    };
  }, [searchParams]);

  const checkInDisplay = formatFriendlyDate(checkIn);
  const checkOutDisplay = formatFriendlyDate(checkOut);

  const handleEditSearch = useCallback(() => {
    navigate({ pathname: PATH_TRAVELERS_HOME, search: searchParams.toString() });
  }, [navigate, searchParams]);

  return (
    <section className="search-summary" aria-label={t("searchSummary.aria")}>
      <div className="search-summary__fields">
        <div className="search-summary__segment search-summary__destination">
          <span className="search-summary__label">{t("searchSummary.destination")}</span>
          <span className="search-summary__value">
            <IconMapPin className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">{destination}</span>
          </span>
        </div>

        <span className="search-summary__sep" aria-hidden="true" />

        <div className="search-summary__segment search-summary__date">
          <span className="search-summary__label">{t("searchSummary.checkIn")}</span>
          <span className="search-summary__value">
            <IconCalendar className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">{checkInDisplay}</span>
          </span>
        </div>

        <span className="search-summary__sep" aria-hidden="true" />

        <div className="search-summary__segment search-summary__date">
          <span className="search-summary__label">{t("searchSummary.checkOut")}</span>
          <span className="search-summary__value">
            <IconCalendar className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">{checkOutDisplay}</span>
          </span>
        </div>

        <span className="search-summary__sep search-summary__sep--before-guests" aria-hidden="true" />

        <div className="search-summary__segment search-summary__guests">
          <span className="search-summary__label">{t("searchSummary.guests")}</span>
          <span className="search-summary__value">
            <IconUsers className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">
              {formatGuestsLabel(guests)}
            </span>
          </span>
        </div>

        <span className="search-summary__sep" aria-hidden="true" />

        <div className="search-summary__segment search-summary__rooms">
          <span className="search-summary__label">{t("searchSummary.rooms")}</span>
          <span className="search-summary__value">
            <IconBed className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">
              {formatRoomsLabel(rooms)}
            </span>
          </span>
        </div>
      </div>

      <button
        type="button"
        className="search-summary__search-btn"
        onClick={handleEditSearch}
        aria-label={t("searchSummary.editSearch")}
      >
        <IconSearch className="search-summary__search-icon" />
      </button>
    </section>
  );
}

export default SearchSummary;
