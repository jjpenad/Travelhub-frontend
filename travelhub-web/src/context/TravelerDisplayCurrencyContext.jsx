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

/**
 * Tasa USD→COP para **sólo presentación** cuando el GET rates aún no devolvió dato.
 * - `VITE_DISPLAY_USD_COP_FALLBACK` (opcional) en prod/staging.
 * - En `import.meta.env.DEV`, ~4000 si no hay env (evita listados en USD con selector COP).
 */
function getDisplayUsdToCopFallbackRate() {
  const v = Number(import.meta.env.VITE_DISPLAY_USD_COP_FALLBACK);
  if (Number.isFinite(v) && v > 0) return v;
  if (import.meta.env.DEV) return 4000;
  return null;
}

const DISPLAY_USD_TO_COP_FALLBACK = getDisplayUsdToCopFallbackRate();

/** @param {number | null} live */
function effectiveUsdToCop(live) {
  if (live != null && Number.isFinite(live) && live > 0) return live;
  return DISPLAY_USD_TO_COP_FALLBACK;
}

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
    const r = effectiveUsdToCop(null);
    if (r == null) {
      return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
    }
    return formatFlexibleMoneyWithIsoSuffix(n * r, "COP", { variant: "detail" });
  },
  formatPaymentInDisplayCurrency: (amount, paymentCurrencyCode) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "—";
    const pay = normalizeFxCurrencyCode(paymentCurrencyCode);
    const r = effectiveUsdToCop(null);
    if (pay !== "USD" && pay !== "COP") {
      return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
    }
    if (pay === "COP") {
      return formatFlexibleMoneyWithIsoSuffix(n, "COP", { variant: "detail" });
    }
    if (r == null) {
      return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
    }
    return formatFlexibleMoneyWithIsoSuffix(n * r, "COP", { variant: "detail" });
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

  /** Tasa USD→COP: reintentos + `forceRefresh` tras fallo para no quedar con `usdToCop` null (selector sin efecto). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        if (cancelled) return;
        try {
          const { data } = await getFxRatePayloadCached("USD", "COP", {
            forceRefresh: attempt > 0,
          });
          const r = extractRateFromFxResponse(data);
          if (Number.isFinite(r) && r > 0) {
            if (!cancelled) setUsdToCop(r);
            return;
          }
        } catch {
          /* siguiente intento */
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 350 * (attempt + 1));
        });
      }
      if (!cancelled) {
        setUsdToCop((prev) =>
          Number.isFinite(prev) && prev > 0 ? prev : null,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currencyCode]);

  const setCurrencyCode = useCallback((code) => {
    setTravelerDisplayCurrencyCode(code);
    // Misma lectura que el listener del evento: garantiza re-render aunque el
    // CustomEvent falle o llegue desordenado en algún entorno.
    setCurrencyCodeState(getTravelerDisplayCurrencyCode());
  }, []);

  const formatUsdBaseAmount = useCallback(
    (amount) => {
      const n = Number(amount);
      if (!Number.isFinite(n)) return "—";
      if (currencyCode === "USD") {
        return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
      }
      const r = effectiveUsdToCop(usdToCop);
      if (r == null) {
        return formatFlexibleMoneyWithIsoSuffix(n, "USD", { variant: "detail" });
      }
      return formatFlexibleMoneyWithIsoSuffix(n * r, "COP", { variant: "detail" });
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
      const r = effectiveUsdToCop(usdToCop);
      if (r == null || !Number.isFinite(r) || r <= 0) {
        return formatFlexibleMoneyWithIsoSuffix(n, pay, { variant: "detail" });
      }
      if (pay === "USD" && disp === "COP") {
        return formatFlexibleMoneyWithIsoSuffix(n * r, "COP", { variant: "detail" });
      }
      return formatFlexibleMoneyWithIsoSuffix(n / r, "USD", { variant: "detail" });
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
