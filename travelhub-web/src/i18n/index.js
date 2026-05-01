import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import translationEN from "../locales/en/translation.json";
import translationES from "../locales/es/translation.json";

const STORAGE_KEY = "travelhub-lang";

function syncHtmlLang(language) {
  if (typeof document === "undefined") return;
  const short = language && String(language).toLowerCase().startsWith("en") ? "en" : "es";
  document.documentElement.lang = short;
}

i18n.on("initialized", () => syncHtmlLang(i18n.language));
i18n.on("languageChanged", (lng) => {
  syncHtmlLang(lng);
});

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        es: { translation: translationES },
        en: { translation: translationEN },
      },
      lng: undefined,
      fallbackLng: "es",
      supportedLngs: ["es", "en"],
      load: "languageOnly",
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
        lookupLocalStorage: STORAGE_KEY,
      },
    })
    .then(() => syncHtmlLang(i18n.language));
}

export default i18n;
