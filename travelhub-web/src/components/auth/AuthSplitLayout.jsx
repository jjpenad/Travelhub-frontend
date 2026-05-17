import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PATH_TRAVELERS_HOME } from "../../constants/routes";
import CurrencySwitcher from "../currency/CurrencySwitcher";
import LanguageSwitcher from "../language/LanguageSwitcher";
import AuthMarketingAside from "./AuthMarketingAside";

function AuthSplitLayout({ children }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const showCurrencySwitcher = pathname !== "/login" && pathname !== "/signup";
  return (
    <div className="auth-split">
      <div className="auth-split__toolbar">
        {showCurrencySwitcher ? <CurrencySwitcher /> : null}
        <LanguageSwitcher />
      </div>
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
            <Link to={PATH_TRAVELERS_HOME}>{t("authFooter.privacy")}</Link>
            <span aria-hidden="true">·</span>
            <Link to={PATH_TRAVELERS_HOME}>{t("authFooter.terms")}</Link>
            <span aria-hidden="true">·</span>
            <Link to={PATH_TRAVELERS_HOME}>{t("authFooter.help")}</Link>
            <span aria-hidden="true">·</span>
            <Link to={PATH_TRAVELERS_HOME}>{t("authFooter.contact")}</Link>
          </nav>
          <p className="auth-split__footer-tagline">{t("authFooter.tagline")}</p>
        </div>
      </footer>
    </div>
  );
}

export default AuthSplitLayout;
