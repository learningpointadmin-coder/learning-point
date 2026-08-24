import { supaCount } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default async function AdminDashboard() {
  const [exams, tests, questions, payments, profiles] = await Promise.all([
    supaCount("exams"),
    supaCount("tests"),
    Promise.resolve("Turso"),
    supaCount("payments"),
    supaCount("profiles"),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
        Admin Dashboard
      </h1>
      <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>
        Manage exams, tests, questions and monitor the platform.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 }}>
        <Stat label="Exams" value={exams} />
        <Stat label="Tests" value={tests} />
        <Stat label="Questions" value="Turso DB" />
        <Stat label="Payments" value={payments} />
        <Stat label="Profiles" value={profiles} />
      </div>

      <div style={{ marginTop: 32, padding: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
          Quick actions
        </h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="/admin/exams" style={linkBtn}>Manage Exams</a>
          <a href="/admin/tests" style={linkBtn}>Manage Tests</a>
          <a href="/admin/questions" style={linkBtn}>Generate Questions</a>
        </div>
      </div>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#0ea5e9",
  color: "#fff",
  borderRadius: 8,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
};
