import "./GuestForm.css";

function GuestForm({ email = "", onEmailChange }) {
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
            className="guest-form__input"
            type="text"
            name="firstName"
            autoComplete="given-name"
          />
        </div>
        <div className="guest-form__field">
          <label className="guest-form__label" htmlFor="guest-form-last-name">
            Apellidos
          </label>
          <input
            id="guest-form-last-name"
            className="guest-form__input"
            type="text"
            name="lastName"
            autoComplete="family-name"
          />
        </div>
        <div className="guest-form__field guest-form__field--full">
          <label className="guest-form__label" htmlFor="guest-form-email">
            Correo electrónico
          </label>
          <input
            id="guest-form-email"
            className="guest-form__input"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange?.(e.target.value)}
          />
        </div>
        <div className="guest-form__field guest-form__field--full">
          <label className="guest-form__label" htmlFor="guest-form-phone">
            Teléfono
          </label>
          <input
            id="guest-form-phone"
            className="guest-form__input"
            type="tel"
            name="phone"
            autoComplete="tel"
          />
        </div>
        <div className="guest-form__field guest-form__field--full">
          <label
            className="guest-form__label"
            htmlFor="guest-form-special-requests"
          >
            Peticiones especiales
          </label>
          <textarea
            id="guest-form-special-requests"
            className="guest-form__textarea"
            name="specialRequests"
            rows={4}
            placeholder="Alergias, llegada tardía, celebraciones…"
          />
        </div>
      </div>
    </section>
  );
}

export default GuestForm;
