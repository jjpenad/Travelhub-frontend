import i18n from "../i18n";
import { localeTagForI18n } from "./locale";

/** Locale para `Intl` alineado con el idioma activo de la app (`es` / `en`). */
export function currentLocaleTag() {
  return localeTagForI18n(i18n.resolvedLanguage || i18n.language || "es");
}
