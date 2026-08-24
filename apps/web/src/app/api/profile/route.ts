import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/supabase-server";

/* ============================================================================
   PATCH /api/profile
   Body: { full_name?, mobile?, state? }
   Updates the profiles row matching the caller's auth_id (service_role).
   ============================================================================ */

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export async function PATCH(req: Request) {
  const authId = await verifyAuth(req);
  if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (typeof body.full_name === "string" && body.full_name.trim())
    patch.full_name = body.full_name.trim().slice(0, 120);
  if (typeof body.mobile === "string")
    patch.mobile = body.mobile.trim().slice(0, 20);
  if (typeof body.state === "string" && body.state.trim())
    patch.state = body.state.trim().slice(0, 60);

  const res = await fetch(`${URL}/rest/v1/profiles?auth_id=eq.${authId}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
  const arr = await res.json();
  return NextResponse.json({ ok: true, profile: arr?.[0] ?? null });
}
