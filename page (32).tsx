"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type Test = { id: string; name: string; slug: string };
type Q = {
  id: string;
  question_text_en: string;
  subject: string;
  topic: string | null;
  difficulty: string;
  source_type: string;
  opt_count: number;
  correct_count: number;
};

export default function AdminQuestionsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [testId, setTestId] = useState("");
  const [rows, setRows] = useState<Q[]>([]);
  const [count, setCount] = useState(0);
  const [genCount, setGenCount] = useState(15);
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? null);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const r = await fetch("/api/admin/tests", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const t = await r.json();
        setTests(t);
        if (t[0]) setTestId(t[0].id);
      }
    })();
  }, [token]);

  const loadQuestions = useCallback(async () => {
    if (!token || !testId) return;
    setBusy(true);
    const r = await fetch(`/api/admin/questions?testId=${testId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const j = await r.json();
      setRows(j.rows || []);
      setCount(j.count || 0);
    }
    setBusy(false);
  }, [token, testId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function generate() {
    if (!token || !testId) return;
    setGenBusy(true);
    setMsg("Generating — this can take 20-40s…");
    try {
      const r = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ testId, count: genCount, focus }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Generate failed");
      setMsg(`Done. Test now has ${j.total} questions.`);
      await loadQuestions();
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setGenBusy(false);
    }
  }

  async function del(id: string) {
    if (!token || !confirm("Delete this question permanently?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await loadQuestions();
  }

  if (!token) return <p style={{ color: "#64748b" }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Questions & AI Generation</h1>

      <div style={card}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Select Test">
            <select style={{ ...inp, minWidth: 260 }} value={testId} onChange={(e) => setTestId(e.target.value)}>
              {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <div style={{ fontSize: 13, color: "#64748b", paddingBottom: 10 }}>
            {count} question{count !== 1 ? "s" : ""} in this test
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: 16, background: "#eff6ff", borderColor: "#bfdbfe" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>⚡ AI Generate Questions</h2>
        <p style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
          Gemini generates fresh MCQs for the selected test. Set how many questions the test should have
          in total — it fills up to that number.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Target total questions">
            <input type="number" style={{ ...inp, width: 120 }} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} />
          </Field>
          <Field label="Focus / instructions (exam + subjects)">
            <input style={{ ...inp, minWidth: 320 }} value={focus} placeholder="UPSSSC VDO — GK, Hindi, Maths, Reasoning" onChange={(e) => setFocus(e.target.value)} />
          </Field>
          <button style={btnPrimary} disabled={genBusy} onClick={generate}>
            {genBusy ? "Generating…" : "Generate"}
          </button>
        </div>
        {msg && <p style={{ marginTop: 10, fontSize: 13, color: msg.startsWith("Error") ? "#b91c1c" : "#15803d" }}>{msg}</p>}
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Questions in test</h2>
      {busy ? (
        <p style={{ color: "#64748b" }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>No questions yet. Use AI generate above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((q, i) => (
            <div key={q.id} style={{ ...card, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "#0ea5e9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>{q.question_text_en}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <Tag color="#64748b" bg="#f1f5f9">{q.subject}</Tag>
                  {q.topic && <Tag color="#64748b" bg="#f1f5f9">{q.topic}</Tag>}
                  <Tag color="#1e40af" bg="#dbeafe">{q.difficulty}</Tag>
                  <Tag color="#7c3aed" bg="#f3e8ff">{q.source_type}</Tag>
                  {q.correct_count === 1 ? (
                    <Tag color="#15803d" bg="#dcfce7">4 options ✓</Tag>
                  ) : (
                    <Tag color="#b91c1c" bg="#fee2e2">{q.correct_count} correct / {q.opt_count} opts</Tag>
                  )}
                </div>
              </div>
              <button style={{ ...btnSmall, color: "#b91c1c", flexShrink: 0 }} onClick={() => del(q.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const inp: React.CSSProperties = { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "8px 16px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSmall: React.CSSProperties = { padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 11, cursor: "pointer" };

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>{children}</span>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label style={{ display: "block" }}><span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</span>{children}</label>);
}
