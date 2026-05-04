import { useTranslation } from "react-i18next";
import { HOTEL_PORTAL_SUPPORTED_CURRENCIES } from "../../constants/hotelCurrency";
import { useTravelerDisplayCurrency } from "../../context/TravelerDisplayCurrencyContext";
import "./CurrencySwitcher.css";

function CurrencySwitcher({ className = "" }) {
  const { t } = useTranslation();
  const { currencyCode, setCurrencyCode } = useTravelerDisplayCurrency();

  return (
    <div className={"currency-switcher " + className}>
      <label htmlFor="currency-switcher-select" className="visually-hidden">
        {t("currency.switchAria")}
      </label>
      <select
        id="currency-switcher-select"
        className="currency-switcher__select"
        value={currencyCode}
        aria-label={t("currency.switchAria")}
        onChange={(e) => setCurrencyCode(e.target.value)}
      >
        {HOTEL_PORTAL_SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {t(c === "USD" ? "currency.usd" : "currency.cop")}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CurrencySwitcher;
