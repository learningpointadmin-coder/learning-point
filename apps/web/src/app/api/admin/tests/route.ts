import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminListTests, adminCreateTest } from "@/lib/admin";

export async function GET(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  return NextResponse.json(await adminListTests());
}

export async function POST(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  try {
    const body = await req.json();
    const test = await adminCreateTest(body);
    return NextResponse.json(test, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
