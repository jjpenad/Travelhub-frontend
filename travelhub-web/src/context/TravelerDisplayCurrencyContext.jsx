import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getTravelerDisplayCurrencyCode,
  setTravelerDisplayCurrencyCode,
  TRAVELER_DISPLAY_CURRENCY_EVENT,
} from "../auth/travelerDisplayCurrency";
import { normalizeFxCurrencyCode } from "../constants/fxCurrency";
import { formatFlexibleMoneyWithIsoSuffix } from "../utils/formatHotelPortalMoney";
import { extractRateFromFxResponse } from "../utils/fxConversion";
import { getFxRatePayloadCached } from "../utils/fxRateCache";

/** @type {import("react").Context<TravelerDisplayCurrencyContextValue | null>} */
const TravelerDisplayCurrencyContext = createContext(null);

/**
 * @typedef {{
 *   currencyCode: "USD" | "COP",
 *   setCurrencyCode: (code: string) => void,
 *   formatUsdBaseAmount: (amount: unknown) => string,
 *   formatPaymentInDisplayCurrency: (amount: unknown, paymentCurrencyCode: string | null | undefined) => string,
 *   copRateReady: boolean,
 * }} TravelerDisplayCurrencyContextValue — pago en moneda del backend, mostrado según el selector (USD↔COP).
 */

const FALLBACK_VALUE = {
  currencyCode: /** @type {"USD" | "COP"} */ ("COP"),
  setCurrencyCode: () => {},
  formatUsdBaseAmount: (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "—";
    return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
  },
  formatPaymentInDisplayCurrency: (amount, paymentCurrencyCode) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "—";
    const pay = normalizeFxCurrencyCode(paymentCurrencyCode);
    return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
  },
  copRateReady: true,
};

export function TravelerDisplayCurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCodeState] = useState(() => getTravelerDisplayCurrencyCode());
  const [usdToCop, setUsdToCop] = useState(/** @type {number | null} */ (null));

  const syncFromStorage = useCallback(() => {
    setCurrencyCodeState(getTravelerDisplayCurrencyCode());
  }, []);

  useEffect(() => {
    function onChanged() {
      syncFromStorage();
    }
    window.addEventListener(TRAVELER_DISPLAY_CURRENCY_EVENT, onChanged);
    return () => window.removeEventListener(TRAVELER_DISPLAY_CURRENCY_EVENT, onChanged);
  }, [syncFromStorage]);

  /** Tasa USD→COP siempre cargada: sirve listados (montos en USD) y confirmación (pago en USD o COP vs selector). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getFxRatePayloadCached("USD", "COP");
        const r = extractRateFromFxResponse(data);
        if (!cancelled) {
          setUsdToCop(Number.isFinite(r) && r > 0 ? r : null);
        }
      } catch {
        if (!cancelled) setUsdToCop(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrencyCode = useCallback((code) => {
    setTravelerDisplayCurrencyCode(code);
  }, []);

  const formatUsdBaseAmount = useCallback(
    (amount) => {
      const n = Number(amount);
      if (!Number.isFinite(n)) return "—";
      if (currencyCode === "USD") {
        return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
      }
      if (usdToCop == null) {
        return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
      }
      return formatFlexibleMoneyWithIsoSuffix(n * usdToCop, "COP", { variant: "detail" });
    },
    [currencyCode, usdToCop],
  );

  const formatPaymentInDisplayCurrency = useCallback(
    (amount, paymentCurrencyCode) => {
      const n = Number(amount);
      if (!Number.isFinite(n)) return "—";
      const pay = normalizeFxCurrencyCode(paymentCurrencyCode);
      const disp = currencyCode;

      if (pay !== "USD" && pay !== "COP") {
        return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
      }
      if (disp !== "USD" && disp !== "COP") {
        return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
      }
      if (pay === disp) {
        return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
      }
      if (usdToCop == null || !Number.isFinite(usdToCop) || usdToCop <= 0) {
        return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
      }
      if (pay === "USD" && disp === "COP") {
        return formatFlexibleMoneyWithIsoSuffix(n * usdToCop, "COP", { variant: "detail" });
      }
      return formatFlexibleMoneyWithIsoSuffix(n / usdToCop, "USD", { variant: "detail" });
    },
    [currencyCode, usdToCop],
  );

  const copRateReady = currencyCode !== "COP" || usdToCop != null;

  const value = useMemo(
    () => ({
      currencyCode,
      setCurrencyCode,
      formatUsdBaseAmount,
      formatPaymentInDisplayCurrency,
      copRateReady,
    }),
    [currencyCode, setCurrencyCode, formatUsdBaseAmount, formatPaymentInDisplayCurrency, copRateReady],
  );

  return (
    <TravelerDisplayCurrencyContext.Provider value={value}>
      {children}
    </TravelerDisplayCurrencyContext.Provider>
  );
}

/** @returns {TravelerDisplayCurrencyContextValue} */
// eslint-disable-next-line react-refresh/only-export-components -- hook usado junto al Provider
export function useTravelerDisplayCurrency() {
  const ctx = useContext(TravelerDisplayCurrencyContext);
  return ctx ?? FALLBACK_VALUE;
}
