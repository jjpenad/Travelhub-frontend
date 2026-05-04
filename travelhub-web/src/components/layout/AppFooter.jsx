import { getAppVersionLabel } from "../../config/appVersion";
import "./AppFooter.css";

/**
 * Pie global con la versión de la app (build desde `package.json`).
 */
function AppFooter() {
  return (
    <footer className="app-footer" role="contentinfo">
      <p className="app-footer__version">{getAppVersionLabel()}</p>
    </footer>
  );
}

export default AppFooter;
