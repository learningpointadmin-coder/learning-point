import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminGenerate } from "@/lib/admin";

export async function POST(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  try {
    const { testId, count, focus } = await req.json();
    if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });
    const total = await adminGenerate(testId, count || 15, focus || "exam");
    return NextResponse.json({ ok: true, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
