"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { DICT, type Lang } from "@/lib/i18n-dict";

/* ============================================================================
   LANGUAGE PROVIDER
   Persists the chosen language (en/hi) in localStorage. useLang() returns the
   current language + a t(key) translator. Wraps the whole app in root layout.
   ============================================================================ */

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "lp_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

  const t = useCallback(
    (key: string) => DICT[lang][key] ?? DICT.en[key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
