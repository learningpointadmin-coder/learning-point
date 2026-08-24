import Link from "next/link";
import type { Metadata } from "next";
import { getPlayableTests } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ============================================================================
   FREE TESTS HUB — /free-tests
   All published, playable tests (with questions) across exams.
   ============================================================================ */

export const metadata: Metadata = {
  title: "Free Tests — Learning Point",
  description: "Take free mock tests across all exams. Instant scores, solutions and ranks.",
};

export default async function FreeTestsPage() {
  const tests = await getPlayableTests();

  return (
    <main className="min-h-screen">
      <section className="max-w-container mx-auto px-4 md:px-6 pt-12 pb-8 text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2.5">
          Free Mock Tests
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Practice for free</h1>
        <p className="text-content-secondary mt-2 max-w-lg mx-auto">
          Take full mock tests with instant scoring, detailed solutions and a live leaderboard — no payment needed.
        </p>
      </section>

      <section className="max-w-container mx-auto px-4 md:px-6 pb-16">
        {tests.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-surface-1 border border-border rounded-2xl p-8">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-sm text-content-muted">Free tests will appear here soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map((t) => (
              <div
                key={t.id}
                className="group bg-surface-1 border border-border-subtle rounded-2xl p-6 flex flex-col transition-all duration-base hover:-translate-y-1 hover:border-border"
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="brand" size="sm">✓ Free</Badge>
                  <Badge variant="neutral" size="sm">
                    {t.total_questions} Qs · {t.duration_minutes} min
                  </Badge>
                </div>
                <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-brand-300 transition-colors">
                  {t.name}
                </h3>
                {t.description && (
                  <p className="text-sm text-content-secondary line-clamp-3 mb-4">
                    {t.description}
                  </p>
                )}
                <div className="mt-auto flex gap-2">
                  <Link href={`/test/${t.slug}`}>
                    <Button variant="primary" size="sm">Start →</Button>
                  </Link>
                  <Link href={`/test/${t.slug}/leaderboard`}>
                    <Button variant="secondary" size="sm">🏆 Ranks</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
