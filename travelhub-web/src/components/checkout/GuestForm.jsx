import { useEffect, useMemo, useState } from "react";
import { getCurrentUserClaims } from "../../auth/sessionAuth";
import "./GuestForm.css";

const MAX_PETICIONES = 2000;

function isValidEmail(email) {
  const t = email.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function isFormValid(form) {
  const { nombre, apellidos, email, telefono, peticionesEspeciales } = form;
  if (
    !nombre.trim() ||
    !apellidos.trim() ||
    !telefono.trim() ||
    !isValidEmail(email)
  ) {
    return false;
  }
  if (peticionesEspeciales.length > MAX_PETICIONES) return false;
  return true;
}

/**
 * Si el usuario está autenticado, leemos sus datos directamente del JWT
 * (mismo contrato que `BookingViewModel.init` en Android: pre-rellena el
 * form con `firstName / lastName / email` del session). Devolvemos `null`
 * si el navegador no tiene token activo, para que el form arranque vacío
 * en flujos anónimos.
 *
 * `prefillOverride` permite a tests/Storybook inyectar datos sin tocar
 * `localStorage` y mantenerlo determinista.
 */
function readPrefillFromAuth(prefillOverride) {
  if (prefillOverride && typeof prefillOverride === "object") {
    return {
      nombre: prefillOverride.firstName || "",
      apellidos: prefillOverride.lastName || "",
      email: prefillOverride.email || "",
    };
  }
  const claims = getCurrentUserClaims();
  if (!claims) return null;
  if (!claims.firstName && !claims.lastName && !claims.email) return null;
  return {
    nombre: claims.firstName || "",
    apellidos: claims.lastName || "",
    email: claims.email || "",
  };
}

function GuestForm({
  onGuestEmailChange,
  onValidityChange,
  onGuestNameChange,
  /** Override solo para tests; en producción los datos se leen del JWT. */
  prefillOverride,
}) {
  // El pre-fill se calcula UNA vez al montar. Si después cambia el token
  // (login/logout), la página padre se re-monta o navega, así que no
  // intentamos hidratar el form a mitad de sesión.
  const initial = useMemo(
    () => readPrefillFromAuth(prefillOverride),
    [prefillOverride],
  );

  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    apellidos: initial?.apellidos ?? "",
    email: initial?.email ?? "",
    telefono: "",
    peticionesEspeciales: "",
  });

  // Los campos pre-rellenados desde el JWT son los datos canónicos de la
  // cuenta — quedan en read-only (mismo trato que la pantalla de booking
  // en Android, que renderiza esos inputs deshabilitados). Teléfono y
  // peticiones especiales siguen siendo editables porque son contextuales
  // a la reserva, no al usuario.
  const lockNombre = Boolean(initial?.nombre);
  const lockApellidos = Boolean(initial?.apellidos);
  const lockEmail = Boolean(initial?.email);

  const [touched, setTouched] = useState({
    nombre: false,
    apellidos: false,
    email: false,
    telefono: false,
  });

  const valid = useMemo(() => isFormValid(form), [form]);

  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  useEffect(() => {
    onGuestEmailChange?.(form.email);
  }, [form.email, onGuestEmailChange]);

  useEffect(() => {
    onGuestNameChange?.({ firstName: form.nombre, lastName: form.apellidos });
  }, [form.nombre, form.apellidos, onGuestNameChange]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const showNombreError = touched.nombre && !form.nombre.trim();
  const showApellidosError = touched.apellidos && !form.apellidos.trim();
  const showEmailError =
    touched.email && (!form.email.trim() || !isValidEmail(form.email));
  const showTelefonoError = touched.telefono && !form.telefono.trim();

  return (
    <section className="guest-form" aria-labelledby="guest-form-title">
      <h2 id="guest-form-title" className="guest-form__title">
        Datos del huésped
      </h2>
      <div className="guest-form__grid">
        <div className="guest-form__field">
          <label className="guest-form__label" htmlFor="guest-form-first-name">
            Nombre
          </label>
          <input
            id="guest-form-first-name"
            className={`guest-form__input${showNombreError ? " guest-form__input--error" : ""}${lockNombre ? " guest-form__input--locked" : ""}`}
            type="text"
            name="firstName"
            required
            autoComplete="given-name"
            value={form.nombre}
            onChange={(e) => updateField("nombre", e.target.value)}
            onBlur={() => markTouched("nombre")}
            aria-invalid={showNombreError}
            aria-describedby={
              showNombreError ? "guest-form-error-nombre" : undefined
            }
            readOnly={lockNombre}
            aria-readonly={lockNombre || undefined}
          />
          {showNombreError ? (
            <p id="guest-form-error-nombre" className="guest-form__error" role="alert">
              Indica tu nombre.
            </p>
          ) : null}
        </div>
        <div className="guest-form__field">
          <label className="guest-form__label" htmlFor="guest-form-last-name">
            Apellidos
          </label>
          <input
            id="guest-form-last-name"
            className={`guest-form__input${showApellidosError ? " guest-form__input--error" : ""}${lockApellidos ? " guest-form__input--locked" : ""}`}
            type="text"
            name="lastName"
            required
            autoComplete="family-name"
            value={form.apellidos}
            onChange={(e) => updateField("apellidos", e.target.value)}
            onBlur={() => markTouched("apellidos")}
            aria-invalid={showApellidosError}
            aria-describedby={
              showApellidosError ? "guest-form-error-apellidos" : undefined
            }
            readOnly={lockApellidos}
            aria-readonly={lockApellidos || undefined}
          />
          {showApellidosError ? (
            <p
              id="guest-form-error-apellidos"
              className="guest-form__error"
              role="alert"
            >
              Indica tus apellidos.
            </p>
          ) : null}
        </div>
        <div className="guest-form__field guest-form__field--full">
          <label className="guest-form__label" htmlFor="guest-form-email">
            Correo electrónico
          </label>
          <input
            id="guest-form-email"
            className={`guest-form__input${showEmailError ? " guest-form__input--error" : ""}${lockEmail ? " guest-form__input--locked" : ""}`}
            type="email"
            name="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => markTouched("email")}
            aria-invalid={showEmailError}
            aria-describedby={
              showEmailError ? "guest-form-error-email" : undefined
            }
            readOnly={lockEmail}
            aria-readonly={lockEmail || undefined}
          />
          {showEmailError ? (
            <p id="guest-form-error-email" className="guest-form__error" role="alert">
              {form.email.trim() === ""
                ? "Indica un correo electrónico."
                : "Introduce un correo electrónico válido."}
            </p>
          ) : null}
        </div>
        <div className="guest-form__field guest-form__field--full">
          <label className="guest-form__label" htmlFor="guest-form-phone">
            Teléfono
          </label>
          <input
            id="guest-form-phone"
            className={`guest-form__input${showTelefonoError ? " guest-form__input--error" : ""}`}
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            value={form.telefono}
            onChange={(e) => updateField("telefono", e.target.value)}
            onBlur={() => markTouched("telefono")}
            aria-invalid={showTelefonoError}
            aria-describedby={
              showTelefonoError ? "guest-form-error-telefono" : undefined
            }
          />
          {showTelefonoError ? (
            <p
              id="guest-form-error-telefono"
              className="guest-form__error"
              role="alert"
            >
              Indica un número de teléfono.
            </p>
          ) : null}
        </div>
        <div className="guest-form__field guest-form__field--full">
          <label
            className="guest-form__label"
            htmlFor="guest-form-special-requests"
          >
            Peticiones especiales
          </label>
          <div className="guest-form__textarea-wrap">
            <textarea
              id="guest-form-special-requests"
              className="guest-form__textarea guest-form__textarea--counter"
              name="specialRequests"
              rows={4}
              placeholder="Alergias, llegada tardía, celebraciones…"
              value={form.peticionesEspeciales}
              maxLength={MAX_PETICIONES}
              aria-describedby="guest-form-peticiones-count"
              onChange={(e) => updateField("peticionesEspeciales", e.target.value)}
            />
            <span
              id="guest-form-peticiones-count"
              className="guest-form__char-count"
              aria-live="polite"
            >
              {form.peticionesEspeciales.length}/{MAX_PETICIONES}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GuestForm;
