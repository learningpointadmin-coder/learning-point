import { NextResponse } from "next/server";
import { verifyAuth, getProfileByAuthId } from "@/lib/supabase-server";

/* ============================================================================
   POST /api/report-question
   Body: { questionId, testId, category, comment, attemptId? }
   Requires auth. Resolves profile_id from the auth user, inserts a report.
   ============================================================================ */

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const CATEGORIES = new Set([
  "wrong_answer",
  "multiple_correct",
  "no_correct",
  "explanation_error",
  "calculation_error",
  "formatting",
  "translation",
  "out_of_syllabus",
  "image_table_error",
  "other",
]);

export async function POST(req: Request) {
  const authId = await verifyAuth(req);
  if (!authId) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }
  const profile = await getProfileByAuthId(authId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const questionId = String(body.questionId || "");
  const testId = String(body.testId || "");
  const category = String(body.category || "");
  const comment = String(body.comment || "").slice(0, 1000);
  // attempt_id column is NOT NULL; during live play no attempt exists yet, so
  // default to empty string. Result-page reports pass a real attempt id.
  const attemptId = body.attemptId ? String(body.attemptId) : "";

  if (!questionId || !testId || !CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "questionId, testId and a valid category are required." },
      { status: 400 }
    );
  }

  const res = await fetch(`${URL}/rest/v1/question_reports`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      profile_id: profile.id,
      question_id: questionId,
      test_id: testId,
      attempt_id: attemptId,
      category,
      comment,
      status: "open",
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Could not save report." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
