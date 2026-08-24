/* ============================================================================
   SUPABASE SERVER HELPERS (server-only)
   Reads core content via the service_role key. Centralises the fetch pattern
   used across server components + route handlers.
   ============================================================================ */

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function supaGet(path: string) {
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      headers: H,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

export type Exam = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string | null;
  icon: string | null;
};

export type Test = {
  id: string;
  test_series_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  total_questions: number;
  duration_minutes: number;
  total_marks: number;
  negative_mark_per_wrong: number;
  subject_type: string;
  test_type: string;
  is_ranked: boolean;
  max_reattempts: number;
  is_published: boolean;
};

export async function getExamBySlug(slug: string): Promise<Exam | null> {
  const rows = await supaGet(
    `exams?select=id,name,slug,description,accent_color,icon&slug=eq.${encodeURIComponent(
      slug
    )}&is_published=eq.true`
  );
  return rows?.[0] ?? null;
}

export async function getPublishedExams(): Promise<Exam[]> {
  const rows = await supaGet(
    "exams?select=id,name,slug,description,accent_color,icon&is_published=eq.true&order=sort_order.asc"
  );
  return rows ?? [];
}

/** Resolve exam → course → test_series → published tests. */
export async function getPublishedTestsForExam(
  examId: string
): Promise<Test[]> {
  const courses = await supaGet(
    `courses?select=id&exam_id=eq.${examId}&is_published=eq.true`
  );
  if (!courses?.length) return [];
  const courseIds = courses.map((c: any) => c.id).join(",");
  const series = await supaGet(
    `test_series?select=id&course_id=in.(${courseIds})&is_published=eq.true`
  );
  if (!series?.length) return [];
  const seriesIds = series.map((s: any) => s.id).join(",");
  const tests = await supaGet(
    `tests?select=*&test_series_id=in.(${seriesIds})&is_published=eq.true&order=created_at.asc`
  );
  return tests ?? [];
}

export async function getTestBySlug(slug: string): Promise<Test | null> {
  const rows = await supaGet(
    `tests?select=*&slug=eq.${encodeURIComponent(slug)}`
  );
  return rows?.[0] ?? null;
}

export async function getTestById(id: string): Promise<Test | null> {
  const rows = await supaGet(`tests?select=*&id=eq.${id}`);
  return rows?.[0] ?? null;
}

export async function getTestsByIds(ids: string[]): Promise<Test[]> {
  if (ids.length === 0) return [];
  const csv = ids.join(",");
  const rows = await supaGet(`tests?select=id,name,slug&id=in.(${csv})`);
  return rows ?? [];
}

/** Map auth_id -> { full_name, state } for leaderboard name lookups. */
export async function getProfilesByAuthIds(
  authIds: string[]
): Promise<Map<string, { full_name: string; state: string | null }>> {
  const map = new Map<string, { full_name: string; state: string | null }>();
  if (authIds.length === 0) return map;
  const rows = await supaGet(
    `profiles?select=auth_id,full_name,state&auth_id=in.(${authIds.join(",")})`
  );
  for (const r of rows ?? []) {
    map.set(r.auth_id, { full_name: r.full_name, state: r.state ?? null });
  }
  return map;
}

/** All published free/playable tests across exams (for the Free Tests hub). */
export async function getPlayableTests(): Promise<Test[]> {
  const tests = await supaGet(
    `tests?select=*&is_published=eq.true&total_questions=gt.0&order=created_at.asc`
  );
  return tests ?? [];
}

/** Published study materials (course-independent catalog). */
export type Material = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  view_online: boolean;
  download_allowed: boolean;
  print_allowed: boolean;
};
export async function getPublishedMaterials(): Promise<Material[]> {
  const rows = await supaGet(
    `materials?select=id,title,description,file_url,file_type,view_online,download_allowed,print_allowed&is_published=eq.true&order=sort_order.asc,created_at.desc`
  );
  return rows ?? [];
}

/** Notifications for a profile (newest first). */
export type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};
export async function getNotificationsForProfile(profileId: string): Promise<Notification[]> {
  const rows = await supaGet(
    `notifications?select=id,title,body,type,link,is_read,created_at&profile_id=eq.${profileId}&order=created_at.desc&limit=50`
  );
  return rows ?? [];
}
export async function markAllNotificationsRead(profileId: string) {
  await fetch(`${URL}/rest/v1/notifications?profile_id=eq.${profileId}&is_read=eq.false`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ is_read: true }),
  });
}

/** Row count for a table (service_role). */
export async function supaCount(table: string, filter?: string): Promise<number> {
  try {
    const res = await fetch(`${URL}/rest/v1/${table}?select=*&limit=1${filter ? `&${filter}` : ""}`, {
      headers: { ...H, Prefer: "count=exact", Range: "0-0" },
      cache: "no-store",
    });
    const cr = res.headers.get("content-range") || "";
    // e.g. "0-0/42"
    const n = cr.split("/")[1];
    return n ? parseInt(n, 10) : 0;
  } catch {
    return 0;
  }
}

// ---- inserts / writes (service_role, server-only) -------------------------
/** Verify a bearer access token → auth_id (or null). */
export async function verifyAuth(req: Request): Promise<string | null> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const r = await fetch(`${URL}/auth/v1/user`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/** Test-series ids a user owns (active entitlements). */
export async function getOwnedSeriesIds(authId: string): Promise<string[]> {
  const profile = await getProfileByAuthId(authId);
  if (!profile) return [];
  const rows = await supaGet(
    `entitlements?select=item_id&profile_id=eq.${profile.id}&item_type=eq.test_series&is_active=eq.true`
  );
  return (rows ?? []).map((r: any) => r.item_id);
}

async function supaInsert(table: string, payload: Record<string, unknown>) {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${table} insert failed: ${await res.text()}`);
  const j = await res.json();
  return j[0];
}

/** Resolve an exam's test series (via course) + its price. */
export async function getTestSeriesForExam(
  examId: string
): Promise<{ id: string; name: string; price_cents: number } | null> {
  const courses = await supaGet(`courses?select=id&exam_id=eq.${examId}&is_published=eq.true`);
  if (!courses?.length) return null;
  const courseIds = courses.map((c: any) => c.id).join(",");
  const series = await supaGet(
    `test_series?select=id,name,price_cents&course_id=in.(${courseIds})&is_published=eq.true&order=sort_order.asc&limit=1`
  );
  return series?.[0] ?? null;
}

/** Profile row (id, name) for an auth user id. */
export async function getProfileByAuthId(
  authId: string
): Promise<{ id: string; full_name: string } | null> {
  const rows = await supaGet(`profiles?select=id,full_name&auth_id=eq.${authId}&limit=1`);
  return rows?.[0] ?? null;
}

export async function grantEntitlement(
  profileId: string,
  itemType: "course" | "test_series" | "batch",
  itemId: string
) {
  return supaInsert("entitlements", {
    profile_id: profileId,
    item_type: itemType,
    item_id: itemId,
    source: "purchase",
    validity_type: "lifetime",
    is_active: true,
  });
}

export async function recordPayment(params: {
  profileId: string;
  itemType: "course" | "test_series" | "batch";
  itemId: string;
  orderId: string;
  paymentId: string;
  signature: string;
  amountCents: number;
}) {
  return supaInsert("payments", {
    profile_id: params.profileId,
    item_type: params.itemType,
    item_id: params.itemId,
    razorpay_order_id: params.orderId,
    razorpay_payment_id: params.paymentId,
    razorpay_signature: params.signature,
    base_amount_cents: params.amountCents,
    total_amount_cents: params.amountCents,
    currency: "INR",
    status: "captured",
    captured_at: new Date().toISOString(),
  });
}
