// scripts/seed-supabase.mjs
// Seeds Supabase core content: for each published exam -> 1 course + 1 test_series + 2 tests.
// Idempotent: checks by slug before inserting. Run: node scripts/seed-supabase.mjs
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function getBySlug(table, slug) {
  const r = await fetch(`${URL}/rest/v1/${table}?slug=eq.${encodeURIComponent(slug)}&select=*`, { headers: H });
  const j = await r.json();
  return j[0] || null;
}
async function insert(table, payload) {
  const r = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${table} insert failed: ${JSON.stringify(j)}`);
  return j[0];
}
async function upsert(table, slug, payload) {
  const existing = await getBySlug(table, slug);
  if (existing) return { row: existing, created: false };
  return { row: await insert(table, payload), created: true };
}

const exams = await (await fetch(`${URL}/rest/v1/exams?select=id,slug,name,accent_color&is_published=eq.true&order=sort_order.asc`, { headers: H })).json();

const createdTests = [];

for (const exam of exams) {
  const cslug = `${exam.slug}-course`;
  const { row: course } = await upsert("courses", cslug, {
    exam_id: exam.id,
    name: `${exam.name} — Complete Course`,
    slug: cslug,
    short_description: `Complete preparation track for ${exam.name} with mock tests, PYQs and study material.`,
    language: "bilingual",
    is_free: false,
    price_cents: 99900,
    validity_type: "lifetime",
    sort_order: 1,
    is_published: true,
  });

  const tsslug = `${exam.slug}-mock-series`;
  const { row: series } = await upsert("test_series", tsslug, {
    course_id: course.id,
    name: `${exam.name} Mock Test Series`,
    slug: tsslug,
    description: `Full-length and sectional mock tests for ${exam.name}.`,
    is_free: false,
    price_cents: 49900,
    validity_type: "lifetime",
    is_published: true,
    sort_order: 1,
  });

  // Test 1 — free mock (playable demo for VDO; others get questions later)
  const t1slug = `${exam.slug}-free-mock`;
  const { row: t1 } = await upsert("tests", t1slug, {
    test_series_id: series.id,
    name: `${exam.name} — Free Mock Test`,
    slug: t1slug,
    description: "A free practice mock to experience the test interface and get instant results.",
    total_questions: exam.slug === "upsssc-vdo" ? 15 : 0,
    duration_minutes: 20,
    total_marks: exam.slug === "upsssc-vdo" ? 15 : 0,
    negative_mark_per_wrong: 0,
    subject_type: "mixed",
    test_type: "free",
    is_ranked: true,
    max_reattempts: 5,
    is_published: true,
  });

  // Test 2 — full mock (structure only, questions added later)
  const t2slug = `${exam.slug}-full-mock-1`;
  const { row: t2 } = await upsert("tests", t2slug, {
    test_series_id: series.id,
    name: `${exam.name} — Full Mock Test 1`,
    slug: t2slug,
    description: "Complete full-length mock as per the latest exam pattern.",
    total_questions: 100,
    duration_minutes: 120,
    total_marks: 100,
    negative_mark_per_wrong: 0.25,
    subject_type: "mixed",
    test_type: "full_length",
    is_ranked: true,
    max_reattempts: 5,
    is_published: false, // not playable yet (no questions)
  });

  createdTests.push({
    exam: exam.slug,
    accent: exam.accent_color,
    free_mock_id: t1.id,
    free_mock_slug: t1slug,
    free_mock_total: t1.total_questions,
    full_mock_slug: t2slug,
  });
  console.log(`✓ ${exam.slug}: course + series + 2 tests`);
}

console.log("\n=== CREATED TESTS ===");
console.log(JSON.stringify(createdTests, null, 2));
console.log("\nDEMO (playable) test → upsssc-vdo-free-mock");
