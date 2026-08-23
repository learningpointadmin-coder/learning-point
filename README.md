# Learning Point 🎓

> AI-assisted competitive-exam preparation platform for India.
> Dark, professional, bilingual (English/Hindi). Built for 1,000+ students.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend (Student) | Next.js + TypeScript + Tailwind CSS |
| Frontend (Admin) | Next.js + TypeScript |
| API Gateway | Cloudflare Workers |
| Hosting | Cloudflare Pages (static) |
| Auth + Core DB | **Supabase** (Postgres, Mumbai) |
| Test Data DB | **Turso** (libSQL, Mumbai) |
| AI Models | Gemini + Groq + SambaNova + Mistral |
| Payment | Razorpay |
| Email | Resend + Brevo + Mailjet |
| Files | Google Drive + optional Cloudflare R2 |

---

## 📁 Project Structure

```
learning-point/
├── supabase/
│   └── migrations/           # Supabase core schema (Postgres)
│       └── 20260823000000_init_core_schema.sql
├── turso/
│   └── migrations/           # Turso test-data schema (libSQL)
│       └── 20260823000000_init_test_data.sql
├── docs/
│   └── phase-1-plan.md
├── .env.example              # PLACEHOLDERS ONLY — safe to commit
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone & install
```bash
git clone <repo-url> learning-point
cd learning-point
```

### 2. Set up environment
```bash
cp .env.example .env.local      # create local env
# Edit .env.local and add your real keys (NEVER commit this file)
```

### 3. Run database migrations

**Supabase (core schema):**
```bash
# Option A — Supabase CLI
supabase db push

# Option B — Paste in Supabase Dashboard > SQL Editor
#   Copy contents of: supabase/migrations/20260823000000_init_core_schema.sql
```

**Turso (test-data schema):**
```bash
# Via Turso CLI
turso db shell learning-point-attempts < turso/migrations/20260823000000_init_test_data.sql
```

---

## 🔒 Security Rules

- ✅ **Schema files, code, .env.example** → committed to GitHub
- ❌ **`.env.local`, service-account.json, any key/password** → NEVER committed
- ✅ Secrets stored in: Cloudflare dashboard, Supabase vault, GitHub Secrets
- ✅ All student tables have **Row Level Security (RLS)** enabled

---

## 📋 Docs

- [Master PRD](docs/prd) — full product spec
- [Setup Checklist](docs/setup-checklist) — accounts & API keys
- [Phase 1 Plan](docs/phase-1-plan.md) — foundation execution

---

## 🏗️ Coding Phases

```
Phase 1 — Foundation         ← CURRENT
Phase 2 — Auth + Public Courses
Phase 3 — Question Bank
Phase 4 — AI Factory
Phase 5 — Test Engine + Result
Phase 6 — Payment
Phase 7 — Admin + AI Control Center
Phase 8 — Launch Validation
```
