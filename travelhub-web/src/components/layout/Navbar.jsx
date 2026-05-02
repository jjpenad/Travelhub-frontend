import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AUTH_EMAIL_KEY,
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  canAccessTravelerAccountRoutes,
  clearSessionUser,
  isAuthenticated,
  isLoggedIn,
  SESSION_CHANGED_EVENT,
} from "../../auth/sessionAuth";
import {
  PATH_HOTEL_MANAGE_RESERVATIONS,
  PATH_HOTEL_PORTAL_HOME,
  PATH_HOTEL_PORTAL_LEGACY,
  PATH_MY_TRIPS,
  PATH_TRAVELERS_HOME,
} from "../../constants/routes";
import logoTravelhub from "../../assets/logo_travelhub.png";
import CurrencySwitcher from "../currency/CurrencySwitcher";
import LanguageSwitcher from "../language/LanguageSwitcher";
import NavbarUserIcon from "./NavbarUserIcon";
import "./Navbar.css";
import { useTranslation } from "react-i18next";

/** MVP: desactiva la entrada Mis viajes (solo viajeros logueados la ven si está en true) */
const showMyTripsNav = true;

/** MVP: oculta la búsqueda del header; pon en true para mostrarla */
const showSearchBar = false;

/** MVP: oculta Iniciar sesión y Registrarse; pon en true para mostrarlos */
const showAuthButtons = true;

function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === PATH_TRAVELERS_HOME;
  const isMyTrips =
    pathname === PATH_MY_TRIPS || pathname.startsWith(`${PATH_MY_TRIPS}/`);
  const isHotelPortalRoute =
    pathname === PATH_HOTEL_PORTAL_LEGACY ||
    pathname === PATH_HOTEL_PORTAL_HOME ||
    pathname.startsWith("/hoteles/");
  const hideTravelerCurrency =
    isHotelPortalRoute || pathname.startsWith(`${PATH_HOTEL_MANAGE_RESERVATIONS}`);
  const [sessionVersion, setSessionVersion] = useState(0);
  const loggedIn = useMemo(() => {
    void pathname;
    void sessionVersion;
    return isAuthenticated() || isLoggedIn();
  }, [pathname, sessionVersion]);

  const showMyTripsLink = useMemo(() => {
    void pathname;
    void sessionVersion;
    return showMyTripsNav && canAccessTravelerAccountRoutes();
  }, [pathname, sessionVersion]);

  useEffect(() => {
    function bump() {
      setSessionVersion((v) => v + 1);
    }
    function onStorage(e) {
      if (
        e.key === AUTH_ROLE_KEY ||
        e.key === AUTH_EMAIL_KEY ||
        e.key === AUTH_TOKEN_KEY
      ) {
        bump();
      }
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(SESSION_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SESSION_CHANGED_EVENT, bump);
    };
  }, []);

  function handleLogout() {
    clearSessionUser();
    setSessionVersion((v) => v + 1);
    navigate(PATH_TRAVELERS_HOME, { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar__inner navbar__inner--compact">
        <div className="navbar__start">
          <Link className="navbar__brand" to={PATH_TRAVELERS_HOME}>
            <span className="navbar__brand-container">
              <span className="navbar__logo" aria-hidden="true">
                <img
                  className="navbar__logo-image"
                  src={logoTravelhub}
                  alt=""
                  width={64}
                  height={64}
                />
              </span>
              <span className="navbar__brand-text">
                Travel
                <span className="navbar__brand-text--accent">Hub</span>
              </span>
            </span>
          </Link>

          <nav className="navbar__menu" aria-label={t("nav.mainAria")}>
            <ul className="navbar__menu-list">
              <li>
                <Link
                  className={
                    "navbar__link" + (isHome ? " navbar__link--active" : "")
                  }
                  to={`${PATH_TRAVELERS_HOME}#explore`}
                  aria-current={isHome ? "page" : undefined}
                >
                  {t("nav.explore")}
                </Link>
              </li>
              {showMyTripsLink ? (
                <li>
                  <Link
                    className={
                      "navbar__link" +
                      (isMyTrips ? " navbar__link--active" : "")
                    }
                    to={PATH_MY_TRIPS}
                    aria-current={isMyTrips ? "page" : undefined}
                  >
                    {t("nav.myTrips")}
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>

        {showSearchBar ? (
          <form
            className="navbar__search"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="nav-search" className="visually-hidden">
              {t("nav.searchDestinations")}
            </label>
            <input
              id="nav-search"
              type="search"
              name="q"
              placeholder={t("nav.searchPlaceholder")}
              className="navbar__search-input"
              autoComplete="off"
            />
          </form>
        ) : null}

        <div
          className={
            loggedIn ? "navbar__actions navbar__actions--logged" : "navbar__actions"
          }
        >
          {!hideTravelerCurrency ? <CurrencySwitcher /> : null}
          <LanguageSwitcher />
          {loggedIn ? (
            <>
              <button
                type="button"
                className="navbar__btn navbar__btn--logout"
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </button>
              {!isHotelPortalRoute ? (
                <span
                  className="navbar__user-badge"
                  role="img"
                  aria-label={t("nav.sessionStarted")}
                >
                  <NavbarUserIcon className="navbar__user-badge-icon" />
                </span>
              ) : null}
            </>
          ) : showAuthButtons ? (
            <>
              <Link
                className="navbar__btn navbar__btn--primary navbar__sign-in"
                to="/login"
              >
                {t("nav.login")}
              </Link>
              <Link className="navbar__btn navbar__btn--register" to="/signup">
                {t("nav.signup")}
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
