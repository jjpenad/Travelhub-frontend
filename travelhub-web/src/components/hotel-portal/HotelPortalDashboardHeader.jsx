import "./HotelPortalDashboardHeader.css";

/**
 * Cabecera del dashboard: título y saludo (sin sustituir Navbar global).
 */
function HotelPortalDashboardHeader({ firstName = "Usuario" }) {
  return (
    <header className="hp-dash-header">
      <div className="hp-dash-header__titles">
        <h1 className="hp-dash-header__title">Dashboard</h1>
        <p className="hp-dash-header__subtitle">
          Bienvenido/a, {firstName}. Aquí está el resumen de hoy.
        </p>
      </div>
    </header>
  );
}

export default HotelPortalDashboardHeader;
