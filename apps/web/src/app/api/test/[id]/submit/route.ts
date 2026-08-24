import { NextResponse } from "next/server";
import { scoreAndPersist } from "@/lib/turso";
import { getTestById } from "@/lib/supabase-server";

/* ============================================================================
   POST /api/test/[id]/submit
   Body: { answers: { questionId: selectedOptionId }, timeTakenSeconds, profileId? }
   Scores server-side (negative marking read from the test config in Supabase),
   persists the attempt + responses to Turso, returns the result summary.
   ============================================================================ */

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const answers: Record<string, string> = body?.answers ?? {};
  const timeTakenSeconds = Number(body?.timeTakenSeconds ?? 0);
  const profileId: string | null = body?.profileId ?? null;

  const test = await getTestById(id);
  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  const result = await scoreAndPersist({
    testId: id,
    profileId,
    answers,
    negativeMarkPerWrong: Number(test.negative_mark_per_wrong) || 0,
    timeTakenSeconds,
  });

  return NextResponse.json(result);
}
