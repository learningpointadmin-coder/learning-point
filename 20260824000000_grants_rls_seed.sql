-- ============================================================================
-- LEARNING POINT — Grants, RLS Policies, Auth Trigger & Seed Exams
-- ============================================================================
-- WHY THIS EXISTS:
--   The initial schema migration (20260823) created all tables but did NOT
--   grant API access or wire up auth. Without this file:
--     • REST API cannot read any table  → exam page fails (permission denied)
--     • New signups cannot create a profile row
--   This fixes both. Required for login + exam pages to work.
--
-- HOW TO RUN (one time):
--   Supabase Dashboard → SQL Editor → New query → paste this whole file
--   → click "Run" (Ctrl+Enter). Done.
--   Safe to re-run (idempotent: GRANT + DROP ... IF EXISTS + ON CONFLICT).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCHEMA USAGE — let the API roles see the public schema
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. service_role = full access (trusted server-side key, bypasses RLS)
-- ----------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- 3. PUBLIC-READABLE CATALOG TABLES — visible without login
--    anon + authenticated can SELECT published catalog content
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.exams         TO anon, authenticated;
GRANT SELECT ON public.courses       TO anon, authenticated;
GRANT SELECT ON public.test_series   TO anon, authenticated;
GRANT SELECT ON public.tests         TO anon, authenticated;
GRANT SELECT ON public.test_sections TO anon, authenticated;
GRANT SELECT ON public.materials     TO anon, authenticated;
GRANT SELECT ON public.batches       TO anon, authenticated;
GRANT SELECT ON public.settings      TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. profiles — let each authenticated user read / update ONLY their own row
-- ----------------------------------------------------------------------------
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. AUTH TRIGGER — auto-create a profile row when a user signs up.
--    Reads full_name / mobile / state from user_metadata passed at signUp().
--    SECURITY DEFINER so it can INSERT into profiles regardless of RLS.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_id, full_name, mobile, email, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Learner'),
    COALESCE(NEW.raw_user_meta_data->>'mobile', '0000000000'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'state', 'Uttar Pradesh')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. SEED EXAM DATA — so the exam page has content to show
-- ----------------------------------------------------------------------------
INSERT INTO public.exams (name, slug, description, accent_color, icon, is_published, sort_order) VALUES
  ('UPSSSC Agriculture Technical Assistant', 'upsssc-agriculture-technical-assistant',
   'Full syllabus coverage for UPSSSC Agriculture recruitment — agronomy, soil science, horticulture.',
   '#22c55e', '🌾', true, 1),
  ('UPSSSC VDO (Gram Vikas Adhikari)', 'upsssc-vdo',
   'Village Development Officer exam — GK, Hindi, reasoning, rural development.',
   '#0ea5e9', '🏛️', true, 2),
  ('UPSSSC Junior Assistant', 'upsssc-junior-assistant',
   'Clerk-level exam — Hindi, GK, reasoning, computer awareness.',
   '#a855f7', '📋', true, 3),
  ('UP Police Constable', 'up-police-constable',
   'UP Police recruitment — GK, reasoning, quantitative aptitude.',
   '#f59e0b', '🛡️', true, 4),
  ('IBPS Clerk Prelims', 'ibps-clerk-prelims',
   'Banking exam — English, reasoning, quantitative aptitude.',
   '#06b6d4', '🏦', true, 5),
  ('SSC CGL Tier 1', 'ssc-cgl-tier-1',
   'Staff Selection Commission Combined Graduate Level.',
   '#14b8a6', '📚', true, 6)
ON CONFLICT (slug) DO NOTHING;
-- ============================================================================
-- END
-- ============================================================================
