"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function typeIcon(type: string) {
  switch ((type || "").toLowerCase()) {
    case "payment":
    case "purchase":
      return "💳";
    case "test":
    case "new_test":
      return "📝";
    case "announcement":
      return "📢";
    case "rank":
      return "🏆";
    default:
      return "🔔";
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setAuthed(true);
    const r = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const j = await r.json();
      setItems(j.items || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/notifications", { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  if (loading)
    return <div className="max-w-container mx-auto px-4 py-12 text-content-muted">Loading…</div>;

  if (!authed)
    return (
      <div className="max-w-container mx-auto px-4 py-16 text-center">
        <p className="text-content-secondary mb-4">Please log in to see your notifications.</p>
        <Link href="/login?redirect=/notifications" className="text-brand-400 font-semibold">Go to login →</Link>
      </div>
    );

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Notifications</h1>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-sm font-semibold text-brand-400 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-surface-1 border border-border-subtle rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">🔕</div>
            <p className="text-content-secondary">You&apos;re all caught up. No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((n) => {
              const inner = (
                <div
                  className={`bg-surface-1 border rounded-2xl p-4 flex gap-3 items-start transition-colors ${
                    n.is_read ? "border-border-subtle" : "border-brand-600/50 bg-brand-500/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-xl shrink-0">
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm">{n.title}</h2>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                    </div>
                    {n.body && <p className="text-sm text-content-secondary mt-0.5">{n.body}</p>}
                    <p className="text-xs text-content-muted mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} className="block hover:opacity-90">
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
