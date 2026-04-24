import { Link, useLocation } from "react-router-dom";
import logoTravelhub from "../../assets/logo_travelhub.png";
import "./Navbar.css";

/** MVP: oculta Estancias y Mis viajes; pon en true para mostrar el menú completo */
const showFullMenu = false;

/** MVP: oculta la búsqueda del header; pon en true para mostrarla */
const showSearchBar = false;

/** MVP: oculta Iniciar sesión y Registrarse; pon en true para mostrarlos */
const showAuthButtons = true;

const navLinks = [
  { label: "Estancias", href: "#stays" },
  { label: "Mis viajes", href: "#my-trips" },
];

function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <header className="navbar">
      <div className="navbar__inner navbar__inner--compact">
        <div className="navbar__start">
          <a className="navbar__brand" href="/">
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
          </a>

          <nav className="navbar__menu" aria-label="Principal">
            <ul className="navbar__menu-list">
              <li>
                <Link
                  className={
                    "navbar__link" + (isHome ? " navbar__link--active" : "")
                  }
                  to="/#explore"
                  aria-current={isHome ? "page" : undefined}
                >
                  Explorar
                </Link>
              </li>
              {showFullMenu
                ? navLinks.map(({ label, href }) => (
                    <li key={label}>
                      <a className="navbar__link" href={href}>
                        {label}
                      </a>
                    </li>
                  ))
                : null}
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
              Buscar destinos
            </label>
            <input
              id="nav-search"
              type="search"
              name="q"
              placeholder="Buscar destinos..."
              className="navbar__search-input"
              autoComplete="off"
            />
          </form>
        ) : null}

        {showAuthButtons ? (
          <div className="navbar__actions">
            <Link
              className="navbar__btn navbar__btn--primary navbar__sign-in"
              to="/login"
            >
              Iniciar sesión
            </Link>
            <Link className="navbar__btn navbar__btn--register" to="/signup">
              Registrarse
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Navbar;
