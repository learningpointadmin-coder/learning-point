import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAttempt, getTestQuestionsFull, getTestRank } from "@/lib/turso";
import { getTestBySlug } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ============================================================================
   TEST RESULT PAGE — /test/[slug]/result?attempt=<id>
   Reads the persisted attempt, shows score + per-question solutions.
   ============================================================================ */

export const metadata: Metadata = { title: "Result — Learning Point" };

function fmtTime(sec: number | null) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { slug } = await params;
  const { attempt: attemptId } = await searchParams;

  const test = await getTestBySlug(slug);
  if (!test) notFound();

  if (!attemptId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-content-secondary mb-3">No attempt specified.</p>
          <Link href={`/test/${slug}`} className="text-brand-400 font-semibold">
            ← Back to test
          </Link>
        </div>
      </main>
    );
  }

  const attempt = await getAttempt(attemptId);
  const full = attempt ? await getTestQuestionsFull(attempt.testId) : [];
  if (!attempt || full.length === 0) notFound();
  const rank = await getTestRank(attempt.testId, attempt.score);

  const accuracy = Math.round(attempt.accuracy);

  return (
    <main className="min-h-screen">
      <section className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* ===== SCORE HERO ===== */}
        <div className="bg-surface-1 border border-border rounded-2xl p-7 text-center mb-6">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2">
            Test Complete
          </div>
          <h1 className="text-2xl font-extrabold mb-1">{test.name}</h1>
          <div className="text-5xl font-black text-gradient my-4">
            {Number(attempt.score).toFixed(attempt.score % 1 ? 2 : 0)}{" "}
            <span className="text-2xl text-content-muted">/ {full.length}</span>
          </div>
          <p className="text-content-secondary">
            {rank.total > 1 ? (
              <>🏆 You ranked <span className="font-bold text-brand-300">#{rank.rank}</span> out of {rank.total} attempts</>
            ) : (
              <>🎯 First to attempt this test — set the benchmark!</>
            )}
          </p>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-center">
            <div className="font-extrabold text-xl text-brand-300">{attempt.correctCount}</div>
            <div className="text-xs text-content-muted">Correct</div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-center">
            <div className="font-extrabold text-xl text-error">{attempt.incorrectCount}</div>
            <div className="text-xs text-content-muted">Incorrect</div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-center">
            <div className="font-extrabold text-xl text-content-secondary">{attempt.unattemptedCount}</div>
            <div className="text-xs text-content-muted">Skipped</div>
          </div>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-center">
            <div className="font-extrabold text-xl">{accuracy}%</div>
            <div className="text-xs text-content-muted">Accuracy</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link href={`/test/${slug}/leaderboard`} className="flex-1 min-w-[140px]">
            <Button variant="cta" size="lg" fullWidth>🏆 Leaderboard</Button>
          </Link>
          <Link href={`/test/${slug}`} className="flex-1 min-w-[140px]">
            <Button variant="secondary" size="lg" fullWidth>🔁 Retake</Button>
          </Link>
          <Link href="/exams" className="flex-1 min-w-[140px]">
            <Button variant="primary" size="lg" fullWidth>More Tests →</Button>
          </Link>
        </div>

        {/* ===== DETAILED SOLUTIONS ===== */}
        <h2 className="text-xl font-extrabold mb-4">📖 Solutions &amp; Explanations</h2>
        <div className="space-y-4">
          {full.map((q, i) => {
            const userSel = attempt.responses[q.id] ?? null;
            const status: "correct" | "incorrect" | "skipped" = !userSel
              ? "skipped"
              : userSel === q.correct_option_id
              ? "correct"
              : "incorrect";
            const statusCfg = {
              correct: { badge: "brand" as const, label: "✓ Correct", color: "text-brand-300" },
              incorrect: { badge: "neutral" as const, label: "✗ Incorrect", color: "text-error" },
              skipped: { badge: "neutral" as const, label: "— Skipped", color: "text-content-muted" },
            }[status];

            return (
              <div key={q.id} className="bg-surface-1 border border-border-subtle rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    {q.subject && (
                      <span className="text-xs text-content-muted">{q.subject}</span>
                    )}
                  </div>
                  <Badge variant={statusCfg.badge} size="sm">
                    <span className={statusCfg.color}>{statusCfg.label}</span>
                  </Badge>
                </div>

                <p className="font-semibold mb-3 whitespace-pre-wrap">{q.text}</p>

                <div className="space-y-2 mb-3">
                  {q.options.map((o, oi) => {
                    const isCorrect = o.is_correct === 1;
                    const isUserPick = userSel === o.id;
                    let cls = "border-border-subtle bg-surface-2";
                    if (isCorrect) cls = "border-brand-500/60 bg-brand-500/10";
                    else if (isUserPick && status === "incorrect")
                      cls = "border-error/60 bg-error/10";
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${cls}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{o.text}</span>
                        {isCorrect && <span className="text-xs font-bold text-brand-300">Correct</span>}
                        {isUserPick && !isCorrect && (
                          <span className="text-xs font-bold text-error">Your answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="bg-brand-500/5 border border-brand-600/40 rounded-lg px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-300 mb-1">
                      💡 Explanation
                    </div>
                    <p className="text-sm text-content-secondary whitespace-pre-wrap">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
