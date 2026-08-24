"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type State = "loading" | "nologin" | "denied" | "ok";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/exams", label: "Exams", icon: "📚" },
  { href: "/admin/tests", label: "Tests", icon: "📝" },
  { href: "/admin/questions", label: "Questions", icon: "❓" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return setState("nologin");
      try {
        const r = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (j.admin) {
          setName(j.full_name || j.email || "Admin");
          setState("ok");
        } else setState("denied");
      } catch {
        setState("denied");
      }
    })();
  }, []);

  if (state === "loading")
    return <div style={{ padding: 40, color: "#64748b" }}>Checking admin access…</div>;

  if (state === "nologin")
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#475569", marginBottom: 16 }}>Admin access requires login.</p>
        <Link
          href="/login?redirect=/admin"
          style={{ color: "#0ea5e9", textDecoration: "underline", fontWeight: 600 }}
        >
          Go to login →
        </Link>
      </div>
    );

  if (state === "denied")
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "#b91c1c", marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: "#475569" }}>Your account is not registered as staff.</p>
      </div>
    );

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
      <aside
        style={{
          width: 220,
          borderRight: "1px solid #e2e8f0",
          background: "#f8fafc",
          padding: "16px 0",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 16px 12px", borderBottom: "1px solid #e2e8f0", marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Admin
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{name}</div>
        </div>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              color: "#334155",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <span style={{ width: 18, textAlign: "center" }}>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </aside>
      <main style={{ flex: 1, padding: 24, overflowX: "auto" }}>{children}</main>
    </div>
  );
}
