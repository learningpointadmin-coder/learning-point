"use client";

import { useLang } from "@/components/language-provider";

/* ============================================================================
   LANGUAGE TOGGLE — switches between English and Hindi, persists choice.
   ============================================================================ */

export function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle language"
      title={lang === "en" ? "हिंदी में देखें" : "View in English"}
      className="inline-flex items-center justify-center gap-1 font-semibold rounded-lg border border-border bg-surface-2 text-content-secondary hover:text-content-primary hover:border-brand-600 h-9 px-2.5 text-xs transition-colors"
    >
      🌐 <span className="uppercase">{lang === "en" ? "EN" : "हि"}</span>
    </button>
  );
}
