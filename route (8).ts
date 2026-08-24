import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminUpdateTest, adminDeleteTest } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const test = await adminUpdateTest(id, body);
    return NextResponse.json(test);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  const { id } = await params;
  await adminDeleteTest(id);
  return NextResponse.json({ ok: true });
}
