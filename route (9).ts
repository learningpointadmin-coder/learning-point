import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminListQuestions, adminQuestionCount } from "@/lib/admin";

export async function GET(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  const testId = new URL(req.url).searchParams.get("testId");
  if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });
  const [rows, count] = await Promise.all([adminListQuestions(testId), adminQuestionCount(testId)]);
  return NextResponse.json({ rows, count });
}
