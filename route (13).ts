import { NextResponse } from "next/server";
import { requireAdmin, adminError, adminListTestSeries } from "@/lib/admin";

export async function GET(req: Request) {
  const staff = await requireAdmin(req);
  const e = adminError(staff);
  if (e) return NextResponse.json(e, { status: 401 });
  return NextResponse.json(await adminListTestSeries());
}
