import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PATH_TRAVELERS_HOME } from "../../constants/routes";
import logoTravelhub from "../../assets/logo_travelhub.png";

function AuthMarketingAside() {
  const { t } = useTranslation();

  const features = useMemo(
    () => [
      { title: t("authMarketing.f50k"), text: t("authMarketing.t50k") },
      { title: t("authMarketing.fPrice"), text: t("authMarketing.tPrice") },
      { title: t("authMarketing.fCancel"), text: t("authMarketing.tCancel") },
      { title: t("authMarketing.f247"), text: t("authMarketing.t247") },
    ],
    [t],
  );

  return (
    <aside className="auth-marketing" aria-label="TravelHub">
      <div className="auth-marketing__bg" aria-hidden="true" />
      <div className="auth-marketing__inner">
        <Link className="auth-marketing__brand" to={PATH_TRAVELERS_HOME}>
          <span className="auth-marketing__logo-wrap" aria-hidden="true">
            <img
              className="auth-marketing__logo"
              src={logoTravelhub}
              alt=""
              width={72}
              height={72}
            />
          </span>
          <span className="auth-marketing__wordmark">
            Travel
            <span className="auth-marketing__wordmark-accent">Hub</span>
          </span>
        </Link>

        <div className="auth-marketing__visuals" aria-hidden="true">
          <span className="auth-marketing__plane">✈️</span>
          <span className="auth-marketing__wave" />
        </div>

        <h1 className="auth-marketing__headline">
          {t("authMarketing.headline")}
        </h1>
        <p className="auth-marketing__lead">
          {t("authMarketing.lead")}
        </p>

        <ul className="auth-marketing__features">
          {features.map(({ title, text }) => (
            <li key={title} className="auth-marketing__feature">
              <span className="auth-marketing__check" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M6 10l2.5 2.5L14 7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="auth-marketing__feature-text">
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <blockquote className="auth-marketing__quote">
          <p className="auth-marketing__stars" aria-label={t("authMarketing.starsAria")}>
            ★★★★★
          </p>
          <p className="auth-marketing__quote-text">
            {t("authMarketing.quote")}
          </p>
          <footer className="auth-marketing__quote-by">
            {t("authMarketing.quoteBy")}
          </footer>
        </blockquote>
      </div>
    </aside>
  );
}

export default AuthMarketingAside;
