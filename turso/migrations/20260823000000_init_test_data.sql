-- ============================================================================
-- LEARNING POINT — TURSO TEST-DATA SCHEMA
-- Region: Mumbai (aws-ap-south-1) | Engine: libSQL (SQLite-compatible)
-- ============================================================================
-- Yahan rakha jaayega: questions, options, explanations, sources, embeddings,
--   blueprints, ai_jobs, attempts, responses, events, usage, rankings
-- Rule: Turso = high-volume, read-heavy during live tests
-- NOTE: libSQL = SQLite syntax. TEXT for UUIDs/datetimes, INTEGER for bools.
-- ============================================================================

-- Enable foreign keys (run once per connection in app code too)
pragma foreign_keys = on;

-- ============================================================================
-- 1. QUESTIONS  (Master Question Bank — Agriculture + AI-generated)
-- ============================================================================
create table questions (
  id                  text primary key,            -- UUID
  external_ref        text unique,                 -- stable public id if needed
  subject             text,                        -- agriculture, quant, reasoning, gk...
  topic               text,
  subtopic            text,
  question_type       text not null default 'single_choice'
                        check (question_type in (
                          'single_choice','multi_choice',
                          'true_false','match','sequence','assertion_reason'
                        )),
  question_text_en    text not null,
  question_text_hi    text,
  has_image           integer default 0,           -- bool 0/1
  image_url           text,
  image_alt_en        text,
  image_alt_hi        text,
  difficulty          text default 'medium'
                        check (difficulty in ('easy','medium','hard')),
  source_type         text not null default 'ai_generated'
                        check (source_type in ('master_bank','ai_generated')),
  marks_correct       real not null default 1,
  marks_wrong         real not null default 0,     -- negative (positive number)
  -- Workflow status (per PRD section 9.4)
  status              text not null default 'draft'
                        check (status in (
                          'draft','validating','review_required',
                          'approved','published','rejected','archived'
                        )),
  approved_by         text,                        -- staff id
  approved_at         text,
  created_at          text not null default (datetime('now')),
  updated_at          text not null default (datetime('now'))
);

create index idx_q_subject  on questions(subject);
create index idx_q_topic    on questions(topic);
create index idx_q_status   on questions(status);
create index idx_q_source   on questions(source_type);


-- ============================================================================
-- 2. OPTIONS  (Answer choices — stable option_id for shuffle-safe scoring)
-- ============================================================================
create table options (
  id              text primary key,                -- UUID / stable option_id
  question_id     text not null references questions(id) on delete cascade,
  option_text_en  text not null,
  option_text_hi  text,
  sort_order      integer not null default 0,
  is_correct      integer not null default 0,      -- bool 0/1 (HIDDEN from student payload!)
  created_at      text not null default (datetime('now'))
);

create index idx_options_question on options(question_id);

-- IMPORTANT: is_correct column kabhi student ko send nahi hota.
--   Test payload me sirf option_id + text bhejna, is_correct strip karna.


-- ============================================================================
-- 3. EXPLANATIONS  (Pre-generated, approved, versioned)
-- ============================================================================
create table explanations (
  id                  text primary key,            -- UUID
  question_id         text not null references questions(id) on delete cascade,
  version             integer not null default 1,
  -- Explanation blocks (JSON-stored structured content per PRD section 12)
  content_en          text not null,               -- markdown/JSON structured
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


-- ============================================================================
-- 4. QUESTION_SOURCES  (Google Sheet import tracking — per PRD 9.3)
-- ============================================================================
create table question_sources (
  id                  text primary key,
  question_id         text not null references questions(id) on delete cascade,
  source_sheet_id     text not null,               -- Google Sheet ID
  source_tab          text,                        -- tab/sheet name
  source_row          integer,                     -- original row number
  original_hash       text not null,               -- exact content hash
  normalized_hash     text,                        -- normalized for dedup
  imported_at         text not null default (datetime('now')),
  last_synced_at      text
);

create index idx_sources_sheet on question_sources(source_sheet_id, source_tab);
create index idx_sources_hash  on question_sources(original_hash);


-- ============================================================================
-- 5. QUESTION_EMBEDDINGS  (Duplicate/semantic detection — BGE-M3)
-- ============================================================================
create table question_embeddings (
  id              text primary key,
  question_id     text not null references questions(id) on delete cascade,
  embedding       text not null,                   -- serialized BGE-M3 vector (JSON)
  model           text not null default 'bge-m3',
  created_at      text not null default (datetime('now'))
);

create index idx_embed_question on question_embeddings(question_id);


-- ============================================================================
-- 6. PAPER_BLUEPRINTS  (Exam paper generation plans)
-- ============================================================================
create table paper_blueprints (
  id                  text primary key,
  test_id             text,                        -- Supabase test id (stored as text)
  subject_type        text not null check (subject_type in ('agriculture','non_agriculture','mixed')),
  -- For agriculture: 40% master_bank + 60% ai_generated
  master_bank_pct     integer default 0,
  ai_generated_pct    integer default 100,
  total_questions     integer not null,
  blueprint_json      text not null,               -- topic/difficulty distribution
  status              text not null default 'draft'
                        check (status in ('draft','approved','generating','completed','failed')),
  approved_by         text,
  approved_at         text,
  created_at          text not null default (datetime('now'))
);

create index idx_blueprint_test on paper_blueprints(test_id);


-- ============================================================================
-- 7. AI_JOBS  (Background AI pipeline tracking — quota-aware pause/resume)
-- ============================================================================
create table ai_jobs (
  id                  text primary key,
  job_type            text not null check (job_type in (
                        'blueprint','generation','validation','distractor',
                        'explanation','translation','dedup','audit','import'
                      )),
  blueprint_id        text references paper_blueprints(id) on delete set null,
  primary_model       text,
  fallback_chain      text,                        -- JSON array of models
  prompt_version      text,
  status              text not null default 'queued'
                        check (status in ('queued','running','paused','completed','failed')),
  -- Quota pause/resume support
  paused_reason       text,                        -- e.g. 'groq_tpd_exhausted'
  resume_after        text,                        -- datetime to retry
  checkpoint_data     text,                        -- JSON: progress saved for resume
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


-- ============================================================================
-- 8. ATTEMPTS  (Student test attempt snapshots)
-- ============================================================================
create table attempts (
  id                  text primary key,
  profile_id          text not null,               -- Supabase profile id
  test_id             text not null,               -- Supabase test id
  attempt_number      integer not null default 1,  -- 1 = ranked, 2-6 = practice
  status              text not null default 'in_progress'
                        check (status in ('in_progress','submitted','abandoned','expired')),
  -- Scoring (filled on submit)
  score               real,
  correct_count       integer default 0,
  incorrect_count     integer default 0,
  unattempted_count   integer default 0,
  positive_marks      real default 0,
  negative_marks      real default 0,
  accuracy            real,
  time_taken_seconds  integer,
  -- Option shuffle snapshot (stable order for this attempt)
  shuffle_seed        integer,
  -- Ranking
  rank                integer,
  percentile          real,
  is_ranked_attempt   integer default 0,           -- 1 for first valid attempt only
  -- Timing
  started_at          text not null default (datetime('now')),
  submitted_at        text,
  last_synced_at      text
);

create index idx_attempts_profile  on attempts(profile_id);
create index idx_attempts_test     on attempts(test_id, status);
create index idx_attempts_rank     on attempts(test_id, is_ranked_attempt, score desc);


-- ============================================================================
-- 9. RESPONSES  (Per-question answers — sync'd from IndexedDB)
-- ============================================================================
create table responses (
  id                  text primary key,
  attempt_id          text not null references attempts(id) on delete cascade,
  question_id         text not null,
  selected_option_ids text,                        -- JSON array (multi-choice support)
  time_spent_seconds  integer default 0,
  is_correct          integer,                     -- null until scored; 0/1 after
  marks_awarded       real,
  is_marked_for_review integer default 0,
  answered_at         text,
  created_at          text not null default (datetime('now')),
  updated_at          text not null default (datetime('now')),
  unique(attempt_id, question_id)
);

create index idx_responses_attempt on responses(attempt_id);


-- ============================================================================
-- 10. ATTEMPT_EVENTS  (Audit timeline: start, save, sync, submit, refresh)
-- ============================================================================
create table attempt_events (
  id              text primary key,
  attempt_id      text not null references attempts(id) on delete cascade,
  event_type      text not null check (event_type in (
                    'start','answer_save','answer_sync','page_refresh',
                    'network_disconnect','network_reconnect','submit','resume'
                  )),
  event_data      text,                            -- JSON
  created_at      text not null default (datetime('now'))
);

create index idx_events_attempt on attempt_events(attempt_id);


-- ============================================================================
-- 11. QUESTION_USAGE  (How often a question is used — for rotation/dedup)
-- ============================================================================
create table question_usage (
  question_id     text primary key references questions(id) on delete cascade,
  times_used      integer not null default 0,
  last_used_at    text,
  times_reported  integer not null default 0
);


-- ============================================================================
-- 12. RANKINGS  (Leaderboard cache — avoids full rewrite each submit)
-- ============================================================================
create table rankings (
  id              text primary key,
  test_id         text not null,
  attempt_id      text not null,
  profile_id      text not null,
  score           real not null,
  accuracy        real,
  rank            integer,
  is_final        integer default 0,               -- 0=provisional, 1=finalized
  computed_at     text not null default (datetime('now'))
);

create index idx_rank_test_score on rankings(test_id, score desc);
create index idx_rank_profile    on rankings(profile_id);

-- ============================================================================
-- END OF TURSO SCHEMA
-- ============================================================================
-- libSQL notes:
--   • Booleans -> INTEGER (0/1).
--   • Timestamps -> TEXT ISO-8601 via datetime('now').
--   • Foreign keys need `pragma foreign_keys=on;` per connection.
-- ============================================================================
