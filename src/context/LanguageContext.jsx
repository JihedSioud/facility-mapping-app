import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { translations } from "../utils/i18n.js";

const LanguageContext = createContext(null);

const STORAGE_KEY = "app_locale";

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "ar" ? "ar" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const t = (key, fallback = "") => {
    const dict = translations[locale] ?? {};
    return dict[key] ?? fallback ?? key;
  };

  const value = useMemo(
    () => ({
      locale,
      direction: locale === "ar" ? "rtl" : "ltr",
      setLocale,
      t,
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
