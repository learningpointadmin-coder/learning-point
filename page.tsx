"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/* ============================================================================
   ACCOUNT PAGE — /account
   View profile + edit full name / mobile / state (updates both the profiles
   row and auth user_metadata).
   ============================================================================ */

const STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry", "Other",
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border-subtle last:border-0">
      <span className="text-sm text-content-muted">{label}</span>
      <span className="font-semibold text-right break-all">{value || "—"}</span>
    </div>
  );
}

function inpCls() {
  return "w-full bg-surface-1 border border-border text-content-primary rounded-lg px-4 h-11 focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all duration-fast";
}

export default function AccountPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const meta = (user?.user_metadata || {}) as Record<string, string>;
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [stateVal, setStateVal] = useState("");

  function startEdit() {
    setName(meta.full_name || "");
    setMobile(meta.mobile || "");
    setStateVal(meta.state || "Uttar Pradesh");
    setEditing(true);
    setMsg(null);
    setErr(null);
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Session expired. Please log in again.");

      // 1. update profiles table
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, mobile, state: stateVal }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Update failed");

      // 2. update auth user_metadata
      await supabase.auth.updateUser({ data: { full_name: name, mobile, state: stateVal } });

      setMsg("Profile updated.");
      setEditing(false);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-content-muted animate-pulse">Loading…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-surface-1 border border-border rounded-2xl p-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-extrabold mb-2">Please log in</h1>
          <p className="text-sm text-content-secondary mb-5">
            Log in to view your account details.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg" fullWidth>Go to Login →</Button>
          </Link>
        </div>
      </main>
    );
  }

  const created = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;
  const initials = ((meta.full_name as string) || user.email || "?")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen">
      <section className="max-w-2xl mx-auto px-4 md:px-6 py-10">
        <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2">
          My Account
        </div>
        <h1 className="text-3xl font-extrabold mb-6">Profile</h1>

        <div className="bg-surface-1 border border-border rounded-2xl p-6 mb-4 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold truncate">
              {(meta.full_name as string) || "Aspirant"}
            </div>
            <div className="text-sm text-content-muted truncate">{user.email}</div>
          </div>
        </div>

        {/* Edit form OR read-only view */}
        {editing ? (
          <div className="bg-surface-1 border border-border rounded-2xl px-6 py-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Edit details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">Full Name</label>
                <input className={inpCls()} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">Mobile Number</label>
                <input className={inpCls()} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1.5">State / UT</label>
                <select className={inpCls()} value={stateVal} onChange={(e) => setStateVal(e.target.value)}>
                  {STATES_AND_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {err && <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">{err}</p>}
              {msg && <p className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">{msg}</p>}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" size="lg" fullWidth onClick={() => setEditing(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button variant="primary" size="lg" fullWidth onClick={save} isLoading={busy}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-1 border border-border rounded-2xl px-6 mb-6">
            <Row label="Full Name" value={meta.full_name as string} />
            <Row label="Email" value={user.email} />
            <Row label="Mobile" value={meta.mobile as string} />
            <Row label="State / UT" value={meta.state as string} />
            <Row label="Member Since" value={created} />
            <div className="pt-4">
              <Button variant="secondary" size="sm" onClick={startEdit}>✎ Edit Profile</Button>
            </div>
          </div>
        )}

        {msg && !editing && (
          <p className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2 mb-4">{msg}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="flex-1 min-w-[140px]">
            <Button variant="secondary" size="lg" fullWidth>📊 My Dashboard</Button>
          </Link>
          <Link href="/exams" className="flex-1 min-w-[140px]">
            <Button variant="primary" size="lg" fullWidth>Browse Exams →</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
