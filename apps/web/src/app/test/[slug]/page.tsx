import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTestBySlug, type Test } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ============================================================================
   TEST LAUNCH PAGE — /test/[slug]
   Shows test overview + instructions, links to the player.
   ============================================================================ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) return { title: "Test not found — Learning Point" };
  return { title: `${test.name} — Learning Point` };
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-surface-1 border border-border-subtle rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-extrabold text-lg">{value}</div>
      <div className="text-xs text-content-muted">{label}</div>
    </div>
  );
}

const INSTRUCTIONS = [
  "The test contains multiple-choice questions with one correct answer each.",
  "Each correct answer awards +1 mark.",
  "There is a timer — the test auto-submits when time runs out.",
  "You can navigate between questions using the question palette.",
  "Mark questions for review and revisit them before submitting.",
  "Once submitted, you will see your score and detailed solutions.",
];

export default async function TestLaunchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test: Test | null = await getTestBySlug(slug);

  if (!test || !test.is_published) notFound();

  const accent = "#10b981";
  const duration = `${test.duration_minutes} min`;

  return (
    <main className="min-h-screen">
      <section className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content-secondary transition-colors mb-6"
        >
          ← All exams
        </Link>

        {/* Hero card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-7 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="brand" size="sm">● Live</Badge>
            <Badge variant="neutral" size="sm">{test.test_type.replace("_", " ")}</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{test.name}</h1>
          {test.description && (
            <p className="text-content-secondary">{test.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat icon="📝" value={String(test.total_questions)} label="Questions" />
          <Stat icon="⏱" value={duration} label="Duration" />
          <Stat icon="🎯" value={String(test.total_marks)} label="Total Marks" />
          <Stat
            icon={Number(test.negative_mark_per_wrong) > 0 ? "➖" : "✅"}
            value={Number(test.negative_mark_per_wrong) > 0 ? `-${test.negative_mark_per_wrong}` : "None"}
            label="Neg. Marking"
          />
        </div>

        {/* Instructions */}
        <div className="bg-surface-1 border border-border-subtle rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-3">📋 Instructions</h2>
          <ul className="space-y-2.5 text-sm text-content-secondary">
            {INSTRUCTIONS.map((ins) => (
              <li key={ins} className="flex gap-2.5">
                <span className="text-brand-300 shrink-0">•</span>
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/test/${test.slug}/play`} className="flex-1">
            <Button variant="primary" size="lg" fullWidth>
              Start Test →
            </Button>
          </Link>
          <Link href={`/test/${test.slug}/leaderboard`} className="flex-1">
            <Button variant="cta" size="lg" fullWidth>
              🏆 Leaderboard
            </Button>
          </Link>
          <Link href="/exams" className="flex-1">
            <Button variant="secondary" size="lg" fullWidth>
              Back
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
