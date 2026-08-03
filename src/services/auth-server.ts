import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client";

// Isomorphic: runs in-process during SSR, and as an RPC call from the
// browser. auth.getUser() re-validates the JWT against Supabase Auth
// rather than trusting the cookie, unlike getSession().
export const fetchServerUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  },
);
