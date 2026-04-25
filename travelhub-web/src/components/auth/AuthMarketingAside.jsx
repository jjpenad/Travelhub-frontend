import { Link } from "react-router-dom";
import { PATH_TRAVELERS_HOME } from "../../constants/routes";
import logoTravelhub from "../../assets/logo_travelhub.png";

const features = [
  {
    title: "50.000+ alojamientos",
    text: "Destinos en todo el mundo",
  },
  {
    title: "Mejor precio",
    text: "Sin cargos ocultos",
  },
  {
    title: "Cancelación flexible",
    text: "En la mayoría de estancias",
  },
  {
    title: "Soporte 24/7",
    text: "Siempre a tu lado",
  },
];

function AuthMarketingAside() {
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
          Explora el mundo, una estancia a la vez.
        </h1>
        <p className="auth-marketing__lead">
          Miles de propiedades, precios transparentes y experiencias que recordarás.
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
          <p className="auth-marketing__stars" aria-label="5 de 5 estrellas">
            ★★★★★
          </p>
          <p className="auth-marketing__quote-text">
            «La mejor app de viajes que he usado.»
          </p>
          <footer className="auth-marketing__quote-by">
            — Ana M., viajera verificada · 47 viajes
          </footer>
        </blockquote>
      </div>
    </aside>
  );
}

export default AuthMarketingAside;
