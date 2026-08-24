"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ============================================================================
   LOGIN / SIGNUP PAGE
   Email + password auth via Supabase (captcha disabled for dev).
   On signup, full_name/mobile/state are passed as user_metadata — the
   handle_new_user trigger creates the profile row.
   ============================================================================ */

const STATES_AND_UTS = [
  // 28 States
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
  // 8 Union Territories
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
  "Other",
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [state, setState] = useState("Uttar Pradesh");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, mobile, state } },
        });
        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }
        setMessage("Account created! Check your email to confirm, then login.");
        switchMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
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

        {/* Card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-7 shadow-lg">
          <h1 className="text-2xl font-extrabold mb-1">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-content-secondary mb-6">
            {isSignup
              ? "Start your preparation journey today."
              : "Login to access your tests and progress."}
          </p>

          {/* Tab toggle */}
          <div className="flex bg-surface-2 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                !isSignup ? "bg-surface-3 text-content-primary shadow-sm" : "text-content-muted"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                isSignup ? "bg-surface-3 text-content-primary shadow-sm" : "text-content-muted"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <Input
                  label="Full Name"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                />
                <Input
                  label="Mobile Number"
                  name="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="98765 43210"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1.5">State / UT</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-surface-1 border border-border text-content-primary rounded-lg px-4 h-11 focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all duration-fast"
                  >
                    {STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {/* Password with show/hide toggle + example hint */}
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-surface-1 border border-border text-content-primary placeholder-content-muted rounded-lg px-4 h-11 pr-16 transition-all duration-fast focus:outline-none focus:border-brand-500 focus:shadow-glow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-content-muted hover:text-brand-400 bg-surface-2 border border-border rounded px-2 py-1 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-content-muted">
                Example: <span className="text-brand-300 font-medium">Reacher@1995</span>
              </p>
            </div>

            {!isSignup && (
              <div className="text-right -mt-2">
                <Link href="/forgot-password" className="text-xs font-semibold text-brand-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <p className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">{message}</p>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
              {isSignup ? "Create Account" : "Login"}
            </Button>
          </form>

          <p className="text-xs text-content-muted text-center mt-5">
            {isSignup ? "Already have an account? " : "New here? "}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? "login" : "signup")}
              className="text-brand-400 font-semibold hover:underline"
            >
              {isSignup ? "Login instead" : "Create an account"}
            </button>
          </p>
        </div>

        <p className="text-xs text-content-muted text-center mt-5">
          <Link href="/" className="hover:text-content-secondary">← Back to home</Link>
        </p>
      </div>
    </main>
  );
}
