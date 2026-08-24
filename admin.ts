import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

/* ============================================================================
   ADMIN LAYER (server-only)
   - requireAdmin: verifies the bearer access token via Supabase + checks the
     staff table. Admin API routes call this first.
   - Data ops for exams / tests / questions (Supabase + Turso) + AI generate.
   ============================================================================ */

const SURL = process.env.SUPABASE_URL!;
const SKEY = process.env.SUPABASE_SECRET_KEY!;
const SANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SH = { apikey: SKEY, Authorization: `Bearer ${SKEY}` };

export type StaffUser = {
  auth_id: string;
  full_name: string;
  email: string;
  role: string;
};

/** Verify token + staff membership. Returns staff row or null. */
export async function requireAdmin(req: Request): Promise<StaffUser | null> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const r = await fetch(`${SURL}/auth/v1/user`, {
      headers: { apikey: SANON, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const user = await r.json();
    if (!user?.id) return null;
    const s = await fetch(
      `${SURL}/rest/v1/staff?auth_id=eq.${user.id}&is_active=eq.true&select=auth_id,full_name,email,role&limit=1`,
      { headers: SH }
    );
    const arr = await s.json();
    return arr?.[0] ?? null;
  } catch {
    return null;
  }
}

function adminError(staff: StaffUser | null) {
  return staff ? null : { error: "Unauthorized — admin access required." };
}

// ---- generic Supabase writes ----------------------------------------------
async function supaPost(table: string, payload: any) {
  const r = await fetch(`${SURL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...SH, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || `${table} insert failed`);
  return j[0];
}
async function supaPatch(table: string, id: string, payload: any) {
  const r = await fetch(`${SURL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...SH, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || `${table} update failed`);
  return j[0];
}
async function supaDelete(table: string, id: string) {
  const r = await fetch(`${SURL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: SH });
  return r.ok;
}

// ---- EXAMS -----------------------------------------------------------------
export async function adminListExams() {
  const r = await fetch(`${SURL}/rest/v1/exams?select=*&order=sort_order.asc`, { headers: SH });
  return r.json();
}
export const adminCreateExam = (d: any) => supaPost("exams", d);
export const adminUpdateExam = (id: string, d: any) => supaPatch("exams", id, d);
export const adminDeleteExam = (id: string) => supaDelete("exams", id);

// ---- TESTS -----------------------------------------------------------------
export async function adminListTestSeries() {
  const r = await fetch(`${SURL}/rest/v1/test_series?select=id,name,price_cents,course_id,is_published&order=name.asc`, { headers: SH });
  return r.json();
}

export async function adminListTests() {
  const r = await fetch(`${SURL}/rest/v1/tests?select=*&order=created_at.asc`, { headers: SH });
  return r.json();
}
export const adminCreateTest = (d: any) => supaPost("tests", d);
export const adminUpdateTest = (id: string, d: any) => supaPatch("tests", id, d);
export const adminDeleteTest = (id: string) => supaDelete("tests", id);

// ---- QUESTIONS (Turso) -----------------------------------------------------
function turso() {
  return createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
}

export async function adminListQuestions(testId: string) {
  const db = turso();
  const r = await db.execute({
    sql: `SELECT q.id, q.question_text_en, q.subject, q.topic, q.difficulty, q.source_type, q.status,
          (SELECT COUNT(*) FROM options o WHERE o.question_id=q.id) AS opt_count,
          (SELECT COUNT(*) FROM options o WHERE o.question_id=q.id AND o.is_correct=1) AS correct_count
          FROM test_questions tq JOIN questions q ON q.id=tq.question_id
          WHERE tq.test_id=? ORDER BY tq.sort_order ASC`,
    args: [testId],
  });
  return r.rows;
}

export async function adminDeleteQuestion(questionId: string) {
  const db = turso();
  await db.execute({ sql: "DELETE FROM test_questions WHERE question_id=?", args: [questionId] });
  await db.execute({ sql: "DELETE FROM explanations WHERE question_id=?", args: [questionId] });
  await db.execute({ sql: "DELETE FROM options WHERE question_id=?", args: [questionId] });
  await db.execute({ sql: "DELETE FROM questions WHERE id=?", args: [questionId] });
  return true;
}

export async function adminQuestionCount(testId: string): Promise<number> {
  const db = turso();
  const r = await db.execute({ sql: "SELECT COUNT(*) c FROM test_questions WHERE test_id=?", args: [testId] });
  return Number(r.rows[0].c);
}

// ---- AI GENERATE (Gemini) --------------------------------------------------
export async function adminGenerate(
  testId: string,
  count: number,
  focus: string
): Promise<number> {
  const existing = await adminQuestionCount(testId);
  if (existing >= count) return existing; // already has enough

  const GEMINI = process.env.GEMINI_API_KEY!;
  const prompt = `You are an expert exam-content author for Indian competitive exams.
Generate exactly ${count} multiple-choice questions for the ${focus}
Each question must have exactly 4 options and exactly one correct answer.
Return ONLY a JSON array (no prose, no fences) of objects:
{"question": string, "options": [string,string,string,string], "correctIndex": number (0-3), "explanation": string, "subject": string, "topic": string, "difficulty": "easy"|"medium"|"hard"}
Rules: factually correct, unambiguous, mix subjects/difficulties, concise explanations.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 16384 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const g = await res.json();
  let text = g.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  let items: any[];
  try {
    items = JSON.parse(text);
  } catch {
    items = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  }
  const valid = items.filter(
    (it: any) => it.question && Array.isArray(it.options) && it.options.length === 4 &&
      typeof it.correctIndex === "number" && it.explanation
  );

  const db = turso();
  let nextSort = existing;
  for (const it of valid) {
    const qid = randomUUID();
    await db.execute({
      sql: "INSERT INTO questions (id, subject, topic, question_type, question_text_en, difficulty, source_type, marks_correct, marks_wrong, status, approved_at) VALUES (?,?,?,?,?,?,?,?,?,'published',datetime('now'))",
      args: [qid, it.subject || "General", it.topic || null, "single_choice", it.question, it.difficulty || "medium", "ai_generated", 1, 0],
    });
    for (let oi = 0; oi < 4; oi++) {
      await db.execute({
        sql: "INSERT INTO options (id, question_id, option_text_en, sort_order, is_correct) VALUES (?,?,?,?,?)",
        args: [randomUUID(), qid, String(it.options[oi]), oi, oi === it.correctIndex ? 1 : 0],
      });
    }
    await db.execute({
      sql: "INSERT INTO explanations (id, question_id, version, content_en, explanation_type, is_approved, approved_at) VALUES (?,?,1,?,?,1,datetime('now'))",
      args: [randomUUID(), qid, it.explanation, "factual"],
    });
    await db.execute({
      sql: "INSERT INTO test_questions (test_id, question_id, sort_order) VALUES (?,?,?)",
      args: [testId, qid, ++nextSort],
    });
  }
  // sync test total_questions
  const total = await adminQuestionCount(testId);
  await supaPatch("tests", testId, { total_questions: total, total_marks: total });
  return total;
}

export { adminError };
