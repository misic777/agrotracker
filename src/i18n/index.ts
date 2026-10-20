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

/** Languages close enough to Serbian that the Serbian UI is the better fit. */
const SERBIAN_LIKE = ["sr", "hr", "bs", "sh", "cnr", "me"];

/**
 * First visit: Serbian for browsers set to Serbian or a close language,
 * English for everyone else (e.g. recruiters abroad).
 */
export function detectLanguage(browserLanguages: readonly string[]): Language {
  const serbian = browserLanguages.some((tag) =>
    SERBIAN_LIKE.includes(tag.toLowerCase().split("-")[0]),
  );
  return serbian || browserLanguages.length === 0 ? "sr" : "en";
}

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
  } catch {
    // localStorage can be unavailable (private mode).
  }
  return detectLanguage(
    typeof navigator === "undefined" ? [] : (navigator.languages ?? []),
  );
}

export function currentLanguage(): Language {
  return (LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as Language)
    : "sr";
}

i18n.use(initReactI18next).init({
  resources: { sr: { translation: sr }, en: { translation: en } },
  lng: initialLanguage(),
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
