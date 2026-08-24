import { NextRequest, NextResponse } from "next/server";
import { turso } from "@/lib/turso";
import { getTestsByIds } from "@/lib/supabase-server";

/* ============================================================================
   GET /api/my-attempts?profileId=<authId>
   Returns the logged-in user's past attempts (merged with test names).
   ============================================================================ */

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ attempts: [] });

  const db = turso();
  const r = await db.execute({
    sql: `SELECT id, test_id, score, correct_count, incorrect_count, unattempted_count,
          accuracy, submitted_at
          FROM attempts WHERE profile_id=? AND status='submitted'
          ORDER BY submitted_at DESC LIMIT 50`,
    args: [profileId],
  });

  const testIds = [...new Set(r.rows.map((x) => x.test_id as string))];
  const tests = await getTestsByIds(testIds);
  const testMap = new Map(tests.map((t) => [t.id, t]));

  const attempts = r.rows.map((row) => {
    const total =
      Number(row.correct_count) + Number(row.incorrect_count) + Number(row.unattempted_count);
    const test = testMap.get(row.test_id as string);
    return {
      attemptId: row.id as string,
      testId: row.test_id as string,
      testName: test?.name ?? "Test",
      testSlug: test?.slug ?? "",
      score: Number(row.score),
      total,
      accuracy: Number(row.accuracy),
      submittedAt: (row.submitted_at as string) ?? null,
    };
  });

  return NextResponse.json({ attempts });
}
