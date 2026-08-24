import { NextResponse } from "next/server";
import {
  verifyAuth,
  getProfileByAuthId,
  getNotificationsForProfile,
  markAllNotificationsRead,
} from "@/lib/supabase-server";

/* ============================================================================
   /api/notifications
   GET    → { items: Notification[], unread: number }
   PATCH  → mark all as read for the caller
   ============================================================================ */

async function resolveProfile(req: Request) {
  const authId = await verifyAuth(req);
  if (!authId) return null;
  return getProfileByAuthId(authId);
}

export async function GET(req: Request) {
  const profile = await resolveProfile(req);
  if (!profile) return NextResponse.json({ authed: false, items: [], unread: 0 });
  const items = await getNotificationsForProfile(profile.id);
  const unread = items.filter((n) => !n.is_read).length;
  return NextResponse.json({ authed: true, items, unread });
}

export async function PATCH(req: Request) {
  const profile = await resolveProfile(req);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllNotificationsRead(profile.id);
  return NextResponse.json({ ok: true });
}
