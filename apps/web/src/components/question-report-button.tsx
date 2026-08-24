"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* ============================================================================
   QUESTION REPORT BUTTON
   Small flag control. Opens a modal to report an issue with the question
   (wrong answer, ambiguity, typo, etc.). Submits to /api/report-question.
   ============================================================================ */

const REASONS = [
  { value: "wrong_answer", label: "Wrong answer / key" },
  { value: "multiple_correct", label: "More than one correct answer" },
  { value: "explanation_error", label: "Explanation is wrong" },
  { value: "formatting", label: "Typo / formatting error" },
  { value: "out_of_syllabus", label: "Out of syllabus" },
  { value: "other", label: "Other" },
];

export function QuestionReportButton({
  questionId,
  testId,
  attemptId,
}: {
  questionId: string;
  testId: string;
  attemptId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("Please log in to report.");
        setBusy(false);
        return;
      }
      const r = await fetch("/api/report-question", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, testId, category: reason, comment, attemptId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setDone(false);
    setComment("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Report an issue with this question"
        className="text-xs font-medium text-content-muted hover:text-amber-400 transition-colors inline-flex items-center gap-1"
      >
        🚩 Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={close}
        >
          <div
            className="bg-surface-1 border border-border rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-bold text-lg mb-1">Report submitted</h3>
                <p className="text-sm text-content-secondary mb-4">
                  Thanks! Our team will review this question.
                </p>
                <button
                  onClick={close}
                  className="inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-9 px-5 text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-1">Report this question</h3>
                <p className="text-sm text-content-secondary mb-4">
                  Help us improve. What&apos;s the issue?
                </p>
                <div className="space-y-2 mb-3">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ${
                        reason === r.value
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-border-subtle bg-surface-2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-brand-500"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add details (optional)"
                  className="w-full bg-surface-2 border border-border-subtle rounded-lg p-3 text-sm mb-3 resize-none focus:outline-none focus:border-brand-500"
                  rows={3}
                />
                {error && <p className="text-xs text-error mb-3">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={close}
                    className="flex-1 font-semibold rounded-lg border border-border bg-surface-2 text-content-secondary h-9 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-9 text-sm disabled:opacity-60"
                  >
                    {busy ? "Sending…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
