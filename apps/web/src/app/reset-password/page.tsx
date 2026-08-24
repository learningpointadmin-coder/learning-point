"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/* ============================================================================
   RESET PASSWORD — /reset-password
   Landed via the Supabase recovery email link. A recovery session is present;
   the user sets a new password via updateUser().
   ============================================================================ */

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery token in the URL is exchanged for a session by supabase-js
    // on init (detectSessionInUrl). Give it a tick then check.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setReady(true);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // sign out the recovery session after a short delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2.5 font-extrabold text-xl">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black text-white"
              style={{ background: "linear-gradient(135deg,#10b981,#0ea5e9)" }}
            >
              LP
            </span>
            Learning Point
          </Link>
        </div>

        <div className="bg-surface-1 border border-border rounded-2xl p-7 shadow-lg">
          {!ready ? (
            <p className="text-sm text-content-secondary text-center py-6">Verifying your link…</p>
          ) : !hasSession ? (
            <>
              <h1 className="text-2xl font-extrabold mb-2">Link invalid or expired</h1>
              <p className="text-sm text-content-secondary mb-5">
                This password reset link is no longer valid. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center w-full font-semibold rounded-lg bg-gradient-primary text-white h-11"
              >
                Request new link
              </Link>
            </>
          ) : done ? (
            <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-4 py-4 text-center">
              <p className="font-semibold mb-1">✅ Password updated!</p>
              <p className="text-content-secondary">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold mb-1">Set a new password</h1>
              <p className="text-sm text-content-secondary mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-surface-1 border border-border text-content-primary placeholder-content-muted rounded-lg px-4 h-11 pr-16 transition-all duration-fast focus:outline-none focus:border-brand-500 focus:shadow-glow"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-content-muted hover:text-brand-400 bg-surface-2 border border-border rounded px-2 py-1"
                      tabIndex={-1}
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">Confirm Password</label>
                  <input
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="w-full bg-surface-1 border border-border text-content-primary placeholder-content-muted rounded-lg px-4 h-11 transition-all duration-fast focus:outline-none focus:border-brand-500 focus:shadow-glow"
                  />
                </div>
                {error && (
                  <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
                  Update Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
