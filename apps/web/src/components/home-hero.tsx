"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/language-provider";

/* ============================================================================
   HOME HERO (client) — translated above-the-fold content.
   Extracted from the server home page so it can use useLang().
   ============================================================================ */

export function HomeHero() {
  const { t } = useLang();
  const stats = [
    { n: "500+", l: t("home.statsTests") },
    { n: "50k+", l: t("home.statsQs") },
    { n: "1,000+", l: t("home.statsStudents") },
    { n: "5", l: t("home.statsRanks") },
  ];

  return (
    <section className="max-w-container mx-auto px-4 md:px-6 py-16 md:py-20 text-center animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-600 rounded-full text-xs font-semibold text-brand-300 mb-6">
        <span
          className="w-1.5 h-1.5 rounded-full bg-brand-500"
          style={{ boxShadow: "0 0 10px #10b981" }}
        />
        {t("home.badge")}
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
        {t("home.title")}
      </h1>

      <p className="text-lg text-content-secondary max-w-xl mx-auto mb-8">
        {t("home.sub")}
      </p>

      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/test/upsssc-vdo-free-mock">
          <Button variant="primary" size="lg">{t("home.ctaFree")} →</Button>
        </Link>
        <Link href="/exams">
          <Button variant="cta" size="lg">⚡ {t("home.ctaExplore")}</Button>
        </Link>
      </div>

      <div className="flex gap-8 md:gap-12 justify-center mt-12 flex-wrap">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl md:text-3xl font-extrabold text-brand-300">{s.n}</div>
            <div className="text-xs text-content-muted mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
