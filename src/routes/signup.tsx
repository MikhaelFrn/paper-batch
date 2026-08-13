import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsDialog } from "@/components/terms-dialog";
import { useSignInWithGoogle, useSignUp } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account · Comic Vault" },
      { name: "description", content: "Create your Comic Vault account and start tracking your collection." },
      { property: "og:title", content: "Create an account — Comic Vault" },
      { property: "og:description", content: "Start tracking your comic collection today." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const register = useSignUp();
  const signInWithGoogle = useSignInWithGoogle();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const handleGoogleSignIn = () => {
    if (!acceptedTerms) {
      toast.error(t.auth.signup.mustAcceptTerms);
      return;
    }
    signInWithGoogle.mutate(undefined, {
      onError: () => toast.error(t.auth.signup.googleError),
    });
  };
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error(t.auth.signup.mustAcceptTerms);
      return;
    }
    try {
      await register.mutateAsync({
        username,
        email,
        password,
      });
      toast.success(t.auth.signup.success);
      navigate({ to: "/" });
    } catch (error) {
        toast.error(t.auth.signup.error);
    }
  }

  return (
    <AuthShell
      title={t.auth.signup.title}
      subtitle={t.auth.signup.subtitle}
      footer={<>{t.auth.signup.alreadyHaveAccount} <Link to="/login" className="text-marvel hover:underline">{t.auth.signup.signIn}</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4"> <div><Label htmlFor="signup-username">{t.auth.signup.usernameLabel}</Label><Input id="signup-username" placeholder={t.auth.signup.usernamePlaceholder} value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div><Label htmlFor="signup-email">{t.auth.signup.emailLabel}</Label><Input id="signup-email" type="email" placeholder={t.auth.signup.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)}/></div>
        <div><Label htmlFor="signup-password">{t.auth.signup.passwordLabel}</Label><Input id="signup-password" type="password" placeholder={t.auth.signup.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)}/></div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(!!v)} className="mt-0.5" />
          <span>
            {t.auth.signup.acceptTermsPrefix} <TermsDialog />
          </span>
        </label>
        <Button type="submit" className="w-full" disabled={!acceptedTerms}>{t.auth.signup.submit}</Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={signInWithGoogle.isPending || !acceptedTerms}
          onClick={handleGoogleSignIn}
        >
          {signInWithGoogle.isPending ? t.auth.signup.googleRedirecting : t.auth.signup.googleButton}
        </Button>
      </form>
    </AuthShell>
  );
}
