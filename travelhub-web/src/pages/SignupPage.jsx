import { useState } from "react";
import { Link } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import "./AuthPage.css";

function isValidEmail(email) {
  const t = email.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function isSignupFormValid({ nombre, apellidos, email, password, confirm }) {
  return (
    Boolean(nombre.trim() && apellidos.trim()) &&
    isValidEmail(email) &&
    password.length >= 8 &&
    password === confirm
  );
}

function SignupPage() {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isSignupFormValid({ nombre, apellidos, email, password, confirm })) {
      if (!nombre.trim() || !apellidos.trim()) {
        setError("Nombre y apellidos son obligatorios.");
      } else if (!isValidEmail(email)) {
        setError("Introduce un correo electrónico válido.");
      } else if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
      } else if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
      }
      return;
    }

    // Solo con formulario válido (comprobado arriba): aquí irá el API de registro.
    // TODO(backend): llamar al API de registro
  }

  return (
    <AuthSplitLayout>
      <div className="auth-card">
        <h1 className="auth-card__title auth-card__title--center">
          Crea tu cuenta ✨
        </h1>
        <p className="auth-card__subtitle">
          Únete a miles de viajeros: crear una cuenta es gratis.
        </p>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-card__row">
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="signup-nombre">
                Nombre
              </label>
              <input
                id="signup-nombre"
                name="nombre"
                type="text"
                autoComplete="given-name"
                className="auth-card__input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="signup-apellidos">
                Apellidos
              </label>
              <input
                id="signup-apellidos"
                name="apellidos"
                type="text"
                autoComplete="family-name"
                className="auth-card__input"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
              />
            </div>
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-email">
              Correo electrónico
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              className="auth-card__input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-password">
              Crea una contraseña
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="auth-card__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-confirm">
              Confirmar contraseña
            </label>
            <input
              id="signup-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              className="auth-card__input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error ? <p className="auth-card__error">{error}</p> : null}
          <button type="submit" className="auth-card__submit">
            Comenzar — es gratis 🚀
          </button>
          <p className="auth-card__note">No se requiere tarjeta de crédito.</p>
        </form>

        <p className="auth-card__footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
        <p className="auth-card__legal">
          Al registrarte, aceptas los{" "}
          <Link to="/">Términos de uso</Link> y la{" "}
          <Link to="/">Política de privacidad</Link>.
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default SignupPage;
