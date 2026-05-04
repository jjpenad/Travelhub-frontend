/**
 * Versión de la aplicación (semver).
 * Única fuente: `package.json` → inyectada en tiempo de compilación vía `vite.config.js` (`define`).
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

/** Texto listo para UI: marca + versión. */
export function getAppVersionLabel() {
  return `TravelHub v${APP_VERSION}`;
}
