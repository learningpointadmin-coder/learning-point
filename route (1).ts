import { NextResponse } from "next/server";
import { getTestQuestionsFull, toPlayerPayload } from "@/lib/turso";
import { getTestById, verifyAuth, getOwnedSeriesIds } from "@/lib/supabase-server";

/* ============================================================================
   GET /api/test/[id]/questions
   Returns the test's questions + options for the player UI.
   is_correct is STRIPPED — correct answers never reach the browser.

   GATING: tests whose test_type !== "free" require an active entitlement
   for the test's test_series. Free tests are open to everyone.
   ============================================================================ */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const test = await getTestById(id);
  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  // ---- paid gating ----
  const isPaid = test.test_type !== "free";
  if (isPaid) {
    const authId = await verifyAuth(req);
    if (!authId) {
      return NextResponse.json(
        { error: "Login required.", gated: "login" },
        { status: 401 }
      );
    }
    const owned = await getOwnedSeriesIds(authId);
    if (!test.test_series_id || !owned.includes(test.test_series_id)) {
      return NextResponse.json(
        { error: "This test is part of a paid bundle.", gated: "purchase", examId: null },
        { status: 403 }
      );
    }
  }

  const full = await getTestQuestionsFull(id);
  if (full.length === 0) {
    return NextResponse.json(
      { error: "No questions available for this test yet." },
      { status: 404 }
    );
  }
  return NextResponse.json({ questions: toPlayerPayload(full) });
}
