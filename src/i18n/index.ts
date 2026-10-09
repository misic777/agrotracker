import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import sr from "./locales/sr.json";

export const LANGUAGES = ["sr", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = "agrotracker.lang";

/** BCP 47 locale used by Intl (dates, numbers, money) for each app language. */
export const INTL_LOCALE: Record<Language, string> = {
  sr: "sr-Latn-RS",
  en: "en-GB",
};

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
  } catch {
    // localStorage can be unavailable (private mode); fall back to Serbian.
  }
  return "sr";
}

export function currentLanguage(): Language {
  return (LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as Language)
    : "sr";
}

i18n.use(initReactI18next).init({
  resources: { sr: { translation: sr }, en: { translation: en } },
  lng: readStoredLanguage(),
  fallbackLng: "sr",
  interpolation: { escapeValue: false },
});

function applyLanguage(lng: string) {
  document.documentElement.lang = lng === "sr" ? "sr-Latn" : lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Ignore: the choice just won't be remembered.
  }
}

applyLanguage(i18n.language);
i18n.on("languageChanged", applyLanguage);

export default i18n;
