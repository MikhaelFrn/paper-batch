import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parse, serialize } from "cookie";
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
//
// A custom cookies adapter is required (rather than letting @supabase/ssr
// fall back to its own document.cookie handling) because the library
// hardcodes maxAge to 400 days on every write, ignoring any cookieOptions
// passed here. Stripping maxAge/expires below makes the auth cookie a true
// session cookie, cleared when the browser is fully closed — not just on
// tab close or a dev server restart.
export const supabase: SupabaseClient<Database> = createBrowserClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    cookies: {
      // This module is evaluated during SSR too (imported by shared code),
      // where there is no document — mirror @supabase/ssr's own isBrowser()
      // guard rather than assuming a real browser environment.
      getAll() {
        if (typeof document === "undefined") return [];
        const parsed = parse(document.cookie);
        return Object.entries(parsed)
          .filter((entry): entry is [string, string] => entry[1] !== undefined)
          .map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        for (const { name, value, options } of cookiesToSet) {
          const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options ?? {};
          document.cookie = serialize(name, value, sessionOptions);
        }
      },
    },
  },
);

export type { Database } from "./database.types";
