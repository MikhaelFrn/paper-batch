import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useSignIn, useSignInWithGoogle } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · Comic Vault" },
      { name: "description", content: "Sign in to your Comic Vault comic collection." },
      { property: "og:title", content: "Sign in — Comic Vault" },
      { property: "og:description", content: "Access your comic library." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useSignIn();
  const signInWithGoogle = useSignInWithGoogle();
  const handleGoogleSignIn = () => {
    signInWithGoogle.mutate(undefined, {
      onError: () => toast.error(t.auth.login.googleError),
    });
  };
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
        await login.mutateAsync({
            email,
            password,
        });

        navigate({ to: redirectTo || "/" });

    } catch (error) {
        toast.error(t.auth.login.invalidCredentials);
    }
  };

  return (
    <AuthShell
      title={t.auth.login.title}
      subtitle={t.auth.login.subtitle}
      footer={<>{t.auth.login.noAccount} <Link to="/signup" className="text-marvel hover:underline">{t.auth.login.createAccount}</Link></>}
    >
      <form onSubmit={ handleSubmit } className="space-y-4">
        <div><Label htmlFor="login-email">{t.auth.login.emailLabel}</Label><Input id="login-email" type="email" placeholder={t.auth.login.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t.auth.login.passwordLabel}</Label>
            <Link to="/forgot-password" className="inline-block py-2 text-xs text-muted-foreground hover:text-primary">{t.auth.login.forgot}</Link>
          </div>
          <Input id="login-password" type="password" placeholder={t.auth.login.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)}/>
        </div>
        <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> {t.auth.login.keepSignedIn}</label>
        <Button type="submit" className="w-full" disabled={login.isPending}>{login.isPending ? t.auth.login.submitting : t.auth.login.submit}</Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={signInWithGoogle.isPending}
          onClick={handleGoogleSignIn}
        >
          {signInWithGoogle.isPending ? t.auth.login.googleRedirecting : t.auth.login.googleButton}
        </Button>
      </form>
    </AuthShell>
  );
}
