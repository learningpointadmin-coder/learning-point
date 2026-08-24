import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminDeleteQuestion } from "@/lib/admin";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  const { id } = await params;
  await adminDeleteQuestion(id);
  return NextResponse.json({ ok: true });
}
