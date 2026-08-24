"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type Exam = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string | null;
  icon: string | null;
  is_published: boolean;
  sort_order: number | null;
};

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  accent_color: "#0ea5e9",
  icon: "📘",
  is_published: true,
  sort_order: 10,
};

export default function AdminExamsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Exam[]>([]);
  const [editing, setEditing] = useState<Exam | null>(null);
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
    const r = await fetch("/api/admin/exams", { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setRows(await r.json());
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(e: Exam) {
    setEditing(e);
    setForm({
      name: e.name,
      slug: e.slug,
      description: e.description || "",
      accent_color: e.accent_color || "#0ea5e9",
      icon: e.icon || "📘",
      is_published: e.is_published,
      sort_order: e.sort_order ?? 10,
    });
  }

  async function save() {
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/admin/exams/${editing.id}` : "/api/admin/exams";
      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error || "Save failed");
      }
      setMsg(editing ? "Exam updated." : "Exam created.");
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!token || !confirm("Delete this exam? Tests under it remain but become orphans.")) return;
    await fetch(`/api/admin/exams/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  if (!token) return <p style={{ color: "#64748b" }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manage Exams</h1>

      <div style={card}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          {editing ? "Edit Exam" : "Add New Exam"}
        </h2>
        <Row>
          <Field label="Name">
            <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Slug">
            <input style={inp} value={form.slug} placeholder="upsssc-vdo" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <Field label="Icon">
            <input style={{ ...inp, width: 80 }} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </Field>
          <Field label="Color">
            <input type="color" style={{ width: 50, height: 36, border: "none" }} value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
          </Field>
          <Field label="Sort">
            <input type="number" style={{ ...inp, width: 80 }} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </Field>
          <Field label="Published">
            <input type="checkbox" style={{ width: 20, height: 20, marginTop: 8 }} checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          </Field>
        </Row>
        <Field label="Description">
          <textarea style={{ ...inp, minHeight: 60 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={btnPrimary} disabled={busy} onClick={save}>
            {busy ? "Saving…" : editing ? "Update" : "Create Exam"}
          </button>
          {editing && (
            <button
              style={btnGhost}
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {msg && <p style={{ marginTop: 8, fontSize: 13, color: msg.startsWith("Error") ? "#b91c1c" : "#15803d" }}>{msg}</p>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={th}>Name</th>
            <th style={th}>Slug</th>
            <th style={th}>Sort</th>
            <th style={th}>Status</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={td}>
                <span style={{ marginRight: 6 }}>{e.icon}</span>
                {e.name}
              </td>
              <td style={{ ...td, color: "#94a3b8", fontFamily: "monospace" }}>{e.slug}</td>
              <td style={td}>{e.sort_order}</td>
              <td style={td}>
                <span style={e.is_published ? badgeGreen : badgeGray}>
                  {e.is_published ? "Published" : "Hidden"}
                </span>
              </td>
              <td style={td}>
                <button style={btnSmall} onClick={() => startEdit(e)}>Edit</button>{" "}
                <button style={{ ...btnSmall, color: "#b91c1c" }} onClick={() => del(e.id)}>Delete</button>
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
const btnSmall: React.CSSProperties = { padding: "4px 10px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 12, cursor: "pointer" };
const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 600, color: "#475569" };
const td: React.CSSProperties = { padding: "8px 10px", color: "#1e293b" };
const badgeGreen: React.CSSProperties = { background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontSize: 11 };
const badgeGray: React.CSSProperties = { background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 10, fontSize: 11 };

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 10 }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}
