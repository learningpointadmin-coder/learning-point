# ============================================================================
# Learning Point - Turso Schema Runner (PowerShell - ZERO INSTALL)
# ============================================================================
# NO pip, NO python package, NO CLI needed.
# Directly calls Turso HTTP API to create 12 tables.
#
# HOW TO RUN:
#   1. Save this file as: run-turso-schema.ps1
#   2. In PowerShell, run:
#        powershell -ExecutionPolicy Bypass -File run-turso-schema.ps1
#   3. Enter Turso URL + token when asked.
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Learning Point - Turso Schema Runner (PowerShell)" -ForegroundColor Cyan
Write-Host "  ZERO INSTALL - Uses Turso HTTP API directly" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# ----------------------------------------------------------------------------
# SCHEMA (12 tables) - embedded
# ----------------------------------------------------------------------------
$schema = @"
pragma foreign_keys = on;

create table questions (
  id                  text primary key,
  external_ref        text unique,
  subject             text,
  topic               text,
  subtopic            text,
  question_type       text not null default 'single_choice' check (question_type in ('single_choice','multi_choice','true_false','match','sequence','assertion_reason')),
  question_text_en    text not null,
  question_text_hi    text,
  has_image           integer default 0,
  image_url           text,
  image_alt_en        text,
  image_alt_hi        text,
  difficulty          text default 'medium' check (difficulty in ('easy','medium','hard')),
  source_type         text not null default 'ai_generated' check (source_type in ('master_bank','ai_generated')),
  marks_correct       real not null default 1,
  marks_wrong         real not null default 0,
  status              text not null default 'draft' check (status in ('draft','validating','review_required','approved','published','rejected','archived')),
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
  explanation_type    text check (explanation_type in ('quant','factual','reasoning','grammar','code','diagram')),
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
  status              text not null default 'draft' check (status in ('draft','approved','generating','completed','failed')),
  approved_by         text,
  approved_at         text,
  created_at          text not null default (datetime('now'))
);

create index idx_blueprint_test on paper_blueprints(test_id);

create table ai_jobs (
  id                  text primary key,
  job_type            text not null check (job_type in ('blueprint','generation','validation','distractor','explanation','translation','dedup','audit','import')),
  blueprint_id        text references paper_blueprints(id) on delete set null,
  primary_model       text,
  fallback_chain      text,
  prompt_version      text,
  status              text not null default 'queued' check (status in ('queued','running','paused','completed','failed')),
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
  status              text not null default 'in_progress' check (status in ('in_progress','submitted','abandoned','expired')),
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
  event_type      text not null check (event_type in ('start','answer_save','answer_sync','page_refresh','network_disconnect','network_reconnect','submit','resume')),
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
"@

# ----------------------------------------------------------------------------
# Get Turso credentials
# ----------------------------------------------------------------------------
Write-Host ""
Write-Host "[1/3] Turso database URL chahiye." -ForegroundColor Yellow
Write-Host "      (Turso Dashboard > database > libsql://... wala URL)"
$dbUrl = Read-Host "      Paste URL"

Write-Host ""
Write-Host "[2/3] Turso Auth Token chahiye." -ForegroundColor Yellow
Write-Host "      (Turso Dashboard > database > 'Create Token')"
$token = Read-Host "      Paste token"

if ([string]::IsNullOrWhiteSpace($dbUrl) -or [string]::IsNullOrWhiteSpace($token)) {
    Write-Host "`n[ERROR] URL ya token khaali hai!" -ForegroundColor Red
    exit 1
}

# ----------------------------------------------------------------------------
# Convert libsql:// URL to HTTP pipeline endpoint
# ----------------------------------------------------------------------------
$apiUrl = $dbUrl.Trim() -replace '^libsql://', 'https://'
$apiUrl = $apiUrl.TrimEnd('/')
if ($apiUrl -notmatch '/v2/pipeline$') {
    $apiUrl = $apiUrl + '/v2/pipeline'
}

Write-Host ""
Write-Host "[3/3] Connecting to Turso..." -ForegroundColor Yellow
Write-Host "      Endpoint: $apiUrl" -ForegroundColor DarkGray

# ----------------------------------------------------------------------------
# Split schema into statements (skip comment-only fragments)
# ----------------------------------------------------------------------------
$rawStmts = $schema -split ';'
$statements = @()
foreach ($s in $rawStmts) {
    $hasSql = $false
    foreach ($line in ($s -split "`n")) {
        $code = ($line -split '--')[0]
        if ($code.Trim()) { $hasSql = $true; break }
    }
    if ($hasSql) { $statements += $s.Trim() }
}

Write-Host ""
Write-Host "$($statements.Count) SQL statements chala raha hoon..." -ForegroundColor Yellow
Write-Host ""

$headers = @{ 'Authorization' = "Bearer $token" }
$success = 0; $skipped = 0; $failed = 0

for ($i = 0; $i -lt $statements.Count; $i++) {
    $stmt = $statements[$i]
    $words = ($stmt -replace "`n|`r", " ") -split '\s+'
    $kind = $words[0].ToUpper() + " " + $words[1].ToUpper()

    $bodyObj = @{
        requests = @(
            @{ type = 'execute'; stmt = @{ sql = $stmt } },
            @{ type = 'close' }
        )
    }
    $body = $bodyObj | ConvertTo-Json -Depth 10

    try {
        $resp = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $body
        $r = $resp.results[0]
        if ($r.type -eq 'ok') {
            $success++
            Write-Host "   [$($i+1)/$($statements.Count)] OK    $kind" -ForegroundColor Green
        } elseif ($r.error.message -match 'already exists') {
            $skipped++
            Write-Host "   [$($i+1)/$($statements.Count)] SKIP  $kind (pehle se hai)" -ForegroundColor DarkYellow
        } else {
            $failed++
            Write-Host "   [$($i+1)/$($statements.Count)] FAIL  $kind -> $($r.error.message)" -ForegroundColor Red
        }
    } catch {
        $failed++
        $em = $_.Exception.Message
        if ($em -match 'already exists') {
            $skipped++; $failed--
            Write-Host "   [$($i+1)/$($statements.Count)] SKIP  $kind (pehle se hai)" -ForegroundColor DarkYellow
        } else {
            Write-Host "   [$($i+1)/$($statements.Count)] FAIL  $kind -> $em" -ForegroundColor Red
        }
    }
}

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================"
Write-Host "  OK: $success    SKIP: $skipped    FAIL: $failed" -ForegroundColor Cyan
Write-Host "============================================================"

# ----------------------------------------------------------------------------
# Verify - count tables
# ----------------------------------------------------------------------------
Write-Host ""
Write-Host "Tables database me check kar raha hoon..." -ForegroundColor Yellow
$verifyObj = @{
    requests = @(
        @{ type = 'execute'; stmt = @{ sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" } },
        @{ type = 'close' }
    )
}
$verifyBody = $verifyObj | ConvertTo-Json -Depth 10

try {
    $resp = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $verifyBody
    $rows = $resp.results[0].response.result.rows
    $count = 0
    foreach ($row in $rows) {
        $name = $null
        if ($row.value) { $name = $row.value }
        elseif ($row[0].value) { $name = $row[0].value }
        elseif ($row[0][0].value) { $name = $row[0][0].value }
        if ($name) {
            Write-Host "   - $name" -ForegroundColor White
            $count++
        }
    }
    Write-Host ""
    Write-Host "   Total: $count tables" -ForegroundColor Cyan
    if ($count -ge 12) {
        Write-Host ""
        Write-Host "*** SAARI TABLES BAN GAYI! Turso schema COMPLETE! ***" -ForegroundColor Green
    }
} catch {
    Write-Host "   Tables list nahi ho payi (lekin schema run ho gaya)." -ForegroundColor DarkYellow
    Write-Host "   Turso Dashboard me jaakar verify karo." -ForegroundColor DarkYellow
}

Write-Host ""
