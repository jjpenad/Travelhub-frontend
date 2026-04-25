import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { getSessionEmail, getSessionRole, ROLE_HOTEL } from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import "./HotelPortalPage.css";

function HotelPortalPage() {
  const navigate = useNavigate();
  const email = getSessionEmail() ?? "";

  useEffect(() => {
    if (getSessionRole() !== ROLE_HOTEL) {
      navigate(PATH_TRAVELERS_HOME, { replace: true });
    }
  }, [navigate]);

  if (getSessionRole() !== ROLE_HOTEL) {
    return null;
  }

  return (
    <div className="hotel-portal-page">
      <Navbar />
      <header className="hotel-portal-hero">
        <div className="hotel-portal-hero__inner">
          <p className="hotel-portal-hero__eyebrow">TravelHub para socios</p>
          <h1 className="hotel-portal-hero__title">Portal de hoteles</h1>
          <p className="hotel-portal-hero__lead">
            Gestiona tu inventario, tarifas y reservas. Esta vista es el espacio de
            trabajo para establecimientos asociados.
          </p>
          <div className="hotel-portal-hero__actions">
            <p className="hotel-portal-hero__user">
              Sesión: <strong>{email}</strong>
            </p>
          </div>
        </div>
      </header>

      <main className="hotel-portal-body">
        <PageContainer>
          <section aria-labelledby="hotel-portal-blocks-title">
            <h2 id="hotel-portal-blocks-title" className="visually-hidden">
              Accesos rápidos
            </h2>
            <div className="hotel-portal-grid">
              <article className="hotel-portal-card">
                <h2>Propiedades</h2>
                <p>
                  Aquí podrás listar y editar tus alojamientos cuando exista conexión con el
                  backend.
                </p>
              </article>
              <article className="hotel-portal-card">
                <h2>Reservas</h2>
                <p>Consulta calendario y ocupación en una próxima iteración.</p>
              </article>
              <article className="hotel-portal-card">
                <h2>Rendimiento</h2>
                <p>Indicadores e informes estarán disponibles más adelante.</p>
              </article>
            </div>
          </section>
        </PageContainer>
      </main>
    </div>
  );
}

export default HotelPortalPage;
