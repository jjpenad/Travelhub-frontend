import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getAuthToken, getSessionEmail, isTravelerLoggedIn } from "../../auth/sessionAuth";
import {
  hasSentReservationConfirmEmail,
  markSentReservationConfirmEmail,
} from "../../bookings/reservationConfirmEmailDedup";
import { encodeApiReservationDetailSlug } from "../../bookings/bookingDetailSlug";
import { PATH_MY_TRIPS, PATH_MY_TRIPS_RESERVATION } from "../../constants/routes";
import {
  getTravelerReservationsForStatusPollMerged,
  getTravelerReservationByIdForPoll,
  sendEmailNotification,
} from "../../services/api";
import {
  buildTravelerConfirmEmailMessage,
  buildTravelerConfirmToastBody,
} from "../../utils/reservationInAppToastText";
import logoTravelhub from "../../assets/logo_travelhub.png";
import "./TravelerConfirmToast.css";

const POLL_MS = 4000;
const TOAST_MS = 4000;
const TOAST_TITLE = "¡Reserva confirmada!";

/** Evita dos POST en paralelo (p. ej. React StrictMode) antes de `markSent`. */
const confirmEmailInFlight = new Set();
/** Evita re-mostrar el mismo toast en la misma pestaña. */
const confirmToastShownKeys = new Set();

function toastKeyForReservation({ reservationId, reservationRef }) {
  const id = reservationId != null && String(reservationId).trim() !== ""
    ? String(reservationId).trim()
    : "";
  if (id) return `id:${id}`;
  const ref = reservationRef != null && String(reservationRef).trim() !== ""
    ? String(reservationRef).trim()
    : "";
  if (ref) return `ref:${ref}`;
  return "";
}

/**
 * @param {object | null} reservaLocal
 * @returns {string}
 */
function emailParaNotificacionConfirmacion(reservaLocal) {
  const session = getSessionEmail();
  if (session && String(session).trim() !== "") return String(session).trim();
  if (
    reservaLocal &&
    typeof reservaLocal.guestEmail === "string" &&
    reservaLocal.guestEmail.trim() !== ""
  ) {
    return reservaLocal.guestEmail.trim();
  }
  return "";
}

/**
 * En checkout el destinatario debe ser el email que el usuario digitó en el formulario,
 * no necesariamente el email con el que inició sesión.
 * @param {{ guestEmail?: string | null } | null} p
 * @returns {string}
 */
function emailParaNotificacionCheckout(p) {
  if (p && typeof p.guestEmail === "string" && p.guestEmail.trim() !== "") {
    return p.guestEmail.trim();
  }
  const session = getSessionEmail();
  return session && String(session).trim() !== "" ? String(session).trim() : "";
}

/**
 * @param {{ dedupKey: string, email: string, body: string, confirmationCode?: string, reservationId?: string }} p
 */
function enviarEmailConfirmacionSiCorresponde(p) {
  if (!p.email) return;
  const key = String(p.dedupKey);
  if (hasSentReservationConfirmEmail(key)) return;
  if (confirmEmailInFlight.has(key)) return;
  confirmEmailInFlight.add(key);
  const message = buildTravelerConfirmEmailMessage({
    toastBody: p.body,
    confirmationCode: p.confirmationCode,
    reservationId: p.reservationId,
  });
  sendEmailNotification({ email: p.email, message })
    .then((ok) => {
      if (ok) markSentReservationConfirmEmail(key);
    })
    .catch(() => {})
    .finally(() => {
      confirmEmailInFlight.delete(key);
    });
}

export default function TravelerConfirmToastProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  const statusByIdRef = useRef(new Map());
  const isFirstListSampleRef = useRef(true);
  const toastTimeoutRef = useRef(null);
  const runPollRef = useRef(null);
  /** Evita re-mostrar el toast al volver a /confirmation; solo memoria, sin sessionStorage. */
  const lastCheckoutToastAtByRef = useRef(new Map());

  const clearToastTimeout = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  const dismissToast = useCallback(() => {
    clearToastTimeout();
    setToast(null);
  }, [clearToastTimeout]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  /**
   * In-app: transición a confirmada. Opcional: POST a service-soport/send-email
   * (activo por defecto; el backend puede enviar su propio correo también).
   */
  const runPoll = useCallback(async () => {
    if (!isTravelerLoggedIn() || !getAuthToken()) {
      statusByIdRef.current = new Map();
      isFirstListSampleRef.current = true;
      return;
    }
    if (document.visibilityState !== "visible") {
      return;
    }

    const items = await getTravelerReservationsForStatusPollMerged();
    if (items.length === 0) {
      return;
    }

    const isFirst = isFirstListSampleRef.current;
    const map = statusByIdRef.current;

    const toNotify = [];
    for (const it of items) {
      const prev = map.get(it.id);
      if (
        !isFirst &&
        it.statusNorm === "confirmed" &&
        prev !== "confirmed" &&
        prev !== undefined &&
        prev !== "cancelled"
      ) {
        toNotify.push(it);
      }
    }
    for (const it of items) {
      map.set(it.id, it.statusNorm);
    }
    if (toNotify.length > 0) {
      const it = toNotify[0];
      const raw = it.raw && typeof it.raw === "object" ? it.raw : {};
      const fromApi = [
        raw.confirmation_code,
        raw.reference,
        raw.booking_reference,
        raw.reservation_reference,
      ]
        .map((x) => (x != null && String(x).trim() !== "" ? String(x).trim() : ""))
        .find((s) => s);
      const confirmationCode = (fromApi || "").trim();
      const toastKey = toastKeyForReservation({
        reservationId: it.id,
        reservationRef: confirmationCode || undefined,
      });
      if (toastKey && confirmToastShownKeys.has(toastKey)) {
        isFirstListSampleRef.current = false;
        return;
      }
      const body = buildTravelerConfirmToastBody({
        hotelName: it.hotelName,
        checkIn: it.checkIn,
        checkOut: it.checkOut,
        reservationId: it.id,
        reservationRef: confirmationCode || undefined,
      });
      clearToastTimeout();
      setToast({
        id: it.id,
        body,
        nav: { kind: "api", id: it.id },
      });
      if (toastKey) confirmToastShownKeys.add(toastKey);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, TOAST_MS);

      const userEmail = emailParaNotificacionConfirmacion(
        it.raw && typeof it.raw === "object" ? it.raw : null,
      );
      if (userEmail) {
        enviarEmailConfirmacionSiCorresponde({
          dedupKey: it.id,
          email: String(userEmail).trim(),
          body,
          confirmationCode: confirmationCode || undefined,
          reservationId: it.id,
        });
      }
    }

    isFirstListSampleRef.current = false;
  }, [clearToastTimeout]);

  useEffect(() => {
    runPollRef.current = runPoll;
  }, [runPoll]);

  /**
   * Tras pago, checkout navega a /confirmation con `state`.
   */
  useEffect(() => {
    if (location.pathname !== "/confirmation") {
      return undefined;
    }
    if (toast?.nav?.kind === "checkout" && toast?.id?.startsWith("checkout-")) {
      return undefined;
    }
    const st = location.state;
    const src = st && typeof st === "object" ? st : null;
    if (!src || typeof src !== "object" || src.reference == null) {
      return undefined;
    }
    if (!src.checkIn || !src.checkOut) {
      return undefined;
    }
    const ref = String(src.reference).trim();
    const now = Date.now();
    let allowShow = true;
    const prevTs = lastCheckoutToastAtByRef.current.get(ref);
    if (Number.isFinite(prevTs) && now - prevTs > 6500) {
      allowShow = false;
    }
    if (allowShow) {
      lastCheckoutToastAtByRef.current.set(ref, now);
    }
    if (!allowShow) return undefined;

    const hotelObj = src.hotel && typeof src.hotel === "object" ? src.hotel : null;
    const name =
      hotelObj && typeof hotelObj.name === "string" && hotelObj.name.trim() !== ""
        ? hotelObj.name
        : "Alojamiento";
    const body = buildTravelerConfirmToastBody({
      hotelName: name,
      checkIn: src.checkIn,
      checkOut: src.checkOut,
      reservationId:
        src.apiReservationId != null && String(src.apiReservationId).trim() !== ""
          ? String(src.apiReservationId).trim()
          : undefined,
      reservationRef:
        src.reference != null && String(src.reference).trim() !== ""
          ? String(src.reference).trim()
          : undefined,
    });
    clearToastTimeout();
    const apiId =
      src.apiReservationId != null && String(src.apiReservationId).trim() !== ""
        ? String(src.apiReservationId).trim()
        : null;
    const toastKey = toastKeyForReservation({
      reservationId: apiId,
      reservationRef: ref,
    });
    if (toastKey && confirmToastShownKeys.has(toastKey)) return undefined;
    queueMicrotask(() => {
      setToast({
        id: `checkout-${ref}`,
        body,
        nav: {
          kind: "checkout",
          reference: ref,
          apiReservationId: apiId,
          guestEmail: typeof src.guestEmail === "string" ? src.guestEmail.trim() : null,
        },
      });
    });
    if (toastKey) confirmToastShownKeys.add(toastKey);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, TOAST_MS);
    return undefined;
  }, [location.pathname, location.state, toast?.id, toast?.nav?.kind, clearToastTimeout]);

  /**
   * Validación determinística post-pago: si tenemos `apiReservationId` en el state de /confirmation,
   * consultamos `GET /reservations/{id}` hasta que el backend marque confirmada.
   *
   * Esto evita depender del listado `/reservations/user`, que puede tardar o no incluir la reserva aún.
   */
  useEffect(() => {
    if (location.pathname !== "/confirmation") return undefined;
    const st = location.state;
    const fromState =
      st && typeof st === "object" && st.apiReservationId != null
        ? String(st.apiReservationId).trim()
        : "";
    const fromQuery = (
      searchParams.get("rid") ||
      searchParams.get("reservationId") ||
      ""
    ).trim();
    const apiReservationId = fromState || fromQuery;
    if (!apiReservationId) return undefined;
    // GET /reservations/{id} (service-core) requiere JWT; sin sesión el backend no expone el detalle.
    if (!getAuthToken()) return undefined;

    let cancelled = false;
    const startedAt = Date.now();
    const timeoutMs = 60000;

    async function tick() {
      if (cancelled) return;
      // Si ya hay toast para este id (o ya enviamos email), no insistir.
      const curr = toastRef.current;
      if (curr?.nav?.kind === "api" && curr?.nav?.id === apiReservationId) return;
      const key = toastKeyForReservation({ reservationId: apiReservationId, reservationRef: null });
      if (key && confirmToastShownKeys.has(key)) return;
      if (hasSentReservationConfirmEmail(apiReservationId)) return;

      const item = await getTravelerReservationByIdForPoll(apiReservationId);
      if (cancelled || !item) return;
      if (item.statusNorm !== "confirmed") return;

      const raw = item.raw && typeof item.raw === "object" ? item.raw : {};
      const ref = [
        raw.confirmation_code,
        raw.reference,
        raw.booking_reference,
        raw.reservation_reference,
      ]
        .map((x) => (x != null && String(x).trim() !== "" ? String(x).trim() : ""))
        .find((s) => s);

      const body = buildTravelerConfirmToastBody({
        hotelName: item.hotelName,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        reservationId: item.id,
        reservationRef: ref || undefined,
      });

      clearToastTimeout();
      setToast({
        id: item.id,
        body,
        nav: { kind: "api", id: item.id },
      });
      const shownKey = toastKeyForReservation({
        reservationId: item.id,
        reservationRef: ref || undefined,
      });
      if (shownKey) confirmToastShownKeys.add(shownKey);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, TOAST_MS);

      const guestEmail =
        st && typeof st === "object" && typeof st.guestEmail === "string"
          ? st.guestEmail.trim()
          : null;
      const userEmail = emailParaNotificacionCheckout({ guestEmail });
      if (userEmail) {
        enviarEmailConfirmacionSiCorresponde({
          dedupKey: item.id,
          email: String(userEmail).trim(),
          body,
          confirmationCode: ref || undefined,
          reservationId: item.id,
        });
      }
    }

    const id = setInterval(() => {
      if (Date.now() - startedAt > timeoutMs) return;
      tick().catch(() => {});
    }, POLL_MS);

    tick().catch(() => {});

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [location.pathname, location.state, searchParams, clearToastTimeout]);

  /**
   * Tras checkout (solo `location.state`); mismo envío a service-soport que en el poller.
   */
  useEffect(() => {
    if (!toast || !String(toast.id).startsWith("checkout-") || !toast.body) {
      return;
    }
    if (toast.nav?.kind !== "checkout") return;
    const ref =
      toast.nav.reference != null && String(toast.nav.reference).trim() !== ""
        ? String(toast.nav.reference).trim()
        : "";
    if (!ref) return;
    const apiId = toast.nav.apiReservationId
      ? String(toast.nav.apiReservationId).trim()
      : "";
    const dedupKey = apiId || `ref:${ref}`;
    const email = emailParaNotificacionCheckout({
      guestEmail: toast.nav.guestEmail,
    });
    if (!email) return;
    const reservationId = apiId || undefined;
    enviarEmailConfirmacionSiCorresponde({
      dedupKey,
      email,
      body: toast.body,
      confirmationCode: ref,
      reservationId,
    });
  }, [toast]);

  useEffect(() => {
    const tick = () => {
      const p = runPollRef.current?.();
      if (p && typeof p.then === "function") p.catch(() => {});
    };
    const id = setInterval(tick, POLL_MS);
    tick();
    const onVis = () => {
      if (document.visibilityState === "visible" && runPollRef.current) {
        const p = runPollRef.current();
        if (p && typeof p.then === "function") p.catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [location.pathname]);

  const onToastClick = useCallback(() => {
    if (!toast) return;
    dismissToast();
    if (toast.nav?.kind === "checkout") {
      const apiId = toast.nav.apiReservationId
        ? String(toast.nav.apiReservationId).trim()
        : "";
      if (apiId) {
        const slug = encodeApiReservationDetailSlug(apiId);
        navigate(`${PATH_MY_TRIPS_RESERVATION}/${slug}`);
        return;
      }
      navigate(PATH_MY_TRIPS);
      return;
    }
    const apiId = toast.nav?.kind === "api" ? toast.nav.id : toast.id;
    if (!apiId) {
      navigate(PATH_MY_TRIPS);
      return;
    }
    const slug = encodeApiReservationDetailSlug(apiId);
    navigate(`${PATH_MY_TRIPS_RESERVATION}/${slug}`);
  }, [toast, dismissToast, navigate]);

  return (
    <>
      {children}
      {typeof document !== "undefined" &&
        toast != null &&
        createPortal(
          <div
            className="traveler-confirm-toast-host"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="traveler-confirm-toast" role="group" aria-label="Notificación de reserva">
              <button
                type="button"
                className="traveler-confirm-toast__main"
                onClick={onToastClick}
              >
                <div className="traveler-confirm-toast__icon" aria-hidden="true">
                  <img
                    className="traveler-confirm-toast__icon-img"
                    src={logoTravelhub}
                    alt=""
                  />
                </div>
                <div className="traveler-confirm-toast__text">
                  <h2 className="traveler-confirm-toast__title">{TOAST_TITLE}</h2>
                  <p className="traveler-confirm-toast__body">{toast.body}</p>
                </div>
              </button>
              <button
                type="button"
                className="traveler-confirm-toast__close"
                aria-label="Cerrar notificación"
                onClick={dismissToast}
              >
                ×
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
