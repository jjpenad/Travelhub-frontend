import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { getPostAuthDestination, persistSessionFromLogin } from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { loginUser, registerUser } from "../services/api";
import { formatApiUserError } from "../utils/formatApiUserError";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!isSignupFormValid({ nombre, apellidos, email, password, confirm })) {
      if (!nombre.trim() || !apellidos.trim()) {
        setError(t("auth.errors.nameRequired"));
      } else if (!isValidEmail(email)) {
        setError(t("auth.errors.emailInvalid"));
      } else if (password.length < 8) {
        setError(t("auth.errors.passwordRules"));
      } else if (password !== confirm) {
        setError(t("auth.errors.passwordMismatch"));
      }
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email: email.trim(),
        password,
        first_name: nombre.trim(),
        last_name: apellidos.trim(),
      });

      const emailNorm = email.trim().toLowerCase();
      const loginResult = await loginUser({ email: emailNorm, password });
      persistSessionFromLogin({
        email: loginResult.email || emailNorm,
        accessToken: loginResult.access_token,
        userType: loginResult.user_type,
        // Si el login no devolvió first/last (posible en algunos backends),
        // usamos los que el usuario tipeó al registrarse — que son los
        // mismos que el backend acaba de persistir.
        firstName: loginResult.first_name || nombre.trim(),
        lastName: loginResult.last_name || apellidos.trim(),
        remember: true,
      });

      setSuccessMsg(t("auth.errors.successRedirect"));
      await new Promise((r) => setTimeout(r, 500));
      navigate(getPostAuthDestination(loginResult.user_type, from), { replace: true });
    } catch (err) {
      setError(formatApiUserError(err, "auth.errors.signupFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="auth-card">
        <h1 className="auth-card__title auth-card__title--center">
          {t("auth.signupTitle")}
        </h1>
        <p className="auth-card__subtitle">
          {t("auth.signupSubtitle")}
        </p>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-card__row">
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="signup-nombre">
                {t("auth.firstName")}
              </label>
              <input
                id="signup-nombre"
                name="nombre"
                type="text"
                autoComplete="given-name"
                className="auth-card__input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="signup-apellidos">
                {t("auth.lastName")}
              </label>
              <input
                id="signup-apellidos"
                name="apellidos"
                type="text"
                autoComplete="family-name"
                className="auth-card__input"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-email">
              {t("auth.email")}
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
              disabled={loading}
            />
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-password">
              {t("auth.createPassword")}
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="auth-card__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="signup-confirm">
              {t("auth.confirmPassword")}
            </label>
            <input
              id="signup-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              className="auth-card__input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </div>
          {error ? <p className="auth-card__error">{error}</p> : null}
          {successMsg ? <p className="auth-card__success">{successMsg}</p> : null}
          <button type="submit" className="auth-card__submit" disabled={loading}>
            {loading ? t("auth.creating") : t("auth.ctaSignup")}
          </button>
          <p className="auth-card__note">{t("auth.noCard")}</p>
        </form>

        <p className="auth-card__footer">
          {t("auth.haveAccount")} <Link to="/login">{t("nav.login")}</Link>
        </p>
        <p className="auth-card__legal">
          {t("auth.signupLegal")}{" "}
          <Link to={PATH_TRAVELERS_HOME}>{t("auth.terms")}</Link> {t("auth.privacyJoin")}{" "}
          <Link to={PATH_TRAVELERS_HOME}>{t("auth.privacyPolicy")}</Link>.
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default SignupPage;
