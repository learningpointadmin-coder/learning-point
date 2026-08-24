# Learning Point — Turso Schema Run Guide

> **Goal:** Turso database me 12 tables banana (questions, attempts, responses, etc.)
> **File:** `turso/migrations/20260823000000_init_test_data.sql`

---

## 📦 TURSO = libSQL (SQLite jaisa). Isliye Supabase (Postgres) se syntax alag hai.
## Turso me SQL chalane ke 2 tareeke hain:

---

# ✅ TARIQA 1 — Turso CLI (RECOMMENDED, sabse reliable)

## Step 1 — Turso CLI install karo

**Windows (PowerShell):**
```powershell
irm https://get.tur.so/install.ps1 | iex
```

**Mac / Linux:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Check karo install hua ya nahi:
```bash
turso --version
```
Agar version number aaya → ✅ ho gaya. (Terminal band karke dobara kholo agar "command not found" aaye.)

## Step 2 — Login karo

```bash
turso auth login
```
> Browser khulega → Turso account me login → authorize karo. Terminal me "Logged in" dikhega.

## Step 3 — Apni database ka naam dekho

```bash
turso db list
```
Output me aapko apna database naam dikhega (jaise `learning-point-attempts`). **Yeh naam yaad rakho.**

## Step 4 — Schema run karo (12 tables banengi)

**Tariqa A — agar SQL file local computer par hai:**
```bash
# learning-point repo folder me jao (jahan turso/ folder hai)
cd path/to/your/learning-point

turso db shell learning-point-attempts < turso/migrations/20260823000000_init_test_data.sql
```
> `learning-point-attempts` ko apne actual DB naam se badal lo.

**Tariqa B — agar file local nahi hai (sirf GitHub par hai):**
```bash
turso db shell learning-point-attempts
```
Isse interactive shell khulega. Phir **pura Turso SQL code (File 8) paste karo** → Enter dabao.
Exit: `.exit` likho.

## Step 5 — Verify karo — 12 tables bani ya nahi

```bash
turso db shell learning-point-attempts ".tables"
```

Aapko ye 12 tables dikhni chahiye:
```
ai_jobs            explanations       question_sources
attempt_events     options            rankings
attempts           paper_blueprints   question_embeddings
question_usage     questions          responses
```

✅ Sab 12 dikh rahi? → **TURSO DONE!**

---

# 🌐 TARIQA 2 — Turso Web (agar CLI mushkil lage)

1. **https://app.turso.tech** par jao → login
2. Apna database (`learning-point-attempts`) par click karo
3. "Shell" ya "Console" tab dhoondho (agar available)
4. **Pura Turso SQL code (File 8) paste karo** → Run

> Note: Turso ka web console har account me same nahi hota.
> Agar web me "Shell" option na mile → CLI (Tariqa 1) use karo.

---

## 🆘 Errors / Problem?

| Problem | Solution |
|---|---|
| `turso: command not found` | Terminal band karke dobara kholo; ya PATH check karo |
| `authentication required` | `turso auth login` phir se |
| `database not found` | `turso db list` se sahi naam pakdo |
| `table already exists` | Tables bani hui hain — `.tables` se verify karo, DONE! |
| Web console nahi mil raha | CLI use karo (Tariqa 1) |

---

## ⏭️ Turso hone ke baad:

```
✅ Supabase schema run   (18 tables)
✅ Turso schema run       (12 tables)
→ Phase 1 aage: Design System (dark theme) + Next.js scaffold!
```
