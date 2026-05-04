import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { getPostAuthDestination, persistSessionFromLogin } from "../auth/sessionAuth";
import { PATH_TRAVELERS_HOME } from "../constants/routes";
import { loginUser } from "../services/api";
import { formatApiUserError } from "../utils/formatApiUserError";
import "./AuthPage.css";

function isValidEmail(email) {
  const t = email.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function IconEye({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError(t("auth.errors.emailInvalid"));
      return;
    }
    if (!password) {
      setError(t("auth.errors.passwordMissing"));
      return;
    }

    const emailNorm = email.trim().toLowerCase();
    setLoading(true);
    try {
      const result = await loginUser({ email: emailNorm, password });
      persistSessionFromLogin({
        email: result.email || emailNorm,
        accessToken: result.access_token,
        userType: result.user_type,
        firstName: result.first_name,
        lastName: result.last_name,
        remember,
        hotelCurrencyCode: result.currency_code,
      });
      navigate(getPostAuthDestination(result.user_type, from), { replace: true });
    } catch (err) {
      setError(formatApiUserError(err, "auth.errors.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="auth-card">
        <h1 className="auth-card__title auth-card__title--center">
          {t("auth.loginWelcome")}
        </h1>
        <p className="auth-card__subtitle auth-card__subtitle--center">
          {t("auth.loginSubtitle")}
        </p>

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="login-email">
              {t("auth.email")}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className="auth-card__input"
              placeholder="juan@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="login-password">
              {t("auth.password")}
            </label>
            <div className="auth-card__input-wrap">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="auth-card__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="auth-card__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                disabled={loading}
              >
                <IconEye open={showPassword} />
              </button>
            </div>
          </div>

          <div className="auth-card__row-extras">
            <label className="auth-card__remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              {t("auth.remember")}
            </label>
            <Link className="auth-card__link-muted" to={PATH_TRAVELERS_HOME}>
              {t("auth.forgotPassword")}
            </Link>
          </div>

          {error ? <p className="auth-card__error">{error}</p> : null}
          <button type="submit" className="auth-card__submit" disabled={loading}>
            {t("auth.submitLogin")}
          </button>
        </form>

        <p className="auth-card__footer">
          {t("auth.noAccount")}{" "}
          <Link to="/signup" state={from ? { from } : undefined}>
            {t("auth.createFree")}
          </Link>
        </p>
        <p className="auth-card__legal">
          {t("auth.legalContinue")}{" "}
          <Link to={PATH_TRAVELERS_HOME}>{t("auth.terms")}</Link> {t("auth.privacyJoin")}{" "}
          <Link to={PATH_TRAVELERS_HOME}>{t("auth.privacyPolicy")}</Link>{" "}
          {t("auth.companySuffix")}
        </p>
      </div>
    </AuthSplitLayout>
  );
}

export default LoginPage;
