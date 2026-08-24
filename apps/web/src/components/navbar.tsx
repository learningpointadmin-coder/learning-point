"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NotificationBell } from "@/components/notification-bell";
import { useLang } from "@/components/language-provider";
import { LangToggle } from "@/components/lang-toggle";

/* ============================================================================
   NAVBAR (global, in root layout)
   Sticky top bar — logo + nav links + auth-aware right side.
   Logged out  -> "Login" button
   Logged in   -> "Hi, {name}" + "Logout" button
   Mobile      -> hamburger toggles a dropdown panel
   ============================================================================ */

const NAV_LINKS = [
  { href: "/courses", key: "nav.courses" },
  { href: "/exams", key: "nav.exams" },
  { href: "/free-tests", key: "nav.freeTests" },
  { href: "/study-material", key: "nav.material" },
];

const LOGIN_BTN =
  "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-base bg-gradient-primary text-white shadow-md hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 h-9 px-3.5 text-sm";

const LOGOUT_BTN =
  "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-base border border-border bg-surface-2 text-content-secondary hover:text-content-primary hover:border-brand-600 h-9 px-3.5 text-sm";

export function Navbar() {
  const { user, loading } = useCurrentUser();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || "Account";

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border-subtle sticky top-0 backdrop-blur-md bg-base/80 z-50">
      <nav className="max-w-container mx-auto flex items-center justify-between h-header px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg shrink-0">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black text-white"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 0 18px rgba(16,185,129,.4)",
            }}
          >
            LP
          </span>
          <span className="hidden sm:inline">Learning Point</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {user && (
            <Link href="/dashboard" className="text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors">
              {t("nav.dashboard")}
            </Link>
          )}
          {user && (
            <Link href="/admin" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">
              {t("nav.admin")}
            </Link>
          )}
          {NAV_LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
            >
              {t(l.key)}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <LangToggle />
          {!loading &&
            (user ? (
              <>
                <Link href="/account" className="text-sm text-content-secondary max-w-[150px] truncate hover:text-content-primary transition-colors">
                  {t("nav.hi")}, {name}
                </Link>
                <NotificationBell />
                <button type="button" onClick={handleLogout} className={LOGOUT_BTN}>
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link href="/login" className={LOGIN_BTN}>
                {t("nav.login")}
              </Link>
            ))}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface-2 text-content-secondary"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border-subtle bg-base">
          <div className="max-w-container mx-auto px-4 py-3 flex flex-col gap-1">
            <div className="py-1 px-2 mb-1">
              <LangToggle />
            </div>
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="py-2.5 px-2 text-sm font-semibold text-brand-300 rounded-lg hover:bg-surface-2 transition-colors"
              >
                {t("nav.dashboard")}
              </Link>
            )}
            {user && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="py-2.5 px-2 text-sm font-medium text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-2 transition-colors"
              >
                {t("nav.admin")}
              </Link>
            )}
            {NAV_LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 px-2 text-sm font-medium text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-2 transition-colors"
              >
                {t(l.key)}
              </Link>
            ))}

            <div className="h-px my-2" style={{ background: "var(--border-subtle)" }} />

            {!loading &&
              (user ? (
                <div className="flex items-center justify-between gap-3 px-2 py-2">
                  <Link href="/account" onClick={() => setOpen(false)} className="text-sm text-content-secondary truncate hover:text-content-primary">
                    {t("nav.hi")}, {name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <button type="button" onClick={handleLogout} className={LOGOUT_BTN}>
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center font-semibold rounded-lg bg-gradient-primary text-white h-9 px-3.5 text-sm mt-1"
                >
                  {t("nav.login")}
                </Link>
              ))}
          </div>
        </div>
      )}
    </header>
  );
}
