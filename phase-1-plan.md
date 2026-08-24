# Learning Point — Phase 1: Foundation (Execution Plan)

> **Goal:** Project scaffold + database schemas + design system setup.
> Ye sab AI/content se independent hai — bina sample sheets ya syllabus ke ho jayega.

---

## Phase 1 Deliverables

| # | Deliverable | Status | File |
|---|---|---|---|
| 1 | Project structure (monorepo scaffold) | 🔄 | `/learning-point/` |
| 2 | **Supabase core schema** (profiles, courses, payments, etc.) | 🔄 | `database/supabase-schema.sql` |
| 3 | **Turso test-data schema** (questions, attempts, responses) | 🔄 | `database/turso-schema.sql` |
| 4 | Design tokens (dark theme, Tailwind config) | ⬜ | `apps/web/tailwind.config.ts` |
| 5 | `.env.example` (all placeholders) | ✅ | `.env.example` |
| 6 | Scripts folder (Sheets verifier) | ✅ | `scripts/` |
| 7 | Cloudflare deploy config | ⬜ | `wrangler.toml` |
| 8 | GitHub repo `.gitignore` + README | ⬜ | repo root |

---

## Data Architecture Split (locked from research)

```
┌─────────────────────────────────────────────┐
│  SUPABASE (Postgres, Mumbai)                │
│  Core business data — low volume, strong    │
│  relational integrity                        │
│                                              │
│  profiles, student_sessions, staff          │
│  exams, courses, batches, test_series, tests│
│  payments, entitlements, coupons            │
│  materials, notifications                   │
│  question_reports, audit_logs, settings     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  TURSO (libSQL, Mumbai)                      │
│  High-volume test/exam data — read-heavy     │
│  during live tests                            │
│                                              │
│  questions, options, explanations            │
│  question_sources, embeddings                │
│  paper_blueprints, ai_jobs                   │
│  attempts, responses, attempt_events         │
│  question_usage, rankings                    │
└─────────────────────────────────────────────┘
```

---

## Coding Phases Roadmap (reminder)

```
Phase 1 — Foundation         ← WE ARE HERE 🏗️
Phase 2 — Auth + Public Courses
Phase 3 — Question Bank (needs sample Sheets)
Phase 4 — AI Factory (needs syllabus/PYQ)
Phase 5 — Test Engine + Result
Phase 6 — Payment (Razorpay)
Phase 7 — Admin + AI Control Center
Phase 8 — Launch Validation
```

> Phases 1-2 me content/sample data ki zaroorat nahi.
> Sample Sheets Phase 3 ke time, syllabus/PYQ Phase 4 ke time la dena.
