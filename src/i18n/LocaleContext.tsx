import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { en } from "./locales/en";
import { fr } from "./locales/fr";

export type Locale = "en" | "fr";

const dictionaries: Record<Locale, typeof en> = { en, fr };

// Cookie, not localStorage — same persistence mechanism the sidebar's own
// collapsed-state already uses in this app (see ui/sidebar.tsx), kept
// consistent rather than introducing a second pattern for the same kind
// of problem.
const LOCALE_COOKIE_NAME = "locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readStoredLocale(): Locale | null {
  const match = document.cookie.match(/(?:^|; )locale=(en|fr)/);
  const value = match?.[1];
  return value === "en" || value === "fr" ? value : null;
}

function detectBrowserLocale(): Locale {
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** The current locale's whole string dictionary — accessed as
   * `t.auth.login.title` rather than a `t("auth.login.title")` string-key
   * function, so a typo or a missing translation is a TypeScript error at
   * compile time instead of a silent runtime fallback. Only worth
   * reconsidering if this ever needs runtime interpolation/pluralization
   * beyond simple string swaps. */
  t: typeof en;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Not read from a cookie during SSR (same tradeoff the sidebar's cookie
 * already accepts in this app) — the server-rendered HTML is always
 * English, corrected to the stored/detected locale in a layout effect
 * before the browser paints that first frame. In practice this means a
 * first-ever visit briefly renders English before browser-language
 * detection kicks in, and every visit after that (once the cookie is
 * set) renders correctly with no visible flash, since the correction
 * happens before paint, not after it. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useLayoutEffect(() => {
    setLocaleState(readStoredLocale() ?? detectBrowserLocale());
  }, []);

  // The <html lang> attribute isn't just metadata — screen readers use it
  // to pick which pronunciation rules to read the page with, so it needs
  // to track the actual displayed language, not stay hardcoded to
  // whatever RootShell's static SSR markup set it to.
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within a LocaleProvider");
  return ctx;
}
