import { useCallback, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { IconCalendar, IconMapPin, IconSearch, IconUsers } from "./HeroIcons";
import "./Hero.css";

const guestOptions = [
  { value: "1", label: "1 huésped" },
  { value: "2", label: "2 huéspedes" },
  { value: "3", label: "3 huéspedes" },
  { value: "4", label: "4 huéspedes" },
  { value: "5", label: "5+ huéspedes" },
];

/** @param {string} yyyyMmDd */
function parseLocalDate(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  const parts = yyyyMmDd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/** @param {Date} date */
function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function addDaysYmd(yyyyMmDd, days) {
  const base = parseLocalDate(yyyyMmDd);
  if (!base) return "";
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + days);
  return formatYmd(next);
}

function withClearError(reg, clearErrors, names) {
  const list = Array.isArray(names) ? names : [names];
  return {
    ...reg,
    onChange: (e) => {
      list.forEach((n) => clearErrors(n));
      reg.onChange(e);
    },
    onFocus: (e) => {
      list.forEach((n) => clearErrors(n));
      reg.onFocus(e);
    },
  };
}

function Hero() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    trigger,
    clearErrors,
    formState: { errors, touchedFields, isSubmitted, submitCount },
  } = useForm({
    defaultValues: {
      destination: "",
      checkIn: "",
      checkOut: "",
      guests: "1",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const checkInValue = useWatch({ control, name: "checkIn" });

  const todayYmd = useMemo(() => formatYmd(startOfToday()), []);

  const minCheckOutYmd = useMemo(() => {
    if (checkInValue) {
      return addDaysYmd(checkInValue, 1);
    }
    return addDaysYmd(todayYmd, 1);
  }, [checkInValue, todayYmd]);

  useEffect(() => {
    if (checkInValue) {
      void trigger("checkOut");
    }
  }, [checkInValue, trigger]);

  const errorKeys = useMemo(() => Object.keys(errors).sort().join(","), [errors]);

  useEffect(() => {
    if (errorKeys.length === 0) return undefined;
    const t = window.setTimeout(() => {
      clearErrors();
    }, 5000);
    return () => clearTimeout(t);
  }, [errorKeys, clearErrors, submitCount]);

  const shouldShowError = useCallback(
    (name) =>
      Boolean(errors[name]) &&
      (Boolean(touchedFields[name]) || isSubmitted || submitCount > 0),
    [errors, touchedFields, isSubmitted, submitCount],
  );

  const onValidSubmit = () => {
    navigate("/search");
  };

  const onInvalidSubmit = useCallback(async () => {
    await trigger(
      ["destination", "checkIn", "checkOut", "guests"],
      { shouldFocus: true },
    );
  }, [trigger]);

  const destReg = register("destination", {
    required: "Indica un destino.",
    validate: (v) => (v.trim().length > 0 ? true : "Indica un destino."),
  });

  const checkInReg = register("checkIn", {
    required: "Selecciona la fecha de entrada.",
    validate: (val) => {
      const d = parseLocalDate(val);
      if (!d) return "Fecha no válida.";
      const today = startOfToday();
      if (d.getTime() < today.getTime()) {
        return "La fecha debe ser hoy o posterior.";
      }
      return true;
    },
  });

  const checkOutReg = register("checkOut", {
    required: "Selecciona la fecha de salida.",
    validate: (val, formValues) => {
      if (!val) return true;
      const out = parseLocalDate(val);
      if (!out) return "Fecha no válida.";
      if (!formValues.checkIn) return true;
      const inn = parseLocalDate(formValues.checkIn);
      if (!inn) return true;
      if (out.getTime() <= inn.getTime()) {
        return "La fecha de salida debe ser posterior a la de entrada.";
      }
      return true;
    },
  });

  const guestsReg = register("guests", {
    required: "Selecciona el número de huéspedes.",
  });

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__content">
        <div className="home-hero__intro">
          <h1 id="home-hero-title" className="home-hero__title">
            Encuentra tu estadía perfecta
          </h1>
          <p className="home-hero__subtitle">
            Descubre hoteles, villas y alojamientos entre más de 50.000 anuncios en todo el mundo
          </p>
        </div>

        <form
          className="home-hero__form"
          onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
          role="search"
          noValidate
        >
          <div className="home-hero__search-card">
            <div className="home-hero__search-row">
              <div className="home-hero__field home-hero__field--destination">
                <label htmlFor="hero-destination" className="home-hero__field-label">
                  Destino
                </label>
                <div className="home-hero__field-wrap">
                  <div className="home-hero__field-control">
                    <IconMapPin className="home-hero__field-icon" aria-hidden="true" />
                    <input
                      id="hero-destination"
                      type="text"
                      autoComplete="off"
                      placeholder="¿A dónde vas?"
                      className={
                        shouldShowError("destination")
                          ? "home-hero__field-input home-hero__field-input--error"
                          : "home-hero__field-input"
                      }
                      aria-invalid={shouldShowError("destination")}
                      aria-describedby={
                        shouldShowError("destination") ? "hero-destination-error" : undefined
                      }
                      {...withClearError(destReg, clearErrors, "destination")}
                    />
                  </div>
                  {shouldShowError("destination") && (
                    <p
                      id="hero-destination-error"
                      className="home-hero__field-error"
                      role="alert"
                    >
                      {errors.destination?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="home-hero__field home-hero__field--datecol">
                <label htmlFor="hero-checkin" className="home-hero__field-label">
                  Fecha de entrada
                </label>
                <div className="home-hero__field-wrap">
                  <div className="home-hero__field-control">
                    <IconCalendar className="home-hero__field-icon" aria-hidden="true" />
                    <input
                      id="hero-checkin"
                      type="date"
                      min={todayYmd}
                      className={
                        shouldShowError("checkIn")
                          ? "home-hero__field-input home-hero__field-input--date home-hero__field-input--error"
                          : "home-hero__field-input home-hero__field-input--date"
                      }
                      aria-invalid={shouldShowError("checkIn")}
                      aria-describedby={
                        shouldShowError("checkIn") ? "hero-checkin-error" : undefined
                      }
                      {...withClearError(checkInReg, clearErrors, ["checkIn", "checkOut"])}
                    />
                  </div>
                  {shouldShowError("checkIn") && (
                    <p id="hero-checkin-error" className="home-hero__field-error" role="alert">
                      {errors.checkIn?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="home-hero__field home-hero__field--datecol">
                <label htmlFor="hero-checkout" className="home-hero__field-label">
                  Fecha de salida
                </label>
                <div className="home-hero__field-wrap">
                  <div className="home-hero__field-control">
                    <IconCalendar className="home-hero__field-icon" aria-hidden="true" />
                    <input
                      id="hero-checkout"
                      type="date"
                      min={minCheckOutYmd || undefined}
                      className={
                        shouldShowError("checkOut")
                          ? "home-hero__field-input home-hero__field-input--date home-hero__field-input--error"
                          : "home-hero__field-input home-hero__field-input--date"
                      }
                      aria-invalid={shouldShowError("checkOut")}
                      aria-describedby={
                        shouldShowError("checkOut") ? "hero-checkout-error" : undefined
                      }
                      {...withClearError(checkOutReg, clearErrors, "checkOut")}
                    />
                  </div>
                  {shouldShowError("checkOut") && (
                    <p id="hero-checkout-error" className="home-hero__field-error" role="alert">
                      {errors.checkOut?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="home-hero__field home-hero__field--guests">
                <label htmlFor="hero-guests" className="home-hero__field-label">
                  Huéspedes
                </label>
                <div className="home-hero__field-wrap">
                  <div className="home-hero__field-control">
                    <IconUsers className="home-hero__field-icon" aria-hidden="true" />
                    <select
                      id="hero-guests"
                      className={
                        shouldShowError("guests")
                          ? "home-hero__field-select home-hero__field-select--error"
                          : "home-hero__field-select"
                      }
                      aria-invalid={shouldShowError("guests")}
                      aria-describedby={
                        shouldShowError("guests") ? "hero-guests-error" : undefined
                      }
                      {...withClearError(guestsReg, clearErrors, "guests")}
                    >
                      {guestOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {shouldShowError("guests") && (
                    <p id="hero-guests-error" className="home-hero__field-error" role="alert">
                      {errors.guests?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="home-hero__search-action">
                <span
                  className="home-hero__field-label home-hero__field-label--spacer"
                  aria-hidden="true"
                >
                  Buscar
                </span>
                <button type="submit" className="home-hero__search-btn" aria-label="Buscar">
                  <IconSearch />
                </button>
              </div>
            </div>
          </div>

          <p className="home-hero__trust">
            <span className="home-hero__trust-item">✓ Más de 50.000 propiedades</span>
            <span className="home-hero__trust-sep" aria-hidden="true">
              ·
            </span>
            <span className="home-hero__trust-item">✓ Mejor precio garantizado</span>
            <span className="home-hero__trust-sep" aria-hidden="true">
              ·
            </span>
            <span className="home-hero__trust-item">✓ Cancelación gratuita</span>
            <span className="home-hero__trust-sep" aria-hidden="true">
              ·
            </span>
            <span className="home-hero__trust-item">✓ Atención 24/7</span>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Hero;
