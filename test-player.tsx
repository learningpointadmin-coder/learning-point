"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { QuestionReportButton } from "@/components/question-report-button";
import { useLang } from "@/components/language-provider";

/* ============================================================================
   TEST PLAYER — the live test interface
   Timer · single-choice options · question palette · mark for review · submit
   Answers sent to /api/test/[id]/submit for server-side scoring.
   ============================================================================ */

type Opt = { id: string; text: string; sort_order: number };
type Q = {
  id: string;
  text: string;
  subject: string | null;
  topic: string | null;
  sort_order: number;
  options: Opt[];
};

export function TestPlayer({
  testId,
  slug,
  testName,
  durationMinutes,
}: {
  testId: string;
  slug: string;
  testName: string;
  durationMinutes: number;
}) {
  const router = useRouter();
  const { t } = useLang();
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const profileIdRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  const [gated, setGated] = useState<null | "login" | "purchase">(null);

  // load questions + user
  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        const res = await fetch(`/api/test/${testId}/questions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.gated === "login") {
            setGated("login");
            setLoading(false);
            return;
          }
          if (data.gated === "purchase") {
            setGated("purchase");
            setLoading(false);
            return;
          }
          throw new Error(data.error || "Failed to load questions");
        }
        const qs: Q[] = (data.questions as Q[]).sort(
          (a, b) => a.sort_order - b.sort_order
        );
        setQuestions(qs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    supabase.auth.getUser().then(({ data }) => {
      profileIdRef.current = data.user?.id ?? null;
    });
  }, [testId]);

  // countdown timer
  useEffect(() => {
    if (loading || error) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [loading, error]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const timeTaken = durationMinutes * 60 - timeLeft;
        const res = await fetch(`/api/test/${testId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            timeTakenSeconds: Math.max(0, timeTaken),
            profileId: profileIdRef.current,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submit failed");
        router.push(`/test/${slug}/result?attempt=${data.attemptId}`);
      } catch (e: any) {
        submittedRef.current = false;
        setSubmitting(false);
        setError(e.message + (auto ? " (auto-submit failed)" : ""));
      }
    },
    [answers, timeLeft, testId, slug, durationMinutes]
  );

  // auto-submit on timeout
  useEffect(() => {
    if (timeLeft <= 0 && !submittedRef.current && questions.length > 0) {
      submit(true);
    }
  }, [timeLeft, questions.length, submit]);

  // ---------- render states ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-content-secondary">{t("test.loading")}</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="font-bold text-lg mb-2">Couldn&apos;t load</h2>
          <p className="text-sm text-content-secondary mb-4">{error}</p>
          <a href="/exams" className="text-brand-400 font-semibold">← Back to exams</a>
        </div>
      </div>
    );
  }
  if (gated === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-3xl mb-3">🔐</div>
          <h2 className="font-bold text-lg mb-2">{t("common.loginRequired")}</h2>
          <p className="text-sm text-content-secondary mb-4">
            This is a premium test. Please log in to continue.
          </p>
          <a href={`/login?redirect=/test/${slug}`} className="inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-9 px-4 text-sm">
            Go to Login
          </a>
        </div>
      </div>
    );
  }
  if (gated === "purchase") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-3xl mb-3">🔒</div>
          <h2 className="font-bold text-lg mb-2">{t("common.premium")}</h2>
          <p className="text-sm text-content-secondary mb-4">
            This full-length mock is part of the paid bundle. Unlock all tests for this exam.
          </p>
          <a href="/exams" className="inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-9 px-4 text-sm">
            {t("common.viewBundles")}
          </a>
        </div>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-3xl mb-3">📭</div>
          <h2 className="font-bold text-lg mb-2">No questions yet</h2>
          <p className="text-sm text-content-secondary mb-4">
            Questions for this test are being added. Try the free demo test.
          </p>
          <a href="/exams" className="text-brand-400 font-semibold">← Back to exams</a>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const total = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const mm = String(Math.floor(Math.max(0, timeLeft) / 60)).padStart(2, "0");
  const ss = String(Math.max(0, timeLeft) % 60).padStart(2, "0");
  const lowTime = timeLeft <= 60;

  function selectOption(qid: string, oid: string) {
    setAnswers((a) => ({ ...a, [qid]: oid }));
  }
  function toggleMark(qid: string) {
    setMarked((m) => {
      const n = new Set(m);
      n.has(qid) ? n.delete(qid) : n.add(qid);
      return n;
    });
  }
  function paletteClass(idx: number, qid: string) {
    const isCurrent = idx === current;
    const isAnswered = !!answers[qid];
    const isMarked = marked.has(qid);
    const base = "h-9 w-9 rounded-lg text-sm font-semibold transition-all ";
    if (isCurrent) return base + "ring-2 ring-brand-400 ";
    if (isMarked && isAnswered) return base + "bg-purple-500/30 text-purple-200 border border-purple-500/50 ";
    if (isMarked) return base + "bg-purple-500/20 text-purple-200 border border-purple-500/40 ";
    if (isAnswered) return base + "bg-brand-500/25 text-brand-200 border border-brand-500/50 ";
    return base + "bg-surface-2 text-content-muted border border-border-subtle ";
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== TOP BAR ===== */}
      <header className="sticky top-0 z-30 bg-base/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="font-bold truncate hidden sm:block">{testName}</div>
          <div className={`font-mono font-bold text-lg tabular-nums ${lowTime ? "text-error" : "text-brand-300"}`}>
            {lowTime ? "⏰ " : "⏱ "}
            {mm}:{ss}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm font-semibold bg-gradient-primary text-white rounded-lg px-3.5 h-9"
          >
            {t("test.submit")}
          </button>
          <button
            onClick={() => setShowPalette((v) => !v)}
            className="lg:hidden text-sm font-semibold border border-border bg-surface-2 rounded-lg px-3 h-9"
          >
            ☰ Palette
          </button>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 py-6 grid lg:grid-cols-[1fr_300px] gap-6 flex-1">
        {/* ===== QUESTION AREA ===== */}
        <main>
          <div className="bg-surface-1 border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-300">
                {t("test.question")} {current + 1} {t("test.of")} {total}
              </span>
              {q.subject && (
                <span className="text-xs text-content-muted bg-surface-2 rounded-full px-3 py-1">
                  {q.subject}{q.topic ? ` · ${q.topic}` : ""}
                </span>
              )}
            </div>
            <div className="flex justify-end -mt-2 mb-3">
              <QuestionReportButton questionId={q.id} testId={testId} />
            </div>

            <p className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{q.text}</p>

            <div className="space-y-3">
              {q.options.map((o, i) => {
                const selected = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => selectOption(q.id, o.id)}
                    className={`w-full text-left flex items-center gap-3 rounded-xl border p-4 transition-all ${
                      selected
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-border-subtle bg-surface-2 hover:border-border"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        selected ? "bg-brand-500 text-white" : "bg-surface-3 text-content-secondary"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm">{o.text}</span>
                  </button>
                );
              })}
            </div>

            {/* per-question actions */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                onClick={() => toggleMark(q.id)}
                className={`text-sm font-semibold rounded-lg px-3.5 h-9 border transition-colors ${
                  marked.has(q.id)
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
                    : "bg-surface-2 border-border text-content-secondary"
                }`}
              >
                {marked.has(q.id) ? t("test.marked") : t("test.mark")}
              </button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  {t("test.prev")}
                </Button>
                {current < total - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                  >
                    {t("test.next")}
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setShowConfirm(true)}>
                    {t("test.review")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ===== PALETTE (desktop sidebar) ===== */}
        <aside className={`${showPalette ? "block" : "hidden"} lg:block`}>
          <div className="bg-surface-1 border border-border rounded-2xl p-5 lg:sticky lg:top-20">
            <h3 className="font-bold mb-3">{t("test.palette")}</h3>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-2 mb-4">
              {questions.map((qq, i) => (
                <button
                  key={qq.id}
                  onClick={() => {
                    setCurrent(i);
                    setShowPalette(false);
                  }}
                  className={paletteClass(i, qq.id)}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* legend */}
            <div className="space-y-1.5 text-xs text-content-muted mb-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-brand-500/40 border border-brand-500/50" /> {t("test.answered")} ({answeredCount})</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500/50" /> {t("test.marked2")} ({marked.size})</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-surface-2 border border-border-subtle" /> {t("test.notVisited")}</div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setShowConfirm(true)}
              isLoading={submitting}
            >
              {t("test.submitTest")}
            </Button>
          </div>
        </aside>
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-surface-1 border border-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-extrabold text-lg mb-2">{t("test.submitTitle")}</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
              <div className="bg-surface-2 rounded-lg p-2">
                <div className="font-bold text-brand-300">{answeredCount}</div>
                <div className="text-xs text-content-muted">{t("test.answered")}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-2">
                <div className="font-bold text-purple-300">{marked.size}</div>
                <div className="text-xs text-content-muted">{t("test.marked2")}</div>
              </div>
              <div className="bg-surface-2 rounded-lg p-2">
                <div className="font-bold text-content-secondary">{total - answeredCount}</div>
                <div className="text-xs text-content-muted">{t("test.skipped")}</div>
              </div>
            </div>
            <p className="text-sm text-content-secondary mb-5">
              You won&apos;t be able to change answers after submitting. View score &amp; solutions instantly.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" fullWidth onClick={() => setShowConfirm(false)}>
                {t("test.keepSolving")}
              </Button>
              <Button variant="primary" size="lg" fullWidth isLoading={submitting} onClick={() => submit(false)}>
                {t("test.submitNow")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
