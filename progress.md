# Learning Point — Build Progress (autonomous session, 2026-08-24)

## ✅ What works right now (production-tested)

### Phase 1–2: Auth + Public content
- **Login / Signup** (`/login`) — email+password, show/hide password, example hint, all 28 states + 8 UTs. Email confirmation ON. Captcha disabled for dev. Auto-redirect to home on login.
- **Global Navbar** — logo, nav links, auth-aware (Login button when logged out; "Hi, {name}" + Logout when logged in), mobile hamburger menu, Dashboard link for logged-in users.
- **Exams listing** (`/exams`) — 6 published exams from Supabase (real data).

### Phase 5: Test Engine (the core — fully working end-to-end) 🎯
- **Exam detail** (`/exams/[slug]`) — shows **real published tests** from Supabase (course → test_series → tests), playable tests link to the test engine.
- **Test launch** (`/test/[slug]`) — overview, stats (questions/duration/marks/negative marking), instructions, Start button.
- **Test player** (`/test/[slug]/play`) — live timer (auto-submit on timeout), single-choice options, **question palette** (answered/marked/not-visited), mark-for-review, prev/next, submit confirmation modal. Mobile-responsive.
- **Scoring** — done **server-side** (`/api/test/[id]/submit`); correct answers never reach the browser. Negative marking read from test config.
- **Results** (`/test/[slug]/result?attempt=`) — score hero, stats (correct/incorrect/skipped/accuracy), **real-time rank** ("ranked #X of Y"), full per-question solutions with correct-answer highlighting + **explanations**.
- **Persistence** — every attempt + per-question responses saved to **Turso** (`attempts`, `responses`).

### Student dashboard (`/dashboard`)
- Greeting, performance stats (tests taken, avg accuracy, best score), recent attempts list (clickable → result), empty state with CTA. Login-gated.

### Leaderboard (`/test/[slug]/leaderboard`) 🏆
- Top scorers per test (best score per student), **medals for top 3**, names resolved from Supabase profiles (cross-DB: Turso attempts + Supabase profiles), score / accuracy / time columns. Empty state ("claim #1"). Linked from launch + result pages. Verified with a real user (Satyam Singh → 🥇).

### Free Tests hub (`/free-tests`)
- All playable tests across exams in one grid (Start + Ranks links).

### Account (`/account`)
- View-only profile: avatar + initials, name, email, mobile, state, member-since. Login-gated. Greeting in navbar links here.

### Payment (Phase 6) — Razorpay wired ✅
- **LIVE keys** connected (validated: real order created). `src/lib/razorpay.ts` (create-order + HMAC signature verify, key secret server-only).
- `/api/payment/create-order` — resolves exam → test series + price, creates a Razorpay order.
- `/api/payment/verify` — verifies signature, logs to `payments`, grants `entitlements` (lifetime test_series access).
- `PaymentButton` client component — opens Razorpay checkout, verifies, shows success. Wired to the **Buy Bundle** button on exam detail (₹499).
- Server-side flow tested (order creation verified). Full live payment requires a real card (the user).

## 🆕 Phase 7–8: All remaining major features (DONE)

### Admin Panel (`/admin`) — staff-only CRUD + AI generation
- `src/lib/admin.ts` — `requireAdmin` (verifies bearer token via Supabase + `staff` table check), exams/tests CRUD, question list/delete (Turso), **AI question generation** (Gemini, batches, auto-publishes).
- Satyam Singh = super_admin in `staff` (auth_id 5482eadf…).
- Pages: dashboard (live counts), Exams (create/edit/delete), Tests (CRUD + publish toggle), Questions (per-test list + AI generate + delete).
- 8 admin API routes (`/api/admin/*`), all token-gated (no-token → 401, verified).
- Navbar shows **Admin** link for logged-in users.

### Paid test gating + full-length tests ✅
- `/api/test/[id]/questions` now **gates** by `test_type`: `free` = open; `full_length` (and others) = requires active entitlement for the test's test_series. Returns `{gated:"login"}` (401) or `{gated:"purchase"}` (403).
- TestPlayer passes the access token + renders Login-required / Premium / View-Bundles states.
- `/api/my-access` returns the caller's owned series ids; `ExamTestList` (client) renders 🔒 Unlock / Login-to-Unlock / Start per test.
- **6 full-length mocks generated + published** (25 Qs each = 150 new via `scripts/seed-full-mocks.mjs`). Each locked behind its ₹499 bundle. Verified: full mock → `gated:login` without token; free mock → 15 Qs served.

### Forgot password ✅
- `/forgot-password` (email → Supabase `resetPasswordForEmail` with `redirectTo=/reset-password`) and `/reset-password` (recovery link → `updateUser`). Login page has **Forgot password?** link. (Add these URLs to Supabase → Auth → Redirect URLs.)

### Question report ✅
- `/api/report-question` (auth-gated, writes `question_reports`). `QuestionReportButton` (🚩 flag + modal: wrong answer / ambiguous / typo / out-of-syllabus / other) wired into the test player.

### Courses page (`/courses`) ✅
- Catalog of exam bundles: per-exam test breakdown (free demos / full mocks), price, features, CTA → exam detail.

### Study Material (`/study-material`) ✅
- Reads published `materials` (title, type, view/download). Empty state included. Add rows to `materials` to populate.

### Notifications ✅
- `/api/notifications` (GET list + PATCH mark-read, per-profile). `NotificationBell` in navbar (unread badge, focus-refetch). `/notifications` page (icons, time-ago, mark-all-read). Insert rows into `notifications` (profile_id) to surface them.

### Hindi language toggle ✅
- `LanguageProvider` + `useLang().t(key)` + `src/lib/i18n-dict.ts` (en/hi, ~60 keys). `LangToggle` (🌐 EN/हि) in navbar, persists to localStorage. Applied to: navbar, **home hero** (`HomeHero`), **test player** (submit/palette/modal/mark-review/gated), exam test list. Extensible — add keys to the dict + use `t()` in any client component.

### Profile edit ✅
- `/account` now has **Edit Profile** mode (full name / mobile / state) → `/api/profile` PATCH (updates `profiles` row) + `supabase.auth.updateUser` (user_metadata). All 28 states + 8 UTs in the dropdown.

## 🗄️ Data (seeded)
- **Supabase**: 6 exams, 6 courses, 6 test_series, 12 tests (**6 playable free mocks**, one per exam).
- **Turso**: **90 questions + 360 options + 90 explanations** + a `test_questions` junction table (created this session).
- **All 6 exams playable** — 15 MCQs each:
  - UPSSSC VDO — 15 hand-authored.
  - Agriculture, Junior Assistant, UP Police, IBPS Clerk, SSC CGL — 15 each **AI-generated** via Gemini.

## 🤖 AI Factory (Phase 4) — proven working
- `scripts/ai-gen-questions.mjs` calls **Gemini `gemini-3.6-flash`** (note: `gemini-2.5-flash` is deprecated) with `responseMimeType: application/json`, validates the output, and seeds into Turso + flips the test to playable.
- Generated 60 validated MCQs across 4 exams in one run. Re-runnable (idempotent per test).

## 🔐 Security
- Correct answers (`is_correct`) **stripped** before reaching the browser (verified).
- Scoring is server-side; client can't fake a score.

## 🧪 Verified flows (production mode)
- All 12 routes return HTTP 200, 0 errors.
- Questions API returns 15 Qs with no `is_correct` leak.
- Submit → score 5/15 (5 correct, 5 wrong, 5 skipped), persisted.
- Result page → solutions + rank "#2 out of 2".

## 📦 Key files added this session
- `src/lib/turso.ts` — Turso client + scoring + rank + attempt read.
- `src/lib/supabase-server.ts` — server Supabase reads (exams, tests chain).
- `src/components/test-player.tsx` — the live test UI.
- `src/app/test/[slug]/{page,play/page,result/page}.tsx` — test engine.
- `src/app/api/test/[id]/{questions,submit}/route.ts` + `src/app/api/my-attempts/route.ts`.
- `src/app/dashboard/page.tsx`.
- `scripts/turso.mjs`, `scripts/seed-supabase.mjs`, `scripts/seed-questions.mjs`, `scripts/ai-gen-questions.mjs`.

## ⏭️ Next steps (minor / config)
- **Supabase Auth → Redirect URLs**: add the production URL + `/reset-password` + `/forgot-password` so the password-recovery email links land correctly.
- **Full mocks**: currently 25 Qs each (demo-ready). Top up to 100 via Admin → Questions → AI Generate (target = 100). The generate batches automatically.
- **Study material / notifications content**: insert rows into `materials` / `notifications` (per profile_id) to populate those pages.
- **Hindi coverage**: dictionary covers navbar, home hero, test player, exam list. Extend `src/lib/i18n-dict.ts` + use `t()` in remaining pages (courses, login, dashboard, etc.) for full coverage.
- `@libsql/client` + `razorpay` are in `apps/web/package.json` — `npm install` after a fresh clone.
- Note: Gemini model is `gemini-3.6-flash` (2.5 deprecated). Razorpay uses LIVE keys (regenerate if exposed).
