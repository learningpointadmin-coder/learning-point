import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

/* ============================================================================
   EXAMS PAGE — lists published exams from Supabase (server component)
   ============================================================================ */

export const metadata: Metadata = {
  title: "Exams — Learning Point",
  description: "Browse all available exam preparation tracks.",
};

type Exam = {
  name: string;
  slug: string;
  description: string | null;
  accent_color: string | null;
  icon: string | null;
};

export default async function ExamsPage() {
  // Server component: uses the service_role key (server-only, never sent to the
  // browser). It bypasses RLS so published exams are always readable.
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;

  let exams: Exam[] = [];
  let loadError: string | null = null;

  try {
    const res = await fetch(
      `${url}/rest/v1/exams?select=name,slug,description,accent_color,icon&is_published=eq.true&order=sort_order.asc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      loadError = `Database returned ${res.status}. Did you run the grants SQL?`;
    } else {
      exams = (await res.json()) as Exam[];
    }
  } catch {
    loadError = "Could not reach the database.";
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="max-w-container mx-auto px-4 md:px-6 pt-12 pb-8">
        <div className="text-center mb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2.5">All Exams</div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Choose your exam</h1>
          <p className="text-content-secondary mt-2 max-w-lg mx-auto">
            Pick a track to see available test series, mock tests and study material.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-container mx-auto px-4 md:px-6 pb-16">
        {loadError ? (
          <div className="max-w-md mx-auto text-center bg-surface-1 border border-border rounded-2xl p-8">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="font-bold text-lg mb-2">Exams couldn&apos;t load</h2>
            <p className="text-sm text-content-secondary mb-1">{loadError}</p>
            <p className="text-xs text-content-muted">
              Run <code className="bg-surface-3 px-1.5 py-0.5 rounded">grants_rls_seed.sql</code> in the Supabase SQL Editor.
            </p>
          </div>
        ) : exams.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-surface-1 border border-border rounded-2xl p-8">
            <div className="text-3xl mb-3">📭</div>
            <h2 className="font-bold text-lg mb-2">No exams yet</h2>
            <p className="text-sm text-content-muted">Exams will appear here once published.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <Link
                key={exam.slug}
                href={`/exams/${exam.slug}`}
                className="group bg-surface-1 border border-border-subtle rounded-2xl p-6 transition-all duration-base hover:-translate-y-1 hover:border-border hover:shadow-md flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: exam.accent_color ? `${exam.accent_color}26` : "var(--bg-surface-3)",
                      color: exam.accent_color || "var(--text-primary)",
                    }}
                  >
                    {exam.icon || "📝"}
                  </div>
                  <Badge variant="neutral" size="sm">View →</Badge>
                </div>
                <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-brand-300 transition-colors">
                  {exam.name}
                </h3>
                {exam.description && (
                  <p className="text-sm text-content-secondary line-clamp-3">{exam.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
