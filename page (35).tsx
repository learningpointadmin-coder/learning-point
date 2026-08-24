import Link from "next/link";
import type { Metadata } from "next";
import {
  getPublishedExams,
  getPublishedTestsForExam,
} from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Courses & Bundles — Learning Point",
  description: "Complete mock test bundles for UPSSSC, UP Police, IBPS, SSC and more.",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const exams = await getPublishedExams();
  const enriched = await Promise.all(
    exams.map(async (e) => {
      const tests = await getPublishedTestsForExam(e.id);
      const free = tests.filter((t) => t.test_type === "free").length;
      const paid = tests.filter((t) => t.test_type !== "free").length;
      return { ...e, total: tests.length, free, paid };
    })
  );

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-border-subtle">
        <div className="max-w-container mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-3">
            Courses & Bundles
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
            Pick your exam. Unlock everything.
          </h1>
          <p className="text-content-secondary max-w-2xl mx-auto">
            Full-length mock tests, free demos, real-time ranks and detailed solutions —
            one bundle per exam, lifetime access.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-container mx-auto px-4 md:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enriched.map((e) => {
            const accent = e.accent_color || "#10b981";
            return (
              <div
                key={e.id}
                className="bg-surface-1 border border-border-subtle rounded-2xl p-6 flex flex-col hover:border-border transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${accent}26`, color: accent }}
                >
                  {e.icon || "📘"}
                </div>

                <h2 className="text-lg font-extrabold mb-1">{e.name}</h2>
                {e.description && (
                  <p className="text-sm text-content-secondary mb-4 line-clamp-2">
                    {e.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-surface-2 border border-border-subtle rounded-full px-2.5 py-1 text-content-secondary">
                    📝 {e.total} tests
                  </span>
                  {e.free > 0 && (
                    <span className="text-xs bg-brand-500/10 border border-brand-600/40 rounded-full px-2.5 py-1 text-brand-300">
                      {e.free} free demo
                    </span>
                  )}
                  {e.paid > 0 && (
                    <span className="text-xs bg-amber-500/10 border border-amber-500/40 rounded-full px-2.5 py-1 text-amber-300">
                      {e.paid} full mocks
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-extrabold text-brand-300">₹499</span>
                  <span className="text-sm text-content-muted line-through">₹999</span>
                  <span className="text-xs text-content-muted">/ lifetime</span>
                </div>

                <ul className="text-sm text-content-secondary space-y-1.5 mb-5">
                  <li>✓ Full-length & sectional mocks</li>
                  <li>✓ Real-time leaderboard ranks</li>
                  <li>✓ Detailed solutions & explanations</li>
                  <li>✓ 5 reattempts per test</li>
                </ul>

                <Link
                  href={`/exams/${e.slug}`}
                  className="mt-auto inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-10 text-sm"
                >
                  Explore Course →
                </Link>
              </div>
            );
          })}
        </div>

        {enriched.length === 0 && (
          <div className="text-center py-16 text-content-secondary">
            Courses are being added. Check back soon!
          </div>
        )}
      </section>
    </main>
  );
}
