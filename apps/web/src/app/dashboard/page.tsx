"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ============================================================================
   STUDENT DASHBOARD — /dashboard
   Greeting, performance stats, past attempts, quick links.
   Client component (reads the browser auth session, then fetches attempts).
   ============================================================================ */

type Attempt = {
  attemptId: string;
  testId: string;
  testName: string;
  testSlug: string;
  score: number;
  total: number;
  accuracy: number;
  submittedAt: string | null;
};

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-2xl p-5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-content-muted">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useCurrentUser();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  const name = (user?.user_metadata?.full_name as string | undefined)?.trim() || "there";
  const email = user?.email ?? "";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLoaded(true);
      return;
    }
    fetch(`/api/my-attempts?profileId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setAttempts(d.attempts ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user, loading]);

  if (loading || !loaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-content-muted animate-pulse">Loading dashboard…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-extrabold mb-2">Please log in</h1>
          <p className="text-sm text-content-secondary mb-5">
            Log in to track your tests, scores and progress.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg" fullWidth>Go to Login →</Button>
          </Link>
        </div>
      </main>
    );
  }

  const testsTaken = attempts.length;
  const avgAccuracy =
    testsTaken > 0
      ? Math.round(attempts.reduce((s, a) => s + a.accuracy, 0) / testsTaken)
      : 0;
  const bestScore =
    testsTaken > 0 ? Math.max(...attempts.map((a) => (a.score / Math.max(1, a.total)) * 100)) : 0;

  return (
    <main className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2">
            Dashboard
          </div>
          <h1 className="text-3xl font-extrabold">Hi, {name} 👋</h1>
          {email && <p className="text-content-secondary mt-1">{email}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon="📝" value={String(testsTaken)} label="Tests Attempted" />
          <StatCard icon="🎯" value={`${avgAccuracy}%`} label="Avg Accuracy" />
          <StatCard icon="🏆" value={`${Math.round(bestScore)}%`} label="Best Score" />
        </div>

        {/* Attempts */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold">Recent attempts</h2>
          <Link href="/exams">
            <Button variant="cta" size="sm">+ Browse tests</Button>
          </Link>
        </div>

        {attempts.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="font-bold text-lg mb-1">No attempts yet</h3>
            <p className="text-sm text-content-secondary mb-5">
              Take your first mock test to see your scores and solutions here.
            </p>
            <Link href="/exams">
              <Button variant="primary" size="lg">Start a Free Test →</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((a) => {
              const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
              return (
                <Link
                  key={a.attemptId}
                  href={a.testSlug ? `/test/${a.testSlug}/result?attempt=${a.attemptId}` : "#"}
                  className="flex items-center justify-between gap-4 bg-surface-1 border border-border-subtle rounded-2xl p-5 hover:border-border transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold truncate">{a.testName}</div>
                    <div className="text-xs text-content-muted mt-0.5">
                      {a.submittedAt ? new Date(a.submittedAt + "Z").toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-extrabold text-lg">
                        {Number(a.score).toFixed(a.score % 1 ? 1 : 0)}
                        <span className="text-sm text-content-muted">/{a.total}</span>
                      </div>
                      <div className="text-xs text-content-muted">{Math.round(a.accuracy)}% acc</div>
                    </div>
                    <Badge variant={pct >= 60 ? "brand" : "neutral"} size="sm">{pct}%</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
