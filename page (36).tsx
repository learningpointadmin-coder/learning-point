import type { Metadata } from "next";
import { getPublishedMaterials } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Study Material — Learning Point",
  description: "Free notes, PDFs and practice resources for your exam preparation.",
};

export const dynamic = "force-dynamic";

function fileIcon(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("pdf")) return "📄";
  if (t.includes("video")) return "🎬";
  if (t.includes("doc") || t.includes("word")) return "📃";
  if (t.includes("img") || t.includes("jpg") || t.includes("png")) return "🖼";
  return "📂";
}

export default async function StudyMaterialPage() {
  const materials = await getPublishedMaterials();

  return (
    <main className="min-h-screen">
      <section className="border-b border-border-subtle">
        <div className="max-w-container mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-3">
            Resources
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3">Study Material</h1>
          <p className="text-content-secondary max-w-2xl mx-auto">
            Downloadable notes, PDFs and practice sheets to complement your mock tests.
          </p>
        </div>
      </section>

      <section className="max-w-container mx-auto px-4 md:px-6 py-12">
        {materials.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h2 className="font-bold text-lg mb-1">Material coming soon</h2>
            <p className="text-sm text-content-secondary">
              We&apos;re adding curated notes and PDFs. Check back shortly!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {materials.map((m) => (
              <div
                key={m.id}
                className="bg-surface-1 border border-border-subtle rounded-2xl p-5 flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center text-2xl shrink-0">
                    {fileIcon(m.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold leading-snug">{m.title}</h2>
                    <span className="text-xs text-content-muted uppercase tracking-wide">
                      {m.file_type || "file"}
                    </span>
                  </div>
                </div>

                {m.description && (
                  <p className="text-sm text-content-secondary mb-4">{m.description}</p>
                )}

                <div className="mt-auto flex gap-2 pt-2">
                  {m.view_online && (
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-9 px-4 text-sm"
                    >
                      View
                    </a>
                  )}
                  {m.download_allowed && (
                    <a
                      href={m.file_url}
                      download
                      className="inline-flex items-center justify-center font-semibold rounded-lg border border-border bg-surface-2 text-content-secondary hover:text-content-primary h-9 px-4 text-sm"
                    >
                      ⬇ Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
