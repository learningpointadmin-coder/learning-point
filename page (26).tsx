import { notFound } from "next/navigation";
import { getTestBySlug } from "@/lib/supabase-server";
import { TestPlayer } from "@/components/test-player";

/* ============================================================================
   TEST PLAYER ROUTE — /test/[slug]/play
   Server wrapper: resolves the test, then renders the client TestPlayer.
   ============================================================================ */

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test || !test.is_published) notFound();

  return (
    <TestPlayer
      testId={test.id}
      slug={test.slug}
      testName={test.name}
      durationMinutes={test.duration_minutes}
    />
  );
}
