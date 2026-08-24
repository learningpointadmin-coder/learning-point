import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PaymentButton } from "@/components/payment-button";
import { ExamTestList } from "@/components/exam-test-list";
import {
  getExamBySlug,
  getPublishedTestsForExam,
  type Exam,
  type Test,
} from "@/lib/supabase-server";

/* ============================================================================
   EXAM DETAIL PAGE — /exams/[slug]
   Server component. Shows exam info + REAL published tests (from Supabase)
   that link into the test engine (/test/[slug]).
   ============================================================================ */

async function getData(slug: string) {
  const exam = await getExamBySlug(slug);
  if (!exam) return { exam: null, tests: [] as Test[] };
  const tests = await getPublishedTestsForExam(exam.id);
  return { exam, tests };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam: Exam | null = await getExamBySlug(slug);
  if (!exam) return { title: "Exam not found — Learning Point" };
  return {
    title: `${exam.name} — Learning Point`,
    description: exam.description ?? `Prepare for ${exam.name} with mock tests and PYQs.`,
  };
}

const HIGHLIGHTS = [
  { icon: "📝", value: "100+", label: "Questions" },
  { icon: "⏱", value: "120 min", label: "Duration" },
  { icon: "🔁", value: "5", label: "Reattempts" },
  { icon: "🌐", value: "Hindi/Eng", label: "Language" },
];

const SUBJECTS = [
  { icon: "🌍", name: "General Knowledge" },
  { icon: "🧩", name: "Reasoning" },
  { icon: "🔢", name: "Quantitative Aptitude" },
  { icon: "📰", name: "Current Affairs" },
  { icon: "💻", name: "Computer Awareness" },
  { icon: "📖", name: "Language (Hindi/English)" },
];

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { exam, tests } = await getData(slug);
  if (!exam) notFound();

  const accent = exam.accent_color || "#10b981";

  return (
    <main className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: accent }}
        />
        <div className="max-w-container mx-auto px-4 md:px-6 py-10 md:py-14 relative">
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content-secondary transition-colors mb-6"
          >
            ← All exams
          </Link>

          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `${accent}26`, color: accent }}
            >
              {exam.icon || "📝"}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{exam.name}</h1>
                <Badge variant="brand" size="sm">● Live</Badge>
              </div>
              {exam.description && (
                <p className="text-content-secondary max-w-2xl">{exam.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HIGHLIGHTS ===== */}
      <section className="border-b border-border-subtle">
        <div className="max-w-container mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.label}
                className="bg-surface-1 border border-border-subtle rounded-xl p-4 flex items-center gap-3"
              >
                <div className="text-2xl">{h.icon}</div>
                <div>
                  <div className="font-extrabold text-lg leading-none">{h.value}</div>
                  <div className="text-xs text-content-muted mt-1">{h.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-container mx-auto px-4 md:px-6 py-12 grid lg:grid-cols-3 gap-8">
        {/* ===== MAIN COLUMN ===== */}
        <div className="lg:col-span-2 space-y-10">
          {/* Tests */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2.5">
              Available Tests
            </div>
            <h2 className="text-2xl font-extrabold mb-5">Start a mock test</h2>

            {tests.length === 0 ? (
              <div className="bg-surface-1 border border-border-subtle rounded-2xl p-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-content-secondary">Tests are being added for this exam. Check back soon!</p>
              </div>
            ) : (
              <ExamTestList
                tests={tests.map((t) => ({
                  id: t.id,
                  slug: t.slug,
                  name: t.name,
                  description: t.description,
                  test_type: t.test_type,
                  test_series_id: t.test_series_id,
                  total_questions: t.total_questions,
                  duration_minutes: t.duration_minutes,
                }))}
                examId={exam.id}
              />
            )}
          </div>

          {/* Subjects */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2.5">
              What you&apos;ll prepare
            </div>
            <h2 className="text-2xl font-extrabold mb-5">Syllabus overview</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUBJECTS.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 bg-surface-1 border border-border-subtle rounded-xl p-4"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: "var(--bg-surface-3)" }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-content-muted">Section {i + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-surface-1 border border-border rounded-2xl p-6">
              <h3 className="font-extrabold text-lg mb-1">Complete Bundle</h3>
              <p className="text-sm text-content-secondary mb-4">
                Get all tests, PYQs and lifetime reattempts for this exam in one pack.
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-extrabold text-brand-300">₹499</span>
                <span className="text-sm text-content-muted line-through">₹999</span>
              </div>
              <PaymentButton examId={exam.id} amountLabel="₹499" label="Buy Bundle" />
              <ul className="mt-4 space-y-2 text-sm text-content-secondary">
                <li>✓ All mock tests</li>
                <li>✓ Real-time ranks</li>
                <li>✓ 5 reattempts per test</li>
                <li>✓ Lifetime access</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
