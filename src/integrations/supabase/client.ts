import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabasePublishableKey) {
  // Surface a clear error early instead of a cryptic runtime fetch failure.
  // Credentials live in .env.local as VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local",
  );
}

// Cookie-backed (not localStorage) so the SSR server client can read the
// same session — see integrations/supabase/server-client.ts.
export const supabase: SupabaseClient<Database> = createBrowserClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
);

export type { Database } from "./database.types";
