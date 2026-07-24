// Reusable Supabase client for the browser.
// All service modules import from here so we have a single client instance
// with consistent configuration.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient = createClient(url ?? "", key ?? "", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** True when real Supabase credentials are configured. Services fall back to
 *  mock data while this is false so the UI keeps working during migration. */
export const isSupabaseConfigured = Boolean(url && key && !url.includes("spburl"));
