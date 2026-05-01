import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const value = i18n.resolvedLanguage === "en" ? "en" : "es";

  return (
    <div className={"language-switcher " + className}>
      <label htmlFor="language-switcher-select" className="visually-hidden">
        {t("language.switchAria")}
      </label>
      <select
        id="language-switcher-select"
        className="language-switcher__select"
        value={value}
        aria-label={t("language.switchAria")}
        onChange={(e) => {
          void i18n.changeLanguage(e.target.value);
        }}
      >
        <option value="es">{t("language.es")}</option>
        <option value="en">{t("language.en")}</option>
      </select>
    </div>
  );
}

export default LanguageSwitcher;
