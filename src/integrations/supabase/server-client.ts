import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Server-only: reads/writes the same auth cookies the browser client sets,
// so SSR requests see the caller's session. Only import this from
// createServerFn handlers — never from client-rendered components.
export function getSupabaseServerClient(): SupabaseClient<Database> {
  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          // @supabase/ssr hardcodes maxAge to 400 days on every write,
          // ignoring any cookieOptions passed to createServerClient — so
          // the only way to make the auth cookie session-only (cleared on
          // browser quit, not just tab close) is to strip it here, after
          // the library has already built its options object.
          const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options ?? {};
          setCookie(name, value, sessionOptions);
        }
      },
    },
  });
}
