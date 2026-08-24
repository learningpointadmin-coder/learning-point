import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLeaderboard } from "@/lib/turso";
import { getTestBySlug, getProfilesByAuthIds } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ============================================================================
   TEST LEADERBOARD — /test/[slug]/leaderboard
   Top scorers for a test (best score per student), names from Supabase.
   ============================================================================ */

export const metadata: Metadata = { title: "Leaderboard — Learning Point" };

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) notFound();

  const entries = await getLeaderboard(test.id, 50);
  const profileMap = await getProfilesByAuthIds(entries.map((e) => e.profileId));

  return (
    <main className="min-h-screen">
      <section className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <Link
          href={`/test/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content-secondary transition-colors mb-6"
        >
          ← Back to test
        </Link>

        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2">
            🏆 Leaderboard
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{test.name}</h1>
          <p className="text-content-secondary mt-1 text-sm">
            Top {entries.length || "—"} aspirant{entries.length === 1 ? "" : "s"} · best score per student
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🏁</div>
            <h2 className="font-bold text-lg mb-1">No attempts yet</h2>
            <p className="text-sm text-content-secondary mb-5">
              Be the first to take this test and claim the #1 spot!
            </p>
            <Link href={`/test/${slug}/play`}>
              <Button variant="primary" size="lg">Take the Test →</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-surface-1 border border-border-subtle rounded-2xl overflow-hidden">
            {/* header row */}
            <div className="grid grid-cols-[48px_1fr_70px_70px_70px] gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-content-muted border-b border-border-subtle">
              <span>Rank</span>
              <span>Aspirant</span>
              <span className="text-right">Score</span>
              <span className="text-right hidden sm:block">Acc</span>
              <span className="text-right">Time</span>
            </div>
            {entries.map((e) => {
              const profile = profileMap.get(e.profileId);
              const name = profile?.full_name || "Anonymous Aspirant";
              return (
                <div
                  key={e.attemptId}
                  className={`grid grid-cols-[48px_1fr_70px_70px_70px] gap-2 px-4 py-3 items-center border-b border-border-subtle last:border-0 ${
                    e.rank <= 3 ? "bg-brand-500/5" : ""
                  }`}
                >
                  <span className="font-bold">
                    {e.rank <= 3 ? (
                      <span className="text-xl">{MEDALS[e.rank - 1]}</span>
                    ) : (
                      <span className="text-content-muted">#{e.rank}</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold truncate block">
                      {name}
                      {e.rank === 1 && <Badge variant="brand" size="sm">★ Topper</Badge>}
                    </span>
                    {profile?.state && (
                      <span className="text-xs text-content-muted">{profile.state}</span>
                    )}
                  </span>
                  <span className="text-right font-extrabold">
                    {Number(e.score).toFixed(e.score % 1 ? 1 : 0)}
                    <span className="text-xs text-content-muted">/{test.total_questions}</span>
                  </span>
                  <span className="text-right text-sm hidden sm:block">
                    {Math.round(e.accuracy)}%
                  </span>
                  <span className="text-right text-sm text-content-secondary">
                    {e.timeTakenSeconds != null
                      ? `${Math.floor(e.timeTakenSeconds / 60)}m ${e.timeTakenSeconds % 60}s`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Link href={`/test/${slug}/play`} className="flex-1">
            <Button variant="primary" size="lg" fullWidth>Attempt Test →</Button>
          </Link>
          <Link href={`/test/${slug}`} className="flex-1">
            <Button variant="secondary" size="lg" fullWidth>Overview</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
