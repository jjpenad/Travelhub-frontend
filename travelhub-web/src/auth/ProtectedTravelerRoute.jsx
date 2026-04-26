import { Navigate, useLocation } from "react-router-dom";
import { canAccessTravelerAccountRoutes } from "./sessionAuth";
import { PATH_LOGIN } from "../constants/routes";

/**
 * Restringe rutas de viajeros autenticados (token + rol traveler).
 * Invitados son redirigidos a login conservando la URL de retorno.
 */
export default function ProtectedTravelerRoute({ children }) {
  const location = useLocation();
  if (!canAccessTravelerAccountRoutes()) {
    return (
      <Navigate
        to={PATH_LOGIN}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return children;
}
