// scripts/ai-gen-questions.mjs
// Generates MCQs via Gemini (gemini-3.6-flash), validates, seeds into Turso,
// and flips the Supabase test to playable. Loops over a config list so all
// exams get content. Idempotent per test.
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

const GEMINI = process.env.GEMINI_API_KEY;
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SECRET_KEY;
const COUNT = 15;

const CONFIGS = [
  { testId: "d183835b-d328-4347-83ec-bb563ab20a7a", focus: "UPSSSC Junior Assistant exam. Subjects: General Knowledge (esp. Uttar Pradesh), General Intelligence & Reasoning, Quantitative Aptitude, Hindi, Computer Awareness." },
  { testId: "738255b0-63c9-4cd6-a642-62f84b7b27d9", focus: "UP Police Constable recruitment exam. Subjects: General Knowledge & Current Affairs, Quantitative Aptitude, Mental Ability / Reasoning, Hindi, UP-specific GK." },
  { testId: "beaf5fe1-a0be-4edd-a0b8-50be58807054", focus: "IBPS Clerk Prelims exam. Subjects: English Language, Numerical Ability, Reasoning Ability." },
  { testId: "fde679aa-718e-46d5-902e-524a4ac6579a", focus: "SSC CGL Tier 1 exam. Subjects: General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, English Comprehension." },
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
        generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 16384 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const gdata = await res.json();
  let text = gdata.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  let items;
  try {
    items = JSON.parse(text);
  } catch {
    items = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  }
  return items.filter(
    (it) =>
      it.question && Array.isArray(it.options) && it.options.length === 4 &&
      typeof it.correctIndex === "number" && it.correctIndex >= 0 && it.correctIndex <= 3 && it.explanation
  );
}

async function seed(testId, focus) {
  if (await alreadySeeded(testId)) { console.log(`  ${testId.slice(0, 8)}: already seeded, skip`); return; }
  const items = await generate(focus);
  let inserted = 0;
  for (let qi = 0; qi < items.length; qi++) {
    const it = items[qi];
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
      args: [testId, qid, qi + 1],
    });
    inserted++;
  }
  const patch = await fetch(`${SUPA_URL}/rest/v1/tests?id=eq.${testId}`, {
    method: "PATCH",
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ total_questions: inserted, total_marks: inserted, duration_minutes: 20, is_published: true }),
  });
  console.log(`  ${testId.slice(0, 8)}: seeded ${inserted} questions (Supabase ${patch.status})`);
}

for (const cfg of CONFIGS) {
  try {
    await seed(cfg.testId, cfg.focus);
  } catch (e) {
    console.error(`  ${cfg.testId.slice(0, 8)}: FAILED -`, e.message);
  }
}
console.log("Done.");
