import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { error?: string; error_description?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
    error_description:
      typeof search.error_description === "string" ? search.error_description : undefined,
  }),
  head: () => ({
    meta: [{ title: "Signing in… · Comic Vault" }],
  }),
  component: AuthCallback,
});

/** Landing point for every OAuth provider (currently just Google) —
 * `createBrowserClient`'s own `detectSessionInUrl` already exchanged the
 * `?code=` for a session and set the auth cookies by the time this
 * mounts; there's no manual exchange to write here. This just waits for
 * that to land (via onAuthStateChange, with an immediate getSession()
 * check in case it already finished) and hands off to "/", whose
 * `_shell` guard re-checks auth server-side against the now-set cookies.
 * A provider error (e.g. the user declined consent) arrives as
 * `?error=...` instead of `?code=...` — shown directly rather than
 * hanging on "Signing you in…" forever. */
function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { error, error_description } = Route.useSearch();

  useEffect(() => {
    if (error) return;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    return () => subscription.subscription.unsubscribe();
  }, [error, navigate]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <div className="font-display text-2xl">{t.auth.callback.failedTitle}</div>
          <p className="mt-2 text-sm text-muted-foreground">{error_description ?? error}</p>
          <Link to="/login" className="mt-4 inline-block text-marvel hover:underline">
            {t.auth.callback.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
      {t.auth.callback.signingIn}
    </div>
  );
}
