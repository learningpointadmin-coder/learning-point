import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminListExams, adminCreateExam } from "@/lib/admin";

export async function GET(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  return NextResponse.json(await adminListExams());
}

export async function POST(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  try {
    const body = await req.json();
    const exam = await adminCreateExam(body);
    return NextResponse.json(exam, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
