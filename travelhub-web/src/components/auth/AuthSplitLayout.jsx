import { Link } from "react-router-dom";
import { PATH_TRAVELERS_HOME } from "../../constants/routes";
import AuthMarketingAside from "./AuthMarketingAside";

function AuthSplitLayout({ children }) {
  return (
    <div className="auth-split">
      <div className="auth-split__grid">
        <AuthMarketingAside />
        <div className="auth-split__main">{children}</div>
      </div>
      <footer className="auth-split__footer">
        <div className="auth-split__footer-inner">
          <p className="auth-split__footer-copy">
            © {new Date().getFullYear()} <strong>TravelHub</strong>
          </p>
          <nav className="auth-split__footer-nav" aria-label="Legal">
            <Link to={PATH_TRAVELERS_HOME}>Privacidad</Link>
            <span aria-hidden="true">·</span>
            <Link to={PATH_TRAVELERS_HOME}>Términos</Link>
            <span aria-hidden="true">·</span>
            <Link to={PATH_TRAVELERS_HOME}>Ayuda</Link>
            <span aria-hidden="true">·</span>
            <Link to={PATH_TRAVELERS_HOME}>Contacto</Link>
          </nav>
          <p className="auth-split__footer-tagline">Hecho con cuidado para viajeros</p>
        </div>
      </footer>
    </div>
  );
}

export default AuthSplitLayout;
