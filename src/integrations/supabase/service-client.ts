import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Server-only: bypasses RLS entirely. Catalog tables (publishers, series,
// volumes, issues, creators, issue_creators) only have SELECT policies —
// they're shared reference data, not user-owned — so writing to them from
// an ingestion pipeline requires this privileged client instead of the
// per-user browser/server-cookie clients. Never import from client code.
export function getSupabaseServiceClient(): SupabaseClient<Database> {
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
