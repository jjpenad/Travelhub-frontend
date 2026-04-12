import { useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IconBed,
  IconCalendar,
  IconMapPin,
  IconSearch,
  IconUsers,
} from "../home/HeroIcons";
import "./SearchSummary.css";

function parseIsoToLocalDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/** ISO YYYY-MM-DD → texto legible (ej. "24 mar 2026") */
function formatFriendlyDate(iso) {
  const dt = parseIsoToLocalDate(iso);
  if (!dt) return "—";
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dt);
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function formatGuestsLabel(n) {
  const num = parseInt(String(n), 10);
  if (!Number.isFinite(num) || num < 1) return "—";
  return num === 1 ? "1 huésped" : `${num} huéspedes`;
}

function formatRoomsLabel(n) {
  const num = parseInt(String(n), 10);
  if (!Number.isFinite(num) || num < 1) return "—";
  return num === 1 ? "1 habitación" : `${num} habitaciones`;
}

function SearchSummary() {
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
    navigate({ pathname: "/", search: searchParams.toString() });
  }, [navigate, searchParams]);

  return (
    <section className="search-summary" aria-label="Resumen de búsqueda">
      <div className="search-summary__fields">
        <div className="search-summary__segment search-summary__destination">
          <span className="search-summary__label">Destino</span>
          <span className="search-summary__value">
            <IconMapPin className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">{destination}</span>
          </span>
        </div>

        <span className="search-summary__sep" aria-hidden="true" />

        <div className="search-summary__segment search-summary__date">
          <span className="search-summary__label">Fecha de entrada</span>
          <span className="search-summary__value">
            <IconCalendar className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">{checkInDisplay}</span>
          </span>
        </div>

        <span className="search-summary__sep" aria-hidden="true" />

        <div className="search-summary__segment search-summary__date">
          <span className="search-summary__label">Fecha de salida</span>
          <span className="search-summary__value">
            <IconCalendar className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">{checkOutDisplay}</span>
          </span>
        </div>

        <span className="search-summary__sep search-summary__sep--before-guests" aria-hidden="true" />

        <div className="search-summary__segment search-summary__guests">
          <span className="search-summary__label">Huéspedes</span>
          <span className="search-summary__value">
            <IconUsers className="search-summary__icon" aria-hidden="true" />
            <span className="search-summary__text">
              {formatGuestsLabel(guests)}
            </span>
          </span>
        </div>

        <span className="search-summary__sep" aria-hidden="true" />

        <div className="search-summary__segment search-summary__rooms">
          <span className="search-summary__label">Habitaciones</span>
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
        aria-label="Editar búsqueda"
      >
        <IconSearch className="search-summary__search-icon" />
      </button>
    </section>
  );
}

export default SearchSummary;
