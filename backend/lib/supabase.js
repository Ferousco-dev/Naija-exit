import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — backend Supabase calls will fail"
  );
}

export const supabaseAdmin = createClient(
  SUPABASE_URL ?? "http://localhost",
  SUPABASE_SERVICE_ROLE_KEY ?? "missing-service-role-key",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
);
