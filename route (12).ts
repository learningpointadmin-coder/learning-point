import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const staff = await requireAdmin(req);
  if (!staff) return NextResponse.json({ admin: false }, { status: 200 });
  return NextResponse.json({ admin: true, ...staff });
}
