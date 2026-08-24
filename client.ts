import { createClient } from "@supabase/supabase-js";

/* ============================================================================
   LEARNING POINT — Supabase Browser Client
   Used in client components (e.g. login form). Reads NEXT_PUBLIC_ env vars
   which are exposed to the browser. Safe — anon key is public by design.
   ============================================================================ */

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
