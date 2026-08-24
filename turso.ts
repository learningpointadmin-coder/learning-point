import { createClient } from "@libsql/client/http";
import { randomUUID } from "node:crypto";

/* ============================================================================

   TURSO CLIENT (server-only) — questions, options, explanations, attempts
   Used by server components + route handlers. Never imported by client code.
   NOTE: imports from "@libsql/client/http" (explicit HTTP subpath) so the
   Cloudflare/OpenNext bundle resolves cleanly. HTTP transport is what Turso
   recommends for serverless/edge and works identically in Node dev.
   ============================================================================ */

export function turso() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

// ---- types -----------------------------------------------------------------
export type FullOption = {
  id: string;
  text: string;
  sort_order: number;
  is_correct: number;
};
export type FullQuestion = {
  id: string;
  text: string;
  subject: string | null;
  topic: string | null;
  sort_order: number;
  options: FullOption[];
  correct_option_id: string;
  explanation: string | null;
};
export type PlayerQuestion = {
  id: string;
  text: string;
  subject: string | null;
  topic: string | null;
  sort_order: number;
  options: { id: string; text: string; sort_order: number }[];
};

// ---- reads -----------------------------------------------------------------
/** Full questions (WITH correct answers + explanations) — server-only. */
export async function getTestQuestionsFull(
  testId: string
): Promise<FullQuestion[]> {
  const db = turso();
  const q = await db.execute({
    sql: `SELECT tq.sort_order AS tq_sort, q.id AS qid, q.question_text_en, q.subject, q.topic
          FROM test_questions tq JOIN questions q ON q.id = tq.question_id
          WHERE tq.test_id = ? ORDER BY tq.sort_order ASC`,
    args: [testId],
  });

  const out: FullQuestion[] = [];
  for (const row of q.rows) {
    const qid = row.qid as string;
    const opts = await db.execute({
      sql: "SELECT id, option_text_en, sort_order, is_correct FROM options WHERE question_id=? ORDER BY sort_order ASC",
      args: [qid],
    });
    const exp = await db.execute({
      sql: "SELECT content_en FROM explanations WHERE question_id=? ORDER BY version DESC LIMIT 1",
      args: [qid],
    });
    const options: FullOption[] = opts.rows.map((o) => ({
      id: o.id as string,
      text: o.option_text_en as string,
      sort_order: o.sort_order as number,
      is_correct: Number(o.is_correct),
    }));
    out.push({
      id: qid,
      text: row.question_text_en as string,
      subject: (row.subject as string) ?? null,
      topic: (row.topic as string) ?? null,
      sort_order: row.tq_sort as number,
      options,
      correct_option_id:
        options.find((o) => o.is_correct === 1)?.id ?? "",
      explanation: (exp.rows[0]?.content_en as string) ?? null,
    });
  }
  return out;
}

/** Player payload — strips correct-answer info before sending to the browser. */
export function toPlayerPayload(full: FullQuestion[]): PlayerQuestion[] {
  return full.map((q) => ({
    id: q.id,
    text: q.text,
    subject: q.subject,
    topic: q.topic,
    sort_order: q.sort_order,
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
      sort_order: o.sort_order,
    })),
  }));
}

// ---- scoring + persistence -------------------------------------------------
export type SubmitInput = {
  testId: string;
  profileId: string | null;
  answers: Record<string, string>; // questionId -> selectedOptionId
  negativeMarkPerWrong: number;
  timeTakenSeconds: number;
};

export type SubmitResult = {
  attemptId: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  positiveMarks: number;
  negativeMarks: number;
  accuracy: number;
};

export async function scoreAndPersist(
  input: SubmitInput
): Promise<SubmitResult> {
  const db = turso();
  const full = await getTestQuestionsFull(input.testId);

  let correct = 0,
    incorrect = 0,
    unattempted = 0,
    positiveMarks = 0,
    negativeMarks = 0;
  const responses: {
    questionId: string;
    selected: string | null;
    isCorrect: number | null;
    marks: number;
  }[] = [];

  for (const q of full) {
    const sel = input.answers[q.id] ?? null;
    if (!sel) {
      unattempted++;
      responses.push({ questionId: q.id, selected: null, isCorrect: null, marks: 0 });
      continue;
    }
    if (sel === q.correct_option_id) {
      correct++;
      positiveMarks += 1;
      responses.push({ questionId: q.id, selected: sel, isCorrect: 1, marks: 1 });
    } else {
      incorrect++;
      negativeMarks += input.negativeMarkPerWrong;
      responses.push({ questionId: q.id, selected: sel, isCorrect: 0, marks: -input.negativeMarkPerWrong });
    }
  }

  const score = positiveMarks - negativeMarks;
  const attempted = correct + incorrect;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

  const attemptId = randomUUID();
  await db.execute({
    sql: `INSERT INTO attempts (id, profile_id, test_id, attempt_number, status, score, correct_count, incorrect_count,
          unattempted_count, positive_marks, negative_marks, accuracy, time_taken_seconds, is_ranked_attempt,
          started_at, submitted_at)
          VALUES (?,?,?,?, 'submitted',?,?,?,?,?,?,?,?,1, datetime('now'), datetime('now'))`,
    args: [
      attemptId,
      input.profileId ?? "anon",
      input.testId,
      1,
      score,
      correct,
      incorrect,
      unattempted,
      positiveMarks,
      negativeMarks,
      accuracy,
      input.timeTakenSeconds,
    ],
  });

  for (const r of responses) {
    await db.execute({
      sql: `INSERT INTO responses (id, attempt_id, question_id, selected_option_ids, is_correct, marks_awarded)
            VALUES (?,?,?,?,?,?)`,
      args: [
        randomUUID(),
        attemptId,
        r.questionId,
        r.selected ? JSON.stringify([r.selected]) : null,
        r.isCorrect,
        r.marks,
      ],
    });
  }

  return {
    attemptId,
    total: full.length,
    correct,
    incorrect,
    unattempted,
    score,
    positiveMarks,
    negativeMarks,
    accuracy,
  };
}

// ---- result page read ------------------------------------------------------
/** Real-time rank among all submitted attempts for a test. */
export async function getTestRank(
  testId: string,
  score: number
): Promise<{ rank: number; total: number }> {
  const db = turso();
  const r = await db.execute({
    sql: `SELECT COUNT(*) AS total,
          SUM(CASE WHEN score >= ? THEN 1 ELSE 0 END) AS at_or_above
          FROM attempts WHERE test_id=? AND status='submitted'`,
    args: [score, testId],
  });
  const row = r.rows[0];
  return {
    rank: Number(row.at_or_above ?? 1),
    total: Number(row.total ?? 1),
  };
}

export type AttemptRow = {
  id: string;
  testId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  positiveMarks: number;
  negativeMarks: number;
  accuracy: number;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  responses: Record<string, string>; // questionId -> selectedOptionId
};

export async function getAttempt(attemptId: string): Promise<AttemptRow | null> {
  const db = turso();
  const a = await db.execute({
    sql: `SELECT id, test_id, score, correct_count, incorrect_count, unattempted_count,
          positive_marks, negative_marks, accuracy, time_taken_seconds, submitted_at
          FROM attempts WHERE id=?`,
    args: [attemptId],
  });
  if (a.rows.length === 0) return null;
  const row = a.rows[0];
  const r = await db.execute({
    sql: "SELECT question_id, selected_option_ids FROM responses WHERE attempt_id=?",
    args: [attemptId],
  });
  const responses: Record<string, string> = {};
  for (const rr of r.rows) {
    const raw = rr.selected_option_ids as string | null;
    if (raw) {
      try {
        const arr = JSON.parse(raw) as string[];
        responses[rr.question_id as string] = arr[0] ?? "";
      } catch {
        /* ignore */
      }
    }
  }
  return {
    id: row.id as string,
    testId: row.test_id as string,
    score: Number(row.score),
    correctCount: Number(row.correct_count),
    incorrectCount: Number(row.incorrect_count),
    unattemptedCount: Number(row.unattempted_count),
    positiveMarks: Number(row.positive_marks),
    negativeMarks: Number(row.negative_marks),
    accuracy: Number(row.accuracy),
    timeTakenSeconds: row.time_taken_seconds === null ? null : Number(row.time_taken_seconds),
    submittedAt: (row.submitted_at as string) ?? null,
    responses,
  };
}

// ---- leaderboard -----------------------------------------------------------
export type LeaderboardEntry = {
  rank: number;
  attemptId: string;
  profileId: string;
  score: number;
  accuracy: number;
  timeTakenSeconds: number | null;
  correctCount: number;
  submittedAt: string | null;
};

/** Top attempts for a test, best score per student, ranked. */
export async function getLeaderboard(
  testId: string,
  limit = 20
): Promise<LeaderboardEntry[]> {
  const db = turso();
  const r = await db.execute({
    sql: `SELECT id, profile_id, score, accuracy, time_taken_seconds, correct_count, submitted_at
          FROM attempts WHERE test_id=? AND status='submitted'
          ORDER BY score DESC, time_taken_seconds ASC LIMIT 100`,
    args: [testId],
  });
  const seen = new Set<string>();
  const entries: LeaderboardEntry[] = [];
  for (const row of r.rows) {
    const pid = row.profile_id as string;
    if (seen.has(pid)) continue; // best score per student only
    seen.add(pid);
    entries.push({
      rank: entries.length + 1,
      attemptId: row.id as string,
      profileId: pid,
      score: Number(row.score),
      accuracy: Number(row.accuracy),
      timeTakenSeconds:
        row.time_taken_seconds === null ? null : Number(row.time_taken_seconds),
      correctCount: Number(row.correct_count),
      submittedAt: (row.submitted_at as string) ?? null,
    });
    if (entries.length >= limit) break;
  }
  return entries;
}
