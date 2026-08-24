#!/usr/bin/env python3
"""
=============================================================
 Learning Point — Turso Schema Runner (ALL-IN-ONE)
=============================================================
Remote Turso database me 12 tables banata hai.
NO separate SQL file needed — schema is built-in!
NO CLI needed — sirf Python + libsql.

SETUP (2 steps):
  1. pip install libsql
  2. python run-turso-schema.py

Script aapse Turso URL + token maangega (Turso Dashboard se laana).
=============================================================
"""

import os
import sys

# ============================================================================
# TURSO SCHEMA (12 tables) — embedded, no external file needed
# ============================================================================
SCHEMA_SQL = r"""
pragma foreign_keys = on;

create table questions (
  id                  text primary key,
  external_ref        text unique,
  subject             text,
  topic               text,
  subtopic            text,
  question_type       text not null default 'single_choice'
                        check (question_type in (
                          'single_choice','multi_choice',
                          'true_false','match','sequence','assertion_reason'
                        )),
  question_text_en    text not null,
  question_text_hi    text,
  has_image           integer default 0,
  image_url           text,
  image_alt_en        text,
  image_alt_hi        text,
  difficulty          text default 'medium'
                        check (difficulty in ('easy','medium','hard')),
  source_type         text not null default 'ai_generated'
                        check (source_type in ('master_bank','ai_generated')),
  marks_correct       real not null default 1,
  marks_wrong         real not null default 0,
  status              text not null default 'draft'
                        check (status in (
                          'draft','validating','review_required',
                          'approved','published','rejected','archived'
                        )),
  approved_by         text,
  approved_at         text,
  created_at          text not null default (datetime('now')),
  updated_at          text not null default (datetime('now'))
);

create index idx_q_subject  on questions(subject);
create index idx_q_topic    on questions(topic);
create index idx_q_status   on questions(status);
create index idx_q_source   on questions(source_type);

create table options (
  id              text primary key,
  question_id     text not null references questions(id) on delete cascade,
  option_text_en  text not null,
  option_text_hi  text,
  sort_order      integer not null default 0,
  is_correct      integer not null default 0,
  created_at      text not null default (datetime('now'))
);

create index idx_options_question on options(question_id);

create table explanations (
  id                  text primary key,
  question_id         text not null references questions(id) on delete cascade,
  version             integer not null default 1,
  content_en          text not null,
  content_hi          text,
  explanation_type    text check (explanation_type in (
                        'quant','factual','reasoning','grammar','code','diagram'
                      )),
  is_approved         integer not null default 0,
  approved_by         text,
  approved_at         text,
  created_at          text not null default (datetime('now')),
  unique(question_id, version)
);

create index idx_expl_question on explanations(question_id);

create table question_sources (
  id                  text primary key,
  question_id         text not null references questions(id) on delete cascade,
  source_sheet_id     text not null,
  source_tab          text,
  source_row          integer,
  original_hash       text not null,
  normalized_hash     text,
  imported_at         text not null default (datetime('now')),
  last_synced_at      text
);

create index idx_sources_sheet on question_sources(source_sheet_id, source_tab);
create index idx_sources_hash  on question_sources(original_hash);

create table question_embeddings (
  id              text primary key,
  question_id     text not null references questions(id) on delete cascade,
  embedding       text not null,
  model           text not null default 'bge-m3',
  created_at      text not null default (datetime('now'))
);

create index idx_embed_question on question_embeddings(question_id);

create table paper_blueprints (
  id                  text primary key,
  test_id             text,
  subject_type        text not null check (subject_type in ('agriculture','non_agriculture','mixed')),
  master_bank_pct     integer default 0,
  ai_generated_pct    integer default 100,
  total_questions     integer not null,
  blueprint_json      text not null,
  status              text not null default 'draft'
                        check (status in ('draft','approved','generating','completed','failed')),
  approved_by         text,
  approved_at         text,
  created_at          text not null default (datetime('now'))
);

create index idx_blueprint_test on paper_blueprints(test_id);

create table ai_jobs (
  id                  text primary key,
  job_type            text not null check (job_type in (
                        'blueprint','generation','validation','distractor',
                        'explanation','translation','dedup','audit','import'
                      )),
  blueprint_id        text references paper_blueprints(id) on delete set null,
  primary_model       text,
  fallback_chain      text,
  prompt_version      text,
  status              text not null default 'queued'
                        check (status in ('queued','running','paused','completed','failed')),
  paused_reason       text,
  resume_after        text,
  checkpoint_data     text,
  tokens_used         integer default 0,
  requests_used       integer default 0,
  error_message       text,
  output_quality_score real,
  created_at          text not null default (datetime('now')),
  updated_at          text not null default (datetime('now')),
  completed_at        text
);

create index idx_jobs_status   on ai_jobs(status);
create index idx_jobs_type     on ai_jobs(job_type);
create index idx_jobs_resume   on ai_jobs(status, resume_after);

create table attempts (
  id                  text primary key,
  profile_id          text not null,
  test_id             text not null,
  attempt_number      integer not null default 1,
  status              text not null default 'in_progress'
                        check (status in ('in_progress','submitted','abandoned','expired')),
  score               real,
  correct_count       integer default 0,
  incorrect_count     integer default 0,
  unattempted_count   integer default 0,
  positive_marks      real default 0,
  negative_marks      real default 0,
  accuracy            real,
  time_taken_seconds  integer,
  shuffle_seed        integer,
  rank                integer,
  percentile          real,
  is_ranked_attempt   integer default 0,
  started_at          text not null default (datetime('now')),
  submitted_at        text,
  last_synced_at      text
);

create index idx_attempts_profile  on attempts(profile_id);
create index idx_attempts_test     on attempts(test_id, status);
create index idx_attempts_rank     on attempts(test_id, is_ranked_attempt, score desc);

create table responses (
  id                  text primary key,
  attempt_id          text not null references attempts(id) on delete cascade,
  question_id         text not null,
  selected_option_ids text,
  time_spent_seconds  integer default 0,
  is_correct          integer,
  marks_awarded       real,
  is_marked_for_review integer default 0,
  answered_at         text,
  created_at          text not null default (datetime('now')),
  updated_at          text not null default (datetime('now')),
  unique(attempt_id, question_id)
);

create index idx_responses_attempt on responses(attempt_id);

create table attempt_events (
  id              text primary key,
  attempt_id      text not null references attempts(id) on delete cascade,
  event_type      text not null check (event_type in (
                    'start','answer_save','answer_sync','page_refresh',
                    'network_disconnect','network_reconnect','submit','resume'
                  )),
  event_data      text,
  created_at      text not null default (datetime('now'))
);

create index idx_events_attempt on attempt_events(attempt_id);

create table question_usage (
  question_id     text primary key references questions(id) on delete cascade,
  times_used      integer not null default 0,
  last_used_at    text,
  times_reported  integer not null default 0
);

create table rankings (
  id              text primary key,
  test_id         text not null,
  attempt_id      text not null,
  profile_id      text not null,
  score           real not null,
  accuracy        real,
  rank            integer,
  is_final        integer default 0,
  computed_at     text not null default (datetime('now'))
);

create index idx_rank_test_score on rankings(test_id, score desc);
create index idx_rank_profile    on rankings(profile_id);
"""


def has_real_sql(fragment):
    for line in fragment.split("\n"):
        code = line.split("--")[0]
        if code.strip():
            return True
    return False


def main():
    print("=" * 60)
    print("  Learning Point - Turso Schema Runner (12 tables)")
    print("=" * 60)

    # ---- Import libsql ----
    try:
        import libsql
    except ImportError:
        print("\n[ERROR] 'libsql' package installed nahi hai!")
        print("   Pehle ye chalao:  pip install libsql")
        sys.exit(1)

    # ---- Get credentials ----
    url = os.environ.get("TURSO_DATABASE_URL")
    token = os.environ.get("TURSO_AUTH_TOKEN")

    if not url:
        print("\n[1/3] Turso Database URL chahiye.")
        print("      Turso Dashboard > apna database > libsql://... wala URL")
        url = input("      Paste URL: ").strip()
    if not token:
        print("\n[2/3] Turso Auth Token chahiye.")
        print("      Turso Dashboard > database > 'Create Token'")
        token = input("      Paste token: ").strip()

    if not url or not token:
        print("[ERROR] URL ya token khaali hai!")
        sys.exit(1)

    # ---- Connect ----
    print("\n[3/3] Connecting to Turso...")
    try:
        conn = libsql.connect(database=url, auth_token=token)
    except Exception as e:
        print(f"[ERROR] Connection fail: {e}")
        print("   URL aur token sahi check karo.")
        sys.exit(1)
    print("   OK - Connected!")

    # ---- Split schema into statements ----
    raw = SCHEMA_SQL.split(";")
    statements = [s.strip() for s in raw if has_real_sql(s)]

    print(f"\n{len(statements)} SQL statements chala raha hoon...\n")

    success = 0
    skipped = 0
    failed = 0

    for i, stmt in enumerate(statements, 1):
        words = stmt.replace("\n", " ").split()
        kind = words[0].upper() + " " + (words[1].upper() if len(words) > 1 else "")
        try:
            conn.execute(stmt)
            success += 1
            print(f"   [{i:>2}/{len(statements)}] OK    {kind}")
        except Exception as e:
            msg = str(e).lower()
            if "already exists" in msg:
                skipped += 1
                print(f"   [{i:>2}/{len(statements)}] SKIP  {kind} (pehle se hai)")
            else:
                failed += 1
                print(f"   [{i:>2}/{len(statements)}] FAIL  {kind} -> {e}")

    try:
        conn.commit()
    except Exception:
        pass

    # ---- Summary ----
    print("\n" + "=" * 60)
    print(f"  OK:{success}   SKIP:{skipped}   FAIL:{failed}")
    print("=" * 60)

    # ---- Verify tables ----
    print("\nTables database me:")
    found = set()
    try:
        result = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        rows = result.fetchall()
        for r in rows:
            name = r[0] if isinstance(r, (list, tuple)) else r
            found.add(name)
            print(f"   - {name}")
        print(f"\n   Total: {len(rows)} tables")
    except Exception as e:
        print(f"   List nahi ho payi: {e}")

    expected = {
        "questions", "options", "explanations", "question_sources",
        "question_embeddings", "paper_blueprints", "ai_jobs", "attempts",
        "responses", "attempt_events", "question_usage", "rankings",
    }
    missing = expected - found
    if not missing:
        print("\n*** SAARI 12 TABLES BAN GAYI! Turso schema COMPLETE! ***")
    else:
        print(f"\n[WARNING] Missing tables: {missing}")


if __name__ == "__main__":
    main()
