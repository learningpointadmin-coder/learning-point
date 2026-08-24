"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

/* ============================================================================
   NOTIFICATION BELL — shows unread count badge, links to /notifications.
   Polls once on mount (and refetches when the tab regains focus).
   ============================================================================ */

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const r = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const j = await r.json();
          if (active) setUnread(j.unread || 0);
        }
      } catch {
        /* ignore */
      }
    }
    load();
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface-2 text-content-secondary hover:text-content-primary transition-colors"
    >
      <span className="text-base">🔔</span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
