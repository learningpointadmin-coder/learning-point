// scripts/seed-full-mocks.mjs
// Generates content for the 6 full-length (paid) mock tests via Gemini,
// seeds into Turso, and publishes them in Supabase. Idempotent per test.
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

const GEMINI = process.env.GEMINI_API_KEY;
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SECRET_KEY;
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const COUNT = 25;

const CONFIGS = [
  { testId: "fb5fba43-c8e1-48d8-ba32-6dc051932ad2", focus: "UPSSSC VDO (Gram Vikas Adhikari) full mock. Subjects: General Knowledge (Uttar Pradesh + India), General Intelligence & Reasoning, Quantitative Aptitude, Hindi, General Science, Rural Development." },
  { testId: "3d61312d-47ab-4449-a312-b23b0b7d958e", focus: "UPSSSC Agriculture Technical Assistant full mock. Subjects: Agriculture (agronomy, soil science, horticulture), General Knowledge, Reasoning, Quantitative Aptitude, Hindi." },
  { testId: "3b14952d-8bba-4b46-9306-f729cf82ebd2", focus: "UPSSSC Junior Assistant full mock. Subjects: General Knowledge (Uttar Pradesh), General Intelligence & Reasoning, Quantitative Aptitude, Hindi, Computer Awareness." },
  { testId: "6e80cdcf-6845-4d0c-8c8d-05b3a4de94b9", focus: "UP Police Constable full mock. Subjects: General Knowledge & Current Affairs, Quantitative Aptitude, Mental Ability / Reasoning, Hindi, UP-specific GK, Law & Constitution basics." },
  { testId: "99ebb25f-2b4a-46e4-9156-2c2e0feca858", focus: "IBPS Clerk Prelims full mock. Subjects: English Language, Numerical Ability, Reasoning Ability." },
  { testId: "381a0d55-43b8-4eea-a0f8-20d6ad6a0d3f", focus: "SSC CGL Tier 1 full mock. Subjects: General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, English Comprehension." },
];

async function alreadySeeded(testId) {
  const r = await db.execute({ sql: "SELECT COUNT(*) c FROM test_questions WHERE test_id=?", args: [testId] });
  return Number(r.rows[0].c) > 0;
}

async function generate(focus) {
  const prompt = `You are an expert exam-content author for Indian competitive exams.
Generate exactly ${COUNT} multiple-choice questions for the ${focus}
Each question must have exactly 4 options and exactly one correct answer.

Return ONLY a JSON array (no prose, no markdown fences) of objects with this exact shape:
{"question": string, "options": [string,string,string,string], "correctIndex": number (0-3), "explanation": string, "subject": string, "topic": string, "difficulty": "easy"|"medium"|"hard"}

Rules:
- Factually correct and unambiguous.
- Mix subjects and difficulties.
- Explanations 1-2 sentences. Option texts concise.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8, maxOutputTokens: 24576 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const gdata = await res.json();
  let text = gdata.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  let items;
  try { items = JSON.parse(text); }
  catch { items = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)); }
  return items.filter(
    (it) => it.question && Array.isArray(it.options) && it.options.length === 4 &&
      typeof it.correctIndex === "number" && it.correctIndex >= 0 && it.correctIndex <= 3 && it.explanation
  );
}

async function seed(cfg) {
  if (await alreadySeeded(cfg.testId)) { console.log(`  ${cfg.testId.slice(0, 8)}: already seeded, skip`); return; }
  const items = await generate(cfg.focus);
  let sortBase = 0;
  for (const it of items) {
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
      args: [cfg.testId, qid, ++sortBase],
    });
  }
  const n = items.length;
  const patch = await fetch(`${SUPA_URL}/rest/v1/tests?id=eq.${cfg.testId}`, {
    method: "PATCH",
    headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ total_questions: n, total_marks: n, duration_minutes: 50, is_published: true }),
  });
  console.log(`  ${cfg.testId.slice(0, 8)}: seeded ${n} questions (publish ${patch.status})`);
}

for (const cfg of CONFIGS) {
  try { await seed(cfg); }
  catch (e) { console.error(`  ${cfg.testId.slice(0, 8)}: FAILED -`, e.message); }
}
console.log("Done.");
