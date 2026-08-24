"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type Test = {
  id: string;
  test_series_id: string | null;
  name: string;
  slug: string;
  total_questions: number;
  duration_minutes: number;
  total_marks: number;
  negative_mark_per_wrong: number;
  test_type: string;
  is_published: boolean;
};

const EMPTY = {
  name: "",
  slug: "",
  test_series_id: "",
  total_questions: 15,
  duration_minutes: 20,
  total_marks: 15,
  negative_mark_per_wrong: 0,
  test_type: "free_mock",
  is_published: false,
};

export default function AdminTestsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Test[]>([]);
  const [series, setSeries] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Test | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? null);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    const [t, s] = await Promise.all([
      fetch("/api/admin/tests", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/test-series", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (t.ok) setRows(await t.json());
    if (s.ok) setSeries(await s.json());
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function seriesName(id: string | null) {
    return series.find((s) => s.id === id)?.name ?? "—";
  }

  function startEdit(t: Test) {
    setEditing(t);
    setForm({
      name: t.name,
      slug: t.slug,
      test_series_id: t.test_series_id || "",
      total_questions: t.total_questions,
      duration_minutes: t.duration_minutes,
      total_marks: t.total_marks,
      negative_mark_per_wrong: t.negative_mark_per_wrong,
      test_type: t.test_type,
      is_published: t.is_published,
    });
  }

  async function save() {
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      const payload = { ...form };
      if (!payload.test_series_id) delete payload.test_series_id;
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/admin/tests/${editing.id}` : "/api/admin/tests";
      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Save failed");
      setMsg(editing ? "Test updated." : "Test created.");
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(t: Test) {
    if (!token) return;
    await fetch(`/api/admin/tests/${t.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !t.is_published }),
    });
    await load();
  }

  async function del(id: string) {
    if (!token || !confirm("Delete this test?")) return;
    await fetch(`/api/admin/tests/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await load();
  }

  if (!token) return <p style={{ color: "#64748b" }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manage Tests</h1>

      <div style={card}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{editing ? "Edit Test" : "Add New Test"}</h2>
        <Grid>
          <Field label="Name"><input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug"><input style={inp} value={form.slug} placeholder="vdo-free-mock" onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Test Series">
            <select style={inp} value={form.test_series_id} onChange={(e) => setForm({ ...form, test_series_id: e.target.value })}>
              <option value="">— none —</option>
              {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select style={inp} value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })}>
              <option value="free_mock">free_mock</option>
              <option value="full_mock">full_mock</option>
              <option value="sectional">sectional</option>
              <option value="previous_year">previous_year</option>
            </select>
          </Field>
          <Field label="Questions"><input type="number" style={inp} value={form.total_questions} onChange={(e) => setForm({ ...form, total_questions: Number(e.target.value) })} /></Field>
          <Field label="Duration (min)"><input type="number" style={inp} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></Field>
          <Field label="Total Marks"><input type="number" style={inp} value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })} /></Field>
          <Field label="Negative / wrong"><input type="number" step="0.25" style={inp} value={form.negative_mark_per_wrong} onChange={(e) => setForm({ ...form, negative_mark_per_wrong: Number(e.target.value) })} /></Field>
          <Field label="Published"><input type="checkbox" style={{ width: 20, height: 20, marginTop: 8 }} checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /></Field>
        </Grid>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={btnPrimary} disabled={busy} onClick={save}>{busy ? "Saving…" : editing ? "Update" : "Create Test"}</button>
          {editing && <button style={btnGhost} onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
        {msg && <p style={{ marginTop: 8, fontSize: 13, color: msg.startsWith("Error") ? "#b91c1c" : "#15803d" }}>{msg}</p>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={th}>Name</th>
            <th style={th}>Type</th>
            <th style={th}>Qs</th>
            <th style={th}>Min</th>
            <th style={th}>Series</th>
            <th style={th}>Status</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={td}>{t.name}</td>
              <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{t.test_type}</td>
              <td style={td}>{t.total_questions}</td>
              <td style={td}>{t.duration_minutes}</td>
              <td style={{ ...td, color: "#64748b", fontSize: 12 }}>{seriesName(t.test_series_id)}</td>
              <td style={td}><span style={t.is_published ? badgeGreen : badgeGray}>{t.is_published ? "Live" : "Hidden"}</span></td>
              <td style={td}>
                <button style={btnSmall} onClick={() => startEdit(t)}>Edit</button>{" "}
                <button style={btnSmall} onClick={() => togglePublish(t)}>{t.is_published ? "Hide" : "Publish"}</button>{" "}
                <button style={{ ...btnSmall, color: "#b91c1c" }} onClick={() => del(t.id)}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 };
const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "8px 16px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 16px", background: "transparent", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, cursor: "pointer" };
const btnSmall: React.CSSProperties = { padding: "4px 8px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 11, cursor: "pointer" };
const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 600, color: "#475569" };
const td: React.CSSProperties = { padding: "8px 10px", color: "#1e293b" };
const badgeGreen: React.CSSProperties = { background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontSize: 11 };
const badgeGray: React.CSSProperties = { background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 10, fontSize: 11 };

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 10 }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label style={{ display: "block" }}><span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</span>{children}</label>);
}
