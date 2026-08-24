// scripts/seed-questions.mjs — seeds the playable demo test into Turso via @libsql/client.
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const DEMO_TEST_ID = "cbc156f7-dfdd-4bb4-bd83-1cb5e6b216b5"; // upsssc-vdo-free-mock

// 15 hand-authored MCQs for UPSSSC VDO
const QUESTIONS = [
  { subject: "General Knowledge", topic: "Polity", q: "Who is the elected head of a Gram Panchayat?", opts: ["Sarpanch / Pradhan", "Tehsildar", "District Magistrate", "BDO"], correct: 0, exp: "The Gram Pradhan (Sarpanch) is the directly elected head of the Gram Panchayat.", diff: "easy" },
  { subject: "Rural Development", topic: "Schemes", q: "NREGA was renamed in 2009 to honour which leader?", opts: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "Lal Bahadur Shastri"], correct: 0, exp: "In 2009 NREGA was renamed Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA).", diff: "easy" },
  { subject: "Uttar Pradesh", topic: "Geography", q: "Which is the largest district of Uttar Pradesh by area?", opts: ["Sonbhadra", "Lakhimpur Kheri", "Hardoi", "Chitrakoot"], correct: 0, exp: "Sonbhadra is the largest district of UP by area (about 6,788 sq km).", diff: "medium" },
  { subject: "Uttar Pradesh", topic: "General", q: "How many districts are there in Uttar Pradesh (as of 2024)?", opts: ["72", "73", "75", "70"], correct: 2, exp: "Uttar Pradesh currently has 75 districts.", diff: "easy" },
  { subject: "Polity", topic: "Panchayati Raj", q: "The Panchayati Raj System was constitutionalised by which amendment?", opts: ["42nd Amendment", "61st Amendment", "73rd Amendment", "86th Amendment"], correct: 2, exp: "The 73rd Constitutional Amendment (1992) gave Panchayati Raj institutions constitutional status.", diff: "medium" },
  { subject: "Rural Development", topic: "Poverty", q: "BPL stands for:", opts: ["Below Poverty Line", "Basic Public Livelihood", "Below Production Level", "Bureau of Public Lands"], correct: 0, exp: "BPL = Below Poverty Line, an economic benchmark used to identify households in need.", diff: "easy" },
  { subject: "Quantitative Aptitude", topic: "Percentage", q: "What is 25% of 480?", opts: ["100", "120", "110", "125"], correct: 1, exp: "25% of 480 = 0.25 × 480 = 120.", diff: "easy" },
  { subject: "Quantitative Aptitude", topic: "Profit & Loss", q: "An article bought for ₹400 is sold for ₹500. The profit percentage is:", opts: ["20%", "25%", "30%", "15%"], correct: 1, exp: "Profit = 100 on cost 400 → (100/400)×100 = 25%.", diff: "medium" },
  { subject: "Reasoning", topic: "Series", q: "Find the next number: 2, 6, 12, 20, 30, ?", opts: ["40", "42", "44", "36"], correct: 1, exp: "Differences are 4,6,8,10,12 → 30+12 = 42.", diff: "medium" },
  { subject: "Reasoning", topic: "Coding", q: "If CAT is coded as 24, how is DOG coded (A=1,B=2,...)?", opts: ["26", "27", "29", "23"], correct: 0, exp: "C(3)+A(1)+T(20)=24; D(4)+O(15)+G(7)=26.", diff: "medium" },
  { subject: "Uttar Pradesh", topic: "Rivers", q: "Which of the following rivers does NOT flow through Uttar Pradesh?", opts: ["Ganga", "Yamuna", "Godavari", "Gomti"], correct: 2, exp: "The Godavari flows through Maharashtra and southern India, not UP.", diff: "medium" },
  { subject: "General Knowledge", topic: "Economy", q: "The Reserve Bank of India was established in which year?", opts: ["1935", "1947", "1950", "1969"], correct: 0, exp: "RBI was established on 1 April 1935; it was nationalised in 1949.", diff: "medium" },
  { subject: "Hindi", topic: "Grammar", q: "'विद्यालय' शब्द का सही संधि विच्छेद है:", opts: ["विद्या + आलय", "विद्या + लय", "विद्य + आलय", "विद् + आलय"], correct: 0, exp: "विद्यालय = विद्या + आलय (संधि विच्छेद)।", diff: "medium" },
  { subject: "General Science", topic: "Biology", q: "Which vitamin is produced in the human skin on exposure to sunlight?", opts: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], correct: 3, exp: "Sunlight helps the skin synthesise Vitamin D (cholecalciferol).", diff: "easy" },
  { subject: "Uttar Pradesh", topic: "History", q: "The historic 1857 revolt began from which cantonment in UP?", opts: ["Allahabad", "Meerut", "Kanpur", "Lucknow"], correct: 1, exp: "The revolt of 1857 started from Meerut on 10 May 1857.", diff: "medium" },
];

// idempotency
const chk = await db.execute({ sql: "SELECT COUNT(*) as c FROM test_questions WHERE test_id=?", args: [DEMO_TEST_ID] });
if (chk.rows[0].c > 0) { console.log(`Already linked (${chk.rows[0].c}). Skipping.`); process.exit(0); }

// clear any leftover questions table state (fresh demo)
await db.executeMultiple(`
  DELETE FROM test_questions WHERE test_id='${DEMO_TEST_ID}';
`);

for (let qi = 0; qi < QUESTIONS.length; qi++) {
  const item = QUESTIONS[qi];
  const qid = randomUUID();
  await db.execute({
    sql: "INSERT INTO questions (id, subject, topic, question_type, question_text_en, difficulty, source_type, marks_correct, marks_wrong, status, approved_at) VALUES (?,?,?,?,?,?,?,?,?,'published',datetime('now'))",
    args: [qid, item.subject, item.topic, "single_choice", item.q, item.diff, "master_bank", 1, 0],
  });
  for (let oi = 0; oi < item.opts.length; oi++) {
    await db.execute({
      sql: "INSERT INTO options (id, question_id, option_text_en, sort_order, is_correct) VALUES (?,?,?,?,?)",
      args: [randomUUID(), qid, item.opts[oi], oi, oi === item.correct ? 1 : 0],
    });
  }
  await db.execute({
    sql: "INSERT INTO explanations (id, question_id, version, content_en, explanation_type, is_approved, approved_at) VALUES (?,?,1,?,?,1,datetime('now'))",
    args: [randomUUID(), qid, item.exp, "factual"],
  });
  await db.execute({
    sql: "INSERT INTO test_questions (test_id, question_id, sort_order) VALUES (?,?,?)",
    args: [DEMO_TEST_ID, qid, qi + 1],
  });
}
console.log(`✓ Seeded ${QUESTIONS.length} questions into demo test ${DEMO_TEST_ID}`);
