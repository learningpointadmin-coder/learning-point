"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ============================================================================
   FORGOT PASSWORD — /forgot-password
   Sends a Supabase password-recovery email. User clicks the link → /reset-password
   ============================================================================ */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
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
          <h1 className="text-2xl font-extrabold mb-1">Reset your password</h1>
          <p className="text-sm text-content-secondary mb-6">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>

          {sent ? (
            <div className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-4 py-4">
              <p className="font-semibold mb-1">✅ Check your inbox</p>
              <p className="text-content-secondary">
                If an account exists for <strong>{email}</strong>, a reset link is on its way.
                Click the link in the email to choose a new password.
              </p>
              <Link href="/login" className="inline-block mt-3 text-brand-400 font-semibold hover:underline">
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {error && (
                <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </div>

        <p className="text-xs text-content-muted text-center mt-5">
          <Link href="/login" className="hover:text-content-secondary">← Back to login</Link>
        </p>
      </div>
    </main>
  );
}
