import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  PATH_HOTEL_MANAGE_RATES,
  PATH_HOTEL_PORTAL_HOME,
} from "../../constants/routes";
import { HotelPortalNavIcon } from "./HotelPortalNavIcons";
import "./HotelPortalSidebar.css";

function initialsFromName(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function NavRow({ item, hashActive }) {
  const badge =
    item.badge != null && item.badge > 0 ? (
      <span className="hp-sidebar__badge">{item.badge > 9 ? "9+" : item.badge}</span>
    ) : null;

  const iconWrapClass =
    "hp-sidebar__icon-wrap" +
    (item.id === "notifications" ? " hp-sidebar__icon-wrap--bell" : "");

  const inner = (
    <>
      <span className={iconWrapClass}>
        <HotelPortalNavIcon name={item.icon} className="hp-sidebar__icon" />
      </span>
      <span className="hp-sidebar__link-text">{item.label}</span>
    </>
  );

  if (item.to.startsWith("#")) {
    return (
      <a
        href={item.to}
        className={"hp-sidebar__link" + (hashActive ? " hp-sidebar__link--active" : "")}
        onClick={(e) => e.preventDefault()}
      >
        <span className="hp-sidebar__link-start">{inner}</span>
        {badge}
      </a>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={Boolean(item.end)}
      className={({ isActive }) =>
        "hp-sidebar__link" + (isActive ? " hp-sidebar__link--active" : "")
      }
    >
      <span className="hp-sidebar__link-start">{inner}</span>
      {badge}
    </NavLink>
  );
}

function HotelPortalSidebar({
  activeId = "dashboard",
  displayName = "Usuario",
  propertyLabel,
}) {
  const { t } = useTranslation();
  const resolvedProperty = propertyLabel ?? t("hotelPortal.propertyLabel");
  const navItems = useMemo(
    () => [
      {
        id: "dashboard",
        label: t("hotelPortal.nav.dashboard"),
        to: PATH_HOTEL_PORTAL_HOME,
        end: true,
        icon: "dashboard",
      },
      { id: "reports", label: t("hotelPortal.nav.reports"), to: "#reportes", icon: "reports" },
      {
        id: "notifications",
        label: t("hotelPortal.nav.notifications"),
        to: "#notificaciones",
        icon: "notifications",
      },
      { id: "rates", label: t("hotelPortal.nav.rates"), to: PATH_HOTEL_MANAGE_RATES, icon: "rates" },
      {
        id: "bookings",
        label: t("hotelPortal.nav.bookings"),
        to: PATH_HOTEL_MANAGE_RESERVATIONS,
        icon: "bookings",
      },
      { id: "rooms", label: t("hotelPortal.nav.rooms"), to: "#habitaciones", icon: "rooms" },
      { id: "guests", label: t("hotelPortal.nav.guests"), to: "#huespedes", icon: "guests" },
    ],
    [t],
  );

  const settingsItem = useMemo(
    () => ({
      id: "settings",
      label: t("hotelPortal.nav.settings"),
      to: "#configuracion",
      icon: "settings",
    }),
    [t],
  );

  const initials = initialsFromName(displayName);

  return (
    <aside className="hp-sidebar" aria-label={t("hotelPortal.sidebarAria")}>
      <div className="hp-sidebar__profile-block">
        <div className="hp-sidebar__profile">
          <span className="hp-sidebar__avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="hp-sidebar__profile-text">
            <span className="hp-sidebar__profile-name">{displayName}</span>
            <span className="hp-sidebar__profile-property">{resolvedProperty}</span>
          </div>
        </div>
      </div>

      <div className="hp-sidebar__divider" aria-hidden="true" />

      <nav className="hp-sidebar__nav" aria-label={t("hotelPortal.navAria")}>
        <div className="hp-sidebar__nav-inner">
          <ul className="hp-sidebar__list hp-sidebar__list--main">
            {navItems.map((item) => {
              const hashActive = item.to.startsWith("#") && item.id === activeId;
              return (
                <li
                  key={item.id}
                  className={
                    "hp-sidebar__item" +
                    (item.id === "notifications" ? " hp-sidebar__item--notifications" : "")
                  }
                >
                  <NavRow item={item} hashActive={hashActive} />
                </li>
              );
            })}
          </ul>
          <div className="hp-sidebar__nav-divider" aria-hidden="true" />
          <ul className="hp-sidebar__list hp-sidebar__list--footer">
            <li className="hp-sidebar__item">
              <NavRow
                item={settingsItem}
                hashActive={settingsItem.id === activeId}
              />
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}

export default HotelPortalSidebar;
