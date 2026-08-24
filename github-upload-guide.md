# 📤 Learning Point — GitHub Upload Guide (Step-by-Step, No Errors)

> **Repo:** `https://github.com/learningpointadmin-coder/learning-point.git`
> **Total files:** 8 (saaf-suthra, koi duplicate nahi)
> **Goal:** Pehla clean commit bina kisi error ke.

---

## 📋 FILE LIST — Ye 8 files GitHub par jaayenge (exact names)

```
learning-point/
├── .env.example                                    ← root me
├── .gitignore                                      ← root me
├── README.md                                       ← root me
├── docs/
│   └── phase-1-plan.md                             ← docs/ folder me
├── scripts/
│   ├── requirements.txt                            ← scripts/ folder me
│   └── verify-google-sheets.py                     ← scripts/ folder me
├── supabase/
│   └── migrations/
│       └── 20260823000000_init_core_schema.sql     ← supabase/migrations/ me
└── turso/
    └── migrations/
        └── 20260823000000_init_test_data.sql       ← turso/migrations/ me
```

> ⚠️ **Ye files KABHI GitHub par NAHI dalni:**
> `.env.local`, `service-account.json`, koi bhi password/key.
> `.gitignore` inko automatically block karta hai.

---

# 🚀 METHOD: Git Commands (RECOMMENDED — sabse reliable)

## Step 0 — Git installed hai? (check karo)

Terminal/Command Prompt kholo aur likho:
```bash
git --version
```
- Agar version number aaya (jaise `git version 2.43.0`) → ✅ Git hai, Step 1 par jao.
- Agar "command not found" → Git install karo:
  - **Windows:** https://git-scm.com/download/win → download + install
  - **Mac:** Terminal me `git` likhne par auto-install prompt aata hai, ya `brew install git`

---

## Step 1 — Repo ko apne computer par lao (clone)

```bash
git clone https://github.com/learningpointadmin-coder/learning-point.git
cd learning-point
```

> Agar repo me pehle se README hai to usko overwrite/rename mat karna —
> hamara README usko replace karega (Step 3 me).

---

## Step 2 — Folder structure banao

Repo folder ke andar ye commands chalao:
```bash
mkdir -p docs scripts supabase/migrations turso/migrations
```

Ab aapke paas ye structure ban gaya:
```
learning-point/
├── docs/
├── scripts/
├── supabase/migrations/
└── turso/migrations/
```

---

## Step 3 — Files ek-ek karke add karo (8 files)

> 💡 **Content kahan se laana hai?** Har file ka content is workspace me
> ready hai. File ko open karo (preview me), **sara content select karo
> (Ctrl+A) → copy (Ctrl+C) → apni local file me paste karo (Ctrl+V).**

### File 1 of 8 — `.gitignore` (root)
- Workspace me kholo: `.gitignore`
- Apne repo me banao: `.gitignore` (root folder me)
- Content paste karo

### File 2 of 8 — `.env.example` (root)
- Workspace me kholo: `.env.example`
- Apne repo me banao: `.env.example` (root folder me)
- Content paste karo

### File 3 of 8 — `README.md` (root)
- Workspace me kholo: `README.md`
- Agar repo me pehle se README.md hai → usko replace kar do
- Content paste karo

### File 4 of 8 — `docs/phase-1-plan.md`
- Workspace me kholo: `docs/phase-1-plan.md`
- Apne repo me banao: `docs/phase-1-plan.md`
- Content paste karo

### File 5 of 8 — `scripts/requirements.txt`
- Workspace me kholo: `scripts/requirements.txt`
- Apne repo me banao: `scripts/requirements.txt`
- Content paste karo

### File 6 of 8 — `scripts/verify-google-sheets.py`
- Workspace me kholo: `scripts/verify-google-sheets.py`
- Apne repo me banao: `scripts/verify-google-sheets.py`
- Content paste karo

### File 7 of 8 — `supabase/migrations/20260823000000_init_core_schema.sql`
- Workspace me kholo: `supabase/migrations/20260823000000_init_core_schema.sql`
- Apne repo me banao: **SAME exact naam** `supabase/migrations/20260823000000_init_core_schema.sql`
- Content paste karo (badi file hai, pura copy karna)

### File 8 of 8 — `turso/migrations/20260823000000_init_test_data.sql`
- Workspace me kholo: `turso/migrations/20260823000000_init_test_data.sql`
- Apne repo me banao: **SAME exact naam** `turso/migrations/20260823000000_init_test_data.sql`
- Content paste karo

---

## Step 4 — Check karo: sab sahi hai? (important!)

```bash
git status
```

Aapko 8 files "untracked" ya "new file" dikheni chahiye. Confirm karo ki:
- ✅ `.env.local` ya `service-account.json` list me NAHI hai (agar hai to gadbad!)

---

## Step 5 — Commit karo (save)

```bash
git add .
git commit -m "Phase 1: database schemas + project structure + setup guide"
```

---

## Step 6 — GitHub par bhejo (push)

```bash
git push origin main
```

> Agar `main` kaam na kare to `git push origin master` try karo.
> Username/password maange to **GitHub Personal Access Token** chahiye
> (GitHub password kaam nahi karta). Token: GitHub > Settings >
> Developer settings > Personal access tokens.

---

## ✅ DONE! Verify karo:

Browser me kholo: `https://github.com/learningpointadmin-coder/learning-point`
- 8 files dikhni chahiye ✅
- Folders: `docs/`, `scripts/`, `supabase/migrations/`, `turso/migrations/` ✅

---

# 🔧 TROUBLESHOOTING (agar error aaye)

| Problem | Solution |
|---|---|
| `git: command not found` | Git install karo (Step 0) |
| `Authentication failed` | Personal Access Token use karo (password nahi) |
| `fatal: remote origin already exists` | `git remote set-url origin https://github.com/learningpointadmin-coder/learning-point.git` |
| `error: failed to push some refs` | Pehle `git pull origin main` phir push |
| File GitHub par nahi dikhi | `git status` check karo — add hui ya nahi |
| `.env.local` upload ho gayi 😱 | Turant `git rm --cached .env.local` + force push + **key rotate karo!** |

---

# 🖱️ ALTERNATIVE: GitHub Desktop (agar commands mushkil lagein)

Agar command line uncomfortable hai:
1. **GitHub Desktop** download karo: https://desktop.github.com
2. Apna account se login karo
3. Repo clone karo (File > Clone Repository)
4. Files manually folder me copy karo (Step 3 jaisa)
5. App me "Commit" likho → "Push origin" dabao
> GitHub Desktop GUI me sab visual hota hai — commands yaad rakhne ki zaroorat nahi.
