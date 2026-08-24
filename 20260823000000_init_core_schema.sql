-- ============================================================================
-- LEARNING POINT — SUPABASE CORE SCHEMA
-- Region: Mumbai (ap-south-1) | Engine: Postgres
-- ============================================================================
-- Yahan rakha jaayega: profiles, sessions, staff, exams, courses, batches,
--   test_series, tests, payments, entitlements, coupons, materials,
--   notifications, question_reports, audit_logs, settings
-- Rule: Live test ka high-volume data yahan NAHI (wo Turso me hai)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions + Helpers
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- updated_at auto-update trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ============================================================================
-- 1. PROFILES  (Students / Learners)
-- ============================================================================
create table public.profiles (
  id              uuid primary key default uuid_generate_v4(),
  auth_id         uuid unique references auth.users(id) on delete cascade,
  full_name       text not null,
  mobile          text not null unique,           -- unique login alias (UI login)
  email           text not null unique,
  state           text not null,
  email_verified  boolean not null default false,
  status          text not null default 'active'
                    check (status in ('active','pending_email','suspended','banned')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_profiles_auth_id   on public.profiles(auth_id);
create index idx_profiles_mobile    on public.profiles(mobile);
create index idx_profiles_status    on public.profiles(status);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 2. STUDENT_SESSIONS  (Single active login — naya login purana revoke kare)
-- ============================================================================
create table public.student_sessions (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  session_token   text not null unique,
  device_info     text,
  ip_address      inet,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  revoked_at      timestamptz
);

create index idx_sessions_profile   on public.student_sessions(profile_id);
create index idx_sessions_active    on public.student_sessions(profile_id, is_active);


-- ============================================================================
-- 3. STAFF  (Admin portal users)
-- ============================================================================
create table public.staff (
  id              uuid primary key default uuid_generate_v4(),
  auth_id         uuid unique references auth.users(id) on delete cascade,
  full_name       text not null,
  email           text not null unique,
  role            text not null default 'read_only_analyst'
                    check (role in (
                      'super_admin','admin','course_manager','paper_manager',
                      'question_reviewer','test_manager','student_support',
                      'finance_manager','website_content_editor','read_only_analyst'
                    )),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_staff_email  on public.staff(email);
create trigger trg_staff_updated
  before update on public.staff
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 4. EXAMS  (Exam categories — e.g. UPSSSC Agriculture, etc.)
-- ============================================================================
create table public.exams (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  description     text,
  accent_color    text,         -- category accent for dark theme
  icon            text,
  is_published    boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index idx_exams_slug on public.exams(slug);
create trigger trg_exams_updated
  before update on public.exams
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 5. COURSES
-- ============================================================================
create table public.courses (
  id                uuid primary key default uuid_generate_v4(),
  exam_id           uuid references public.exams(id) on delete set null,
  name              text not null,
  slug              text not null unique,
  short_description text,
  description       text,
  language          text not null default 'english'
                      check (language in ('english','hindi','bilingual')),
  is_free           boolean not null default false,
  price_cents       int not null default 0,        -- paise (1 rupee = 100)
  validity_type     text not null default 'fixed_date'
                      check (validity_type in ('fixed_date','duration_from_purchase','lifetime')),
  fixed_expiry_date date,
  duration_days     int,                           -- for duration_from_purchase
  sort_order        int not null default 0,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index idx_courses_slug on public.courses(slug);
create index idx_courses_exam on public.courses(exam_id);
create trigger trg_courses_updated
  before update on public.courses
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 6. BATCHES  (Cohorts within a course)
-- ============================================================================
create table public.batches (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  name          text not null,
  description   text,
  start_date    date,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_batches_course on public.batches(course_id);
create trigger trg_batches_updated
  before update on public.batches
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 7. TEST_SERIES  (Groups of tests sold as a product)
-- ============================================================================
create table public.test_series (
  id                uuid primary key default uuid_generate_v4(),
  course_id         uuid references public.courses(id) on delete set null,
  name              text not null,
  slug              text not null unique,
  description       text,
  is_free           boolean not null default false,
  price_cents       int not null default 0,
  validity_type     text not null default 'fixed_date'
                      check (validity_type in ('fixed_date','duration_from_purchase','lifetime')),
  fixed_expiry_date date,
  duration_days     int,
  is_published      boolean not null default false,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index idx_test_series_slug on public.test_series(slug);
create trigger trg_test_series_updated
  before update on public.test_series
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 8. TESTS  (Individual test/exam paper definitions)
-- ============================================================================
create table public.tests (
  id              uuid primary key default uuid_generate_v4(),
  test_series_id  uuid references public.test_series(id) on delete set null,
  batch_id        uuid references public.batches(id) on delete set null,
  name            text not null,
  slug            text not null unique,
  description     text,
  total_questions int not null default 0,
  duration_minutes int not null default 60,
  total_marks     numeric not null default 0,
  negative_mark_per_wrong numeric not null default 0,  -- e.g. 0.25
  subject_type    text not null default 'mixed'
                    check (subject_type in ('agriculture','non_agriculture','mixed')),
  test_type       text not null default 'full_length'
                    check (test_type in ('full_length','sectional','topic_wise','mock','free')),
  window_start    timestamptz,        -- scheduled test open time
  window_end      timestamptz,        -- scheduled test close time
  is_ranked       boolean not null default true,
  max_reattempts  int not null default 5,   -- 5 practice reattempts
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index idx_tests_slug on public.tests(slug);
create index idx_tests_series on public.tests(test_series_id);
create index idx_tests_batch  on public.tests(batch_id);
create trigger trg_tests_updated
  before update on public.tests
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 9. TEST_SECTIONS  (Sections within a test — optional)
-- ============================================================================
create table public.test_sections (
  id            uuid primary key default uuid_generate_v4(),
  test_id       uuid not null references public.tests(id) on delete cascade,
  name          text not null,
  subject       text,
  question_count int not null default 0,
  marks_per_correct numeric not null default 1,
  sort_order    int not null default 0
);

create index idx_sections_test on public.test_sections(test_id);


-- ============================================================================
-- 10. PAYMENTS  (Razorpay transactions)
-- ============================================================================
create table public.payments (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete restrict,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  item_type         text not null check (item_type in ('course','test_series','batch')),
  item_id           uuid not null,
  base_amount_cents int not null,                 -- course fee (discounted)
  razorpay_fee_cents int default 0,               -- payment gateway fee
  tax_cents         int default 0,                -- tax on payment fee
  total_amount_cents int not null,                -- final student-paid amount
  currency          text not null default 'INR',
  coupon_id         uuid,  -- FK added later (coupons table created after this)
  status            text not null default 'created'
                      check (status in ('created','attempted','captured','failed','refunded')),
  captured_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- NOTE: coupons reference added below; run coupons table creation first in practice
create index idx_payments_profile on public.payments(profile_id);
create index idx_payments_status  on public.payments(status);
create index idx_payments_rp_order on public.payments(razorpay_order_id);
create trigger trg_payments_updated
  before update on public.payments
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 11. COUPONS
-- ============================================================================
create table public.coupons (
  id                uuid primary key default uuid_generate_v4(),
  code              text not null unique,
  description       text,
  discount_type     text not null check (discount_type in ('percentage','flat')),
  discount_value    numeric not null,             -- % or flat paise
  max_discount_cents int,                         -- cap for percentage
  min_amount_cents  int default 0,
  start_date        timestamptz,
  end_date          timestamptz,
  total_usage_limit int,                          -- total redemptions allowed
  per_student_limit int default 1,
  new_student_only  boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create index idx_coupons_code on public.coupons(code);

-- Coupon applicability (which courses/test_series)
create table public.coupon_items (
  id          uuid primary key default uuid_generate_v4(),
  coupon_id   uuid not null references public.coupons(id) on delete cascade,
  item_type   text not null check (item_type in ('course','test_series','batch','all')),
  item_id     uuid,                                -- null when 'all'
  is_excluded boolean not null default false        -- exclude specific items
);

create index idx_coupon_items_coupon on public.coupon_items(coupon_id);

-- FK from payments.coupon_id → coupons (added here because coupons is created
-- AFTER payments in this file, so inline reference would fail)
alter table public.payments
  add constraint payments_coupon_id_fk
  foreign key (coupon_id) references public.coupons(id) on delete set null;


-- ============================================================================
-- 12. COUPON_REDEMPTIONS
-- ============================================================================
create table public.coupon_redemptions (
  id          uuid primary key default uuid_generate_v4(),
  coupon_id   uuid not null references public.coupons(id) on delete restrict,
  profile_id  uuid not null references public.profiles(id) on delete restrict,
  payment_id  uuid references public.payments(id),
  redeemed_at timestamptz not null default now(),
  unique(coupon_id, profile_id, payment_id)
);


-- ============================================================================
-- 13. ENTITLEMENTS  (Student's access to a course/batch/test_series)
-- ============================================================================
create table public.entitlements (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  item_type       text not null check (item_type in ('course','test_series','batch')),
  item_id         uuid not null,
  source          text not null check (source in ('purchase','free_enroll','admin_grant','coupon')),
  payment_id      uuid references public.payments(id) on delete set null,
  validity_type   text not null check (validity_type in ('fixed_date','duration_from_purchase','lifetime')),
  starts_at       timestamptz not null default now(),
  expires_at      timestamptz,                     -- null = lifetime
  duration_days   int,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index idx_entitlements_profile on public.entitlements(profile_id);
create index idx_entitlements_item    on public.entitlements(item_type, item_id);
create index idx_entitlements_active  on public.entitlements(profile_id, is_active);


-- ============================================================================
-- 14. MATERIALS  (Study material / PDFs / notes)
-- ============================================================================
create table public.materials (
  id              uuid primary key default uuid_generate_v4(),
  batch_id        uuid references public.batches(id) on delete cascade,
  course_id       uuid references public.courses(id) on delete cascade,
  title           text not null,
  description     text,
  file_url        text not null,                  -- Google Drive / R2 URL
  file_type       text not null default 'pdf'
                    check (file_type in ('pdf','image','doc','video','link')),
  view_online     boolean not null default true,
  download_allowed boolean not null default false,
  print_allowed   boolean not null default false,
  sort_order      int not null default 0,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_materials_batch  on public.materials(batch_id);
create index idx_materials_course on public.materials(course_id);


-- ============================================================================
-- 15. NOTIFICATIONS  (In-app + email queue)
-- ============================================================================
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references public.profiles(id) on delete cascade,  -- null = broadcast
  title       text not null,
  body        text,
  type        text not null default 'info'
                check (type in ('info','test','result','payment','course','system','marketing')),
  link        text,
  is_read     boolean not null default false,
  email_sent  boolean not null default false,
  priority    int not null default 3,             -- P0=0 ... P4=4
  created_at  timestamptz not null default now()
);

create index idx_notifications_profile on public.notifications(profile_id, is_read);


-- ============================================================================
-- 16. QUESTION_REPORTS  (Student reports on question issues)
-- ============================================================================
create table public.question_reports (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  attempt_id      text not null,                  -- Turso attempt id
  question_id     text not null,                  -- Turso question id
  test_id         uuid references public.tests(id) on delete set null,
  category        text not null check (category in (
                    'wrong_answer','multiple_correct','no_correct','explanation_error',
                    'calculation_error','formatting','translation','out_of_syllabus',
                    'image_table_error','other'
                  )),
  comment         text,
  status          text not null default 'open'
                    check (status in ('open','under_review','resolved','rejected')),
  resolution_note text,
  resolved_by     uuid references public.staff(id),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

create index idx_reports_status    on public.question_reports(status);
create index idx_reports_question  on public.question_reports(question_id);


-- ============================================================================
-- 17. AUDIT_LOGS  (Admin actions, especially AI/risky operations)
-- ============================================================================
create table public.audit_logs (
  id            uuid primary key default uuid_generate_v4(),
  actor_type    text not null check (actor_type in ('staff','system','ai')),
  actor_id      uuid,                             -- staff id or null for system
  action        text not null,
  entity_type   text,
  entity_id     text,
  details       jsonb,
  risk_level    text not null default 'low'
                  check (risk_level in ('low','medium','high','critical')),
  ip_address    inet,
  created_at    timestamptz not null default now()
);

create index idx_audit_actor  on public.audit_logs(actor_type, actor_id);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_risk   on public.audit_logs(risk_level);


-- ============================================================================
-- 18. SETTINGS  (App-wide config)
-- ============================================================================
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.staff(id),
  updated_at  timestamptz not null default now()
);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Enable on all public tables
-- ============================================================================
-- Student can only see/edit their OWN data.
-- Detailed RLS policies will be added in Phase 2 (Auth).
alter table public.profiles            enable row level security;
alter table public.student_sessions    enable row level security;
alter table public.entitlements        enable row level security;
alter table public.notifications       enable row level security;
alter table public.question_reports    enable row level security;

-- Public-readable tables (no RLS restriction on SELECT for published content)
-- (exam, course, batch, test_series, test data shown publicly without login)
-- These will have permissive SELECT policies in Phase 2.

-- ============================================================================
-- END OF SUPABASE SCHEMA
-- FK ordering: payments.coupon_id → coupons handled via ALTER TABLE above
--   (coupons created after payments, so inline FK would fail).
--   Safe to run top-to-bottom in Supabase SQL Editor.
-- ============================================================================
