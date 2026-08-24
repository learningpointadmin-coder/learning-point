import { NextResponse } from "next/server";
import { verifyAuth, getOwnedSeriesIds } from "@/lib/supabase-server";

/** GET /api/my-access → { seriesIds: string[], authed: boolean } */
export async function GET(req: Request) {
  const authId = await verifyAuth(req);
  if (!authId) return NextResponse.json({ authed: false, seriesIds: [] });
  const seriesIds = await getOwnedSeriesIds(authId);
  return NextResponse.json({ authed: true, seriesIds });
}
